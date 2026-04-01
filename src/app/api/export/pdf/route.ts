import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getKnowledgeBase } from '@/lib/knowledgeBase';
import { generatePDFHtml } from '@/lib/pdfTemplates';
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

  const { sections, contentType, prospect, prospectLogoBase64, prospectColor, styleOverride, persona, visualSections } = await req.json();
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
  const brand = resolveBrandGuidelines(kb);

  let primaryLogoBase64 = '';
  let secondaryLogoBase64 = '';

  console.log('[PDF Logo Debug] brand.logos.primaryPath:', brand.logos.primaryPath || '(empty)');
  console.log('[PDF Logo Debug] brand.logos.secondaryPath:', brand.logos.secondaryPath || '(empty)');
  console.log('[PDF Logo Debug] kb.logoPath:', kb.logoPath || '(empty)');

  if (brand.logos.primaryPath) {
    primaryLogoBase64 = await convertLogoToBase64(brand.logos.primaryPath);
  }
  if (brand.logos.secondaryPath) {
    secondaryLogoBase64 = await convertLogoToBase64(brand.logos.secondaryPath);
  }

  console.log('[PDF Logo Debug] primaryLogoBase64 result:', primaryLogoBase64 ? `OK (${primaryLogoBase64.length} chars)` : 'EMPTY');
  console.log('[PDF Logo Debug] secondaryLogoBase64 result:', secondaryLogoBase64 ? `OK (${secondaryLogoBase64.length} chars)` : 'EMPTY');

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
