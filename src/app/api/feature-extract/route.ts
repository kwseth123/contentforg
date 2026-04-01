import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface FeatureExtractRequest {
  source: 'url' | 'text' | 'transcript' | 'manual';
  content: string;
  competitorName?: string;
  mode?: 'competitor' | 'discovery' | 'full-analysis';
  yourContent?: string;
}

interface DiscoveryResult {
  whatWeHave: string[];
  whatTheyNeed: string[];
  ourGaps: string[];
  competitiveIntel: string[];
}

interface ExtractedFeature {
  featureName: string;
  category: string;
  supported: 'yes' | 'no' | 'partial';
  caveat: string;
  confidence: 'high' | 'medium' | 'low';
}

interface FeatureExtractResponse {
  competitorName: string;
  logoUrl?: string;
  features: ExtractedFeature[];
}

async function fetchWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMetaFromHtml(html: string): { title: string; ogImage: string; favicon: string } {
  // Extract page title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // Extract og:image
  const ogImageMatch =
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
  const ogImage = ogImageMatch ? ogImageMatch[1] : '';

  // Extract favicon
  const faviconMatch =
    html.match(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
    html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
  const favicon = faviconMatch ? faviconMatch[1] : '';

  return { title, ogImage, favicon };
}

function deriveCompanyName(title: string, url: string): string {
  if (title) {
    // Common patterns: "Product - Company", "Company | Product", "Company: Tagline"
    const separators = [' - ', ' | ', ' — ', ' – ', ': '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        return title.split(sep)[0].trim();
      }
    }
    return title.trim();
  }
  // Fallback: extract domain name
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  } catch {
    return 'Unknown';
  }
}

function resolveLogoUrl(baseUrl: string, ogImage: string, favicon: string): string | undefined {
  if (ogImage) {
    try {
      return new URL(ogImage, baseUrl).href;
    } catch {
      return ogImage;
    }
  }
  if (favicon) {
    try {
      return new URL(favicon, baseUrl).href;
    } catch {
      return favicon;
    }
  }
  // Fallback: try /favicon.ico
  try {
    const origin = new URL(baseUrl).origin;
    return `${origin}/favicon.ico`;
  } catch {
    return undefined;
  }
}

const EXTRACTION_PROMPT = `You are analyzing content about a product or competitor. Extract every feature, capability, or specification mentioned. For each feature return: featureName, category, supported (yes/no/partial), caveat (any limitations or conditions), confidence (high/medium/low based on how explicitly it was mentioned). Return as JSON array. Group features into logical categories: Integration, Workflow, Pricing, Implementation, Support, Security, and any other categories that emerge from the content. Be specific — not just 'reporting' but 'real-time inventory reports' or 'end-of-day batch reports.'`;

const DISCOVERY_PROMPT = `You are performing a holistic discovery analysis on the provided content. Analyze the content thoroughly and produce a four-section intelligence report as a JSON object with exactly these four keys:

1. "whatWeHave" — an array of strings listing features, capabilities, and strengths that are detected or mentioned as existing/available
2. "whatTheyNeed" — an array of strings listing prospect requirements, needs, pain points, or desired capabilities mentioned
3. "ourGaps" — an array of strings listing areas where there may be shortfalls, missing capabilities, or areas that need improvement
4. "competitiveIntel" — an array of strings listing any competitive mentions, comparisons, market positioning, or competitor references found

Return ONLY a JSON object with these four keys, each containing an array of descriptive strings. Be specific and actionable in each item.`;

