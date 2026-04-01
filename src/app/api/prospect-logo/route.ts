import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ProspectBrandingResult {
  logoBase64: string;
  companyName: string;
  description: string;
  primaryColor: string;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return '';
  }
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 ContentForg/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';

    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mime = contentType.split(';')[0].trim();
    return `data:${mime};base64,${base64}`;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const defaults: ProspectBrandingResult = {
    logoBase64: '',
    companyName: '',
    description: '',
    primaryColor: '#6366f1',
  };

  try {
    // Normalize URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    // Fetch the website HTML
    const pageRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    if (!pageRes.ok) {
      return NextResponse.json(defaults);
    }

    const html = await pageRes.text();
    const baseUrl = new URL(targetUrl).origin;

    // Extract metadata
    // Company name: og:site_name or <title>
    const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const companyName = siteNameMatch?.[1]?.trim()
      || titleMatch?.[1]?.replace(/\s*[-|–—].+$/, '').trim()
      || '';

    // Description: og:description or meta description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = ogDescMatch?.[1]?.trim() || metaDescMatch?.[1]?.trim() || '';

    // Primary color: look for theme-color meta tag, or CSS custom properties
    let primaryColor = '#6366f1';
    const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
    if (themeColorMatch?.[1]) {
      primaryColor = themeColorMatch[1].trim();
    } else {
      // Try to find --primary or --brand-color in inline styles
      const cssVarMatch = html.match(/--(?:primary|brand|main)[-\w]*\s*:\s*(#[0-9a-fA-F]{3,8})/);
      if (cssVarMatch?.[1]) {
        primaryColor = cssVarMatch[1];
      }
    }

    // Logo extraction: try multiple strategies
    let logoUrl = '';

    // Strategy 1: og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch?.[1]) {
      logoUrl = resolveUrl(ogImageMatch[1], baseUrl);
    }

    // Strategy 2: <img> with "logo" in attributes
    if (!logoUrl) {
      const logoImgMatch = html.match(/<img[^>]*(?:class|id|alt|src)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)
        || html.match(/<img[^>]*src=["']([^"']*logo[^"']*)["']/i);
      if (logoImgMatch?.[1]) {
        logoUrl = resolveUrl(logoImgMatch[1], baseUrl);
      }
    }

    // Strategy 3: apple-touch-icon or large favicon
    if (!logoUrl) {
      const touchIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
      if (touchIconMatch?.[1]) {
        logoUrl = resolveUrl(touchIconMatch[1], baseUrl);
      }
    }

    // Strategy 4: favicon as last resort
    if (!logoUrl) {
      const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
        || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
      if (iconMatch?.[1]) {
        logoUrl = resolveUrl(iconMatch[1], baseUrl);
      }
    }

    // Convert logo to base64
    let logoBase64 = '';
    if (logoUrl) {
      logoBase64 = await fetchImageAsBase64(logoUrl);
    }

    return NextResponse.json({
      logoBase64,
      companyName,
      description,
      primaryColor,
    });
  } catch {
    return NextResponse.json(defaults);
  }
}
