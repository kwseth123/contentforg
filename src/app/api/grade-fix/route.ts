import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sections, sectionIndex, suggestion, contentType, prospect } = await req.json();

  if (sectionIndex < 0 || sectionIndex >= sections.length) {
    return NextResponse.json({ error: 'Invalid section index' }, { status: 400 });
  }

  const section = sections[sectionIndex];

  const prompt = `You are an expert B2B sales content editor. You must rewrite a specific section of a ${contentType} document.

Target prospect: ${prospect.companyName} in ${prospect.industry}

The section to improve is titled "${section.title}".

Current content:
${section.content}

Improvement required:
${suggestion}

Rewrite ONLY this section's content, applying the improvement. Keep the same general structure and length, but make it stronger based on the suggestion. Return ONLY the improved content text, nothing else — no title, no explanation, no markdown headers.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ updatedContent: text.trim() });
  } catch {
    return NextResponse.json({ error: 'Failed to generate fix' }, { status: 500 });
  }
}
