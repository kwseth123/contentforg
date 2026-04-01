import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { ProspectIntel } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Helpers ──

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

function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and tags
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

// Known tech signatures to detect in HTML source
const TECH_SIGNATURES: { name: string; patterns: RegExp[]; category: string }[] = [
  { name: 'Google Analytics', patterns: [/google-analytics\.com|googletagmanager\.com|gtag\(/i], category: 'Analytics' },
  { name: 'HubSpot', patterns: [/hubspot\.com|hs-scripts\.com|hbspt\./i], category: 'CRM' },
  { name: 'Salesforce', patterns: [/salesforce\.com|force\.com|pardot\.com/i], category: 'CRM' },
  { name: 'Marketo', patterns: [/marketo\.com|marketo\.net|munchkin/i], category: 'Marketing' },
  { name: 'Drift', patterns: [/drift\.com|driftt\.com/i], category: 'Chat' },
  { name: 'Intercom', patterns: [/intercom\.io|intercomcdn\.com/i], category: 'Chat' },
  { name: 'Segment', patterns: [/segment\.com|segment\.io|analytics\.js/i], category: 'Analytics' },
  { name: 'Mixpanel', patterns: [/mixpanel\.com/i], category: 'Analytics' },
  { name: 'Zendesk', patterns: [/zendesk\.com|zdassets\.com/i], category: 'Support' },
  { name: 'Shopify', patterns: [/shopify\.com|cdn\.shopify/i], category: 'E-commerce' },
  { name: 'WordPress', patterns: [/wp-content|wp-includes|wordpress/i], category: 'CMS' },
  { name: 'React', patterns: [/__react|react-root|_reactRootContainer|reactjs\.org/i], category: 'Frontend' },
  { name: 'Angular', patterns: [/ng-version|angular\.js|angular\.min\.js/i], category: 'Frontend' },
  { name: 'Vue.js', patterns: [/vue\.js|vue\.min\.js|vuejs\.org|__vue/i], category: 'Frontend' },
  { name: 'Google Tag Manager', patterns: [/googletagmanager\.com\/gtm/i], category: 'Analytics' },
  { name: 'Hotjar', patterns: [/hotjar\.com|static\.hotjar/i], category: 'Analytics' },
  { name: 'Cloudflare', patterns: [/cloudflare\.com|cloudflareinsights/i], category: 'Infrastructure' },
  { name: 'Stripe', patterns: [/stripe\.com|js\.stripe/i], category: 'Payments' },
  { name: 'Typeform', patterns: [/typeform\.com/i], category: 'Forms' },
  { name: 'Calendly', patterns: [/calendly\.com/i], category: 'Scheduling' },
  { name: 'Gong', patterns: [/gong\.io/i], category: 'Sales' },
  { name: 'Outreach', patterns: [/outreach\.io/i], category: 'Sales' },
  { name: 'Eloqua', patterns: [/eloqua\.com/i], category: 'Marketing' },
  { name: 'Freshdesk', patterns: [/freshdesk\.com|freshworks\.com/i], category: 'Support' },
];

function detectTechStack(html: string): { name: string; category: string }[] {
  const detected: { name: string; category: string }[] = [];
  for (const sig of TECH_SIGNATURES) {
    for (const pattern of sig.patterns) {
      if (pattern.test(html)) {
        detected.push({ name: sig.name, category: sig.category });
        break;
      }
    }
  }
  return detected;
}

function extractJobTitles(html: string): string[] {
  const titles: string[] = [];
  // Look for common job posting patterns
  const patterns = [
    /<h[1-4][^>]*class="[^"]*(?:job|position|role|title)[^"]*"[^>]*>(.*?)<\/h[1-4]>/gi,
    /<a[^>]*class="[^"]*(?:job|position|role)[^"]*"[^>]*>(.*?)<\/a>/gi,
    /<div[^>]*class="[^"]*(?:job-title|position-title|role-title)[^"]*"[^>]*>(.*?)<\/div>/gi,
    /<td[^>]*class="[^"]*(?:job|position|role)[^"]*"[^>]*>(.*?)<\/td>/gi,
    /<li[^>]*class="[^"]*(?:job|position|opening)[^"]*"[^>]*>(.*?)<\/li>/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const title = match[1].replace(/<[^>]+>/g, '').trim();
      if (title && title.length > 3 && title.length < 100 && !titles.includes(title)) {
        titles.push(title);
      }
    }
  }

  // Also extract from plain text patterns that look like job titles
  const text = extractTextFromHtml(html);
  const jobKeywords = /(?:Senior|Junior|Lead|Staff|Principal|Director|Manager|VP|Head of|Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Associate|Consultant)\s+[A-Z][a-zA-Z\s/&-]{3,50}/g;
  let textMatch;
  while ((textMatch = jobKeywords.exec(text)) !== null) {
    const title = textMatch[0].trim();
    if (!titles.includes(title) && titles.length < 30) {
      titles.push(title);
    }
  }

  return titles.slice(0, 20);
}

