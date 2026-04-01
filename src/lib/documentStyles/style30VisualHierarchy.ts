// ════════════════════════════════════════════════════════
// Style 30 — Visual Hierarchy
// Tufte-inspired information design — visual weight equals
// importance, wide margins for annotations, elegant
// typographic hierarchy for B2B sales content
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
} from './shared';

// ── Helpers ────────────────────────────────────────────────

/** Extract leading numbers/stats from content for margin watermarks */
function extractMarginStat(content: string): string | null {
  const patterns = [
    /(\d{1,3}(?:\.\d+)?%)/,           // percentages
    /(\$[\d,.]+[MBKmk]?)/,            // dollar amounts
    /(\d+[xX])/,                       // multipliers like 3x
    /(\d{1,3}(?:,\d{3})+)/,           // large numbers
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Format a section number for margin display */
function sectionNum(idx: number): string {
  return String(idx + 1).padStart(2, '0');
}

// ── Render ─────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
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

  // Build section HTML with margin annotations
  const sectionsHtml = sections
    .map((s, i) => {
      const isHero = i === 0;
      const stat = extractMarginStat(s.content);
      const tierClass = isHero ? 'vh-hero' : i < total * 0.5 ? 'vh-major' : 'vh-minor';

      const marginContent = stat
        ? `<span class="vh-margin-stat">${stat}</span>`
        : '';

      return `
      <section class="vh-section ${tierClass}">
        <div class="vh-margin">
          <span class="vh-section-num">${sectionNum(i)}</span>
          ${marginContent}
        </div>
        <div class="vh-content">
          <h2 class="vh-title">${s.title}</h2>
          <div class="vh-body">${formatMarkdown(s.content)}</div>
        </div>
      </section>${i < total - 1 ? '\n      <hr class="vh-rule" />' : ''}`;
    })
    .join('');

  const css = `
    ${brandCSSVars(brand)}

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: var(--brand-background);
      line-height: 1.6;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }

    /* ── Page layout with wide left margin ── */
    .vh-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 60px 48px 40px 48px;
    }

    /* ── Header ── */
    .vh-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
    }
    .vh-header-left { flex: 1; }
    .vh-header-logo { margin-bottom: 32px; }
    .vh-header-meta {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${lighten(brand.text, 0.5)};
    }

    /* ── Hero title area — maximum visual weight ── */
    .vh-headline {
      font-family: var(--brand-font-primary);
      font-size: calc(var(--brand-font-h1-size) * 1.4);
      font-weight: 800;
      color: var(--brand-primary);
      line-height: 1.08;
      letter-spacing: -0.03em;
      margin-bottom: 10px;
      max-width: 600px;
    }
    .vh-subline {
      font-family: var(--brand-font-secondary);
      font-size: calc(var(--brand-font-h2-size) * 0.9);
      font-weight: 400;
      color: ${lighten(brand.text, 0.3)};
      margin-bottom: 6px;
    }

    /* ── Section layout — two-column with margin ── */
    .vh-section {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 0 24px;
      margin-bottom: 0;
      padding: 28px 0;
    }

    /* ── Left margin column ── */
    .vh-margin {
      text-align: right;
      padding-top: 4px;
      position: relative;
    }
    .vh-section-num {
      display: block;
      font-family: var(--brand-font-primary);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: ${lighten(brand.text, 0.6)};
      margin-bottom: 8px;
    }
    .vh-margin-stat {
      display: block;
      font-family: var(--brand-font-primary);
      font-size: 28px;
      font-weight: 800;
      color: ${lighten(brand.primary, 0.7)};
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-top: 8px;
    }

    /* ── Content column ── */
    .vh-content { min-width: 0; }

    /* ── Section title hierarchy ── */
    .vh-title {
      font-family: var(--brand-font-primary);
      margin-bottom: 12px;
    }

    /* Hero section — extra-large treatment */
    .vh-hero .vh-title {
      font-size: calc(var(--brand-font-h1-size) * 1.15);
      font-weight: 700;
      color: var(--brand-primary);
      line-height: 1.15;
      letter-spacing: -0.015em;
    }
    .vh-hero .vh-body {
      font-size: calc(var(--brand-font-body-size) * 1.12);
      color: var(--brand-text);
      line-height: 1.7;
    }
    .vh-hero .vh-margin-stat {
      font-size: 36px;
      color: ${lighten(brand.primary, 0.55)};
    }

    /* Major sections */
    .vh-major .vh-title {
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: ${darken(brand.text, 0.1)};
    }
    .vh-major .vh-body {
      font-size: var(--brand-font-body-size);
      color: var(--brand-text);
      line-height: 1.65;
    }

    /* Minor sections — reduced visual weight */
    .vh-minor .vh-title {
      font-size: var(--brand-font-h3-size);
      font-weight: 600;
      color: ${lighten(brand.text, 0.2)};
    }
    .vh-minor .vh-body {
      font-size: calc(var(--brand-font-body-size) * 0.93);
      color: ${lighten(brand.text, 0.15)};
      line-height: 1.6;
    }
    .vh-minor .vh-section-num {
      color: ${lighten(brand.text, 0.72)};
    }
    .vh-minor .vh-margin-stat {
      font-size: 22px;
      color: ${lighten(brand.primary, 0.78)};
    }

    /* ── Horizontal rules between sections ── */
    .vh-rule {
      border: none;
      border-top: 1px solid ${lighten(brand.text, 0.82)};
      margin: 0 0 0 144px;
    }

    /* ── Body content styles ── */
    .vh-body h1 { font-size: inherit; font-weight: 700; margin: 18px 0 8px; color: var(--brand-primary); }
    .vh-body h2 { font-size: inherit; font-weight: 600; margin: 16px 0 6px; color: inherit; }
    .vh-body h3, .vh-body h4 { font-size: inherit; font-weight: 600; margin: 14px 0 4px; color: inherit; }
    .vh-body p { margin-bottom: 10px; }
    .vh-body ul, .vh-body ol { padding-left: 22px; margin: 8px 0 12px; }
    .vh-body li { margin-bottom: 4px; }
    .vh-body strong { font-weight: 600; color: ${darken(brand.text, 0.15)}; }
    .vh-body em { font-style: italic; }
    .vh-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: inherit;
    }
    .vh-body th {
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid ${lighten(brand.text, 0.7)};
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${lighten(brand.text, 0.2)};
    }
    .vh-body td {
      padding: 7px 12px;
      border-bottom: 1px solid ${lighten(brand.text, 0.88)};
    }
    .vh-body hr {
      border: none;
      border-top: 1px solid ${lighten(brand.text, 0.85)};
      margin: 16px 0;
    }

    /* ── Footer — Tufte-style minimal ── */
    .vh-footer {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 0 24px;
      margin-top: 48px;
      padding-top: 14px;
      border-top: 1px solid ${lighten(brand.text, 0.82)};
    }
    .vh-footer-margin { }
    .vh-footer-content {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 10px;
      color: ${lighten(brand.text, 0.55)};
      letter-spacing: 0.03em;
    }

    @media print {
      .vh-page { padding: 40px 32px 24px 32px; }
      .vh-section { break-inside: avoid; }
    }
  `;

  const body = `
    <div class="vh-page">
      <header class="vh-header">
        <div class="vh-header-left">
          <div class="vh-header-logo">${brandLogoHtml(input)}</div>
          <h1 class="vh-headline">${title}</h1>
          <p class="vh-subline">Prepared for ${prospect.companyName}</p>
          <p class="vh-header-meta">${dateStr}${prospect.industry ? ' &middot; ' + prospect.industry : ''}</p>
        </div>
      </header>

      ${sectionsHtml}

      <footer class="vh-footer">
        <div class="vh-footer-margin"></div>
        <div class="vh-footer-content">
          <span>${companyName}${prospect.companyName ? ' &middot; ' + prospect.companyName : ''}</span>
          <span>${dateStr}</span>
        </div>
      </footer>
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
  description: 'Tufte-inspired information design — visual weight matches importance, margin annotations',
  keywords: ['hierarchy', 'tufte', 'information', 'design', 'importance', 'weight', 'margin', 'annotation'],
  render,
  thumbnail,
};

export default style30VisualHierarchy;
