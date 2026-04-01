import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ═══════════════════════════════════════════════
// Shared utilities
// ═══════════════════════════════════════════════

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
  const ogTitle = attr(html, 'meta', 'property', 'og:title', 'content');
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) return titleMatch[1].trim();
  const appName = attr(html, 'meta', 'name', 'application-name', 'content');
  if (appName) return appName;
  return '';
}

function extractTagline(html: string): string {
  const ogDesc = attr(html, 'meta', 'property', 'og:description', 'content');
  if (ogDesc) return ogDesc;
  const metaDesc = attr(html, 'meta', 'name', 'description', 'content');
  if (metaDesc) return metaDesc;
  return '';
}

function extractLogoUrl(html: string, baseUrl: string): string {
  const ogImage = attr(html, 'meta', 'property', 'og:image', 'content');
  if (ogImage) return resolveUrl(ogImage, baseUrl);
  const iconPattern = /<link\s[^>]*?rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*?>/i;
  const iconMatch = html.match(iconPattern);
  if (iconMatch) {
    const hrefMatch = iconMatch[0].match(/href=["']([^"']*)["']/i);
    if (hrefMatch && hrefMatch[1]) return resolveUrl(hrefMatch[1], baseUrl);
  }
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

// ═══════════════════════════════════════════════
// Strip HTML to text for AI analysis
// ═══════════════════════════════════════════════

function htmlToText(html: string): string {
  let text = html;
  // Remove scripts, styles, noscript
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// ═══════════════════════════════════════════════
// Extract internal links for crawling
// ═══════════════════════════════════════════════

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const links: Set<string> = new Set();
  const hrefPattern = /<a\s[^>]*?href=["']([^"'#]+)["'][^>]*?>/gi;
  let match;
  while ((match = hrefPattern.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl);
      if (resolved.hostname === base.hostname && resolved.pathname !== '/') {
        // Remove query/hash
        const clean = `${resolved.origin}${resolved.pathname}`.replace(/\/+$/, '');
        links.add(clean);
      }
    } catch {
      // skip invalid URLs
    }
  }

  // Prioritize certain page types
  const priorityKeywords = ['about', 'product', 'service', 'solution', 'case-stud', 'customer', 'client', 'portfolio', 'pricing', 'feature', 'why', 'platform', 'how-it-works', 'industries', 'team'];
  const sorted = Array.from(links).sort((a, b) => {
    const aP = priorityKeywords.some(k => a.toLowerCase().includes(k)) ? 0 : 1;
    const bP = priorityKeywords.some(k => b.toLowerCase().includes(k)) ? 0 : 1;
    return aP - bP;
  });

  // Cap at 8 pages to keep scan fast
  return sorted.slice(0, 8);
}

// ═══════════════════════════════════════════════
// Fetch a page with timeout
// ═══════════════════════════════════════════════

async function fetchPage(url: string, timeoutMs = 8000): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

// ═══════════════════════════════════════════════
// Simple mode (onboarding) — JSON response
// ═══════════════════════════════════════════════

interface ScanResult {
  success: boolean;
  companyName: string;
  tagline: string;
  logoBase64: string;
  partial: boolean;
}

async function handleSimpleScan(rawUrl: string): Promise<NextResponse> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return NextResponse.json({
      success: false, companyName: '', tagline: '', logoBase64: '', partial: false,
    } satisfies ScanResult);
  }

  const url = normalizeUrl(rawUrl);
  const controller = new AbortController();

  const fetchPromise = fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: controller.signal,
    redirect: 'follow',
  }).then(async (res) => {
    if (!res.ok) return '';
    return await res.text();
  });

  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => { controller.abort(); resolve(''); }, 8000);
  });

  const html = await Promise.race([fetchPromise, timeoutPromise]);

  const companyName = html ? extractCompanyName(html) : '';
  const tagline = html ? extractTagline(html) : '';
  const logoUrl = html ? extractLogoUrl(html, url) : '';

  let partial = false;
  if (controller.signal.aborted && (companyName || tagline)) partial = true;

  if (!html && !companyName && !tagline) {
    return NextResponse.json({
      success: false, companyName: '', tagline: '', logoBase64: '', partial: false,
    } satisfies ScanResult);
  }

  const logoBase64 = await fetchLogoAsBase64(logoUrl);

  return NextResponse.json({
    success: true, companyName, tagline, logoBase64, partial,
  } satisfies ScanResult);
}

// ═══════════════════════════════════════════════
// Deep scan mode (KB rescan) — SSE streaming
// ═══════════════════════════════════════════════

