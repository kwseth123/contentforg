// ════════════════════════════════════════════════════════
// Style 30 — Visual Hierarchy
// Progressive disclosure design — content flows from most
// important to supporting details. Each section gets
// progressively smaller with decreasing visual weight.
// Creates a natural "funnel" reading flow.
// ════════════════════════════════════════════════════════

import type { DocumentStyle, StyleInput } from './types';
import {
  resolveBrand,
  brandCSSVars,
  brandFonts,
  brandLogoHtml,
  formatMarkdown,
  wrapDocument,
  lighten,
  darken,
  contrastText,
  hexToRgb,
  buildOnePagerDocument,
  professionalSymbolCSS,
  stripEmojis,
} from './shared';

// ── Tier configuration ────────────────────────────────────

interface TierConfig {
  headingSize: string;
  bodySize: string;
  accentOpacity: number;
  bgShade: string;
  statBoxSize: 'large' | 'medium' | 'compact' | 'dense';
  tierClass: string;
}

function getTierConfig(idx: number, total: number): TierConfig {
  if (idx === 0) {
    return {
      headingSize: '36px',
      bodySize: '16px',
      accentOpacity: 1.0,
      bgShade: '#ffffff',
      statBoxSize: 'large',
      tierClass: 'vh-tier-hero',
    };
  }
  if (idx === 1) {
    return {
      headingSize: '28px',
      bodySize: '14px',
      accentOpacity: 0.75,
      bgShade: '#fafbfc',
      statBoxSize: 'medium',
      tierClass: 'vh-tier-primary',
    };
  }
  if (idx === 2) {
    return {
      headingSize: '22px',
      bodySize: '13px',
      accentOpacity: 0.50,
      bgShade: '#f7f8f9',
      statBoxSize: 'compact',
      tierClass: 'vh-tier-secondary',
    };
  }
  return {
    headingSize: '18px',
    bodySize: '12px',
    accentOpacity: 0.25,
    bgShade: '#f3f4f6',
    statBoxSize: 'dense',
    tierClass: 'vh-tier-detail',
  };
}

function extractStatValue(content: string): { value: string; label: string } | null {
  const patterns = [
    /(\d{1,3}(?:\.\d+)?%)\s*(.{0,40})/,
    /(\$[\d,.]+[MBKmk]?)\s*(.{0,40})/,
    /(\d+[xX])\s*(.{0,40})/,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return { value: m[1], label: m[2]?.trim().replace(/\*+/g, '') || '' };
  }
  return null;
}

function extractBulletPoints(content: string): string[] {
  const points: string[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      points.push(trimmed.replace(/^[-*•]\s+/, '').replace(/\*+/g, ''));
    }
  }
  return points.slice(0, 6);
}

