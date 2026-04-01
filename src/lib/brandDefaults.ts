import { BrandGuidelines, KnowledgeBase, DEFAULT_BRAND_GUIDELINES, DocumentStyle } from './types';

// ═══════════════════════════════════════════════
// Google Fonts available in brand settings
// ═══════════════════════════════════════════════

export const GOOGLE_FONTS = [
  'Inter',
  'Montserrat',
  'Raleway',
  'Playfair Display',
  'Lato',
  'Open Sans',
  'Roboto',
  'Nunito',
  'Poppins',
  'Source Sans Pro',
  'Merriweather',
  'Oswald',
  'Rubik',
  'Work Sans',
  'DM Sans',
  'Manrope',
  'Bitter',
  'Crimson Text',
  'Libre Baskerville',
  'Space Grotesk',
  'PT Serif',
  'Fira Sans',
  'Quicksand',
  'Cabin',
] as const;

// ═══════════════════════════════════════════════
// PPTX Font Mapping (Google Font → System Font)
// ═══════════════════════════════════════════════

export const PPTX_FONT_MAP: Record<string, string> = {
  'Montserrat': 'Arial',
  'Raleway': 'Arial',
  'Playfair Display': 'Georgia',
  'Merriweather': 'Georgia',
  'Crimson Text': 'Georgia',
  'Libre Baskerville': 'Georgia',
  'PT Serif': 'Georgia',
  'Bitter': 'Georgia',
  // Everything else falls back to Calibri
};

export function getPptxFont(googleFont: string): string {
  return PPTX_FONT_MAP[googleFont] || 'Calibri';
}

// ═══════════════════════════════════════════════
// Point ↔ Pixel conversion (1pt = 1.333px @ 96dpi)
// ═══════════════════════════════════════════════

export function ptToPx(pt: number): number {
  return Math.round(pt * 1.333 * 10) / 10;
}

export function pxToPt(px: number): number {
  return Math.round((px / 1.333) * 10) / 10;
}

// ═══════════════════════════════════════════════
// Document Style Labels
// ═══════════════════════════════════════════════

export const DOCUMENT_STYLE_OPTIONS = [
  { value: 'modern' as const, label: 'Executive', description: 'Clean and minimal. Serif accents, generous white space, subtle dividers. McKinsey-style.', bestFor: 'C-suite audiences', icon: '\u{1F3DB}\uFE0F' },
  { value: 'bold' as const, label: 'Bold', description: 'High impact. Dark hero, color sections, large stat callouts, strong typography.', bestFor: 'Competitive situations', icon: '\u26A1' },
  { value: 'corporate' as const, label: 'Technical', description: 'Data-forward. Heavy tables, comparison grids, structured layout, monospace accents.', bestFor: 'IT evaluators', icon: '\u{1F4CA}' },
  { value: 'minimal' as const, label: 'Visual', description: 'Graphic-rich. Large section headers, infographic stat boxes, color-blocked sections.', bestFor: 'Leave-behinds & events', icon: '\u{1F3A8}' },
];

// Style-specific writing instructions for AI generation
export const STYLE_WRITING_INSTRUCTIONS: Record<DocumentStyle, string> = {
  modern: 'Write in formal, polished executive language. Use measured, confident tone. Minimize jargon.',
  bold: 'Write punchy, short sentences. Use strong verbs. Make every point hit hard. Use numbers for impact.',
  corporate: 'Write precise, detailed technical language. Include specific metrics. Use structured comparisons.',
  minimal: 'Write scannable, headline-driven content. Lead every section with a bold takeaway. Use short paragraphs.',
};

// ═══════════════════════════════════════════════
// Resolve brand guidelines from KB (with fallbacks)
// ═══════════════════════════════════════════════

export function resolveBrandGuidelines(kb: KnowledgeBase): BrandGuidelines {
  if (kb.brandGuidelines) {
    return kb.brandGuidelines;
  }

  // Fallback: build from legacy fields
  const guidelines = { ...DEFAULT_BRAND_GUIDELINES };

  if (kb.brandColor) {
    guidelines.colors = {
      ...guidelines.colors,
      secondary: kb.brandColor,
    };
  }

  if (kb.logoPath) {
    guidelines.logos = {
      ...guidelines.logos,
      primaryPath: kb.logoPath,
    };
  }

  if (kb.brandVoice) {
    guidelines.voice = {
      ...guidelines.voice,
      approvedTerms: kb.brandVoice.wordsToUse || [],
      bannedTerms: kb.brandVoice.wordsToAvoid || [],
      tagline: kb.tagline || '',
    };
  }

  return guidelines;
}

