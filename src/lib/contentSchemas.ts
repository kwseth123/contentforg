// ═══════════════════════════════════════════════════════════════════════════════
// ContentForge — Schema-Driven Content Generation
//
// Every template defines exactly what content it needs. The AI generates
// structured JSON matching the schema. The template renders the JSON.
// No ambiguity. No markdown parsing. Perfect fit every time.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Base Schema Types ────────────────────────────────────────────────────────

export interface ContentField {
  key: string;
  type: 'string' | 'array' | 'stat' | 'quote' | 'table' | 'object';
  maxWords?: number;
  maxItems?: number;
  minItems?: number;
  instruction: string;
  example?: string;
  required: boolean;
  /** Nested field definitions for object/array-of-objects types */
  fields?: ContentField[];
}

export interface ContentSchema {
  templateId: string;
  contentType: string;
  fields: ContentField[];
  systemInstruction: string;
}

// ── Verified Stat (Anti-Hallucination) ───────────────────────────────────────

export type StatSource = 'knowledge_base' | 'roi_calculator' | 'explicit_content' | 'needs_verification';

export interface VerifiedStat {
  value: string;
  label: string;
  context?: string;
  source: StatSource;
  sourceDetail: string;
  verified: boolean;
}

// ── Schema Output Types ──────────────────────────────────────────────────────

export interface OnePagerData {
  headline: string;
  subheadline: string;
  stat1_value: string;
  stat1_label: string;
  stat1_context: string;
  stat1_source: StatSource;
  stat1_sourceDetail: string;
  stat2_value: string;
  stat2_label: string;
  stat2_context: string;
  stat2_source: StatSource;
  stat2_sourceDetail: string;
  stat3_value: string;
  stat3_label: string;
  stat3_context: string;
  stat3_source: StatSource;
  stat3_sourceDetail: string;
  challenge_bullets: string[];
  solution_bullets: string[];
  differentiator1: string;
  differentiator2: string;
  differentiator3: string;
  proof_quote: string;
  proof_attribution: string;
  cta: string;
}

export interface BattleCardData {
  competitor_name: string;
  win_headline: string;
  our_strengths: string[];
  their_weaknesses: string[];
  objection_responses: { objection: string; response: string }[];
  landmine_questions: string[];
  pricing_comparison: string;
  win_themes: string[];
}

export interface CompetitiveAnalysisData {
  executive_summary: string;
  feature_categories: {
    category_name: string;
    features: {
      feature_name: string;
      our_support: 'full' | 'partial' | 'no';
      competitor_support: 'full' | 'partial' | 'no';
      our_advantage: string;
    }[];
  }[];
  overall_verdict: string;
  proof_points: string[];
}

export interface ExecutiveSummaryData {
  impact_statement: string;
  situation_summary: string;
  three_outcomes: { outcome_headline: string; outcome_detail: string }[];
  investment_summary: string;
  risk_of_inaction: string;
  recommended_next_step: string;
}

export interface DiscoveryCallPrepData {
  prospect_context: string;
  discovery_questions: { question: string; why_ask: string }[];
  stakeholder_map: { role: string; likely_concern: string; what_they_need_to_hear: string }[];
  likely_objections: { objection: string; response: string }[];
  success_criteria: string;
  next_step_ask: string;
}

export interface ROIBusinessCaseData {
  investment_total: string;
  roi_percentage: string;
  payback_months: string;
  annual_savings_total: string;
  savings_breakdown: { category: string; amount: string; calculation_basis: string }[];
  year1_projection: string;
  year2_projection: string;
  year3_projection: string;
  risk_of_status_quo: string;
  assumptions: string[];
  stat_sources: { field: string; source: StatSource; sourceDetail: string }[];
}

