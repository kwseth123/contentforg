import { NextRequest, NextResponse } from 'next/server';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface ScanResult {
  success: boolean;
  companyName: string;
  tagline: string;
  logoBase64: string;
  partial: boolean;
}

function normalizeUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

function resolveUrl(relative: string, base: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return '';
  }
}

function attr(html: string, tag: string, attrName: string, attrValue: string, extract: string): string {
  // Match a tag with a specific attribute value and extract another attribute
  // e.g. attr(html, 'meta', 'property', 'og:title', 'content')
  const pattern = new RegExp(
    `<${tag}\\s[^>]*?${attrName}=["']${attrValue}["'][^>]*?>`,
    'i'
  );
  const match = html.match(pattern);
  if (!match) return '';
  const extractPattern = new RegExp(`${extract}=["']([^"']*)["']`, 'i');
  const valMatch = match[0].match(extractPattern);
  return valMatch ? valMatch[1].trim() : '';
}

function extractCompanyName(html: string): string {
  // 1. og:title
  const ogTitle = attr(html, 'meta', 'property', 'og:title', 'content');
  if (ogTitle) return ogTitle;

  // 2. <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) return titleMatch[1].trim();

  // 3. meta application-name
  const appName = attr(html, 'meta', 'name', 'application-name', 'content');
  if (appName) return appName;

  return '';
}

function extractTagline(html: string): string {
  // 1. og:description
  const ogDesc = attr(html, 'meta', 'property', 'og:description', 'content');
  if (ogDesc) return ogDesc;

  // 2. meta description
  const metaDesc = attr(html, 'meta', 'name', 'description', 'content');
  if (metaDesc) return metaDesc;

  return '';
}

function extractLogoUrl(html: string, baseUrl: string): string {
  // 1. og:image
  const ogImage = attr(html, 'meta', 'property', 'og:image', 'content');
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  // 2. link[rel="icon"]
  const iconPattern = /<link\s[^>]*?rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*?>/i;
  const iconMatch = html.match(iconPattern);
  if (iconMatch) {
    const hrefMatch = iconMatch[0].match(/href=["']([^"']*)["']/i);
    if (hrefMatch && hrefMatch[1]) return resolveUrl(hrefMatch[1], baseUrl);
  }

  // 3. First <img> inside <header>
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
  if (headerMatch) {
    const imgMatch = headerMatch[0].match(/<img\s[^>]*?src=["']([^"']*)["'][^>]*?>/i);
    if (imgMatch && imgMatch[1]) return resolveUrl(imgMatch[1], baseUrl);
  }

  return '';
}

function guessMimeType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.svg')) return 'image/svg+xml';
  if (lower.includes('.ico')) return 'image/x-icon';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  return 'image/png';
}

async function fetchLogoAsBase64(logoUrl: string): Promise<string> {
  if (!logoUrl) return '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(logoUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return '';

    const contentType = res.headers.get('content-type') || guessMimeType(logoUrl);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mime = contentType.split(';')[0].trim();
    return `data:${mime};base64,${base64}`;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl: string = body?.url;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({
        success: false,
        companyName: '',
        tagline: '',
        logoBase64: '',
        partial: false,
      } satisfies ScanResult);
    }

    const url = normalizeUrl(rawUrl);

    // Fetch the homepage with an 8-second hard timeout
    const controller = new AbortController();
    let partial = false;
    let html = '';

    const fetchPromise = fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    }).then(async (res) => {
      if (!res.ok) return '';
      return await res.text();
    });

    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        controller.abort();
        resolve('');
      }, 8000);
    });

    html = await Promise.race([fetchPromise, timeoutPromise]);

    // Extract whatever we can
    const companyName = html ? extractCompanyName(html) : '';
    const tagline = html ? extractTagline(html) : '';
    const logoUrl = html ? extractLogoUrl(html, url) : '';

    // If the fetch timed out but we got some data, mark as partial
    if (!html && (companyName || tagline || logoUrl)) {
      partial = true;
    }
    if (controller.signal.aborted && (companyName || tagline)) {
      partial = true;
    }

    if (!html && !companyName && !tagline) {
      return NextResponse.json({
        success: false,
        companyName: '',
        tagline: '',
        logoBase64: '',
        partial: false,
      } satisfies ScanResult);
    }

    // Fetch logo and convert to base64 (non-blocking — failure is fine)
    const logoBase64 = await fetchLogoAsBase64(logoUrl);

    return NextResponse.json({
      success: true,
      companyName,
      tagline,
      logoBase64,
      partial,
    } satisfies ScanResult);
  } catch {
    // Never return an error status code
    return NextResponse.json({
      success: false,
      companyName: '',
      tagline: '',
      logoBase64: '',
      partial: false,
    } satisfies ScanResult);
  }
}
