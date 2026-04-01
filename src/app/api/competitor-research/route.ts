import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CompetitorResearchRequest {
  url: string;
  competitorName: string;
}

interface CompetitorResearchData {
  companyDescription: string;
  keyFeatures: string[];
  positioning: string;
  taglines: string[];
  customerClaims: string[];
  pricingInfo: string | null;
  g2Rating: string | null;
  g2Pros: string[];
  g2Cons: string[];
}

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function extractTextFromHtml(html: string): {
  metaDescription: string;
  ogDescription: string;
  headings: string[];
  bodyText: string;
} {
  // Extract meta description
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

  // Extract og:description
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1] : '';

  // Extract h1 and h2 tags
  const headingMatches = html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi);
  const headings: string[] = [];
  for (const match of headingMatches) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && text.length < 300) {
      headings.push(text);
    }
  }

  // Strip all tags for body text (limited)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const bodyText = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);

  return { metaDescription, ogDescription, headings, bodyText };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: CompetitorResearchRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { url, competitorName } = body;
    if (!url || !competitorName) {
      return NextResponse.json({ error: 'url and competitorName are required' }, { status: 400 });
    }

    // Fetch competitor website
    let websiteData: { metaDescription: string; ogDescription: string; headings: string[]; bodyText: string } | null = null;
    try {
      const websiteRes = await fetchWithTimeout(url);
      if (websiteRes.ok) {
        const html = await websiteRes.text();
        websiteData = extractTextFromHtml(html);
      }
    } catch {
      // Website fetch failed - continue without it
    }

    if (!websiteData) {
      return NextResponse.json({ error: 'Could not fetch website', fallback: true });
    }

    // Try G2 data
    let g2Text = '';
    try {
      const g2Slug = competitorName.toLowerCase().replace(/\s+/g, '-');
      const g2Res = await fetchWithTimeout(`https://www.g2.com/products/${g2Slug}/reviews`, 10000);
      if (g2Res.ok) {
        const g2Html = await g2Res.text();
        const g2Body = g2Html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000);
        g2Text = g2Body;
      }
    } catch {
      // G2 failed - skip it
    }

    // Build structured prompt for Claude
    const analysisPrompt = `Analyze the following competitor website data and produce a structured JSON analysis.

COMPETITOR: ${competitorName}
URL: ${url}

META DESCRIPTION: ${websiteData.metaDescription}
OG DESCRIPTION: ${websiteData.ogDescription}

HEADINGS (h1/h2):
${websiteData.headings.join('\n')}

WEBSITE BODY TEXT (excerpt):
${websiteData.bodyText}

${g2Text ? `G2 REVIEW PAGE TEXT (excerpt):\n${g2Text}` : 'G2 data: not available'}

Based on the above data, produce ONLY valid JSON in this exact format (no markdown, no code fences, just the JSON):
{
  "companyDescription": "A 1-2 sentence description of what the company does",
  "keyFeatures": ["feature1", "feature2", ...up to 8 key product features mentioned],
  "positioning": "Their core positioning/value proposition in 1-2 sentences",
  "taglines": ["tagline1", "tagline2", ...any taglines or slogans found],
  "customerClaims": ["claim1", "claim2", ...any claims like 'trusted by X customers', specific numbers, proof points],
  "pricingInfo": "any pricing information found, or null if none",
  "g2Rating": "overall rating if found from G2 data, or null",
  "g2Pros": ["pro1", "pro2", ...top positive themes from reviews, up to 5],
  "g2Cons": ["con1", "con2", ...top negative themes/complaints from reviews, up to 5]
}

If a field has no data, use an empty array [] for arrays, null for nullable strings, or "Not found on website" for required strings.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    // Extract text from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON response
    let researchData: CompetitorResearchData;
    try {
      // Try to extract JSON from response (handle potential markdown fences)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      researchData = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Failed to parse research data', fallback: true });
    }

    return NextResponse.json(researchData);
  } catch (error) {
    console.error('[competitor-research] Error:', error);
    return NextResponse.json({ error: 'Could not fetch website', fallback: true });
  }
}
