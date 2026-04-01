import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { ContentScores } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sections, contentType } = await req.json();
  const fullContent = sections.map((s: { title: string; content: string }) =>
    `## ${s.title}\n${s.content}`
  ).join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Score this B2B sales content (type: ${contentType}) on exactly 4 dimensions, each out of 10.

Content to score:
${fullContent}

Respond ONLY with valid JSON in this exact format, no other text:
{
  "clarity": <1-10>,
  "differentiation": <1-10>,
  "proof": <1-10>,
  "callToAction": <1-10>,
  "tips": {
    "clarity": "<one-line coaching tip if score < 7, empty string otherwise>",
    "differentiation": "<one-line coaching tip if score < 7, empty string otherwise>",
    "proof": "<one-line coaching tip if score < 7, empty string otherwise>",
    "callToAction": "<one-line coaching tip if score < 7, empty string otherwise>"
  }
}

Scoring criteria:
- Clarity: Is the content clear, well-structured, and readable?
- Differentiation: Does it highlight why we win vs. competitors?
- Proof: Does it include customer evidence, data, case studies, or metrics?
- Call to Action: Does it tell the prospect exactly what to do next?`
    }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    const scores: ContentScores = {
      clarity: parsed.clarity,
      differentiation: parsed.differentiation,
      proof: parsed.proof,
      callToAction: parsed.callToAction,
      overall: Math.round((parsed.clarity + parsed.differentiation + parsed.proof + parsed.callToAction) / 4),
      tips: parsed.tips,
    };
    return NextResponse.json(scores);
  } catch {
    return NextResponse.json({
      clarity: 7, differentiation: 7, proof: 7, callToAction: 7,
      overall: 7, tips: { clarity: '', differentiation: '', proof: '', callToAction: '' },
    } satisfies ContentScores);
  }
}
