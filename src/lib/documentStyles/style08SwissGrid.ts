// ════════════════════════════════════════════════════════
// Style 08 — Swiss Grid
// International Typographic Style / Bauhaus — the gold standard
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

const style08SwissGrid: DocumentStyle = {
  id: 'style-08',
  name: 'Swiss Grid',
  category: 'clean',
  description: 'International Typographic Style — strict grid, Helvetica, mathematical precision',
  keywords: ['swiss', 'grid', 'bauhaus', 'helvetica', 'inter', 'modernist', 'typographic', 'international'],

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

    // Swiss style: red+black preference, fallback to brand primary
    const swissRed = '#E53935';
    const accent = brand.primary;
    const isDefaultBrand = accent === '#1e293b' || accent === brand.secondary;
    const swissAccent = isDefaultBrand ? swissRed : accent;
    const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const titleLabel = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const isStatSection = (title: string) =>
      /metric|stat|number|result|roi|kpi|outcome|impact/i.test(title);

    const css = `
      ${brandCSSVars(brand)}
      ${professionalSymbolCSS(swissAccent)}

      @page {
        size: letter;
        margin: 0.6in;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }

      body {
        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #222222;
        background: #ffffff;
        line-height: 1.55;
        font-size: 14px;
        margin: 0;
        padding: 0;
      }

      /* ── Page Grid Container ── */
      .swiss-page {
        max-width: 960px;
        margin: 0 auto;
        padding: 0 40px;
      }

      /* ── 12-Column Grid ── */
      .swiss-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        column-gap: 16px;
      }

      /* ── Header ── */
      .swiss-header {
        padding: 48px 0 24px;
        border-bottom: 2px solid #000000;
        margin-bottom: 0;
      }
      .swiss-header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
      }
      .swiss-header-logo {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .swiss-header-logo img { height: 28px; }
      .swiss-header-logo-text {
        font-weight: 700;
        font-size: 16px;
        color: #000;
        letter-spacing: -0.01em;
      }
      .swiss-accent-block {
        width: 24px;
        height: 24px;
        background: ${swissAccent};
        flex-shrink: 0;
      }
      .swiss-header-right {
        text-align: right;
      }
      .swiss-header-prospect-logo img {
        height: 22px;
        opacity: 0.5;
        margin-bottom: 4px;
      }
      .swiss-header-meta-text {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #999;
        font-weight: 500;
        line-height: 1.6;
      }
      .swiss-header-meta-text .prospect-name {
        font-size: 12px;
        font-weight: 700;
        color: #333;
        letter-spacing: 0.06em;
      }

      /* Title area in grid */
      .swiss-title-area {
        grid-column: 1 / 9;
        padding: 8px 0 0;
      }
      .swiss-title-type {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: ${swissAccent};
        margin-bottom: 8px;
      }
      .swiss-title {
        font-size: 36px;
        font-weight: 800;
        color: #000000;
        letter-spacing: -0.03em;
        line-height: 1.1;
        text-align: left;
        margin-bottom: 0;
      }
      .swiss-date-area {
        grid-column: 9 / 13;
        padding: 8px 0 0;
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .swiss-date-label {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #aaa;
        font-weight: 500;
        margin-bottom: 4px;
      }
      .swiss-date-value {
        font-size: 13px;
        font-weight: 600;
        color: #333;
        text-align: right;
      }

      /* ── Section Row (12-column grid) ── */
      .swiss-section {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        column-gap: 16px;
        padding: 32px 0;
        border-bottom: 1px solid #cccccc;
      }

      /* Label column */
      .swiss-label {
        grid-column: 1 / 4;
        padding-top: 2px;
      }
      .swiss-label-num {
        font-size: 11px;
        font-weight: 800;
        color: ${swissAccent};
        letter-spacing: 0.04em;
        margin-bottom: 4px;
      }
      .swiss-label-text {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #777;
        line-height: 1.4;
        font-variant: small-caps;
      }

      /* Content column */
      .swiss-content {
        grid-column: 4 / 13;
      }

      /* ── Typography (flush-left, no centering) ── */
      .swiss-content h2 { display: none; }
      .swiss-content h3 {
        font-size: 18px;
        font-weight: 700;
        color: #000000;
        margin: 24px 0 8px;
        line-height: 1.3;
        text-align: left;
      }
      .swiss-content h4 {
        font-size: 10px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        margin: 20px 0 8px;
        line-height: 1.4;
        font-variant: small-caps;
      }
      .swiss-content p {
        margin-bottom: 12px;
        color: #333333;
        line-height: 1.6;
        text-align: left;
        font-size: 14px;
      }
      .swiss-content strong { font-weight: 700; color: #000000; }
      .swiss-content em { font-style: italic; color: #555; }
      .swiss-content hr {
        border: none;
        height: 1px;
        background: #e0e0e0;
        margin: 24px 0;
      }

      /* Lists */
      .swiss-content ul, .swiss-content ol {
        margin: 8px 0 16px 18px;
        padding: 0;
      }
      .swiss-content li {
        margin-bottom: 6px;
        line-height: 1.55;
        font-size: 14px;
      }
      .swiss-content ul li::marker {
        color: ${swissAccent};
        font-weight: 700;
      }

      /* Blockquotes */
      .swiss-content blockquote {
        border-left: 4px solid ${swissAccent};
        padding: 12px 18px;
        margin: 20px 0;
        background: #fafafa;
        color: #333;
        font-size: 14px;
      }

      /* ── Stat Grid ── */
      .swiss-stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0;
        margin: 16px 0;
      }
      .swiss-stat-item {
        padding: 20px 16px 20px 18px;
        border-left: 4px solid #000000;
        margin-bottom: 8px;
      }
      .swiss-stat-value {
        font-size: 32px;
        font-weight: 800;
        color: #000000;
        line-height: 1;
        letter-spacing: -0.02em;
        margin-bottom: 6px;
        text-align: left;
      }
      .swiss-stat-label {
        font-size: 10px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        text-align: left;
        font-variant: small-caps;
      }

      /* ── Tables ── */
      .swiss-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 13px;
      }
      .swiss-content thead th {
        background: transparent;
        color: #000000;
        font-weight: 700;
        text-align: left;
        padding: 8px 12px;
        border-top: 2px solid #000000;
        border-bottom: 2px solid #000000;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-variant: small-caps;
      }
      .swiss-content td {
        padding: 8px 12px;
        border-bottom: 1px solid #e0e0e0;
        color: #333;
        text-align: left;
      }
      .swiss-content tbody tr:last-child td {
        border-bottom: 2px solid #000000;
      }

      /* ── Footer ── */
      .swiss-footer {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        column-gap: 16px;
        padding: 24px 0 40px;
        border-top: 2px solid #000000;
        margin-top: 8px;
      }
      .swiss-footer-left {
        grid-column: 1 / 4;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #999;
        font-variant: small-caps;
      }
      .swiss-footer-center {
        grid-column: 4 / 10;
        font-size: 10px;
        color: #aaa;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        text-align: left;
        font-variant: small-caps;
      }
      .swiss-footer-right {
        grid-column: 10 / 13;
        font-size: 10px;
        color: #bbb;
        text-align: right;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-variant: small-caps;
      }
    `;

    // Logo
    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" alt="${companyName}" />`
      : `<span class="swiss-header-logo-text">${companyName}</span>`;

    const prospectLogoHtml = prospectLogoBase64
      ? `<div class="swiss-header-prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}" /></div>`
      : '';

    // Build sections
    const sectionsHtml = sections.map((s, i) => {
      const title = stripEmojis(s.title);
      const content = stripEmojis(s.content);
      const num = String(i + 1).padStart(2, '0');
      const isStat = isStatSection(title);

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
            <div class="swiss-stat-grid">
              ${statItems.map(st => `
                <div class="swiss-stat-item">
                  <div class="swiss-stat-value">${st.value}</div>
                  <div class="swiss-stat-label">${st.label}</div>
                </div>
              `).join('')}
            </div>
          `;
        }
        bodyContent = otherLines.join('\n');
      }

      const rendered = bodyContent.trim() ? formatMarkdown(bodyContent) : '';

      return `
        <div class="swiss-section">
          <div class="swiss-label">
            <div class="swiss-label-num">${num}</div>
            <div class="swiss-label-text">${title}</div>
          </div>
          <div class="swiss-content">
            ${statsHtml}
            ${rendered}
          </div>
        </div>
      `;
    }).join('');

    const body = `
      <div class="swiss-page">
        <div class="swiss-header">
          <div class="swiss-header-top">
            <div class="swiss-header-logo">
              <div class="swiss-accent-block"></div>
              ${logoHtml}
            </div>
            <div class="swiss-header-right">
              ${prospectLogoHtml}
              <div class="swiss-header-meta-text">
                <div class="prospect-name">${prospect.companyName}</div>
                <div>${prospect.industry || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="swiss-grid" style="padding:16px 0 0;">
          <div class="swiss-title-area">
            <div class="swiss-title-type">${titleLabel}</div>
            <div class="swiss-title">${titleLabel} for ${prospect.companyName}</div>
          </div>
          <div class="swiss-date-area">
            <div class="swiss-date-label">Date</div>
            <div class="swiss-date-value">${dateStr}</div>
          </div>
        </div>

        <div class="swiss-grid">
          ${sectionsHtml}

          <div class="swiss-footer">
            <div class="swiss-footer-left">${companyName}</div>
            <div class="swiss-footer-center">${companyDescription || ''}</div>
            <div class="swiss-footer-right">${dateStr} &middot; Page 1</div>
          </div>
        </div>
      </div>
    `;

    return wrapDocument({
      title: `${titleLabel} - ${prospect.companyName} - ${companyName}`,
      css,
      body,
      fonts: ['Inter'],
    });
  },

  thumbnail(accentColor: string): string {
    const isDefault = accentColor === '#1e293b';
    const swissAccent = isDefault ? '#E53935' : accentColor;
    return `
    <div style="width:1000px;font-family:'Inter','Helvetica Neue',sans-serif;background:#fff;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="padding:20px 24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <div style="width:16px;height:16px;background:${swissAccent};"></div>
          <span style="font-weight:700;font-size:14px;color:#000;">Company</span>
        </div>
        <div style="border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:12px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.16em;color:${swissAccent};font-weight:600;margin-bottom:4px;">Proposal</div>
          <div style="font-size:22px;font-weight:800;color:#000;letter-spacing:-0.03em;">Document Title</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:8px;padding:12px 24px;border-bottom:1px solid #ccc;">
        <div style="grid-column:1/4;">
          <div style="font-size:9px;font-weight:800;color:${swissAccent};margin-bottom:2px;">01</div>
          <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.14em;color:#777;font-variant:small-caps;">Section</div>
        </div>
        <div style="grid-column:4/13;">
          <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:90%;"></div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:75%;"></div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;width:55%;"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:8px;padding:12px 24px;border-bottom:1px solid #ccc;">
        <div style="grid-column:1/4;">
          <div style="font-size:9px;font-weight:800;color:${swissAccent};margin-bottom:2px;">02</div>
          <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.14em;color:#777;font-variant:small-caps;">Metrics</div>
        </div>
        <div style="grid-column:4/13;display:flex;gap:8px;">
          <div style="flex:1;border-left:3px solid #000;padding:8px 10px;">
            <div style="font-size:18px;font-weight:800;color:#000;">42%</div>
            <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#888;">Metric</div>
          </div>
          <div style="flex:1;border-left:3px solid #000;padding:8px 10px;">
            <div style="font-size:18px;font-weight:800;color:#000;">3.2x</div>
            <div style="font-size:7px;text-transform:uppercase;letter-spacing:0.1em;color:#888;">Return</div>
          </div>
        </div>
      </div>
      <div style="padding:10px 24px;display:grid;grid-template-columns:repeat(12,1fr);column-gap:8px;border-top:2px solid #000;margin-top:4px;">
        <div style="grid-column:1/4;font-size:8px;text-transform:uppercase;letter-spacing:0.12em;color:#999;font-variant:small-caps;">Company</div>
        <div style="grid-column:10/13;font-size:8px;text-align:right;text-transform:uppercase;letter-spacing:0.12em;color:#bbb;">Page 1</div>
      </div>
    </div>`;
  },
};

export default style08SwissGrid;
