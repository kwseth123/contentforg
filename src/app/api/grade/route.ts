import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { ContentGrades, PersonaType, PERSONA_CONFIGS } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sections, contentType, prospect, persona } = await req.json();

  const fullContent = sections
    .map((s: { title: string; content: string }) => `## ${s.title}\n${s.content}`)
    .join('\n\n');

  const personaLabel = persona
    ? PERSONA_CONFIGS.find((p) => p.id === (persona as PersonaType))?.label || persona
    : null;

  const prompt = `You are an expert B2B sales content reviewer. Grade this document across 6 dimensions, each scored 1-10.

Document type: ${contentType}
Target prospect: ${prospect.companyName} in ${prospect.industry}
${personaLabel ? `Target reader: ${personaLabel}` : ''}

Content to grade:
${fullContent}

For each dimension, provide:
1. A score from 1-10
2. A specific, actionable suggestion if the score is under 7. Not generic advice — reference the actual content and suggest a specific improvement.

Return JSON:
{
  "grades": {
    "relevance": { "score": 8, "suggestion": null },
    "clarity": { "score": 6, "suggestion": "The 'Solution Overview' section uses too much jargon. Replace 'leverage synergistic capabilities' with a plain description of what the integration actually does." },
    "differentiation": { "score": 7, "suggestion": null },
    "proof": { "score": 5, "suggestion": "Add the 342% ROI metric from the Midwest Fastener case study to the 'Why Choose Us' section — it's your strongest proof point for manufacturing prospects." },
    "callToAction": { "score": 4, "suggestion": "The closing section says 'reach out anytime' which is weak. Replace with a specific next step: 'Schedule a 30-minute warehouse walkthrough this week' with a calendar link." },
    "personaFit": { "score": 7, "suggestion": null }
  },
  "overallGrade": "B+",
  "summary": "Strong on relevance and differentiation but needs more specific proof points and a clearer call to action."
}

Scoring guide:
- Relevance (1-10): Does it speak directly to THIS prospect's specific situation, industry, and pain points?
- Clarity (1-10): Is it easy to read? No jargon? Clear structure? Scannable?
- Differentiation (1-10): Does it clearly explain why this company wins vs alternatives?
- Proof (1-10): Does it include specific evidence — numbers, case studies, customer names, metrics?
- Call to Action (1-10): Is the next step clear, specific, and compelling? Not generic.
- Persona Fit (1-10): Does the language, metrics, and emphasis match what the target reader cares about?

Overall grade: A (avg 9+), A- (8.5+), B+ (8+), B (7+), B- (6.5+), C+ (6+), C (5+), D (below 5)

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);

    const grades: ContentGrades = {
      relevance: parsed.grades.relevance,
      clarity: parsed.grades.clarity,
      differentiation: parsed.grades.differentiation,
      proof: parsed.grades.proof,
      callToAction: parsed.grades.callToAction,
      personaFit: parsed.grades.personaFit,
      overallGrade: parsed.overallGrade,
      summary: parsed.summary,
    };

    return NextResponse.json(grades);
  } catch {
    // Fallback grades
    return NextResponse.json({
      relevance: { score: 7, suggestion: null },
      clarity: { score: 7, suggestion: null },
      differentiation: { score: 7, suggestion: null },
      proof: { score: 7, suggestion: null },
      callToAction: { score: 7, suggestion: null },
      personaFit: { score: 7, suggestion: null },
      overallGrade: 'B',
      summary: 'Unable to grade content — using default scores.',
    } satisfies ContentGrades);
  }
}