// ── Render ─────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections: rawSections, contentType, prospect, companyName, date } = input;
  const sections = rawSections.filter(s => s.title?.trim() || s.content?.trim());
  const dateStr =
    date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const total = sections.length;
  const rgb = hexToRgb(accent);

  // Build sections with progressive sizing
  const sectionsHtml = sections
    .map((s, i) => {
      const tier = getTierConfig(i, total);
      const cleanContent = stripEmojis(s.content);
      const stat = extractStatValue(cleanContent);
      const bullets = extractBulletPoints(cleanContent);
      const accentAtOpacity = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${tier.accentOpacity})`;

      // Stat box rendering varies by tier
      let statBoxHtml = '';
      if (stat) {
        if (tier.statBoxSize === 'large') {
          statBoxHtml = `
            <div class="vh-stat-box vh-stat-large" style="border-left-color:${accentAtOpacity};">
              <div class="vh-stat-value" style="color:${accentAtOpacity};">${stat.value}</div>
              <div class="vh-stat-label">${stat.label}</div>
            </div>`;
        } else if (tier.statBoxSize === 'medium') {
          statBoxHtml = `
            <div class="vh-stat-box vh-stat-medium" style="border-left-color:${accentAtOpacity};">
              <div class="vh-stat-value" style="color:${accentAtOpacity};">${stat.value}</div>
              <div class="vh-stat-label">${stat.label}</div>
            </div>`;
        } else if (tier.statBoxSize === 'compact') {
          statBoxHtml = `
            <span class="vh-stat-inline" style="color:${accentAtOpacity};">${stat.value}</span>
            <span class="vh-stat-inline-label">${stat.label}</span>`;
        } else {
          statBoxHtml = `<span class="vh-stat-dense" style="color:${accentAtOpacity};">${stat.value}</span>`;
        }
      }

      // Section divider — visual break between sections
      const dividerHtml = i > 0
        ? `<div class="vh-divider" style="border-top-color:${accentAtOpacity};opacity:${tier.accentOpacity};"></div>`
        : '';

      // Bullet list for hero/primary tiers
      let highlightHtml = '';
      if (bullets.length > 0 && (tier.statBoxSize === 'large' || tier.statBoxSize === 'medium')) {
        highlightHtml = `
          <div class="vh-highlights vh-highlights-${tier.statBoxSize}">
            ${bullets.map(b => `<div class="vh-highlight-item"><span class="vh-highlight-dot" style="background:${accentAtOpacity};"></span>${b}</div>`).join('')}
          </div>`;
      }

      return `
      ${dividerHtml}
      <section class="vh-section ${tier.tierClass}" style="background:${tier.bgShade};">
        <div class="vh-section-inner">
          <div class="vh-section-header">
            <div class="vh-tier-indicator" style="background:${accentAtOpacity};"></div>
            <h2 class="vh-section-title" style="font-size:${tier.headingSize};color:${accentAtOpacity};">${stripEmojis(s.title)}</h2>
          </div>
          ${tier.statBoxSize === 'large' && stat ? `
          <div class="vh-hero-stats">
            ${statBoxHtml}
          </div>` : (tier.statBoxSize === 'medium' && stat ? `<div class="vh-medium-stats">${statBoxHtml}</div>` : '')}
          <div class="vh-section-body" style="font-size:${tier.bodySize};">
            ${tier.statBoxSize === 'compact' || tier.statBoxSize === 'dense' ? (stat ? `<p class="vh-inline-stat">${statBoxHtml}</p>` : '') : ''}
            ${formatMarkdown(cleanContent)}
          </div>
          ${highlightHtml}
        </div>
      </section>`;
    })
    .join('');

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0.5in 0.7in;
    }

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #ffffff;
      line-height: 1.6;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }

    .vh-page {
      width: 100%; max-width: 816px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Bold, prominent header ── */
    .vh-header {
      background: ${brand.primary};
      color: ${contrastText(brand.primary)};
      padding: 36px 44px;
      border-radius: 0 0 16px 16px;
      margin-bottom: 0;
    }
    .vh-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .vh-header-logo img { height: 36px; filter: brightness(0) invert(1); }
    .vh-header-logo span { color: ${contrastText(brand.primary)}; font-size: 18px; }
    .vh-header-meta {
      text-align: right;
      font-size: 12px;
      opacity: 0.85;
    }
    .vh-header-prospect {
      font-weight: 700;
      font-size: 14px;
      opacity: 1;
      margin-bottom: 2px;
    }
    .vh-header-title {
      font-family: var(--brand-font-primary);
      font-size: 42px;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
    }
    .vh-header-subtitle {
      font-size: 16px;
      opacity: 0.85;
      font-weight: 400;
      max-width: 520px;
    }

    /* ── Section structure ── */
    .vh-section {
      padding: 0;
      transition: background 0.2s;
      page-break-inside: avoid;
    }
    .vh-section-inner {
      padding: 36px 44px;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Hero tier: largest treatment */
    .vh-tier-hero .vh-section-inner { padding: 48px 44px; }
    .vh-tier-hero .vh-section-body { line-height: 1.75; color: ${brand.text}; }
    .vh-tier-hero .vh-section-body p { margin-bottom: 14px; }

    /* Primary tier */
    .vh-tier-primary .vh-section-inner { padding: 36px 44px; }
    .vh-tier-primary .vh-section-body { line-height: 1.65; color: ${brand.text}; }
    .vh-tier-primary .vh-section-body p { margin-bottom: 10px; }

    /* Secondary tier */
    .vh-tier-secondary .vh-section-inner { padding: 28px 44px; }
    .vh-tier-secondary .vh-section-body { line-height: 1.6; color: ${lighten(brand.text, 0.1)}; }
    .vh-tier-secondary .vh-section-body p { margin-bottom: 8px; }

    /* Detail tier: dense, small */
    .vh-tier-detail .vh-section-inner { padding: 22px 44px; }
    .vh-tier-detail .vh-section-body { line-height: 1.55; color: ${lighten(brand.text, 0.2)}; }
    .vh-tier-detail .vh-section-body p { margin-bottom: 6px; }

    /* ── Section headers ── */
    .vh-section-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
    }
    .vh-tier-hero .vh-section-header { margin-bottom: 24px; }
    .vh-tier-detail .vh-section-header { margin-bottom: 12px; }
    .vh-tier-indicator {
      width: 4px;
      border-radius: 2px;
      flex-shrink: 0;
      align-self: stretch;
      min-height: 28px;
    }
    .vh-tier-hero .vh-tier-indicator { width: 6px; min-height: 40px; }
    .vh-tier-detail .vh-tier-indicator { width: 3px; min-height: 20px; }
    .vh-section-title {
      font-family: var(--brand-font-primary);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.015em;
      margin: 0;
    }
    .vh-tier-hero .vh-section-title { font-weight: 800; letter-spacing: -0.025em; }
    .vh-tier-detail .vh-section-title { font-weight: 600; letter-spacing: 0; }

    /* ── Section dividers ── */
    .vh-divider {
      border: none;
      border-top: 2px solid transparent;
      margin: 0;
    }
    .vh-tier-hero + .vh-divider { border-top-width: 3px; }

    /* ── Stat boxes (size tiers) ── */
    .vh-stat-box {
      border-left: 4px solid;
      border-radius: 0 10px 10px 0;
      background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04);
    }
    .vh-stat-large {
      padding: 28px 32px;
      margin-bottom: 24px;
    }
    .vh-stat-large .vh-stat-value {
      font-family: var(--brand-font-primary);
      font-size: 48px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .vh-stat-large .vh-stat-label {
      font-size: 15px;
      color: ${lighten(brand.text, 0.3)};
      margin-top: 6px;
      font-weight: 500;
    }
    .vh-stat-medium {
      padding: 20px 24px;
      margin-bottom: 18px;
    }
    .vh-stat-medium .vh-stat-value {
      font-family: var(--brand-font-primary);
      font-size: 32px;
      font-weight: 800;
      line-height: 1;
    }
    .vh-stat-medium .vh-stat-label {
      font-size: 13px;
      color: ${lighten(brand.text, 0.3)};
      margin-top: 4px;
    }
    .vh-stat-inline {
      font-family: var(--brand-font-primary);
      font-size: 20px;
      font-weight: 800;
    }
    .vh-stat-inline-label {
      font-size: 13px;
      color: ${lighten(brand.text, 0.3)};
      margin-left: 6px;
    }
    .vh-inline-stat { margin-bottom: 10px; }
    .vh-stat-dense {
      font-family: var(--brand-font-primary);
      font-size: 16px;
      font-weight: 800;
      margin-right: 6px;
    }
    .vh-hero-stats { }
    .vh-medium-stats { }

    /* ── Highlight bullet lists ── */
    .vh-highlights {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1);
    }
    .vh-highlights-large {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
    }
    .vh-highlights-medium {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
    }
    .vh-highlight-item {
      display: flex;
      align-items: baseline;
      gap: 10px;
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }
    .vh-highlights-large .vh-highlight-item { font-size: 15px; }
    .vh-highlights-medium .vh-highlight-item { font-size: 13px; }
    .vh-highlight-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* ── Body content styling ── */
    .vh-section-body { overflow-wrap: break-word; }
    .vh-section-body h1, .vh-section-body h2, .vh-section-body h3, .vh-section-body h4 {
      font-family: var(--brand-font-primary);
      font-weight: 700;
      margin: 16px 0 8px;
    }
    .vh-tier-hero .vh-section-body h2 { font-size: 22px; color: ${darken(brand.text, 0.05)}; }
    .vh-tier-hero .vh-section-body h3 { font-size: 18px; color: ${darken(brand.text, 0.05)}; }
    .vh-tier-primary .vh-section-body h2 { font-size: 18px; }
    .vh-tier-primary .vh-section-body h3 { font-size: 15px; }
    .vh-tier-secondary .vh-section-body h2 { font-size: 16px; }
    .vh-tier-secondary .vh-section-body h3 { font-size: 14px; }
    .vh-tier-detail .vh-section-body h2 { font-size: 14px; }
    .vh-tier-detail .vh-section-body h3 { font-size: 13px; }

    .vh-section-body ul, .vh-section-body ol { padding-left: 22px; margin: 10px 0; }
    .vh-section-body li { margin-bottom: 5px; }
    .vh-section-body strong { font-weight: 600; color: ${darken(brand.text, 0.1)}; }

    /* Tables scale with tier */
    .vh-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
    }
    .vh-tier-hero .vh-section-body table { font-size: 14px; }
    .vh-tier-primary .vh-section-body table { font-size: 13px; }
    .vh-tier-secondary .vh-section-body table { font-size: 12px; }
    .vh-tier-detail .vh-section-body table { font-size: 11px; }

    .vh-section-body th {
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 0.85em;
    }
    .vh-tier-hero .vh-section-body th {
      background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06);
      border-bottom-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3);
    }
    .vh-section-body td {
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .vh-section-body hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 16px 0;
    }

    /* ── Smallest, most subtle footer ── */
    .vh-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 44px;
      margin-top: 0;
      background: ${lighten(brand.text, 0.92)};
      font-size: 9px;
      color: ${lighten(brand.text, 0.45)};
      letter-spacing: 0.03em;
    }
    .vh-footer-company {
      font-weight: 600;
      font-size: 10px;
      color: ${lighten(brand.text, 0.35)};
    }
    .vh-footer-center {
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 8px;
    }
    .vh-footer-right {
      text-align: right;
    }

    @media print {
      .vh-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .vh-section { break-inside: avoid; page-break-inside: avoid; }
      .vh-tier-hero { break-after: avoid; }
    }
  `;

  const body = `
    <div class="vh-page">
      <div class="vh-header">
        <div class="vh-header-top">
          <div class="vh-header-logo">${brandLogoHtml(input, 'height:34px;')}</div>
          <div class="vh-header-meta">
            <div class="vh-header-prospect">${prospect.companyName}</div>
            <div>${dateStr}${prospect.industry ? ' &middot; ' + prospect.industry : ''}</div>
          </div>
        </div>
        <h1 class="vh-header-title">${title}</h1>
        <p class="vh-header-subtitle">Prepared for ${prospect.companyName}${input.companyDescription ? ' by ' + companyName : ''}</p>
      </div>

      ${sectionsHtml}

      <div class="vh-footer">
        <div class="vh-footer-left">
          <div class="vh-footer-company">${companyName}</div>
          <div>${input.companyDescription || ''}</div>
        </div>
        <div class="vh-footer-center">Confidential</div>
        <div class="vh-footer-right">
          <div>${dateStr}</div>
          <div>Page 1</div>
        </div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;padding:8px;">
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <div style="width:16px;flex-shrink:0;text-align:right;">
        <div style="width:8px;height:3px;background:#ccc;border-radius:1px;margin-left:auto;margin-bottom:6px;"></div>
      </div>
      <div style="flex:1;">
        <div style="width:65%;height:8px;background:${accentColor};border-radius:2px;margin-bottom:3px;"></div>
        <div style="width:40%;height:4px;background:#888;border-radius:1px;margin-bottom:2px;"></div>
        <div style="width:20%;height:2px;background:#ccc;border-radius:1px;"></div>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="width:16px;flex-shrink:0;text-align:right;">
        <div style="font-size:5px;color:#bbb;font-weight:600;">01</div>
        <div style="font-size:8px;font-weight:800;color:${accentColor}22;margin-top:1px;">47%</div>
      </div>
      <div style="flex:1;">
        <div style="width:50%;height:6px;background:${accentColor};border-radius:2px;margin-bottom:4px;opacity:0.8;"></div>
        <div style="width:90%;height:3px;background:#555;border-radius:1px;margin-bottom:2px;"></div>
        <div style="width:75%;height:3px;background:#555;border-radius:1px;"></div>
      </div>
    </div>
    <div style="border-top:1px solid #eee;margin:4px 0 4px 22px;"></div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <div style="width:16px;flex-shrink:0;text-align:right;">
        <div style="font-size:5px;color:#ccc;font-weight:600;">02</div>
      </div>
      <div style="flex:1;">
        <div style="width:40%;height:5px;background:#444;border-radius:2px;margin-bottom:3px;"></div>
        <div style="width:85%;height:2px;background:#999;border-radius:1px;margin-bottom:2px;"></div>
        <div style="width:65%;height:2px;background:#999;border-radius:1px;"></div>
      </div>
    </div>
    <div style="border-top:1px solid #eee;margin:4px 0 4px 22px;"></div>
    <div style="display:flex;gap:6px;">
      <div style="width:16px;flex-shrink:0;text-align:right;">
        <div style="font-size:5px;color:#ddd;font-weight:600;">03</div>
      </div>
      <div style="flex:1;">
        <div style="width:30%;height:4px;background:#aaa;border-radius:2px;margin-bottom:2px;"></div>
        <div style="width:70%;height:2px;background:#ccc;border-radius:1px;"></div>
      </div>
    </div>
    <div style="position:absolute;bottom:4px;right:8px;font-size:5px;color:#bbb;">Visual Hierarchy</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style30VisualHierarchy: DocumentStyle = {
  id: 'style-30',
  name: 'Visual Hierarchy',
  category: 'creative',
  description: 'Progressive disclosure design — visual weight decreases from headline to detail',
  keywords: ['hierarchy', 'progressive', 'disclosure', 'funnel', 'importance', 'weight'],
  render,
  thumbnail,
};

export default style30VisualHierarchy;
