import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing transcript' }), { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are extracting structured knowledge base information from a voice note transcript. Analyze the following transcript and extract any relevant information.

Determine the primary type of information:
- "customer-win" — a story about winning a customer, closing a deal, or a success story
- "differentiator" — something that makes us different or better than competitors
- "product-update" — a new feature, product change, or roadmap item
- "competitor-info" — intelligence about a competitor
- "general" — other useful knowledge base information

Return a JSON object with this exact structure (use null for fields that don't apply):

{
  "type": "customer-win" | "differentiator" | "product-update" | "competitor-info" | "general",
  "caseStudy": { "title": "...", "content": "..." } | null,
  "differentiators": ["..."] | null,
  "productUpdate": { "productName": "...", "update": "..." } | null,
  "competitorInfo": { "name": "...", "notes": "..." } | null,
  "summary": "Brief description of what was extracted"
}

For customer wins, create a structured case study with a clear title and professional content.
For differentiators, extract each distinct differentiator as a separate array item.
For product updates, identify the product name and describe the update.
For competitor info, identify the competitor and summarize the intelligence.

Transcript:
"""
${transcript}
"""

Respond with ONLY the JSON object, no markdown formatting or code blocks.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return new Response(JSON.stringify({ error: 'No response from AI' }), { status: 500 });
    }

    // Parse the JSON response
    let extracted;
    try {
      extracted = JSON.parse(textBlock.text.trim());
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), { status: 500 });
      }
    }

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[voice-extract] Error:', error);
    return new Response(JSON.stringify({ error: 'Voice extraction failed' }), { status: 500 });
  }
}