// ═══════════════════════════════════════════════
// Google Fonts CSS import URL builder
// ═══════════════════════════════════════════════

export function buildGoogleFontsUrl(primary: string, secondary: string): string {
  const fonts = new Set([primary, secondary]);
  const families = Array.from(fonts)
    .map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ═══════════════════════════════════════════════
// Logo auto-selection (primary vs secondary)
// ═══════════════════════════════════════════════

export function getLogoForBackground(
  brand: BrandGuidelines,
  isDarkBg: boolean,
  baseUrl: string = ''
): string {
  const path = isDarkBg && brand.logos.secondaryPath
    ? brand.logos.secondaryPath
    : brand.logos.primaryPath;

  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path}`;
}

// ═══════════════════════════════════════════════
// Natural language → content type parser
// ═══════════════════════════════════════════════

import { ContentType } from './types';

const NL_PATTERNS: { pattern: RegExp; type: ContentType }[] = [
  { pattern: /prep.*(?:call|discovery|meeting)/i, type: 'discovery-call-prep' },
  { pattern: /(?:follow.?up|post.?demo)/i, type: 'post-demo-followup' },
  { pattern: /(?:post.?meeting|meeting.?summary|recap)/i, type: 'post-meeting-summary' },
  { pattern: /battle.?card/i, type: 'battle-card' },
  { pattern: /(?:compet|vs\b|versus)/i, type: 'competitive-analysis' },
  { pattern: /linkedin.?(?:post|article)/i, type: 'linkedin-post' },
  { pattern: /linkedin.?(?:message|outreach|sequence)/i, type: 'linkedin-message-sequence' },
  { pattern: /cold.?(?:email|outbound|sequence)/i, type: 'outbound-email-sequence' },
  { pattern: /cold.?call/i, type: 'cold-call-script' },
  { pattern: /voicemail/i, type: 'voicemail-script' },
  { pattern: /(?:one.?pager|solution.?overview)/i, type: 'solution-one-pager' },
  { pattern: /executive.?(?:summary|brief)/i, type: 'executive-summary' },
  { pattern: /(?:exec|sponsor).?email/i, type: 'executive-sponsor-email' },
  { pattern: /case.?study/i, type: 'case-study' },
  { pattern: /(?:roi|business.?case|cost.?justif)/i, type: 'roi-business-case' },
  { pattern: /proposal/i, type: 'proposal-framework' },
  { pattern: /(?:implement|timeline|rollout)/i, type: 'implementation-timeline' },
  { pattern: /(?:renew|upsell|expand)/i, type: 'renewal-upsell' },
  { pattern: /(?:feature.?sheet|product.?sheet|spec)/i, type: 'product-feature-sheet' },
  { pattern: /(?:comparison|compare|vs.*alternative)/i, type: 'comparison-guide' },
  { pattern: /(?:reference.?letter|testimonial.?letter)/i, type: 'reference-letter' },
  { pattern: /partner/i, type: 'partnership-one-pager' },
  { pattern: /(?:success.?story|customer.?story)/i, type: 'customer-success-story' },
  { pattern: /(?:thought.?leader|article|industry.?insight)/i, type: 'thought-leadership-article' },
  { pattern: /objection/i, type: 'objection-handling-guide' },
  { pattern: /champion/i, type: 'champion-enablement-kit' },
  { pattern: /(?:mutual.?action|map|action.?plan)/i, type: 'mutual-action-plan' },
  { pattern: /stakeholder/i, type: 'stakeholder-map' },
  { pattern: /(?:qbr|business.?review|quarterly)/i, type: 'qbr-review-deck' },
  { pattern: /(?:win.?loss|debrief)/i, type: 'win-loss-analysis' },
  { pattern: /(?:newsletter|blurb)/i, type: 'email-newsletter-blurb' },
  { pattern: /webinar/i, type: 'webinar-invitation' },
  { pattern: /press.?release/i, type: 'press-release' },
  { pattern: /(?:blog|outline)/i, type: 'blog-post-outline' },
  { pattern: /(?:event|trade.?show|booth)/i, type: 'event-leave-behind' },
  { pattern: /(?:video|script|explainer)/i, type: 'video-script' },
  { pattern: /(?:leave.?behind|conference)/i, type: 'conference-leave-behind' },
];

export function detectContentType(text: string): ContentType | null {
  for (const { pattern, type } of NL_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return null;
}