export interface CaseStudyData {
  result_headline: string;
  customer_context: string;
  the_challenge: string;
  the_solution: string;
  result_stat1_value: string;
  result_stat1_label: string;
  result_stat1_source: StatSource;
  result_stat1_sourceDetail: string;
  result_stat2_value: string;
  result_stat2_label: string;
  result_stat2_source: StatSource;
  result_stat2_sourceDetail: string;
  result_stat3_value: string;
  result_stat3_label: string;
  result_stat3_source: StatSource;
  result_stat3_sourceDetail: string;
  customer_quote: string;
  customer_quote_attribution: string;
  what_made_it_work: string[];
}

export type SchemaData =
  | OnePagerData
  | BattleCardData
  | CompetitiveAnalysisData
  | ExecutiveSummaryData
  | DiscoveryCallPrepData
  | ROIBusinessCaseData
  | CaseStudyData;

// ═══════════════════════════════════════════════════════════════════════════════
// Schema Definitions
// ═══════════════════════════════════════════════════════════════════════════════

const ANTI_HALLUCINATION_INSTRUCTION = `
CRITICAL DATA INTEGRITY RULES — You must follow these exactly:
- Every statistic must come from one of three sources: the knowledge base provided, ROI calculator outputs, or numbers explicitly stated in uploaded content.
- If you do not have a verified number, return "NEEDS_VERIFICATION" as the value.
- NEVER invert a cost into a saving. A $54K price is NOT a $54K saving.
- NEVER fabricate industry statistics not in the knowledge base.
- NEVER estimate ROI without calculator inputs.
- For every stat, you must specify the source and sourceDetail explaining where it came from.
- A document with 3 real stats is better than one with 10 fabricated ones.
- If a number from uploaded content is a PRICE, it must never appear as a SAVING or RESULT.
`;