const FULL_ANALYSIS_PROMPT = `You are performing a comprehensive head-to-head analysis. You have content from two sources:

YOUR PRODUCT CONTENT:
{YOUR_CONTENT}

COMPETITOR CONTENT:
{COMPETITOR_CONTENT}

Produce TWO things in your response:

1. A "features" array — for each feature/capability mentioned across EITHER source, return: featureName, category, supported (yes/no/partial — from the COMPETITOR's perspective), caveat, confidence. Group into logical categories.

2. A "discoveryResult" object with four arrays:
   - "whatWeHave": features and capabilities YOUR PRODUCT has
   - "whatTheyNeed": requirements or needs detected from the content
   - "ourGaps": areas where YOUR PRODUCT may fall short compared to the competitor
   - "competitiveIntel": competitive insights, positioning differences, and key differentiators

Return as a JSON object with keys "features" (array) and "discoveryResult" (object with four arrays). Be specific and actionable.`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: FeatureExtractRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { source, content, competitorName, mode, yourContent } = body;

    if (!source || !content) {
      return NextResponse.json(
        { error: 'source and content are required' },
        { status: 400 }
      );
    }

    // Manual source — return content as-is, no AI needed
    if (source === 'manual') {
      const response: FeatureExtractResponse = {
        competitorName: competitorName || 'Manual Entry',
        features: [],
      };

      // Try to parse content as JSON features array
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          response.features = parsed;
        }
      } catch {
        // Content is not JSON — return it as a single feature
        response.features = [
          {
            featureName: content,
            category: 'General',
            supported: 'yes',
            caveat: '',
            confidence: 'high',
          },
        ];
      }

      return NextResponse.json(response);
    }

    let textForClaude = '';
    let derivedName = competitorName || '';
    let logoUrl: string | undefined;

    if (source === 'url') {
      const normalizedUrl = normalizeUrl(content);
      let mainHtml = '';

      // Fetch main URL
      try {
        const mainRes = await fetchWithTimeout(normalizedUrl);
        if (mainRes.ok) {
          mainHtml = await mainRes.text();
        }
      } catch {
        // Main fetch failed
      }

      if (!mainHtml) {
        return NextResponse.json(
          { error: 'Could not fetch the provided URL' },
          { status: 422 }
        );
      }

      // Extract metadata from main page
      const meta = extractMetaFromHtml(mainHtml);
      if (!derivedName) {
        derivedName = deriveCompanyName(meta.title, normalizedUrl);
      }
      logoUrl = resolveLogoUrl(normalizedUrl, meta.ogImage, meta.favicon);

      // Strip main page to text
      const mainText = stripHtmlToText(mainHtml);
      textForClaude = mainText;

      // Try to fetch /features and /product pages from same domain
      try {
        const origin = new URL(normalizedUrl).origin;
        const additionalPaths = ['/features', '/product'];
        const additionalFetches = additionalPaths.map(async (path) => {
          try {
            const res = await fetchWithTimeout(`${origin}${path}`);
            if (res.ok) {
              const html = await res.text();
              return stripHtmlToText(html);
            }
          } catch {
            // Ignore failures for additional pages
          }
          return '';
        });

        const additionalTexts = await Promise.all(additionalFetches);
        for (const text of additionalTexts) {
          if (text) {
            textForClaude += '\n\n' + text;
          }
        }
      } catch {
        // Ignore errors when fetching additional pages
      }

      // Limit total text to avoid token overflow
      textForClaude = textForClaude.slice(0, 30000);
    } else {
      // source === 'text' or 'transcript'
      textForClaude = content.slice(0, 30000);
      if (!derivedName) {
        derivedName = 'Unknown Product';
      }
    }

    // Determine which prompt to use based on mode
    const effectiveMode = mode || 'competitor';

    if (effectiveMode === 'discovery') {
      // Discovery Mode — return four-section intelligence report
      let discoveryResult: DiscoveryResult = {
        whatWeHave: [],
        whatTheyNeed: [],
        ourGaps: [],
        competitiveIntel: [],
      };

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `${DISCOVERY_PROMPT}\n\nContent to analyze:\n\n${textForClaude}`,
            },
          ],
        });

        const responseText = message.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object') {
            discoveryResult = {
              whatWeHave: Array.isArray(parsed.whatWeHave) ? parsed.whatWeHave : [],
              whatTheyNeed: Array.isArray(parsed.whatTheyNeed) ? parsed.whatTheyNeed : [],
              ourGaps: Array.isArray(parsed.ourGaps) ? parsed.ourGaps : [],
              competitiveIntel: Array.isArray(parsed.competitiveIntel) ? parsed.competitiveIntel : [],
            };
          }
        } catch {
          // JSON parse failed for discovery
        }
      } catch (aiError) {
        console.error('Claude API error (discovery):', aiError);
        return NextResponse.json(
          { error: 'AI discovery analysis failed. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        competitorName: derivedName,
        logoUrl,
        features: [],
        discoveryResult,
      });
    }

    if (effectiveMode === 'full-analysis') {
      // Full Analysis Mode — combined features + discovery
      const yourText = (yourContent || '').slice(0, 30000);
      const prompt = FULL_ANALYSIS_PROMPT
        .replace('{YOUR_CONTENT}', yourText || '(No product content provided)')
        .replace('{COMPETITOR_CONTENT}', textForClaude || '(No competitor content provided)');

      let features: ExtractedFeature[] = [];
      let discoveryResult: DiscoveryResult = {
        whatWeHave: [],
        whatTheyNeed: [],
        ourGaps: [],
        competitiveIntel: [],
      };

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const responseText = message.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.features)) {
              features = parsed.features;
            }
            if (parsed.discoveryResult && typeof parsed.discoveryResult === 'object') {
              discoveryResult = {
                whatWeHave: Array.isArray(parsed.discoveryResult.whatWeHave) ? parsed.discoveryResult.whatWeHave : [],
                whatTheyNeed: Array.isArray(parsed.discoveryResult.whatTheyNeed) ? parsed.discoveryResult.whatTheyNeed : [],
                ourGaps: Array.isArray(parsed.discoveryResult.ourGaps) ? parsed.discoveryResult.ourGaps : [],
                competitiveIntel: Array.isArray(parsed.discoveryResult.competitiveIntel) ? parsed.discoveryResult.competitiveIntel : [],
              };
            }
          }
        } catch {
          // Try to find features array
          const arrayMatch = responseText.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              features = JSON.parse(arrayMatch[0]);
            } catch {
              // Could not parse
            }
          }
        }
      } catch (aiError) {
        console.error('Claude API error (full-analysis):', aiError);
        return NextResponse.json(
          { error: 'AI full analysis failed. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        competitorName: derivedName,
        logoUrl,
        features,
        discoveryResult,
      });
    }

    // Default: Competitor Mode — extract features
    let features: ExtractedFeature[] = [];
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\nContent to analyze:\n\n${textForClaude}`,
          },
        ],
      });

      // Extract text from response
      const responseText = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      // Parse JSON from response — handle markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();

      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          features = parsed;
        } else if (parsed && Array.isArray(parsed.features)) {
          features = parsed.features;
        }
      } catch {
        // If JSON parsing fails, try to find array in the response
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            features = JSON.parse(arrayMatch[0]);
          } catch {
            // Could not parse features from response
          }
        }
      }
    } catch (aiError) {
      console.error('Claude API error:', aiError);
      return NextResponse.json(
        { error: 'AI extraction failed. Please try again.' },
        { status: 500 }
      );
    }

    const response: FeatureExtractResponse = {
      competitorName: derivedName,
      logoUrl,
      features,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Feature extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
