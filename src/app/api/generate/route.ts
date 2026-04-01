import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getKnowledgeBase } from '@/lib/knowledgeBase';
import { buildSystemPrompt, buildUserPrompt, buildSectionRegeneratePrompt } from '@/lib/prompts';
import Anthropic from '@anthropic-ai/sdk';
import { ContentType, ProspectInfo, VisualSection } from '@/lib/types';
import { VariationSeed, buildVariationInstructions } from '@/lib/variation';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VISUAL_MODE_PROMPT_SUFFIX = `

IMPORTANT: Return your response as a valid JSON object with this exact structure:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "The actual content text for this section. Use markdown formatting.",
      "visualFormat": "highlight-box",
      "items": []
    }
  ]
}

Valid visualFormat values: "highlight-box", "stat-cards", "numbered-flow", "before-after", "icon-grid", "comparison-table", "timeline", "blockquote", "pricing-cards", "cta-box"

For stat-cards, items should be: [{"value": "342%", "label": "ROI", "subtext": "in 14 months"}]
For numbered-flow, items should be: [{"title": "Step 1", "description": "..."}]
For before-after, provide: {"before": {"title": "Today", "items": ["..."]}, "after": {"title": "With Solution", "items": ["..."]}}
For icon-grid, items should be: [{"icon": "🚀", "title": "Fast Deploy", "description": "..."}]
For comparison-table, provide: {"headers": ["Feature", "Us", "Them"], "rows": [{"dimension": "Speed", "values": ["✅ Fast", "❌ Slow"]}]}
For timeline, items should be: [{"label": "Phase 1", "duration": "2 weeks", "description": "..."}]
For blockquote, provide: {"quote": "...", "attribution": "Name", "role": "Title"}
For pricing-cards, items should be: [{"name": "Starter", "price": "$999/mo", "features": ["..."], "highlighted": false}]
For cta-box, provide: {"headline": "...", "bullets": ["..."], "contactInfo": "..."}

Choose the visualFormat that BEST communicates each section's content. Follow these rules:
- Comparisons → comparison-table
- Metrics/results → stat-cards
- Process/steps → numbered-flow
- Before/after → before-after
- Features/benefits → icon-grid
- Timeline/phases → timeline
- Quotes → blockquote
- Pricing → pricing-cards
- Final CTA → cta-box
- Everything else → highlight-box

Never use the same visualFormat for two consecutive sections. Vary the visual treatment.
Return ONLY the JSON object, no other text.`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (e) {
      console.error('[generate] Failed to parse request body:', e);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }

    const {
      contentType,
      prospect,
      additionalContext,
      toneLevel,
      sessionDocuments,
      regenerateSection,
      originalSectionContent,
      visualMode,
      variationSeed,
    } = body as {
      contentType: ContentType;
      prospect: ProspectInfo;
      additionalContext: string;
      toneLevel: number;
      sessionDocuments: string[];
      regenerateSection?: string;
      originalSectionContent?: string;
      visualMode?: boolean;
      variationSeed?: VariationSeed;
    };

    if (!contentType || !prospect) {
      console.error('[generate] Missing required fields: contentType or prospect');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: contentType and prospect are required' }),
        { status: 400 }
      );
    }

    let kb;
    try {
      kb = await getKnowledgeBase();
    } catch (e) {
      console.error('[generate] Failed to load knowledge base:', e);
      return new Response(
        JSON.stringify({ error: 'Failed to load knowledge base. Please configure it in Settings.' }),
        { status: 500 }
      );
    }

    let systemPrompt = buildSystemPrompt(kb);

    if (variationSeed) {
      systemPrompt += buildVariationInstructions(variationSeed);
    }

    let userPrompt: string;
    if (regenerateSection && originalSectionContent) {
      userPrompt = buildSectionRegeneratePrompt(
        regenerateSection,
        originalSectionContent,
        contentType,
        prospect,
        toneLevel
      );
    } else {
      userPrompt = buildUserPrompt(contentType, prospect, toneLevel ?? 50, additionalContext ?? '', sessionDocuments || []);
    }

    // ── Visual Mode: collect full response, parse JSON ──
    if (visualMode && !regenerateSection) {
      const visualUserPrompt = userPrompt + VISUAL_MODE_PROMPT_SUFFIX;

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: visualUserPrompt }],
        });

        // Extract text from response
        let responseText = '';
        for (const block of message.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }

        // Try to parse as JSON
        let parsed: { sections: VisualSection[] } | null = null;
        try {
          // Strip any markdown code fences if present
          let cleanedText = responseText.trim();
          if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.slice(7);
          } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.slice(3);
          }
          if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
          }
          cleanedText = cleanedText.trim();

          parsed = JSON.parse(cleanedText);
        } catch {
          // JSON parse failed — fall back to streaming mode
          console.warn('[generate] Visual mode JSON parse failed, falling back to streaming');
          parsed = null;
        }

        if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          // Visual mode succeeded
          return new Response(
            JSON.stringify({ visual: true, sections: parsed.sections }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // JSON parsed but invalid structure — fall through to streaming fallback
        console.warn('[generate] Visual mode returned invalid structure, falling back to streaming');
      } catch (e) {
        console.error('[generate] Visual mode API call failed, falling back to streaming:', e);
      }

      // ── Fallback: re-generate with standard streaming ──
    }

    // ── Standard streaming mode ──
    let stream;
    try {
      stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
    } catch (e) {
      console.error('[generate] Failed to create Anthropic stream:', e);
      return new Response(
        JSON.stringify({ error: 'Failed to connect to AI service. Check API key configuration.' }),
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
          console.error('[generate] Stream error:', e);
          const errorMsg = e instanceof Error ? e.message : 'Stream interrupted';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
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
    console.error('[generate] Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred during generation' }),
      { status: 500 }
    );
  }
}
