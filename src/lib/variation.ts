// ═══════════════════════════════════════════════
// Content Variation Engine
// ═══════════════════════════════════════════════

export type HookStyle = 'stat-led' | 'question' | 'story' | 'bold-claim' | 'problem-agitation' | 'future-state' | 'contrarian' | 'social-proof';
export type VoiceMode = 'direct' | 'narrative' | 'data-heavy' | 'empathetic' | 'confident';

export interface VariationSeed {
  hookStyle: HookStyle;
  voiceMode: VoiceMode;
  sequenceIndex: number; // 0, 1, or 2
}

export const HOOK_STYLES: { id: HookStyle; label: string; instruction: string }[] = [
  { id: 'stat-led', label: 'Stat-Led', instruction: 'Open with a surprising, specific statistic that grabs attention and frames the problem. The stat should be verifiable or widely accepted in the industry.' },
  { id: 'question', label: 'Question', instruction: 'Open with a provocative question that makes the reader stop and think. The question should expose a gap in their current approach.' },
  { id: 'story', label: 'Story', instruction: 'Open with a brief 2-sentence story about a company like theirs that faced the same challenge. Make it vivid and relatable.' },
  { id: 'bold-claim', label: 'Bold Claim', instruction: 'Open with a confident, bold assertion that challenges conventional thinking. Back it immediately with a proof point.' },
  { id: 'problem-agitation', label: 'Problem Agitation', instruction: 'Open by describing the prospect\'s problem in vivid detail, making them feel the pain of the status quo. Then pivot to the solution.' },
  { id: 'future-state', label: 'Future State', instruction: 'Open by painting a picture of what their world looks like after implementation. Make the future state so compelling they want to get there.' },
  { id: 'contrarian', label: 'Contrarian', instruction: 'Open by challenging a common industry belief or practice. Take a position that most competitors won\'t take.' },
  { id: 'social-proof', label: 'Social Proof', instruction: 'Open by referencing what leading companies in their space are doing differently. Create FOMO by showing they\'re behind the curve.' },
];

export const VOICE_MODES: { id: VoiceMode; label: string; instruction: string }[] = [
  { id: 'direct', label: 'Direct', instruction: 'Write in a direct, no-nonsense style. Short sentences. Get to the point fast. No fluff. Every word earns its place.' },
  { id: 'narrative', label: 'Narrative', instruction: 'Write in a storytelling style. Use analogies and real-world examples. Take the reader on a journey from problem to solution.' },
  { id: 'data-heavy', label: 'Data-Heavy', instruction: 'Lead with numbers, metrics, and benchmarks throughout. Every claim has a data point. Use tables, bullet stats, and quantified outcomes.' },
  { id: 'empathetic', label: 'Empathetic', instruction: 'Write with empathy and understanding. Acknowledge the prospect\'s challenges sincerely. Show you understand their world before offering solutions.' },
  { id: 'confident', label: 'Confident', instruction: 'Write with authority and conviction. Take strong positions. Use definitive language — not "may help" but "will transform." Project expertise and certainty.' },
];

// Fixed voice for when variation is OFF
export const FIXED_VOICE: VoiceMode = 'direct';
export const FIXED_HOOK: HookStyle = 'stat-led';

export function generateVariationSeed(): VariationSeed {
  const hookIndex = Math.floor(Math.random() * HOOK_STYLES.length);
  const voiceIndex = Math.floor(Math.random() * VOICE_MODES.length);
  const sequenceIndex = Math.floor(Math.random() * 3);
  return {
    hookStyle: HOOK_STYLES[hookIndex].id,
    voiceMode: VOICE_MODES[voiceIndex].id,
    sequenceIndex,
  };
}

export function getFixedSeed(): VariationSeed {
  return {
    hookStyle: FIXED_HOOK,
    voiceMode: FIXED_VOICE,
    sequenceIndex: 0,
  };
}

export function buildVariationInstructions(seed: VariationSeed): string {
  const hook = HOOK_STYLES.find(h => h.id === seed.hookStyle);
  const voice = VOICE_MODES.find(v => v.id === seed.voiceMode);

  let instructions = '';

  if (hook) {
    instructions += `\n\nOPENING HOOK STYLE: ${hook.instruction}`;
  }

  if (voice) {
    instructions += `\n\nWRITING VOICE: ${voice.instruction}`;
  }

  if (seed.sequenceIndex === 1) {
    instructions += '\n\nSECTION SEQUENCE: Lead with the solution and outcomes FIRST, then explain the problem and why it matters. End with proof and next steps.';
  } else if (seed.sequenceIndex === 2) {
    instructions += '\n\nSECTION SEQUENCE: Lead with social proof and customer results FIRST. Then explain what you do and why. End with the prospect-specific recommendation.';
  }
  // sequenceIndex 0 = default order, no special instruction needed

  return instructions;
}

export function getHookLabel(id: HookStyle): string {
  return HOOK_STYLES.find(h => h.id === id)?.label || id;
}

export function getVoiceLabel(id: VoiceMode): string {
  return VOICE_MODES.find(v => v.id === id)?.label || id;
}
