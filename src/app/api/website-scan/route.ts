import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const KNOWN_PATTERNS = [
  '/about', '/about-us', '/products', '/solutions', '/services',
  '/customers', '/case-studies', '/pricing', '/team', '/company',
  '/features', '/platform', '/why-us', '/industries',
];

const FUZZY_KEYWORDS = [
  'about', 'product', 'solution', 'service', 'customer', 'case-stud',
  'pricing', 'team', 'company', 'feature', 'platform', 'why', 'industr',
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  // Remove trailing slash
  url = url.replace(/\/+$/, '');
  return url;
}

function getBaseDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

function stripHtml(html: string): string {
  // Remove script and style tags and their contents
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove nav and footer
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  // Remove header tags (site header, not h1-h6)
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '');
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text.substring(0, 5000);
}

function extractInternalLinks(html: string, baseDomain: string): string[] {
  const links: Set<string> = new Set();
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    let href = match[1];
    // Skip anchors, mailto, tel, javascript
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    // Resolve relative URLs
    if (href.startsWith('/')) {
      href = baseDomain + href;
    }
    // Only keep internal links
    if (href.startsWith(baseDomain)) {
      const path = href.replace(baseDomain, '').split('?')[0].split('#')[0].replace(/\/+$/, '');
      if (path && path !== '') {
        links.add(path);
      }
    }
  }
  return Array.from(links);
}

function matchesFuzzyPattern(path: string): boolean {
  const lower = path.toLowerCase();
  return FUZZY_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { url: rawUrl, mode } = body as { url: string; mode: 'full' | 'rescan' };

    if (!rawUrl) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
    }

    const baseUrl = normalizeUrl(rawUrl);
    const baseDomain = getBaseDomain(baseUrl);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const sendSSE = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Step 1: Fetch homepage
          sendSSE({ type: 'progress', page: 'Scanning homepage...', current: 1, total: 8 });
          const homepageHtml = await fetchPage(baseUrl);

          if (!homepageHtml) {
            sendSSE({ type: 'error', message: `Could not fetch ${baseUrl}. Make sure the website is accessible.` });
            controller.close();
            return;
          }

          // Step 2: Find pages to crawl
          const foundLinks = extractInternalLinks(homepageHtml, baseDomain);
          const matchingLinks = foundLinks.filter(matchesFuzzyPattern);

          // Build page list: known patterns + matching discovered links
          const pagePaths = new Set<string>();
          for (const pattern of KNOWN_PATTERNS) {
            pagePaths.add(pattern);
          }
          for (const link of matchingLinks) {
            pagePaths.add(link);
          }

          // Cap at 14 additional pages (homepage + 14 = 15 total)
          const pageList = Array.from(pagePaths).slice(0, 14);
          const totalPages = 1 + pageList.length + 1; // homepage + pages + AI analysis

          // Step 3: Crawl pages
          const pageTexts: { url: string; text: string }[] = [];
          const homepageText = stripHtml(homepageHtml);
          if (homepageText.length > 50) {
            pageTexts.push({ url: baseUrl, text: homepageText });
          }

          for (let i = 0; i < pageList.length; i++) {
            const pagePath = pageList[i];
            const pageUrl = baseDomain + pagePath;
            sendSSE({
              type: 'progress',
              page: `Scanning ${pagePath}...`,
              current: i + 2,
              total: totalPages,
            });

            await delay(1000);
            const html = await fetchPage(pageUrl);
            if (html) {
              const text = stripHtml(html);
              if (text.length > 50) {
                pageTexts.push({ url: pageUrl, text });
              }
            }
          }

          if (pageTexts.length === 0) {
            sendSSE({ type: 'error', message: 'Could not extract text from any pages.' });
            controller.close();
            return;
          }

          // Step 4: AI Extraction
          sendSSE({
            type: 'progress',
            page: 'Analyzing content with AI...',
            current: totalPages,
            total: totalPages,
          });

          const combinedText = pageTexts
            .map(p => `--- Page: ${p.url} ---\n${p.text}`)
            .join('\n\n')
            .substring(0, 50000);

          const basePrompt = `You are extracting company information from website content. Analyze the following website text and extract structured data.

Return a JSON object with these exact fields:
{
  "companyName": "string",
  "tagline": "string",
  "aboutUs": "string (2-4 sentences)",
  "products": [{ "name": "string", "description": "string (1-2 sentences)", "keyFeatures": ["string"], "pricing": "string or empty" }],
  "differentiators": "string (what makes them unique)",
  "industries": ["string (target industries mentioned)"],
  "personas": ["string (job titles/roles mentioned)"],
  "companySize": "string (if mentioned)",
  "caseStudies": [{ "title": "string", "content": "string (summary)" }],
  "competitors": [{ "name": "string", "howWeBeatThem": "" }],
  "brandVoice": { "tone": "string (describe the voice)", "wordsToUse": ["string"], "wordsToAvoid": [] },
  "missingFields": ["string (what couldn't be found)"]
}

Only include items you actually found in the content. For missing items, use empty arrays/strings and list them in missingFields.`;

          const rescanAddition = mode === 'rescan'
            ? '\n\nIMPORTANT: This is a re-scan. Merge new findings with existing data. Flag new items with [NEW] prefix.'
            : '';

          const aiResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: `${basePrompt}${rescanAddition}\n\nWebsite content:\n${combinedText}`,
            }],
          });

          // Extract text from response
          let responseText = '';
          for (const block of aiResponse.content) {
            if (block.type === 'text') {
              responseText += block.text;
            }
          }

          // Parse JSON from response (handle markdown code blocks)
          let extractedData;
          try {
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
            extractedData = JSON.parse(jsonStr);
          } catch {
            // Try to find JSON object directly
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
              extractedData = JSON.parse(responseText.substring(startIdx, endIdx + 1));
            } else {
              sendSSE({ type: 'error', message: 'Failed to parse AI response. Please try again.' });
              controller.close();
              return;
            }
          }

          sendSSE({ type: 'result', data: extractedData });
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          sendSSE({ type: 'error', message });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e) {
    console.error('[website-scan] Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
}