async function handleDeepScan(rawUrl: string, mode: string): Promise<Response> {
  const url = normalizeUrl(rawUrl);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: Fetch homepage
        send({ type: 'progress', page: 'Fetching homepage...', current: 1, total: 5 });
        const homepageHtml = await fetchPage(url);

        if (!homepageHtml) {
          send({ type: 'error', message: 'Could not fetch website. Check the URL and try again.' });
          controller.close();
          return;
        }

        // Step 2: Find internal pages to crawl
        send({ type: 'progress', page: 'Finding pages to scan...', current: 1, total: 5 });
        const internalLinks = extractInternalLinks(homepageHtml, url);
        const totalPages = 1 + Math.min(internalLinks.length, 6);

        // Step 3: Crawl internal pages
        const pageTexts: { url: string; text: string }[] = [
          { url, text: htmlToText(homepageHtml).slice(0, 8000) },
        ];

        const pagesToCrawl = internalLinks.slice(0, 6);
        for (let i = 0; i < pagesToCrawl.length; i++) {
          const pageUrl = pagesToCrawl[i];
          const pageName = new URL(pageUrl).pathname.replace(/^\//, '') || 'page';
          send({ type: 'progress', page: `Scanning ${pageName}...`, current: i + 2, total: totalPages + 1 });

          const pageHtml = await fetchPage(pageUrl, 6000);
          if (pageHtml) {
            pageTexts.push({ url: pageUrl, text: htmlToText(pageHtml).slice(0, 6000) });
          }
        }

        // Step 4: Send all text to Claude for extraction
        send({ type: 'progress', page: 'Analyzing content with AI...', current: totalPages, total: totalPages + 1 });

        const combinedContent = pageTexts
          .map(p => `=== PAGE: ${p.url} ===\n${p.text}`)
          .join('\n\n');

        const extractionPrompt = `Analyze the following website content and extract structured business information. Return a JSON object with the following fields. For any field you cannot determine, use null or an empty array.

{
  "companyName": "string — the company name",
  "tagline": "string — main tagline or value proposition",
  "aboutUs": "string — 2-4 sentence company description",
  "products": [
    {
      "name": "string",
      "description": "string — 1-2 sentences",
      "keyFeatures": ["feature1", "feature2", "feature3"],
      "pricing": "string or null"
    }
  ],
  "differentiators": "string — what makes this company unique (2-3 sentences)",
  "industries": ["industry1", "industry2"],
  "personas": ["persona1", "persona2"],
  "companySize": "string — target company size if mentioned",
  "caseStudies": [
    {
      "title": "string — customer name or story title",
      "content": "string — 2-4 sentence summary"
    }
  ],
  "competitors": [
    {
      "name": "string",
      "howWeBeatThem": "string — brief competitive advantage"
    }
  ],
  "brandVoice": {
    "tone": "string — describe the brand tone in 2-3 words",
    "wordsToUse": ["word1", "word2", "word3"],
    "wordsToAvoid": ["word1", "word2"]
  },
  "missingFields": ["field names that could not be determined"]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation.

Website content:
${combinedContent.slice(0, 50000)}`;

        const aiResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: extractionPrompt }],
        });

        const aiText = aiResponse.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map(b => b.text)
          .join('');

        // Parse AI response
        let extractedData;
        try {
          // Try to extract JSON from the response (handle code blocks)
          const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiText];
          extractedData = JSON.parse(jsonMatch[1] || aiText);
        } catch {
          // Try harder — find first { to last }
          const start = aiText.indexOf('{');
          const end = aiText.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            try {
              extractedData = JSON.parse(aiText.slice(start, end + 1));
            } catch {
              send({ type: 'error', message: 'AI analysis returned invalid data. Please try again.' });
              controller.close();
              return;
            }
          } else {
            send({ type: 'error', message: 'AI analysis returned invalid data. Please try again.' });
            controller.close();
            return;
          }
        }

        // Step 5: Done
        send({ type: 'progress', page: 'Scan complete!', current: totalPages + 1, total: totalPages + 1 });
        send({ type: 'result', data: extractedData });

      } catch (err) {
        console.error('[Website Scan Error]', err);
        send({ type: 'error', message: err instanceof Error ? err.message : 'Scan failed unexpectedly.' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ═══════════════════════════════════════════════
// POST handler — routes to simple or deep scan
// ═══════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl: string = body?.url;
    const mode: string = body?.mode || '';

    // Deep scan mode (used by KB admin rescan)
    if (mode === 'full' || mode === 'rescan') {
      return handleDeepScan(rawUrl, mode);
    }

    // Simple mode (used by onboarding)
    return handleSimpleScan(rawUrl);
  } catch {
    return NextResponse.json({
      success: false, companyName: '', tagline: '', logoBase64: '', partial: false,
    });
  }
}
