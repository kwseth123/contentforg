// ═══════════════════════════════════════════════════════════════════════════════
// ContentForge — Schema-Driven Generation Pipeline
//
// Takes a ContentSchema + context, builds a prompt that instructs Claude to
// fill exactly the schema fields, validates the JSON response, and returns
// typed data ready for the template renderer.
// ═══════════════════════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import {
  ContentSchema,
  ContentField,
  validateSchemaOutput,
  ValidationResult,
} from './contentSchemas';
import { KnowledgeBase, ProductProfile } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface GenerationContext {
  knowledgeBase: KnowledgeBase;
  products: ProductProfile[];
  prospect: {
    companyName: string;
    industry?: string;
    companySize?: string;
    painPoints?: string | string[];
    techStack?: string | string[];
  };
  additionalContext?: string;
  /** Content from uploaded documents — transcripts, recordings, etc. */
  uploadedContent?: string;
  /** ROI calculator outputs if available */
  roiCalculatorData?: Record<string, string | number>;
}

export interface GenerationResult {
  data: Record<string, unknown>;
  validation: ValidationResult;
  rawResponse: string;
}

// ── Build Knowledge Base Context ─────────────────────────────────────────────

function buildKBContext(ctx: GenerationContext): string {
  const { knowledgeBase: kb, products } = ctx;
  const parts: string[] = [];

  if (kb.companyName) parts.push(`Company Name: ${kb.companyName}`);
  if (kb.tagline) parts.push(`Tagline: ${kb.tagline}`);
  if (kb.aboutUs) parts.push(`About Us: ${kb.aboutUs}`);

  if (products.length > 0) {
    const productLines = products.map(p => {
      const features = p.features?.length
        ? ` (Features: ${p.features.map(f => `${f.name}: ${f.description || ''}`).join('; ')})`
        : '';
      return `- ${p.name}: ${p.shortDescription || ''}${features}`;
    });
    parts.push(`Products:\n${productLines.join('\n')}`);
  }

  if (kb.differentiators) parts.push(`Key Differentiators:\n${kb.differentiators}`);

  if (kb.competitors?.length) {
    parts.push(`Competitors:\n${kb.competitors.map(c => {
      if (typeof c === 'string') return `- ${c}`;
      return `- ${c.name}: ${c.howWeBeatThem || ''}`;
    }).join('\n')}`);
  }

  if (kb.caseStudies?.length) {
    parts.push(`Customer Success Stories:\n${kb.caseStudies.map(cs => {
      if (typeof cs === 'string') return `- ${cs}`;
      return `- ${cs.title}: ${cs.content || ''}`;
    }).join('\n')}`);
  }

  if (kb.brandVoice) {
    parts.push([
      `Brand Voice:`,
      `- Tone: ${kb.brandVoice.tone || 'Professional'}`,
      `- Approved vocabulary: ${(kb.brandVoice.wordsToUse || []).join(', ') || 'None specified'}`,
      `- Banned vocabulary: ${(kb.brandVoice.wordsToAvoid || []).join(', ') || 'None specified'}`,
    ].join('\n'));
  }

  return parts.join('\n\n');
}

// ── Build Field Instructions ─────────────────────────────────────────────────

function buildFieldInstructions(fields: ContentField[], indent = ''): string {
  return fields.map(f => {
    const constraints: string[] = [];
    if (f.maxWords) constraints.push(`max ${f.maxWords} words`);
    if (f.type === 'array') {
      if (f.minItems && f.maxItems && f.minItems === f.maxItems) {
        constraints.push(`exactly ${f.minItems} items`);
      } else {
        if (f.minItems) constraints.push(`min ${f.minItems} items`);
        if (f.maxItems) constraints.push(`max ${f.maxItems} items`);
      }
    }
    const constraintStr = constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
    const exampleStr = f.example ? `\n${indent}  Example: "${f.example}"` : '';
    const requiredStr = f.required ? ' (REQUIRED)' : ' (optional)';

    let nested = '';
    if (f.fields && f.fields.length > 0) {
      nested = `\n${indent}  Each item has these fields:\n${buildFieldInstructions(f.fields, indent + '    ')}`;
    }

    return `${indent}"${f.key}" (${f.type})${constraintStr}${requiredStr}: ${f.instruction}${exampleStr}${nested}`;
  }).join('\n\n');
}

// ── Build Generation Prompt ──────────────────────────────────────────────────

