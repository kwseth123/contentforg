import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { IndustryConfig, ROIInputs } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { industry } = await req.json();
  if (!industry) return NextResponse.json({ error: 'No industry' }, { status: 400 });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You generate industry-specific ROI calculator configurations. Return ONLY valid JSON matching this exact structure:

{
  "industry": "the industry name",
  "metricLabels": {
    "employeesAffected": { "label": "industry-specific label", "helper": "industry-specific helper text" },
    "hoursLostPerWeek": { "label": "...", "helper": "..." },
    "hourlyRate": { "label": "...", "helper": "..." },
    "errorsPerWeek": { "label": "...", "helper": "..." },
    "costPerError": { "label": "...", "helper": "..." },
    "currentMonthlySpend": { "label": "...", "helper": "..." },
    "solutionMonthlyCost": { "label": "...", "helper": "..." }
  },
  "benchmarkValues": {
    "employeesAffected": number,
    "hoursLostPerWeek": number,
    "hourlyRate": number,
    "errorsPerWeek": number,
    "costPerError": number,
    "currentMonthlySpend": number,
    "solutionMonthlyCost": number
  },
  "painPoints": ["8 industry-specific operational pain points"],
  "proofPointPrompts": ["suggestions for what proof points would resonate"],
  "terminology": { "key_term": "industry_equivalent" }
}

Rules:
- Labels must use industry-specific jargon and language — nothing generic
- Benchmark values must be realistic for a mid-size company in this industry
- Pain points must be specific operational problems, not vague
- Use the exact metric keys shown above
- Return ONLY the JSON`,
      messages: [{
        role: 'user',
        content: `Generate a complete industry-specific ROI calculator configuration for: ${industry}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to generate config' }, { status: 500 });

    const config: IndustryConfig = JSON.parse(jsonMatch[0]);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: `Config generation failed: ${(error as Error).message}` }, { status: 500 });
  }
}
