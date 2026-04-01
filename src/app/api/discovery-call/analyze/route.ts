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

  try {
    const formData = await req.formData();
    const prospectName = formData.get('prospectName') as string;
    const transcript = formData.get('transcript') as string;
    const file = formData.get('file') as File | null;

    let content = transcript || '';
    if (file && !content) {
      content = await file.text();
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'No content to analyze' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze this discovery call transcript/notes for ${prospectName}. Extract structured intelligence.

TRANSCRIPT:
${content.slice(0, 8000)}

Return ONLY valid JSON with this exact structure:
{
  "painPoints": [{"text": "summary", "quote": "exact quote from call"}],
  "currentState": [{"text": "summary", "quote": "exact quote"}],
  "desiredState": [{"text": "summary", "quote": "exact quote"}],
  "timeline": [{"text": "summary", "quote": "exact quote"}],
  "budgetSignals": [{"text": "summary", "quote": "exact quote"}],
  "decisionProcess": [{"text": "summary", "quote": "exact quote"}],
  "competitorsMentioned": [{"text": "competitor name and context", "quote": "exact quote"}],
  "objectionsRaised": [{"text": "summary", "quote": "exact quote"}],
  "buyingSignals": [{"text": "summary", "quote": "exact quote"}],
  "stakeholders": [{"name": "person name", "role": "their role"}],
  "nextSteps": [{"text": "agreed action item", "quote": "exact quote"}]
}

Be thorough. Extract every relevant detail. Use exact quotes where possible.`
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      success: true,
      prospectName,
      analyzedAt: new Date().toISOString(),
      analysis,
    });
  } catch (error) {
    console.error('Discovery call analysis failed:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
