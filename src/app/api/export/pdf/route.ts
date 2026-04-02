import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getKnowledgeBase } from '@/lib/knowledgeBase';
import { generatePDFHtml } from '@/lib/pdfTemplates';
import { getStyle } from '@/lib/documentStyles/registry';
import type { StyleInput, BrandVars } from '@/lib/documentStyles/types';
import * as db from '@/lib/db';
import fs from 'fs';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

async function convertLogoToBase64(logoPath: string): Promise<string> {
  try {
    if (!logoPath) return '';
    if (logoPath.startsWith('data:')) return logoPath;

    let cleanPath = logoPath;
    try {
      const url = new URL(logoPath);
      cleanPath = url.pathname;
    } catch {
      // Not a URL, use as-is
    }

    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }

    const filePath = path.join(process.cwd(), 'public', cleanPath);

    if (!fs.existsSync(filePath)) {
      return '';
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_MAP[ext];
    if (!mime) return '';

    const data = fs.readFileSync(filePath);
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch {
    return '';
  }
}

// ── Build the full HTML for a document ──
async function buildDocumentHtml(req: NextRequest, body: Record<string, unknown>): Promise<{ html: string; fileName: string }> {
  const { sections, contentType, prospect, prospectLogoBase64, prospectColor, styleOverride, styleId, persona, visualSections } = body as {
    sections: { id?: string; title: string; content: string }[];
    contentType: string;
    prospect: { companyName: string; industry?: string; companySize?: string };
    prospectLogoBase64?: string;
    prospectColor?: string;
    styleOverride?: string;
    styleId?: string;
    persona?: string;
    visualSections?: unknown;
  };

  const kb = await getKnowledgeBase();

  if (styleOverride && ['modern', 'corporate', 'bold', 'minimal'].includes(styleOverride)) {
    if (!kb.brandGuidelines) {
      const { DEFAULT_BRAND_GUIDELINES } = await import('@/lib/types');
      kb.brandGuidelines = { ...DEFAULT_BRAND_GUIDELINES };
    }
    kb.brandGuidelines = { ...kb.brandGuidelines, documentStyle: styleOverride as any };
  }

  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  const baseUrl = `${proto}://${host}`;

  const { resolveBrandGuidelines } = await import('@/lib/brandDefaults');
  const brandGuidelines = resolveBrandGuidelines(kb);

  let primaryLogoBase64 = await db.getLogo('default', 'primary');
  let secondaryLogoBase64 = await db.getLogo('default', 'secondary');

  if (!primaryLogoBase64 && brandGuidelines.logos.primaryPath) {
    primaryLogoBase64 = await convertLogoToBase64(brandGuidelines.logos.primaryPath);
  }
  if (!secondaryLogoBase64 && brandGuidelines.logos.secondaryPath) {
    secondaryLogoBase64 = await convertLogoToBase64(brandGuidelines.logos.secondaryPath);
  }

  const fileName = `${contentType}-${prospect.companyName || 'document'}`.replace(/[^a-zA-Z0-9-_]/g, '_');

  // ── Route through Document Style renderer when styleId is provided ──
  if (styleId) {
    const docStyle = getStyle(styleId);
    if (docStyle) {
      const ptToPx = (pt: number) => Math.round(pt * 1.333);
      const brandVars: BrandVars = {
        primary: brandGuidelines.colors?.primary || kb.brandColor || '#1e293b',
        secondary: brandGuidelines.colors?.secondary || kb.brandColor || '#4a4ae0',
        accent: brandGuidelines.colors?.accent || kb.brandColor || '#f59e0b',
        background: brandGuidelines.colors?.background || '#ffffff',
        text: brandGuidelines.colors?.text || '#334155',
        fontPrimary: brandGuidelines.fonts?.primary || 'Inter',
        fontSecondary: brandGuidelines.fonts?.secondary || 'Inter',
        h1Size: ptToPx(brandGuidelines.fonts?.sizes?.h1 || 28),
        h2Size: ptToPx(brandGuidelines.fonts?.sizes?.h2 || 18),
        h3Size: ptToPx(brandGuidelines.fonts?.sizes?.h3 || 14),
        bodySize: ptToPx(brandGuidelines.fonts?.sizes?.body || 11),
        documentStyle: (brandGuidelines.documentStyle as BrandVars['documentStyle']) || 'modern',
        logoPlacement: (brandGuidelines.logos?.placement as BrandVars['logoPlacement']) || 'top-left',
      };

      const styleInput: StyleInput = {
        sections: sections.map((s, i) => ({
          id: s.id || `section-${i}`,
          title: s.title,
          content: s.content,
        })),
        contentType,
        prospect: {
          companyName: prospect.companyName || 'Prospect',
          industry: prospect.industry,
          companySize: prospect.companySize,
        },
        companyName: kb.companyName || 'Company',
        companyDescription: kb.tagline || kb.aboutUs || '',
        logoBase64: primaryLogoBase64 || undefined,
        prospectLogoBase64: (prospectLogoBase64 as string) || undefined,
        accentColor: kb.brandColor || brandGuidelines.colors?.primary || '#6366F1',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        brand: brandVars,
      };

      return { html: docStyle.render(styleInput), fileName };
    }
  }

  // ── Fallback: legacy pdfTemplates renderer ──
  const html = generatePDFHtml(sections as any, contentType as any, prospect as any, kb, baseUrl, {
    logoBase64: primaryLogoBase64,
    secondaryLogoBase64,
    prospectLogoBase64: (prospectLogoBase64 as string) || '',
    prospectColor: (prospectColor as string) || '',
  }, persona as string | undefined, visualSections as any);

  return { html, fileName };
}

// ── Send HTML to Browserless.io for PDF generation ──
async function renderPdfWithBrowserless(html: string): Promise<ArrayBuffer> {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('BROWSERLESS_API_KEY is not configured');
  }

  const res = await fetch(`https://chrome.browserless.io/pdf?token=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html,
      options: {
        format: 'Letter',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        preferCSSPageSize: true,
      },
      gotoOptions: {
        waitUntil: 'networkidle0',
        timeout: 30000,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    console.error('[PDF Browserless] Error:', res.status, errText);
    throw new Error(`Browserless PDF generation failed: ${res.status}`);
  }

  return res.arrayBuffer();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const returnHtml = body.returnHtml === true;

  // If pre-rendered HTML is provided, use it directly (e.g. from Refresh Doc)
  let html: string;
  let fileName: string;
  if (body.html && typeof body.html === 'string') {
    html = body.html;
    fileName = 'refreshed-document';
  } else {
    const result = await buildDocumentHtml(req, body);
    html = result.html;
    fileName = result.fileName;
  }

  // If client requests HTML (for preview), return HTML
  if (returnHtml) {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${fileName}.html"`,
      },
    });
  }

  // Otherwise, generate a real PDF via Browserless
  try {
    const pdfBuffer = await renderPdfWithBrowserless(html);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    console.error('[PDF Export]', message);

    // Fallback: return HTML if Browserless fails
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${fileName}.html"`,
        'X-PDF-Fallback': 'true',
      },
    });
  }
}