function buildPrompt(schema: ContentSchema, ctx: GenerationContext): { system: string; user: string } {
  const kbContext = buildKBContext(ctx);

  const system = schema.systemInstruction;

  const prospectContext = [
    `Prospect: ${ctx.prospect.companyName}`,
    ctx.prospect.industry ? `Industry: ${ctx.prospect.industry}` : '',
    ctx.prospect.companySize ? `Company Size: ${ctx.prospect.companySize}` : '',
    ctx.prospect.painPoints ? `Known Pain Points:\n${Array.isArray(ctx.prospect.painPoints) ? ctx.prospect.painPoints.map(p => `- ${p}`).join('\n') : ctx.prospect.painPoints}` : '',
    ctx.prospect.techStack ? `Tech Stack:\n${Array.isArray(ctx.prospect.techStack) ? ctx.prospect.techStack.map(t => `- ${t}`).join('\n') : ctx.prospect.techStack}` : '',
  ].filter(Boolean).join('\n');

  const roiSection = ctx.roiCalculatorData
    ? `\n## ROI CALCULATOR OUTPUTS (VERIFIED DATA — use these exact numbers)\n${Object.entries(ctx.roiCalculatorData).map(([k, v]) => `${k}: ${v}`).join('\n')}`
    : '';

  const uploadedSection = ctx.uploadedContent
    ? `\n## UPLOADED CONTENT (use numbers from here ONLY if context supports the claim)\n${ctx.uploadedContent.slice(0, 8000)}`
    : '';

  const user = `## KNOWLEDGE BASE
${kbContext}

## PROSPECT
${prospectContext}
${roiSection}
${uploadedSection}

${ctx.additionalContext ? `## ADDITIONAL CONTEXT FROM REP\n${ctx.additionalContext}` : ''}

## YOUR TASK
Generate content for a "${schema.contentType}" document using the "${schema.templateId}" template.

Fill in EXACTLY these fields and return them as a valid JSON object:

${buildFieldInstructions(schema.fields)}

## CRITICAL RULES
1. Return ONLY a valid JSON object. No markdown code fences, no explanation, no preamble.
2. Fill every required field. Do not skip any.
3. Respect word limits — go under, never over.
4. For stats: include the source field specifying where the number came from (knowledge_base, roi_calculator, explicit_content, or needs_verification).
5. If you don't have verified data for a stat, use "NEEDS_VERIFICATION" as the value — never fabricate.
6. Never use banned vocabulary from the brand voice guidelines.
7. Sound like a senior sales professional, not an AI.`;

  return { system, user };
}

// ── Parse JSON Response ──────────────────────────────────────────────────────

function parseJsonResponse(text: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1]);
      } catch { /* fall through */ }
    }

    // Try finding the first { ... } block
    const braceStart = text.indexOf('{');
    const braceEnd = text.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      try {
        return JSON.parse(text.slice(braceStart, braceEnd + 1));
      } catch { /* fall through */ }
    }
  }
  return null;
}

// ── Main Generation Function ─────────────────────────────────────────────────

export async function generateFromSchema(
  schema: ContentSchema,
  ctx: GenerationContext,
): Promise<GenerationResult> {
  const { system, user } = buildPrompt(schema, ctx);

  // First attempt
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  });

  let responseText = '';
  for (const block of message.content) {
    if (block.type === 'text') responseText += block.text;
  }

  let data = parseJsonResponse(responseText);

  // Retry with stricter prompt if parsing failed
  if (!data) {
    console.warn('[generateFromSchema] First attempt JSON parse failed, retrying...');
    const retryMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: system + '\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY a JSON object. No text before or after. No markdown fences.',
      messages: [
        { role: 'user', content: user },
        { role: 'assistant', content: responseText },
        { role: 'user', content: 'That was not valid JSON. Please return ONLY the JSON object, nothing else.' },
      ],
    });

    let retryText = '';
    for (const block of retryMessage.content) {
      if (block.type === 'text') retryText += block.text;
    }

    data = parseJsonResponse(retryText);
    if (!data) {
      throw new Error('Failed to generate valid JSON after 2 attempts');
    }
    responseText = retryText;
  }

  // Validate
  const validation = validateSchemaOutput(schema, data);

  // If there are errors (missing required fields), attempt targeted fix
  if (!validation.valid && validation.errors.length <= 3) {
    const fixFields = validation.errors.map(e => e.field);
    const fixPrompt = `The JSON you generated is missing or has invalid values for these fields: ${fixFields.join(', ')}.

Current data: ${JSON.stringify(data, null, 2)}

Please return a JSON object with ONLY the corrected fields. Example: {"${fixFields[0]}": "corrected value"}`;

    try {
      const fixMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: fixPrompt }],
      });

      let fixText = '';
      for (const block of fixMessage.content) {
        if (block.type === 'text') fixText += block.text;
      }

      const fixData = parseJsonResponse(fixText);
      if (fixData) {
        // Merge fixes into data
        for (const [key, value] of Object.entries(fixData)) {
          if (value !== undefined && value !== null) {
            data[key] = value;
          }
        }
      }
    } catch (err) {
      console.warn('[generateFromSchema] Targeted fix call failed:', err);
    }

    // Re-validate after fix
    const revalidation = validateSchemaOutput(schema, data);
    return { data, validation: revalidation, rawResponse: responseText };
  }

  return { data, validation, rawResponse: responseText };
}
