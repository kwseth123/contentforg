import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { getKnowledgeBase } from '@/lib/knowledgeBase';

interface ImageSuggestion {
  description: string;
  placement: 'hero' | 'section' | 'proof';
  sectionIndex: number;
  searchQuery: string;
}

interface ImageResult {
  id: string;
  url: string;         // Regular size URL or data URI for SVG
  thumbUrl: string;    // Thumbnail for preview
  alt: string;
  credit?: string;     // Unsplash photographer credit
  placement: 'hero' | 'section' | 'proof';
  sectionIndex: number;
  isSvg: boolean;
}

function generateSvgPlaceholder(description: string, accentColor: string): string {
  // Create a branded SVG placeholder
  const hash = description.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const patterns = [
    // Abstract circles
    `<circle cx="50%" cy="50%" r="60" fill="${accentColor}" opacity="0.15"/><circle cx="35%" cy="40%" r="30" fill="${accentColor}" opacity="0.2"/><circle cx="70%" cy="65%" r="45" fill="${accentColor}" opacity="0.1"/>`,
    // Grid dots
    Array.from({length: 20}, (_, i) => `<circle cx="${(i%5)*80+40}" cy="${Math.floor(i/5)*60+30}" r="4" fill="${accentColor}" opacity="${0.1 + (i%3)*0.1}"/>`).join(''),
    // Diagonal lines
    Array.from({length: 8}, (_, i) => `<line x1="${i*50}" y1="0" x2="${i*50+200}" y2="200" stroke="${accentColor}" stroke-width="1" opacity="0.1"/>`).join(''),
    // Rounded rectangles
    `<rect x="30" y="40" width="120" height="80" rx="12" fill="${accentColor}" opacity="0.1"/><rect x="180" y="60" width="100" height="60" rx="10" fill="${accentColor}" opacity="0.15"/>`,
  ];
  const pattern = patterns[hash % patterns.length];
  const shortDesc = description.slice(0, 40);

  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#f8f9fb"/>${pattern}<text x="200" y="170" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" fill="#999">${shortDesc}</text></svg>`)}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sections, contentType, prospect } = await req.json();
  const kb = getKnowledgeBase();
  const accentColor = kb.brandGuidelines?.colors?.accent || '#6366F1';

  // Step 1: Ask Claude for image suggestions
  const client = new Anthropic();
  let suggestions: ImageSuggestion[] = [];

  try {
    const sectionSummary = sections.map((s: {title: string; content: string}, i: number) =>
      `Section ${i}: "${s.title}" - ${s.content.slice(0, 100)}...`
    ).join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `For a ${contentType} document about ${prospect?.companyName || 'a company'} in ${prospect?.industry || 'their industry'}, suggest 2-3 specific stock photo search queries. Each should enhance a specific section.

Sections:
${sectionSummary}

Respond in JSON only:
[{"description":"what the image shows","placement":"hero|section|proof","sectionIndex":0,"searchQuery":"specific unsplash search query"}]

Rules:
- Hero image: wide business/industry photo
- Section images: relevant to the section topic
- Proof images: business/operations photos
- Use specific, descriptive search queries (3-5 words)
- JSON only, no markdown`
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      suggestions = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If Claude fails, create generic suggestions
    suggestions = [
      { description: 'Professional business meeting', placement: 'hero', sectionIndex: 0, searchQuery: 'business team office' },
      { description: 'Data analytics dashboard', placement: 'section', sectionIndex: Math.min(1, sections.length - 1), searchQuery: 'analytics dashboard technology' },
    ];
  }

  // Step 2: Search Unsplash or generate SVGs
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const results: ImageResult[] = [];

  for (const suggestion of suggestions.slice(0, 3)) {
    let found = false;

    if (unsplashKey) {
      try {
        const searchRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(suggestion.searchQuery)}&per_page=1&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` }, signal: AbortSignal.timeout(5000) }
        );
        if (searchRes.ok) {
          const data = await searchRes.json();
          if (data.results?.length > 0) {
            const photo = data.results[0];
            results.push({
              id: photo.id,
              url: photo.urls.regular,
              thumbUrl: photo.urls.thumb,
              alt: suggestion.description,
              credit: `${photo.user.name} on Unsplash`,
              placement: suggestion.placement as 'hero' | 'section' | 'proof',
              sectionIndex: suggestion.sectionIndex,
              isSvg: false,
            });
            found = true;
          }
        }
      } catch { /* fall through to SVG */ }
    }

    if (!found) {
      const svgUri = generateSvgPlaceholder(suggestion.description, accentColor);
      results.push({
        id: `svg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: svgUri,
        thumbUrl: svgUri,
        alt: suggestion.description,
        placement: suggestion.placement as 'hero' | 'section' | 'proof',
        sectionIndex: suggestion.sectionIndex,
        isSvg: true,
      });
    }
  }

  return NextResponse.json({ images: results });
}
