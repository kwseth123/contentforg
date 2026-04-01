import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getKnowledgeBase } from '@/lib/knowledgeBase';
import { generatePDFHtml } from '@/lib/pdfTemplates';
import { getStyle } from '@/lib/documentStyles/registry';
import type { StyleInput, BrandVars } from '@/lib/documentStyles/types';
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

    // Strip any URL prefix — we only need the path portion
    let cleanPath = logoPath;
    try {
      const url = new URL(logoPath);
      cleanPath = url.pathname;
    } catch {
      // Not a URL, use as-is
    }

    // Ensure leading slash is handled — path.join with /uploads/logo.png
    // on Windows can produce wrong results if cleanPath starts with /
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }

    const filePath = path.join(process.cwd(), 'public', cleanPath);
    console.log('[PDF Logo Debug] Logo path from KB:', logoPath);
    console.log('[PDF Logo Debug] Resolved file path:', filePath);
    console.log('[PDF Logo Debug] File exists:', fs.existsSync(filePath));

    if (!fs.existsSync(filePath)) {
      console.log('[PDF Logo Debug] File NOT found at resolved path');
      return '';
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_MAP[ext];
    if (!mime) {
      console.log('[PDF Logo Debug] Unsupported extension:', ext);
      return '';
    }

    const data = fs.readFileSync(filePath);
    const base64Str = `data:${mime};base64,${data.toString('base64')}`;
    console.log('[PDF Logo Debug] Base64 conversion succeeded, first 50 chars:', base64Str.slice(0, 50));
    return base64Str;
  } catch (err) {
    console.error('[PDF Logo Debug] Error converting logo:', err);
    return '';
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sections, contentType, prospect, prospectLogoBase64, prospectColor, styleOverride, styleId, persona, visualSections } = await req.json();
  const kb = getKnowledgeBase();

  // Apply document style override if provided
  if (styleOverride && ['modern', 'corporate', 'bold', 'minimal'].includes(styleOverride)) {
    if (!kb.brandGuidelines) {
      const { DEFAULT_BRAND_GUIDELINES } = await import('@/lib/types');
      kb.brandGuidelines = { ...DEFAULT_BRAND_GUIDELINES };
    }
    kb.brandGuidelines = { ...kb.brandGuidelines, documentStyle: styleOverride };
  }

  // Build absolute base URL so logo images resolve in the print window
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  const baseUrl = `${proto}://${host}`;

  // Convert company logos to base64 for reliable print rendering
  const { resolveBrandGuidelines } = await import('@/lib/brandDefaults');
  const brandGuidelines = resolveBrandGuidelines(kb);

  let primaryLogoBase64 = '';
  let secondaryLogoBase64 = '';

  if (brandGuidelines.logos.primaryPath) {
    primaryLogoBase64 = await convertLogoToBase64(brandGuidelines.logos.primaryPath);
  }
  if (brandGuidelines.logos.secondaryPath) {
    secondaryLogoBase64 = await convertLogoToBase64(brandGuidelines.logos.secondaryPath);
  }

  // ── Route through Document Style renderer when styleId is provided ──
  if (styleId) {
    const docStyle = getStyle(styleId);
    if (docStyle) {
      // Build BrandVars from KB brand guidelines
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
        sections: sections.map((s: { id?: string; title: string; content: string }, i: number) => ({
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
        prospectLogoBase64: prospectLogoBase64 || undefined,
        accentColor: kb.brandColor || brandGuidelines.colors?.primary || '#6366F1',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        brand: brandVars,
      };

      const html = docStyle.render(styleInput);
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${contentType}-${prospect.companyName}.html"`,
        },
      });
    }
  }

  // ── Fallback: legacy pdfTemplates renderer ──
  const html = generatePDFHtml(sections, contentType, prospect, kb, baseUrl, {
    logoBase64: primaryLogoBase64,
    secondaryLogoBase64,
    prospectLogoBase64: prospectLogoBase64 || '',
    prospectColor: prospectColor || '',
  }, persona || undefined, visualSections || undefined);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="${contentType}-${prospect.companyName}.html"`,
    },
  });
}
