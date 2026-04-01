import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { documentContent, fileName, existingProfile } = await req.json();
  if (!documentContent || typeof documentContent !== 'string') {
    return NextResponse.json({ error: 'No document content provided' }, { status: 400 });
  }
  if (documentContent.trim().length < 50) {
    return NextResponse.json(
      { error: 'Document content is too short to extract product information. Try a more detailed document or paste the content manually.' },
      { status: 400 }
    );
  }

  try {
    const existingContext = existingProfile
      ? `\n\nEXISTING PRODUCT PROFILE (merge new info, never overwrite existing values, append new items to lists):\n${JSON.stringify(existingProfile, null, 2)}`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: `You extract product information from documents. Return ONLY valid JSON.

Extract into this structure:
{
  "name": "product name or null",
  "shortDescription": "one sentence description or null",
  "fullDescription": "2-4 paragraph description or null",
  "features": [{"name": "feature name", "description": "1-2 sentence description"}],
  "benefits": ["outcome-focused benefit"],
  "idealUseCase": "what problem this solves and in what scenario, or null",
  "targetIndustries": ["industry tags"],
  "differentiators": ["what makes this better than alternatives"],
  "proofPoints": ["specific metrics or customer results"],
  "objections": [{"objection": "common objection", "response": "suggested response"}]
}

Rules:
- Extract ONLY what's explicitly stated or clearly implied in the document
- Features must have both name and description
- Benefits should be outcome-focused, not feature descriptions
- Proof points should include specific numbers when available
- If merging with existing profile, ADD new items to arrays, don't replace existing ones
- If the same feature appears in both old and new, flag it with "[CONFLICT]" prefix in the name
- Return ONLY the JSON, no other text`,
      messages: [{
        role: 'user',
        content: `Extract product information from this document.\n\nDocument: "${fileName}"\n\n${documentContent}${existingContext}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip markdown code fences if present (e.g. ```json ... ```)
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[product-parse] No JSON found in AI response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'Could not parse this document. Try a text-based PDF or paste the content manually.' },
        { status: 500 }
      );
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('[product-parse] JSON parse error:', (parseErr as Error).message);
      return NextResponse.json(
        { error: 'Could not parse AI response. Try uploading the document again.' },
        { status: 500 }
      );
    }

    // Filter out null/undefined values so only real data is returned
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(extracted)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length === 0) continue;
        filtered[key] = value;
      }
    }

    return NextResponse.json({ extracted: filtered, sourceFile: fileName });
  } catch (error) {
    console.error('[product-parse] Extraction error:', (error as Error).message);
    return NextResponse.json(
      { error: `Could not parse this document: ${(error as Error).message}. Try a different format or paste content manually.` },
      { status: 500 }
    );
  }
}
