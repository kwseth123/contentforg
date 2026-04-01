import { DocumentStyle, StyleInput } from './types';
import { formatMarkdown, lighten, darken, contrastText, wrapDocument } from './shared';

// ── Real style implementations ──
import style01UltraMinimal from './style01UltraMinimal';
import style02SplitPanel from './style02SplitPanel';
import style03MagazineGrid from './style03MagazineGrid';
import style04Typographic from './style04Typographic';
import style05FullBleed from './style05FullBleed';
import style06Monochrome from './style06Monochrome';
import style07Asymmetric from './style07Asymmetric';
import style08SwissGrid from './style08SwissGrid';
import style09DarkMode from './style09DarkMode';
import style10Newspaper from './style10Newspaper';
import style11BoldSerif from './style11BoldSerif';
import style12OversizedNumbers from './style12OversizedNumbers';
import style13ColorBlock from './style13ColorBlock';
import style14DramaticContrast from './style14DramaticContrast';
import style15Cinematic from './style15Cinematic';
import style16NeonAccent from './style16NeonAccent';
import style17ClassicBusiness from './style17ClassicBusiness';
import style18FinancialReport from './style18FinancialReport';
import style19ConsultingDeck from './style19ConsultingDeck';
import style20TechnicalBrief from './style20TechnicalBrief';
import style21LegalMemo from './style21LegalMemo';
import style22Boardroom from './style22Boardroom';
import style23Enterprise from './style23Enterprise';

// ── Creative & Distinctive (24-30) ──
import style24Editorial from './style24Editorial';
import style25Storytelling from './style25Storytelling';
import style26Infographic from './style26Infographic';
import style27Timeline from './style27Timeline';
import style28Scorecard from './style28Scorecard';
import style29ComparisonMatrix from './style29ComparisonMatrix';
import style30VisualHierarchy from './style30VisualHierarchy';

// ════════════════════════════════════════════════════════
// Stub render/thumbnail factory
// ════════════════════════════════════════════════════════

function createStubRender(styleName: string) {
  return (input: StyleInput): string => {
    const accent = input.accentColor;
    const textOnAccent = contrastText(accent);
    const lightBg = lighten(accent, 0.93);
    const borderColor = lighten(accent, 0.7);

    const headerLogoHtml = input.logoBase64
      ? `<img src="${input.logoBase64}" alt="${input.companyName}" style="height:40px;margin-right:16px;">`
      : '';

    const prospectLogoHtml = input.prospectLogoBase64
      ? `<img src="${input.prospectLogoBase64}" alt="${input.prospect.companyName}" style="height:36px;margin-right:12px;">`
      : '';

    const sectionsHtml = input.sections.map(section => `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <div class="section-body">${formatMarkdown(section.content)}</div>
      </div>
    `).join('');

    const dateStr = input.date || new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const css = `
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #1a1a2e;
        background: #ffffff;
        line-height: 1.6;
        font-size: 14px;
      }
      .header {
        background: ${accent};
        color: ${textOnAccent};
        padding: 40px 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .header-left {
        display: flex;
        align-items: center;
      }
      .header-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }
      .header-subtitle {
        font-size: 13px;
        opacity: 0.85;
        margin-top: 4px;
      }
      .meta-bar {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 16px 48px;
        background: ${lightBg};
        border-bottom: 1px solid ${borderColor};
        font-size: 13px;
        color: #555;
      }
      .meta-bar .prospect-info {
        display: flex;
        align-items: center;
      }
      .content {
        max-width: 820px;
        margin: 0 auto;
        padding: 40px 48px;
      }
      .section {
        margin-bottom: 32px;
      }
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: ${accent};
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid ${lighten(accent, 0.8)};
      }
      .section-body {
        color: #333;
        line-height: 1.7;
      }
      .section-body h1, .section-body h2, .section-body h3, .section-body h4 {
        color: ${darken(accent, 0.15)};
        margin: 16px 0 8px 0;
      }
      .section-body h1 { font-size: 20px; }
      .section-body h2 { font-size: 17px; }
      .section-body h3 { font-size: 15px; }
      .section-body h4 { font-size: 14px; }
      .section-body ul, .section-body ol {
        margin: 8px 0;
        padding-left: 24px;
      }
      .section-body li {
        margin-bottom: 4px;
      }
      .section-body table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 13px;
      }
      .section-body th {
        background: ${lighten(accent, 0.85)};
        color: ${darken(accent, 0.2)};
        font-weight: 600;
        text-align: left;
        padding: 10px 12px;
        border: 1px solid ${borderColor};
      }
      .section-body td {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
      }
      .section-body hr {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 16px 0;
      }
      .section-body strong { font-weight: 600; }
      .section-body em { font-style: italic; }
      .footer {
        text-align: center;
        padding: 24px 48px;
        font-size: 12px;
        color: #999;
        border-top: 1px solid #eee;
      }
    `;

    const body = `
      <div class="header">
        <div>
          <div class="header-left">${headerLogoHtml}</div>
          <h1 class="header-title">${input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h1>
          <div class="header-subtitle">Prepared for ${input.prospect.companyName}</div>
        </div>
      </div>
      <div class="meta-bar">
        <div class="prospect-info">${prospectLogoHtml}<span><strong>${input.prospect.companyName}</strong>${input.prospect.industry ? ` &middot; ${input.prospect.industry}` : ''}${input.prospect.companySize ? ` &middot; ${input.prospect.companySize}` : ''}</span></div>
        <div style="margin-left:auto;">${dateStr}</div>
      </div>
      <div class="content">
        ${sectionsHtml}
      </div>
      <div class="footer">
        ${input.companyName}${input.companyDescription ? ` &mdash; ${input.companyDescription}` : ''} &middot; Confidential
      </div>
    `;

    return wrapDocument({
      title: `${input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} - ${input.prospect.companyName}`,
      css,
      body,
      fonts: ['Inter'],
    });
  };
}

