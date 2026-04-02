import { NextRequest } from 'next/server';
import { getKnowledgeBase } from '@/lib/knowledgeBase';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts';
import Anthropic from '@anthropic-ai/sdk';
import { ContentType, ProspectInfo } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Onboarding-specific generate endpoint.
 * No auth required — only allows solution-one-pager generation
 * to power the onboarding step 4 demo document.
 */
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }

    const { contentType, prospect, additionalContext, toneLevel } = body as {
      contentType: ContentType;
      prospect: ProspectInfo;
      additionalContext: string;
      toneLevel: number;
    };

    // Only allow solution-one-pager during onboarding
    if (contentType !== 'solution-one-pager') {
      return new Response(JSON.stringify({ error: 'Only solution-one-pager is allowed during onboarding' }), { status: 403 });
    }

    if (!prospect) {
      return new Response(JSON.stringify({ error: 'Missing prospect' }), { status: 400 });
    }

    let kb;
    try {
      kb = await getKnowledgeBase();
    } catch {
      kb = {
        companyName: '', tagline: '', website: '', aboutUs: '',
        products: [], differentiators: '',
        icp: { industries: [], companySize: '', personas: [] },
        competitors: [],
        brandVoice: { tone: '', wordsToUse: [], wordsToAvoid: [] },
        caseStudies: [], uploadedDocuments: [], logoPath: '',
      };
    }

    const systemPrompt = buildSystemPrompt(kb);
    const userPrompt = buildUserPrompt(contentType, prospect, toneLevel ?? 50, additionalContext ?? '', []);

    let stream;
    try {
      stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
    } catch (e) {
      console.error('[onboarding/generate] Failed to create stream:', e);
      return new Response(
        JSON.stringify({ error: 'Failed to connect to AI service' }),
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`));
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (e) {
          console.error('[onboarding/generate] Stream error:', e);
          const errorMsg = e instanceof Error ? e.message : 'Stream interrupted';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('[onboarding/generate] Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500 }
    );
  }
}