export const SCHEMAS: Record<string, ContentSchema> = {
  // ── Schema 1: Solution One-Pager / Ultra Minimal ─────────────────────────
  'solution-one-pager:style-01': {
    templateId: 'style-01',
    contentType: 'solution-one-pager',
    systemInstruction: `You are writing a one-page sales document for a B2B software company. Every word must earn its place. Be specific with numbers. Sound like a confident sales leader not a marketing robot. Never use jargon. Lead with business outcomes not features.\n${ANTI_HALLUCINATION_INSTRUCTION}`,
    fields: [
      { key: 'headline', type: 'string', maxWords: 12, required: true,
        instruction: 'Write one powerful outcome statement. Start with a number or strong verb.',
        example: 'Eliminate manual inventory counts and reclaim 16 hours every week' },
      { key: 'subheadline', type: 'string', maxWords: 20, required: true,
        instruction: 'One sentence expanding on the headline with a second specific benefit.' },
      { key: 'stat1_value', type: 'string', maxWords: 3, required: true,
        instruction: 'The most impressive percentage or number from verified data. If none available, return NEEDS_VERIFICATION.',
        example: '94%' },
      { key: 'stat1_label', type: 'string', maxWords: 4, required: true,
        instruction: 'What the stat measures.', example: 'Inventory accuracy rate' },
      { key: 'stat1_context', type: 'string', maxWords: 6, required: true,
        instruction: 'Brief context.', example: 'Up from 78% before implementation' },
      { key: 'stat1_source', type: 'string', required: true,
        instruction: 'One of: knowledge_base, roi_calculator, explicit_content, needs_verification' },
      { key: 'stat1_sourceDetail', type: 'string', required: true,
        instruction: 'Exactly where this number came from. If needs_verification, explain what data is needed.' },
      { key: 'stat2_value', type: 'string', maxWords: 3, required: true,
        instruction: 'Second most impressive stat from verified data. Return NEEDS_VERIFICATION if unavailable.' },
      { key: 'stat2_label', type: 'string', maxWords: 4, required: true, instruction: 'What stat 2 measures.' },
      { key: 'stat2_context', type: 'string', maxWords: 6, required: true, instruction: 'Brief context for stat 2.' },
      { key: 'stat2_source', type: 'string', required: true,
        instruction: 'Source for stat 2.' },
      { key: 'stat2_sourceDetail', type: 'string', required: true, instruction: 'Source detail for stat 2.' },
      { key: 'stat3_value', type: 'string', maxWords: 3, required: true,
        instruction: 'Third stat from verified data. Return NEEDS_VERIFICATION if unavailable.' },
      { key: 'stat3_label', type: 'string', maxWords: 4, required: true, instruction: 'What stat 3 measures.' },
      { key: 'stat3_context', type: 'string', maxWords: 6, required: true, instruction: 'Brief context for stat 3.' },
      { key: 'stat3_source', type: 'string', required: true, instruction: 'Source for stat 3.' },
      { key: 'stat3_sourceDetail', type: 'string', required: true, instruction: 'Source detail for stat 3.' },
      { key: 'challenge_bullets', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three specific pain points this prospect is experiencing right now. Start each with a present-tense pain verb. Max 12 words each.',
        example: 'Manual counts take 16 hours and still produce errors' },
      { key: 'solution_bullets', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three specific things the product does to solve those exact pains. Start with an action verb. Max 12 words each.',
        example: 'Barcode scanning updates Acumatica inventory in real time automatically' },
      { key: 'differentiator1', type: 'string', maxWords: 8, required: true,
        instruction: 'The single biggest reason to choose this product. Bold claim.',
        example: 'Only solution built natively for Acumatica manufacturers' },
      { key: 'differentiator2', type: 'string', maxWords: 8, required: true,
        instruction: 'Second strongest differentiator.' },
      { key: 'differentiator3', type: 'string', maxWords: 8, required: true,
        instruction: 'Third differentiator focused on implementation speed or risk reduction.' },
      { key: 'proof_quote', type: 'string', maxWords: 25, required: true,
        instruction: 'Write a quote that sounds like a real warehouse manager or VP Ops said it after seeing results. Specific and outcome-focused.' },
      { key: 'proof_attribution', type: 'string', maxWords: 8, required: true,
        instruction: 'Job title and company type only.', example: 'VP of Operations, Mid-Market Distributor' },
      { key: 'cta', type: 'string', maxWords: 10, required: true,
        instruction: 'One specific next step.', example: 'Schedule a 30-minute live demo this week' },
    ],
  },

  // ── Schema 2: Battle Card / Dark Mode ────────────────────────────────────
  'battle-card:style-09': {
    templateId: 'style-09',
    contentType: 'battle-card',
    systemInstruction: `You are writing an internal sales battle card. This is for the rep's eyes only — be direct, competitive, and tactical. Give reps exact phrases they can use. Be honest about weaknesses but always show how to counter them.\n${ANTI_HALLUCINATION_INSTRUCTION}`,
    fields: [
      { key: 'competitor_name', type: 'string', required: true,
        instruction: 'The competitor this card is for.' },
      { key: 'win_headline', type: 'string', maxWords: 10, required: true,
        instruction: 'The single most powerful reason you beat this competitor. Aggressive and direct.' },
      { key: 'our_strengths', type: 'array', maxItems: 5, minItems: 5, required: true,
        instruction: 'Five specific product advantages over this competitor. Each must reference something the competitor cannot do or does worse. Max 15 words each.' },
      { key: 'their_weaknesses', type: 'array', maxItems: 5, minItems: 5, required: true,
        instruction: 'Five specific competitor weaknesses based on actual product limitations. Be factual not hyperbolic. Max 15 words each.' },
      { key: 'objection_responses', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three common things prospects say when considering this competitor and the exact words to say back.',
        fields: [
          { key: 'objection', type: 'string', required: true, instruction: 'The prospect objection.' },
          { key: 'response', type: 'string', required: true, instruction: 'The exact response to use.' },
        ] },
      { key: 'landmine_questions', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three discovery questions that naturally expose this competitor\'s weaknesses without mentioning them by name. Max 15 words each.' },
      { key: 'pricing_comparison', type: 'string', maxWords: 30, required: true,
        instruction: 'Honest comparison of pricing models and total cost of ownership.' },
      { key: 'win_themes', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three short phrases that summarize why you win. Max 8 words each.',
        example: 'Real-time vs batch. Native vs bolted-on. Weeks vs months.' },
    ],
  },

  // ── Schema 3: Competitive Analysis / Comparison Matrix ───────────────────
  'competitive-analysis:style-29': {
    templateId: 'style-29',
    contentType: 'competitive-analysis',
    systemInstruction: `You are writing a formal competitive analysis for a B2B buyer. Be objective and structured. Use specific feature comparisons. Base every claim on actual product capabilities from the knowledge base.\n${ANTI_HALLUCINATION_INSTRUCTION}`,
    fields: [
      { key: 'executive_summary', type: 'string', maxWords: 40, required: true,
        instruction: 'One paragraph verdict on the competitive landscape and why this product is the right choice.' },
      { key: 'feature_categories', type: 'array', minItems: 3, maxItems: 6, required: true,
        instruction: 'Feature categories with individual feature comparisons.',
        fields: [
          { key: 'category_name', type: 'string', required: true, instruction: 'Category name, e.g. "Core Functionality" or "Integration".' },
          { key: 'features', type: 'array', minItems: 2, maxItems: 5, required: true,
            instruction: 'Features in this category.',
            fields: [
              { key: 'feature_name', type: 'string', required: true, instruction: 'Feature name.' },
              { key: 'our_support', type: 'string', required: true, instruction: 'One of: full, partial, no' },
              { key: 'competitor_support', type: 'string', required: true, instruction: 'One of: full, partial, no' },
              { key: 'our_advantage', type: 'string', maxWords: 10, required: true, instruction: 'Why our approach is better.' },
            ] },
        ] },
      { key: 'overall_verdict', type: 'string', maxWords: 30, required: true,
        instruction: 'The bottom line recommendation.' },
      { key: 'proof_points', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three specific customer results that validate the competitive position. Max 20 words each.' },
    ],
  },

  // ── Schema 4: Executive Summary / Editorial ──────────────────────────────
  'executive-summary:style-14': {
    templateId: 'style-14',
    contentType: 'executive-summary',
    systemInstruction: `You are writing for a C-suite executive who reads at 1000 words per minute and has zero patience for fluff. Lead with financial impact. Use specific numbers. Respect their intelligence. Get to the point immediately.\n${ANTI_HALLUCINATION_INSTRUCTION}`,
    fields: [
      { key: 'impact_statement', type: 'string', maxWords: 20, required: true,
        instruction: 'The single most important financial or operational impact. Lead with a dollar figure or percentage. If no verified number, use NEEDS_VERIFICATION as the number.' },
      { key: 'situation_summary', type: 'string', maxWords: 50, required: true,
        instruction: 'What is happening at this company right now that makes this an urgent priority.' },
      { key: 'three_outcomes', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three specific measurable outcomes the executive cares about.',
        fields: [
          { key: 'outcome_headline', type: 'string', maxWords: 6, required: true, instruction: 'Short outcome headline.' },
          { key: 'outcome_detail', type: 'string', maxWords: 20, required: true, instruction: 'Specific measurable detail.' },
        ] },
      { key: 'investment_summary', type: 'string', maxWords: 30, required: true,
        instruction: 'Frame the investment as ROI not cost. Include payback period if available from calculator.' },
      { key: 'risk_of_inaction', type: 'string', maxWords: 25, required: true,
        instruction: 'What happens if they do nothing. Quantify it if possible.' },
      { key: 'recommended_next_step', type: 'string', maxWords: 15, required: true,
        instruction: 'One specific action with a timeframe.' },
    ],
  },

  // ── Schema 5: Discovery Call Prep / Technical Brief ──────────────────────
  'discovery-call-prep:style-20': {
    templateId: 'style-20',
    contentType: 'discovery-call-prep',
    systemInstruction: `You are preparing a sales rep for a discovery call. Be specific to this prospect's industry and company size. Make every question open-ended. Give the rep confidence and context.`,
    fields: [
      { key: 'prospect_context', type: 'string', maxWords: 40, required: true,
        instruction: 'What we know about this prospect and why they are likely talking to us.' },
      { key: 'discovery_questions', type: 'array', maxItems: 7, minItems: 7, required: true,
        instruction: 'Seven open-ended questions that uncover pain, urgency, and buying process. Never yes/no questions.',
        fields: [
          { key: 'question', type: 'string', maxWords: 20, required: true, instruction: 'The open-ended question.' },
          { key: 'why_ask', type: 'string', maxWords: 15, required: true, instruction: 'Why this question matters for the deal.' },
        ] },
      { key: 'stakeholder_map', type: 'array', minItems: 2, maxItems: 5, required: true,
        instruction: 'Key stakeholders likely involved in this deal.',
        fields: [
          { key: 'role', type: 'string', required: true, instruction: 'Stakeholder role/title.' },
          { key: 'likely_concern', type: 'string', maxWords: 10, required: true, instruction: 'Their primary concern.' },
          { key: 'what_they_need_to_hear', type: 'string', maxWords: 15, required: true, instruction: 'What resonates with this persona.' },
        ] },
      { key: 'likely_objections', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three likely objections and responses.',
        fields: [
          { key: 'objection', type: 'string', required: true, instruction: 'The objection.' },
          { key: 'response', type: 'string', maxWords: 20, required: true, instruction: 'How to respond.' },
        ] },
      { key: 'success_criteria', type: 'string', maxWords: 25, required: true,
        instruction: 'What a successful discovery call looks like for this prospect.' },
      { key: 'next_step_ask', type: 'string', maxWords: 15, required: true,
        instruction: 'The specific next step to ask for at the end of the call.' },
    ],
  },

  // ── Schema 6: ROI Business Case / Financial Report ───────────────────────
  'roi-business-case:style-18': {
    templateId: 'style-18',
    contentType: 'roi-business-case',
    systemInstruction: `You are writing a financial justification document for a CFO or VP of Finance. Use conservative estimates. Show your math. Make it easy to present internally. Every number must be defensible.\n${ANTI_HALLUCINATION_INSTRUCTION}\n\nCRITICAL: If no ROI calculator data is provided, ALL financial figures must be NEEDS_VERIFICATION. Do not fabricate dollar amounts or percentages.`,
    fields: [
      { key: 'investment_total', type: 'string', required: true,
        instruction: 'The annual investment amount. Use NEEDS_VERIFICATION if not provided.' },
      { key: 'roi_percentage', type: 'string', required: true,
        instruction: 'The ROI percentage. Must come from calculator or knowledge base. Use NEEDS_VERIFICATION if not available.' },
      { key: 'payback_months', type: 'string', required: true,
        instruction: 'Months to payback. Use NEEDS_VERIFICATION if not calculated.' },
      { key: 'annual_savings_total', type: 'string', required: true,
        instruction: 'Total annual savings. Use NEEDS_VERIFICATION if not calculated.' },
      { key: 'savings_breakdown', type: 'array', minItems: 3, maxItems: 6, required: true,
        instruction: 'Savings by category with calculation basis.',
        fields: [
          { key: 'category', type: 'string', required: true, instruction: 'Savings category name.' },
          { key: 'amount', type: 'string', required: true, instruction: 'Dollar amount or NEEDS_VERIFICATION.' },
          { key: 'calculation_basis', type: 'string', maxWords: 20, required: true, instruction: 'How this was calculated. Be specific.' },
        ] },
      { key: 'year1_projection', type: 'string', required: true, instruction: 'Net benefit year 1. NEEDS_VERIFICATION if not calculated.' },
      { key: 'year2_projection', type: 'string', required: true, instruction: 'Net benefit year 2.' },
      { key: 'year3_projection', type: 'string', required: true, instruction: 'Net benefit year 3.' },
      { key: 'risk_of_status_quo', type: 'string', maxWords: 30, required: true,
        instruction: 'Annual cost of doing nothing in dollar terms. Only use verified numbers.' },
      { key: 'assumptions', type: 'array', minItems: 3, maxItems: 6, required: true,
        instruction: 'Conservative assumptions used in calculations. Max 15 words each.' },
      { key: 'stat_sources', type: 'array', required: true,
        instruction: 'Source verification for every financial figure used.',
        fields: [
          { key: 'field', type: 'string', required: true, instruction: 'Which field this sources.' },
          { key: 'source', type: 'string', required: true, instruction: 'One of: knowledge_base, roi_calculator, explicit_content, needs_verification' },
          { key: 'sourceDetail', type: 'string', required: true, instruction: 'Where exactly this came from.' },
        ] },
    ],
  },

  // ── Schema 7: Case Study / Storytelling ──────────────────────────────────
  'case-study:style-25': {
    templateId: 'style-25',
    contentType: 'case-study',
    systemInstruction: `You are writing a customer success story. Make the customer the hero. Use narrative structure. Lead with the most impressive result. Sound like a journalist not a marketer.\n${ANTI_HALLUCINATION_INSTRUCTION}`,
    fields: [
      { key: 'result_headline', type: 'string', maxWords: 10, required: true,
        instruction: 'The single most impressive quantified result.',
        example: '94% inventory accuracy achieved in 6 weeks' },
      { key: 'customer_context', type: 'string', maxWords: 30, required: true,
        instruction: 'Who the customer is and what their situation was before.' },
      { key: 'the_challenge', type: 'string', maxWords: 50, required: true,
        instruction: 'What specific problem they were trying to solve and why it was urgent.' },
      { key: 'the_solution', type: 'string', maxWords: 50, required: true,
        instruction: 'What was implemented and how it addressed the challenge.' },
      { key: 'result_stat1_value', type: 'string', required: true,
        instruction: 'First result stat value. NEEDS_VERIFICATION if not from verified source.' },
      { key: 'result_stat1_label', type: 'string', required: true, instruction: 'What result stat 1 measures.' },
      { key: 'result_stat1_source', type: 'string', required: true, instruction: 'Source type.' },
      { key: 'result_stat1_sourceDetail', type: 'string', required: true, instruction: 'Source detail.' },
      { key: 'result_stat2_value', type: 'string', required: true, instruction: 'Second result stat value.' },
      { key: 'result_stat2_label', type: 'string', required: true, instruction: 'What stat 2 measures.' },
      { key: 'result_stat2_source', type: 'string', required: true, instruction: 'Source type.' },
      { key: 'result_stat2_sourceDetail', type: 'string', required: true, instruction: 'Source detail.' },
      { key: 'result_stat3_value', type: 'string', required: true, instruction: 'Third result stat value.' },
      { key: 'result_stat3_label', type: 'string', required: true, instruction: 'What stat 3 measures.' },
      { key: 'result_stat3_source', type: 'string', required: true, instruction: 'Source type.' },
      { key: 'result_stat3_sourceDetail', type: 'string', required: true, instruction: 'Source detail.' },
      { key: 'customer_quote', type: 'string', maxWords: 30, required: true,
        instruction: 'What the customer said about the results. Specific and outcome-focused.' },
      { key: 'customer_quote_attribution', type: 'string', required: true,
        instruction: 'Name, title, and company.' },
      { key: 'what_made_it_work', type: 'array', maxItems: 3, minItems: 3, required: true,
        instruction: 'Three specific things that drove the success. Max 15 words each.' },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Schema Lookup
// ═══════════════════════════════════════════════════════════════════════════════

/** Get schema for a content type + template combination */
export function getSchema(contentType: string, templateId: string): ContentSchema | undefined {
  return SCHEMAS[`${contentType}:${templateId}`];
}

/** Get schema for a content type using its default template */
export function getSchemaForContentType(contentType: string): ContentSchema | undefined {
  const DEFAULT_MAP: Record<string, string> = {
    'solution-one-pager': 'style-01',
    'battle-card': 'style-09',
    'competitive-analysis': 'style-29',
    'executive-summary': 'style-14',
    'discovery-call-prep': 'style-20',
    'roi-business-case': 'style-18',
    'case-study': 'style-25',
  };
  const templateId = DEFAULT_MAP[contentType];
  if (!templateId) return undefined;
  return SCHEMAS[`${contentType}:${templateId}`];
}

/** Check if a content type has a schema available */
export function hasSchema(contentType: string): boolean {
  return !!getSchemaForContentType(contentType);
}

/** Get all available schema keys */
export function getAllSchemaKeys(): string[] {
  return Object.keys(SCHEMAS);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Quality Validation
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: { field: string; error: string }[];
  warnings: { field: string; warning: string }[];
  needsVerification: string[];
}

const BANNED_WORDS = [
  'various', 'multiple', 'several', 'numerous', 'many', 'lots of',
  'synergy', 'leverage', 'paradigm', 'holistic', 'robust solution',
  'best-in-class', 'world-class', 'cutting-edge', 'state-of-the-art',
  'revolutionary', 'game-changing', 'disruptive', 'innovative solution',
];

const FILLER_PATTERNS = [
  /\bin today's (?:fast-paced|ever-changing|dynamic) (?:business |market )?(?:landscape|environment)\b/i,
  /\bunlock the (?:full )?potential\b/i,
  /\btake .+ to the next level\b/i,
  /\bseamlessly integrate\b/i,
];

export function validateSchemaOutput(schema: ContentSchema, data: Record<string, unknown>): ValidationResult {
  const errors: { field: string; error: string }[] = [];
  const warnings: { field: string; warning: string }[] = [];
  const needsVerification: string[] = [];

  for (const field of schema.fields) {
    const value = data[field.key];

    // Required field check
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: field.key, error: 'Required field is missing' });
      continue;
    }

    if (value === undefined || value === null) continue;

    // NEEDS_VERIFICATION tracking
    if (typeof value === 'string' && value.includes('NEEDS_VERIFICATION')) {
      needsVerification.push(field.key);
    }

    // String field checks
    if (field.type === 'string' && typeof value === 'string' && !value.includes('NEEDS_VERIFICATION')) {
      if (field.maxWords) {
        const wordCount = value.split(/\s+/).filter(Boolean).length;
        if (wordCount > field.maxWords * 1.5) {
          errors.push({ field: field.key, error: `Exceeds word limit: ${wordCount} words (max ${field.maxWords})` });
        } else if (wordCount > field.maxWords) {
          warnings.push({ field: field.key, warning: `Slightly over word limit: ${wordCount} words (max ${field.maxWords})` });
        }
      }

      // Check for banned vocabulary
      for (const banned of BANNED_WORDS) {
        if (value.toLowerCase().includes(banned)) {
          warnings.push({ field: field.key, warning: `Contains banned word: "${banned}"` });
        }
      }

      // Check for filler patterns
      for (const pattern of FILLER_PATTERNS) {
        if (pattern.test(value)) {
          warnings.push({ field: field.key, warning: `Contains filler language` });
        }
      }
    }

    // Array field checks
    if (field.type === 'array' && Array.isArray(value)) {
      if (field.minItems && value.length < field.minItems) {
        errors.push({ field: field.key, error: `Too few items: ${value.length} (min ${field.minItems})` });
      }
      if (field.maxItems && value.length > field.maxItems) {
        warnings.push({ field: field.key, warning: `Too many items: ${value.length} (max ${field.maxItems})` });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    needsVerification,
  };
}
