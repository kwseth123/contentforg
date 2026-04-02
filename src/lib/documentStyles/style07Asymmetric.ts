// ════════════════════════════════════════════════════════
// Style 07 — Asymmetric
// Avant-garde design studio portfolio — deliberate tension
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

const style07Asymmetric: DocumentStyle = {
  id: 'style-07',
  name: 'Asymmetric',
  category: 'clean',
  description: 'Avant-garde offset layouts with oversized decorative numbers and deliberate tension',
  keywords: ['asymmetric', 'creative', 'agency', 'portfolio', 'offset', 'avant-garde', 'monospace'],

  render(input: StyleInput): string {
    const brand = resolveBrand(input);

    // One-pager shortcut
    if (input.contentType === 'solution-one-pager') {
      return buildOnePagerDocument(input, brand);
    }

    const {
      sections,
      contentType,
      prospect,
      companyName,
      companyDescription,
      logoBase64,
      prospectLogoBase64,
      date,
    } = input;

    const accent = brand.primary;
    const accentLight = lighten(accent, 0.92);
    const accentMid = lighten(accent, 0.8);
    const accentDark = darken(accent, 0.15);
    const textOnAccent = contrastText(accent);
    const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const titleLabel = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const isStatSection = (title: string) =>
      /metric|stat|number|result|roi|kpi|outcome|impact/i.test(title);

    // Assign layout patterns for variety
    // 0 = offset-left (25% margin), 1 = full-width, 2 = offset-right, 3 = accent-bg
    const layoutPattern = (idx: number): number => {
      const patterns = [1, 0, 2, 1, 0, 3, 2, 1, 0, 2];
      return patterns[idx % patterns.length];
    };

    const css = `
      ${brandCSSVars(brand)}
      ${professionalSymbolCSS(accent)}

      @page {
        size: letter;
        margin: 0;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }

      body {
        font-family: var(--brand-font-primary);
        color: #2a2a2a;
        background: #ffffff;
        line-height: 1.7;
        font-size: var(--brand-font-body-size);
        margin: 0;
        padding: 0;
        overflow-wrap: break-word;
        word-wrap: break-word;
      }

      /* ── Hero Header ── */
      .asym-hero {
        position: relative;
        padding: 80px 60px 60px;
        min-height: 280px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        overflow: hidden;
      }
      .asym-hero-bg-num {
        position: absolute;
        top: -40px;
        right: 40px;
        font-size: 280px;
        font-weight: 900;
        color: #f0f0f0;
        line-height: 1;
        user-select: none;
        letter-spacing: -0.05em;
        z-index: 0;
      }
      .asym-hero-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
        position: relative;
        z-index: 1;
      }
      .asym-hero-logo img { height: 36px; }
      .asym-hero-logo-text {
        font-weight: 700;
        font-size: 18px;
        color: #111;
      }
      .asym-hero-meta {
        text-align: right;
        font-family: 'Courier New', 'SF Mono', monospace;
        font-size: 11px;
        color: #888;
        line-height: 1.6;
      }
      .asym-hero-meta .prospect-label {
        font-size: 13px;
        font-weight: 700;
        color: #333;
        font-family: var(--brand-font-primary);
      }
      .asym-prospect-logo img {
        height: 24px;
        opacity: 0.6;
        margin-bottom: 4px;
      }
      .asym-hero-type {
        font-family: 'Courier New', 'SF Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: ${accent};
        margin-bottom: 12px;
        position: relative;
        z-index: 1;
      }
      .asym-hero-title {
        font-size: 42px;
        font-weight: 800;
        color: #111111;
        line-height: 1.1;
        letter-spacing: -0.03em;
        max-width: 600px;
        position: relative;
        z-index: 1;
      }
      .asym-hero-subtitle {
        font-size: 16px;
        font-weight: 400;
        color: #777;
        margin-top: 12px;
        position: relative;
        z-index: 1;
      }
      .asym-hero-rule {
        margin-top: 32px;
        width: 80px;
        height: 4px;
        background: ${accent};
        position: relative;
        z-index: 1;
      }

      /* ── Page Container ── */
      .asym-page {
        width: 100%;
        max-width: 816px;
        margin: 0 auto;
      }

      /* ── Section Wrapper ── */
      .asym-sections { padding: 0; }

      /* ── Section Layouts ── */
      .asym-section {
        position: relative;
        padding: 48px 60px 48px;
        overflow: hidden;
        page-break-inside: avoid;
      }
      .asym-section-offset-left {
        padding-left: 25%;
      }
      .asym-section-offset-right {
        padding-right: 25%;
      }
      .asym-section-accent-bg {
        background: ${accent};
        color: ${textOnAccent};
      }

      /* Decorative background number */
      .asym-bg-number {
        position: absolute;
        top: 12px;
        left: 20px;
        font-size: 160px;
        font-weight: 900;
        color: rgba(0,0,0,0.04);
        line-height: 1;
        user-select: none;
        letter-spacing: -0.05em;
        z-index: 0;
      }
      .asym-section-accent-bg .asym-bg-number {
        color: rgba(255,255,255,0.1);
      }

      /* Section header */
      .asym-section-header {
        display: flex;
        align-items: baseline;
        gap: 16px;
        margin-bottom: 24px;
        position: relative;
        z-index: 1;
      }
      .asym-section-num {
        font-family: 'Courier New', 'SF Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        color: ${accent};
        flex-shrink: 0;
      }
      .asym-section-accent-bg .asym-section-num {
        color: rgba(255,255,255,0.7);
      }
      .asym-section-title {
        font-size: var(--brand-font-h2-size);
        font-weight: 700;
        color: #111111;
        letter-spacing: -0.01em;
      }
      .asym-section-accent-bg .asym-section-title {
        color: ${textOnAccent};
      }
      .asym-section-rule {
        width: 40px;
        height: 3px;
        background: ${accent};
        margin-bottom: 20px;
        position: relative;
        z-index: 1;
      }
      .asym-section-accent-bg .asym-section-rule {
        background: rgba(255,255,255,0.4);
      }

      /* Section body content */
      .asym-section-body {
        position: relative;
        z-index: 1;
      }
      .asym-section-body h2 { display: none; }
      .asym-section-body h3 {
        font-size: var(--brand-font-h3-size);
        font-weight: 600;
        color: #222;
        margin: 28px 0 10px;
      }
      .asym-section-accent-bg .asym-section-body h3 { color: ${textOnAccent}; }
      .asym-section-body h4 {
        font-family: 'Courier New', 'SF Mono', monospace;
        font-size: 12px;
        font-weight: 600;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin: 20px 0 8px;
      }
      .asym-section-accent-bg .asym-section-body h4 { color: rgba(255,255,255,0.7); }
      .asym-section-body p {
        margin-bottom: 14px;
        color: #3a3a3a;
        line-height: 1.75;
        font-size: 15px;
      }
      .asym-section-accent-bg .asym-section-body p { color: ${textOnAccent}; }
      .asym-section-body strong { font-weight: 600; color: #111; }
      .asym-section-accent-bg .asym-section-body strong { color: ${textOnAccent}; }
      .asym-section-body em { font-style: italic; color: #666; }
      .asym-section-accent-bg .asym-section-body em { color: rgba(255,255,255,0.8); }
      .asym-section-body hr {
        border: none;
        height: 1px;
        background: #e0e0e0;
        margin: 28px 0;
      }
      .asym-section-accent-bg .asym-section-body hr { background: rgba(255,255,255,0.2); }

      /* Lists */
      .asym-section-body ul, .asym-section-body ol {
        margin: 10px 0 18px 20px;
        padding: 0;
      }
      .asym-section-body li {
        margin-bottom: 8px;
        line-height: 1.65;
      }
      .asym-section-body ul li::marker { color: ${accent}; font-weight: 700; }
      .asym-section-accent-bg .asym-section-body ul li::marker { color: rgba(255,255,255,0.5); }
      .asym-section-accent-bg .asym-section-body li { color: ${textOnAccent}; }

      /* Blockquotes / pull quotes */
      .asym-section-body blockquote {
        border: none;
        border-right: 4px solid ${accent};
        margin: 28px 0 28px auto;
        padding: 16px 24px;
        max-width: 360px;
        text-align: right;
        color: ${accent};
        font-size: 18px;
        font-weight: 600;
        line-height: 1.45;
        background: transparent;
      }
      .asym-section-accent-bg .asym-section-body blockquote {
        border-right-color: rgba(255,255,255,0.5);
        color: ${textOnAccent};
      }

      /* ── Stat Display (offset left) ── */
      .asym-stat-row {
        display: flex;
        gap: 0;
        margin: 24px 0;
        flex-wrap: nowrap;
      }
      .asym-stat-item {
        flex: 1;
        min-width: 0;
        padding: 24px 20px;
        border-right: 1px solid #e5e5e5;
      }
      .asym-stat-item:last-child { border-right: none; }
      .asym-stat-value {
        font-size: 40px;
        font-weight: 800;
        color: #111111;
        line-height: 1;
        margin-bottom: 8px;
        letter-spacing: -0.02em;
      }
      .asym-stat-label {
        font-family: 'Courier New', 'SF Mono', monospace;
        font-size: 10px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .asym-section-accent-bg .asym-stat-value { color: ${textOnAccent}; }
      .asym-section-accent-bg .asym-stat-label { color: rgba(255,255,255,0.6); }
      .asym-section-accent-bg .asym-stat-item { border-right-color: rgba(255,255,255,0.15); }

      /* ── Tables ── */
      .asym-section-body table {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
        font-size: 14px;
      }
      .asym-section-body thead th {
        background: ${accent};
        color: ${textOnAccent};
        font-weight: 600;
        text-align: left;
        padding: 10px 16px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .asym-section-body td {
        padding: 10px 16px;
        border-bottom: 1px solid #eee;
        color: #3a3a3a;
      }
      .asym-section-body tr:nth-child(even) td { background: #fafafa; }
      .asym-section-accent-bg .asym-section-body thead th {
        background: rgba(255,255,255,0.15);
        color: ${textOnAccent};
      }
      .asym-section-accent-bg .asym-section-body td {
        color: ${textOnAccent};
        border-bottom-color: rgba(255,255,255,0.1);
      }
      .asym-section-accent-bg .asym-section-body tr:nth-child(even) td {
        background: rgba(255,255,255,0.05);
      }

      /* ── Divider ── */
      .asym-divider {
        height: 1px;
        background: #e8e8e8;
        margin: 0 60px;
      }

      /* ── Footer ── */
      .asym-footer {
        padding: 32px 60px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #e0e0e0;
        margin-top: auto;
      }
      .asym-footer-left {
        font-size: 12px;
        color: #999;
      }
      .asym-footer-company {
        font-weight: 600;
        color: #666;
      }
      .asym-footer-right {
        font-family: 'Courier New', 'SF Mono', monospace;
        font-size: 10px;
        color: #aaa;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
    `;

    // Logo
    const logoHtml = logoBase64
      ? `<div class="asym-hero-logo"><img src="${logoBase64}" alt="${companyName}" /></div>`
      : `<div class="asym-hero-logo-text">${companyName}</div>`;

    const prospectMeta = `
      <div class="asym-hero-meta">
        ${prospectLogoBase64 ? `<div class="asym-prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}" /></div>` : ''}
        <div class="prospect-label">${prospect.companyName}</div>
        <div>${prospect.industry || ''}</div>
        <div>${dateStr}</div>
      </div>
    `;

    // Build sections with varying layouts
    const validSections = sections.filter(s => s.content && s.content.trim().length > 0);
    let accentSectionUsed = false;
    const sectionsHtml = validSections.map((s, i) => {
      const title = stripEmojis(s.title);
      const content = stripEmojis(s.content);
      const num = String(i + 1).padStart(2, '0');
      const isStat = isStatSection(title);

      // Determine layout
      let layout = layoutPattern(i);
      // Only use accent bg once, for the most impactful non-stat section
      if (layout === 3 && accentSectionUsed) layout = 1;
      if (layout === 3) accentSectionUsed = true;

      let layoutClass = '';
      if (layout === 0) layoutClass = 'asym-section-offset-left';
      else if (layout === 2) layoutClass = 'asym-section-offset-right';
      else if (layout === 3) layoutClass = 'asym-section-accent-bg';

      // Build stat items if detected
      let statsHtml = '';
      let bodyContent = content;
      if (isStat) {
        const lines = content.split('\n').filter(l => l.trim());
        const statItems: { value: string; label: string }[] = [];
        const otherLines: string[] = [];
        for (const line of lines) {
          const pipeMatch = line.match(/^[*\-]?\s*\**(.+?)\**\s*[|:]\s*(.+)$/);
          const boldMatch = line.match(/\*\*(.+?)\*\*\s*(.+)/);
          if (pipeMatch) {
            statItems.push({ value: pipeMatch[1].replace(/\*+/g, '').trim(), label: pipeMatch[2].replace(/\*+/g, '').trim() });
          } else if (boldMatch) {
            statItems.push({ value: boldMatch[1].trim(), label: boldMatch[2].trim() });
          } else {
            otherLines.push(line);
          }
        }
        if (statItems.length > 0) {
          statsHtml = `
            <div class="asym-stat-row">
              ${statItems.map(st => `
                <div class="asym-stat-item">
                  <div class="asym-stat-value">${st.value}</div>
                  <div class="asym-stat-label">${st.label}</div>
                </div>
              `).join('')}
            </div>
          `;
        }
        bodyContent = otherLines.join('\n');
      }

      const rendered = bodyContent.trim() ? formatMarkdown(bodyContent) : '';

      return `
        ${i > 0 && layout !== 3 ? '<div class="asym-divider"></div>' : ''}
        <div class="asym-section ${layoutClass}">
          <div class="asym-bg-number">${num}</div>
          <div class="asym-section-header">
            <span class="asym-section-num">${num}</span>
            <span class="asym-section-title">${title}</span>
          </div>
          <div class="asym-section-rule"></div>
          ${statsHtml}
          <div class="asym-section-body">${rendered}</div>
        </div>
      `;
    }).join('');

    const body = `
      <div class="asym-page">
      <div class="asym-hero">
        <div class="asym-hero-bg-num">A</div>
        <div class="asym-hero-top">
          ${logoHtml}
          ${prospectMeta}
        </div>
        <div class="asym-hero-type">${titleLabel}</div>
        <div class="asym-hero-title">${prospect.companyName}</div>
        <div class="asym-hero-subtitle">${titleLabel} &mdash; Prepared by ${companyName}</div>
        <div class="asym-hero-rule"></div>
      </div>

      <div class="asym-sections">
        ${sectionsHtml}
      </div>

      <div class="asym-footer">
        <div class="asym-footer-left">
          <span class="asym-footer-company">${companyName}</span>
          ${companyDescription ? ' &middot; ' + companyDescription : ''}
        </div>
        <div class="asym-footer-right">${dateStr} &middot; Page 1</div>
      </div>
      </div>
    `;

    return wrapDocument({
      title: `${titleLabel} - ${prospect.companyName} - ${companyName}`,
      css,
      body,
      fonts: brandFonts(brand),
    });
  },

  thumbnail(accentColor: string): string {
    const accentLight = lighten(accentColor, 0.92);
    const textOn = contrastText(accentColor);
    return `
    <div style="width:1000px;font-family:'Inter',sans-serif;background:#fff;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);position:relative;">
      <div style="padding:28px 32px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:20px;font-size:140px;font-weight:900;color:#f0f0f0;line-height:1;user-select:none;">A</div>
        <div style="font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:${accentColor};margin-bottom:8px;position:relative;z-index:1;">Proposal</div>
        <div style="font-size:26px;font-weight:800;color:#111;letter-spacing:-0.03em;position:relative;z-index:1;max-width:60%;">Company Name</div>
        <div style="width:50px;height:3px;background:${accentColor};margin-top:12px;"></div>
      </div>
      <div style="padding:16px 32px 16px 25%;position:relative;">
        <div style="position:absolute;left:12px;top:0;font-size:80px;font-weight:900;color:rgba(0,0,0,0.04);line-height:1;">01</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;">
          <span style="font-family:monospace;font-size:10px;color:${accentColor};font-weight:700;">01</span>
          <span style="font-size:15px;font-weight:700;color:#111;">Section Title</span>
        </div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:6px;width:90%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;width:65%;"></div>
      </div>
      <div style="background:${accentColor};padding:16px 32px;position:relative;overflow:hidden;">
        <div style="position:absolute;left:12px;top:-8px;font-size:80px;font-weight:900;color:rgba(255,255,255,0.1);line-height:1;">02</div>
        <div style="font-size:15px;font-weight:700;color:${textOn};margin-bottom:8px;">Key Section</div>
        <div style="height:8px;background:rgba(255,255,255,0.2);border-radius:4px;margin-bottom:6px;width:85%;"></div>
        <div style="height:8px;background:rgba(255,255,255,0.2);border-radius:4px;width:60%;"></div>
      </div>
    </div>`;
  },
};

export default style07Asymmetric;