// ── Main handler ──

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, url } = body as { companyName: string; url?: string };

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 });
    }

    // Set overall timeout
    const overallTimeout = setTimeout(() => {}, 15000);

    let websiteContent = '';
    let detectedTech: { name: string; category: string }[] = [];
    let jobTitles: string[] = [];
    let rawHtml = '';

    // Only fetch website data if URL is provided
    if (url) {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const baseUrl = new URL(normalizedUrl).origin;

      // Fetch homepage, about, blog, careers in parallel
      const pagesToFetch = [
        { path: normalizedUrl, label: 'homepage' },
        { path: `${baseUrl}/about`, label: 'about' },
        { path: `${baseUrl}/about-us`, label: 'about-us' },
        { path: `${baseUrl}/blog`, label: 'blog' },
        { path: `${baseUrl}/news`, label: 'news' },
        { path: `${baseUrl}/careers`, label: 'careers' },
        { path: `${baseUrl}/jobs`, label: 'jobs' },
        { path: `${baseUrl}/careers/open-positions`, label: 'open-positions' },
      ];

      const fetchResults = await Promise.allSettled(
        pagesToFetch.map(async (page) => {
          try {
            const res = await fetchWithTimeout(page.path, 10000);
            if (!res.ok) return { label: page.label, html: '', text: '' };
            const html = await res.text();
            return { label: page.label, html, text: extractTextFromHtml(html) };
          } catch {
            return { label: page.label, html: '', text: '' };
          }
        })
      );

      for (const result of fetchResults) {
        if (result.status === 'fulfilled' && result.value.html) {
          const { label, html, text } = result.value;
          rawHtml += html;

          if (label === 'homepage') {
            websiteContent += `[Homepage]: ${text.slice(0, 1500)}\n\n`;
          } else if (label === 'about' || label === 'about-us') {
            websiteContent += `[About Page]: ${text.slice(0, 1000)}\n\n`;
          } else if (label === 'blog' || label === 'news') {
            websiteContent += `[Blog/News]: ${text.slice(0, 800)}\n\n`;
          } else if (label === 'careers' || label === 'jobs' || label === 'open-positions') {
            const jobs = extractJobTitles(html);
            if (jobs.length > 0) {
              jobTitles.push(...jobs);
            }
            websiteContent += `[Careers Page]: ${text.slice(0, 800)}\n\n`;
          }
        }
      }

      // Deduplicate job titles
      jobTitles = [...new Set(jobTitles)];

      // Detect tech stack from combined HTML
      detectedTech = detectTechStack(rawHtml);
    }

    // Trim website content to 3000 chars for AI prompt
    const trimmedContent = websiteContent.slice(0, 3000);
    const techNames = detectedTech.map(t => `${t.name} (${t.category})`);

    // AI Analysis
    const aiPrompt = `Analyze this prospect data and provide sales intelligence:

Company: ${companyName}
${trimmedContent ? `Website content: ${trimmedContent}` : 'No website data available — use your general knowledge about this company.'}
${jobTitles.length > 0 ? `Job postings found: ${jobTitles.join(', ')}` : 'No job postings data available.'}
${techNames.length > 0 ? `Tech stack detected: ${techNames.join(', ')}` : 'No tech stack data detected.'}

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "companySnapshot": {
    "description": "2-3 sentences about what they do",
    "industry": "string",
    "estimatedSize": "string (based on website complexity and job postings)",
    "location": "string (if found, otherwise 'Unknown')"
  },
  "techStack": ["string (technologies detected or inferred)"],
  "hiringSignals": {
    "summary": "string (what their hiring patterns suggest about business priorities)",
    "signals": ["string (specific insight per signal)"]
  },
  "recentNews": [{ "title": "string", "date": "string", "relevance": "string" }],
  "suggestedAngle": "string (Based on their hiring, tech stack, and company profile, lead with [specific pain point or opportunity])",
  "painPointHypotheses": ["string (inferred pain points from the data)"]
}

Be specific and actionable. If you don't have enough data for a field, make reasonable inferences based on the company name and any available context. Always provide at least 2-3 pain point hypotheses and a concrete suggested angle.`;

    try {
      const aiResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: aiPrompt }],
      });

      const aiText = aiResponse.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

      // Parse AI response
      let parsed: Omit<ProspectIntel, 'fetchedAt'>;
      try {
        // Try to extract JSON from the response (handle potential markdown wrapping)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // If parsing fails, return a minimal response
        parsed = {
          companySnapshot: {
            description: `${companyName} — analysis could not be fully completed.`,
            industry: 'Unknown',
            estimatedSize: 'Unknown',
            location: 'Unknown',
          },
          techStack: techNames.length > 0 ? techNames : [],
          hiringSignals: { summary: 'No hiring data available', signals: [] },
          recentNews: [],
          suggestedAngle: 'Lead with a discovery approach to understand their current challenges.',
          painPointHypotheses: ['Operational efficiency', 'Growth management', 'Technology modernization'],
        };
      }

      // Merge detected tech with AI-inferred tech (deduplicate)
      if (techNames.length > 0) {
        const aiTech = parsed.techStack || [];
        const detectedNames = detectedTech.map(t => t.name);
        const merged = [...detectedNames];
        for (const t of aiTech) {
          if (!merged.some(m => m.toLowerCase() === t.toLowerCase())) {
            merged.push(t);
          }
        }
        parsed.techStack = merged;
      }

      const intel: ProspectIntel = {
        ...parsed,
        fetchedAt: new Date().toISOString(),
      };

      clearTimeout(overallTimeout);
      return NextResponse.json(intel);
    } catch {
      // AI call failed — return partial data
      clearTimeout(overallTimeout);
      const fallback: ProspectIntel = {
        companySnapshot: {
          description: `${companyName} — AI analysis temporarily unavailable.`,
          industry: 'Unknown',
          estimatedSize: 'Unknown',
          location: 'Unknown',
        },
        techStack: techNames.length > 0 ? techNames.map(t => t) : [],
        hiringSignals: {
          summary: jobTitles.length > 0 ? `Found ${jobTitles.length} open positions` : 'No hiring data available',
          signals: jobTitles.slice(0, 5).map(j => `Hiring: ${j}`),
        },
        recentNews: [],
        suggestedAngle: 'Lead with a discovery approach to understand their current challenges.',
        painPointHypotheses: ['Operational efficiency', 'Growth management'],
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(fallback);
    }
  } catch (err) {
    console.error('Prospect intel error:', err);
    return NextResponse.json(
      { error: 'Failed to gather prospect intelligence' },
      { status: 500 }
    );
  }
}