function createStubThumbnail(styleName: string) {
  return (accentColor: string): string => {
    const textColor = contrastText(accentColor);
    const lightBg = lighten(accentColor, 0.92);
    return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;">
      <div style="height:28%;background:${accentColor};padding:8px 12px;">
        <div style="width:40%;height:8px;background:${textColor};opacity:0.9;border-radius:2px;margin-bottom:4px;"></div>
        <div style="width:60%;height:6px;background:${textColor};opacity:0.5;border-radius:2px;"></div>
      </div>
      <div style="padding:8px 12px;">
        <div style="width:35%;height:6px;background:${accentColor};border-radius:2px;margin-bottom:6px;"></div>
        <div style="width:90%;height:4px;background:#ddd;border-radius:2px;margin-bottom:3px;"></div>
        <div style="width:80%;height:4px;background:#ddd;border-radius:2px;margin-bottom:3px;"></div>
        <div style="width:85%;height:4px;background:#ddd;border-radius:2px;margin-bottom:8px;"></div>
        <div style="width:30%;height:6px;background:${accentColor};border-radius:2px;margin-bottom:6px;"></div>
        <div style="width:100%;height:4px;background:#ddd;border-radius:2px;margin-bottom:3px;"></div>
        <div style="width:70%;height:4px;background:#ddd;border-radius:2px;"></div>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;">${styleName}</div>
    </div>`;
  };
}

// ════════════════════════════════════════════════════════
// Style definitions — all 30 entries
// ════════════════════════════════════════════════════════

const styleDefinitions: Omit<DocumentStyle, 'render' | 'thumbnail'>[] = [
  // ── Clean & Modern (01-08) ──
  {
    id: 'style-01',
    name: 'Ultra Minimal',
    category: 'clean',
    description: 'Pure white, maximum whitespace, typography does all the work',
    keywords: ['minimal', 'white', 'simple', 'clean', 'spacious', 'swiss', 'inter'],
  },
  {
    id: 'style-02',
    name: 'Split Panel',
    category: 'clean',
    description: 'Accent sidebar with progress indicator, content on the right',
    keywords: ['split', 'panel', 'sidebar', 'accent', 'architectural'],
  },
  {
    id: 'style-03',
    name: 'Magazine Grid',
    category: 'clean',
    description: 'Editorial magazine layout with asymmetric columns and pull quotes',
    keywords: ['magazine', 'editorial', 'columns', 'pull-quotes', 'wired'],
  },
  {
    id: 'style-04',
    name: 'Typographic',
    category: 'clean',
    description: 'Pure typography — enormous headers, display numbers, no decoration',
    keywords: ['typography', 'type', 'bold', 'luxury', 'annual-report', 'dm-sans'],
  },
  {
    id: 'style-05',
    name: 'Full Bleed',
    category: 'clean',
    description: 'Cinematic hero gradient with refined typography below',
    keywords: ['hero', 'cinematic', 'full-bleed', 'gradient', 'modern', 'poppins'],
  },
  {
    id: 'style-06',
    name: 'Monochrome',
    category: 'clean',
    description: 'Black, white, and gray only — serious financial institution feel',
    keywords: ['monochrome', 'black', 'white', 'minimal', 'financial', 'ibm-plex'],
  },
  {
    id: 'style-07',
    name: 'Asymmetric',
    category: 'clean',
    description: 'Off-center layouts with bold section numbers in the margin',
    keywords: ['asymmetric', 'creative', 'agency', 'pitch', 'space-grotesk'],
  },
  {
    id: 'style-08',
    name: 'Swiss Grid',
    category: 'clean',
    description: 'Mathematical precision — strict grid, small caps labels, 1px rules',
    keywords: ['swiss', 'grid', 'modernist', 'helvetica', 'inter', 'precision'],
  },

  // ── Bold & Impactful (09-16) ──
  {
    id: 'style-09',
    name: 'Dark Mode',
    category: 'bold',
    description: 'Full dark background with glowing accent highlights — premium tech feel',
    keywords: ['dark', 'mode', 'vivid', 'tech', 'high-contrast', 'dramatic'],
  },
  {
    id: 'style-10',
    name: 'Newspaper',
    category: 'bold',
    description: 'Multi-column newspaper layout with masthead and pull statistics',
    keywords: ['newspaper', 'columns', 'masthead', 'serif', 'authoritative'],
  },
  {
    id: 'style-11',
    name: 'Bold Serif',
    category: 'bold',
    description: 'Large serif headlines with sans body — premium consulting feel',
    keywords: ['serif', 'bold', 'consulting', 'premium', 'sophisticated'],
  },
  {
    id: 'style-12',
    name: 'Oversized Numbers',
    category: 'bold',
    description: 'Giant statistics as watermark-style visual anchors behind content',
    keywords: ['numbers', 'oversized', 'statistics', 'infographic', 'data'],
  },
  {
    id: 'style-13',
    name: 'Color Block',
    category: 'bold',
    description: 'Alternating accent and white sections — bold rhythmic design',
    keywords: ['color', 'block', 'alternating', 'bold', 'energetic', 'modern'],
  },
  {
    id: 'style-14',
    name: 'Dramatic Contrast',
    category: 'bold',
    description: 'Extreme type hierarchy — enormous headers, tiny labels, wide margins',
    keywords: ['dramatic', 'contrast', 'luxury', 'fashion', 'editorial'],
  },
  {
    id: 'style-15',
    name: 'Cinematic',
    category: 'bold',
    description: 'Wide format with filmstrip header and full-width color transitions',
    keywords: ['cinematic', 'filmstrip', 'wide', 'production', 'creative'],
  },
  {
    id: 'style-16',
    name: 'Neon Accent',
    category: 'bold',
    description: 'Very dark background with vivid neon accent — SaaS product feel',
    keywords: ['neon', 'dark', 'electric', 'saas', 'vibrant', 'launch'],
  },

  // ── Corporate & Professional (17-23) ──
  {
    id: 'style-17',
    name: 'Classic Business',
    category: 'corporate',
    description: 'Conservative and professional — serif headers, navy accent, Big 4 feel',
    keywords: ['classic', 'business', 'formal', 'serif', 'traditional', 'consulting'],
  },
  {
    id: 'style-18',
    name: 'Financial Report',
    category: 'corporate',
    description: 'Data tables, bordered callouts, understated headers — Goldman Sachs feel',
    keywords: ['financial', 'report', 'data', 'tables', 'metrics', 'research'],
  },
  {
    id: 'style-19',
    name: 'Consulting Deck',
    category: 'corporate',
    description: 'Slide-like sections — large header, 3 bullets, executive takeaway boxes',
    keywords: ['consulting', 'deck', 'slides', 'mckinsey', 'takeaways', 'strategy'],
  },
  {
    id: 'style-20',
    name: 'Technical Brief',
    category: 'corporate',
    description: 'Dense technical layout — three columns, monospace details, specs',
    keywords: ['technical', 'brief', 'dense', 'specifications', 'aws', 'documentation'],
  },
  {
    id: 'style-21',
    name: 'Legal Memo',
    category: 'corporate',
    description: 'Formal memo format — To/From/Re header, numbered paragraphs',
    keywords: ['legal', 'memo', 'formal', 'numbered', 'paragraphs', 'communication'],
  },
  {
    id: 'style-22',
    name: 'Boardroom',
    category: 'corporate',
    description: 'Board-level presentation — large type, one takeaway per page, minimal detail',
    keywords: ['boardroom', 'board', 'executive', 'premium', 'leave-behind'],
  },
  {
    id: 'style-23',
    name: 'Enterprise',
    category: 'corporate',
    description: 'Feature-rich with icons, color-coded indicators, progress bars, badges',
    keywords: ['enterprise', 'salesforce', 'sap', 'feature-rich', 'icons', 'badges'],
  },

  // ── Creative & Distinctive (24-30) ──
  {
    id: 'style-24',
    name: 'Editorial',
    category: 'creative',
    description: 'Premium magazine editorial — italic pull quotes, narrow columns, HBR feel',
    keywords: ['editorial', 'magazine', 'pull-quotes', 'columns', 'hbr', 'premium'],
  },
  {
    id: 'style-25',
    name: 'Storytelling',
    category: 'creative',
    description: 'Narrative arc — customer scenario, solution, transformation chapters',
    keywords: ['story', 'narrative', 'chapters', 'case-study', 'journalism'],
  },
  {
    id: 'style-26',
    name: 'Infographic',
    category: 'creative',
    description: 'Visual-first — bar charts, icon arrays, process flows, minimal prose',
    keywords: ['infographic', 'visual', 'icons', 'charts', 'data', 'callouts'],
  },
  {
    id: 'style-27',
    name: 'Timeline',
    category: 'creative',
    description: 'Vertical timeline with milestone markers and phase-coded colors',
    keywords: ['timeline', 'milestones', 'chronological', 'implementation', 'phases'],
  },
  {
    id: 'style-28',
    name: 'Scorecard',
    category: 'creative',
    description: 'Evaluation framework — scores, ratings, green/amber/red indicators',
    keywords: ['scorecard', 'evaluation', 'ratings', 'comparison', 'checklist'],
  },
  {
    id: 'style-29',
    name: 'Comparison Matrix',
    category: 'creative',
    description: 'Feature comparison grid — color-coded cells, summary wins, footnotes',
    keywords: ['comparison', 'matrix', 'grid', 'features', 'g2', 'versus'],
  },
  {
    id: 'style-30',
    name: 'Visual Hierarchy',
    category: 'creative',
    description: 'Information design — visual weight matches importance, Tufte-inspired',
    keywords: ['hierarchy', 'tufte', 'information', 'design', 'importance', 'weight'],
  },
];

// ════════════════════════════════════════════════════════
// Build the full registry with stub render/thumbnail
// ════════════════════════════════════════════════════════

// Map of style IDs to real implementations
const realStyles: Record<string, DocumentStyle> = {
  'style-01': style01UltraMinimal,
  'style-02': style02SplitPanel,
  'style-03': style03MagazineGrid,
  'style-04': style04Typographic,
  'style-05': style05FullBleed,
  'style-06': style06Monochrome,
  'style-07': style07Asymmetric,
  'style-08': style08SwissGrid,
  'style-09': style09DarkMode,
  'style-10': style10Newspaper,
  'style-11': style11BoldSerif,
  'style-12': style12OversizedNumbers,
  'style-13': style13ColorBlock,
  'style-14': style14DramaticContrast,
  'style-15': style15Cinematic,
  'style-16': style16NeonAccent,
  'style-17': style17ClassicBusiness,
  'style-18': style18FinancialReport,
  'style-19': style19ConsultingDeck,
  'style-20': style20TechnicalBrief,
  'style-21': style21LegalMemo,
  'style-22': style22Boardroom,
  'style-23': style23Enterprise,
  'style-24': style24Editorial,
  'style-25': style25Storytelling,
  'style-26': style26Infographic,
  'style-27': style27Timeline,
  'style-28': style28Scorecard,
  'style-29': style29ComparisonMatrix,
  'style-30': style30VisualHierarchy,
};

export const DOCUMENT_STYLES: DocumentStyle[] = styleDefinitions.map(def => {
  const real = realStyles[def.id];
  if (real) {
    return { ...def, render: real.render, thumbnail: real.thumbnail };
  }
  return {
    ...def,
    render: createStubRender(def.name),
    thumbnail: createStubThumbnail(def.name),
  };
});

/**
 * Look up a single style by ID (e.g. 'style-01').
 */
export function getStyle(id: string): DocumentStyle | undefined {
  return DOCUMENT_STYLES.find(s => s.id === id);
}

/**
 * Get all styles in a given category.
 */
export function getStylesByCategory(cat: string): DocumentStyle[] {
  return DOCUMENT_STYLES.filter(s => s.category === cat);
}

/**
 * Default style assignment per content type.
 */
const DEFAULT_STYLE_MAP: Record<string, string> = {
  'battle-card': 'style-08',
  'competitive-analysis': 'style-09',
  'solution-one-pager': 'style-01',
  'executive-summary': 'style-14',
  'discovery-call-prep': 'style-20',
  'roi-business-case': 'style-18',
  'case-study': 'style-25',
  'outbound-email-sequence': 'style-01',
  'linkedin-post': 'style-03',
  'conference-leave-behind': 'style-05',
  'proposal': 'style-19',
  'implementation-timeline': 'style-27',
  'mutual-action-plan': 'style-28',
};

/**
 * Returns the default style ID for a given content type.
 * Falls back to 'style-01' for unknown types.
 */
export function getDefaultStyleForContentType(contentType: string): string {
  return DEFAULT_STYLE_MAP[contentType] || 'style-01';
}

// ════════════════════════════════════════════════════════
// Content Type Recommendations
// ════════════════════════════════════════════════════════

export interface StyleRecommendation {
  styleId: string;
  reason: string;
}

export const CONTENT_TYPE_RECOMMENDATIONS: Record<string, StyleRecommendation[]> = {
  'solution-one-pager': [
    { styleId: 'style-01', reason: 'Best for clean executive presentations' },
    { styleId: 'style-02', reason: 'Strong visual impact with split layout' },
    { styleId: 'style-24', reason: 'Premium editorial feel for C-suite' },
  ],
  'battle-card': [
    { styleId: 'style-09', reason: 'Bold dark theme commands attention' },
    { styleId: 'style-10', reason: 'Authoritative newspaper-style layout' },
    { styleId: 'style-11', reason: 'Confident serif typography' },
  ],
  'competitive-analysis': [
    { styleId: 'style-29', reason: 'Purpose-built for comparisons' },
    { styleId: 'style-23', reason: 'Enterprise-grade data presentation' },
    { styleId: 'style-17', reason: 'Classic credibility for stakeholders' },
  ],
  'executive-summary': [
    { styleId: 'style-24', reason: 'HBR-quality editorial layout' },
    { styleId: 'style-22', reason: 'Boardroom-ready executive format' },
    { styleId: 'style-19', reason: 'Strategy-firm credibility' },
  ],
  'discovery-call-prep': [
    { styleId: 'style-20', reason: 'Clean technical reference format' },
    { styleId: 'style-17', reason: 'Professional and scannable' },
    { styleId: 'style-06', reason: 'Distraction-free monochrome' },
  ],
  'roi-business-case': [
    { styleId: 'style-18', reason: 'Financial document credibility' },
    { styleId: 'style-17', reason: 'Classic business document format' },
    { styleId: 'style-19', reason: 'Consulting-firm quality' },
  ],
  'case-study': [
    { styleId: 'style-25', reason: 'Narrative storytelling format' },
    { styleId: 'style-24', reason: 'Premium editorial presentation' },
    { styleId: 'style-03', reason: 'Magazine-quality grid layout' },
  ],
  'outbound-email-sequence': [
    { styleId: 'style-01', reason: 'Clean minimal for email content' },
    { styleId: 'style-04', reason: 'Typography-focused readability' },
    { styleId: 'style-06', reason: 'Professional monochrome' },
  ],
  'linkedin-post': [
    { styleId: 'style-03', reason: 'Magazine-style visual appeal' },
    { styleId: 'style-11', reason: 'Bold statements stand out' },
    { styleId: 'style-07', reason: 'Eye-catching asymmetric layout' },
  ],
  'conference-leave-behind': [
    { styleId: 'style-05', reason: 'Full-bleed visual impact' },
    { styleId: 'style-13', reason: 'Bold color blocks grab attention' },
    { styleId: 'style-30', reason: 'Strong visual hierarchy' },
  ],
  'proposal-framework': [
    { styleId: 'style-19', reason: 'Consulting-deck credibility' },
    { styleId: 'style-17', reason: 'Classic business format' },
    { styleId: 'style-22', reason: 'Boardroom-ready presentation' },
  ],
  'implementation-timeline': [
    { styleId: 'style-27', reason: 'Purpose-built timeline format' },
    { styleId: 'style-20', reason: 'Clean technical layout' },
    { styleId: 'style-08', reason: 'Precise Swiss grid system' },
  ],
  'mutual-action-plan': [
    { styleId: 'style-28', reason: 'Scorecard format for tracking' },
    { styleId: 'style-17', reason: 'Professional business format' },
    { styleId: 'style-23', reason: 'Enterprise data presentation' },
  ],
};

export function getRecommendationsForContentType(contentType: string): StyleRecommendation[] {
  return CONTENT_TYPE_RECOMMENDATIONS[contentType] || [];
}
