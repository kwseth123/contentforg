import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentContent, fileName } = await req.json();

  if (!documentContent) {
    return NextResponse.json({ error: 'No document content provided' }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a brand guidelines parser. You extract brand settings from brand guideline documents.
Return ONLY a valid JSON object with the following structure — fill in whatever you can find in the document. Leave fields as null if not found.

{
  "colors": {
    "primary": "#hex or null",
    "secondary": "#hex or null",
    "accent": "#hex or null",
    "background": "#hex or null",
    "text": "#hex or null"
  },
  "fonts": {
    "primary": "font name or null",
    "secondary": "font name or null",
    "sizes": {
      "h1": number or null,
      "h2": number or null,
      "h3": number or null,
      "body": number or null
    }
  },
  "voice": {
    "guidelinesText": "extracted brand voice/tone description or null",
    "approvedTerms": ["list of approved words/phrases"] or [],
    "bannedTerms": ["list of banned/avoid words/phrases"] or [],
    "tagline": "company tagline or null"
  },
  "documentStyle": "modern" | "corporate" | "bold" | "minimal" | null
}

Rules:
- Extract hex color values when mentioned (e.g. "Primary Blue: #2B5797")
- For fonts, use exact names as they appear (e.g. "Montserrat", "Open Sans")
- Font sizes should be in points
- For voice, extract any tone descriptions, personality traits, or writing style guidelines
- Approved terms = words/phrases the brand encourages using
- Banned terms = words/phrases the brand says to avoid or never use
- Document style: "modern" if clean/minimalist language, "corporate" if traditional/formal, "bold" if energetic/creative, "minimal" if ultra-simple
- If a color is described by name but no hex (e.g. "Navy Blue"), provide your best hex approximation
- Return ONLY the JSON object, no other text`,
      messages: [
        {
          role: 'user',
          content: `Parse this brand guidelines document and extract all brand settings.\n\nDocument: "${fileName}"\n\n${documentContent}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse brand guidelines' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to parse brand guidelines: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
