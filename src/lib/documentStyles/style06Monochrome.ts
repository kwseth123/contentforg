// ════════════════════════════════════════════════════════
// Style 06 — Monochrome
// New York Times editorial — ink on paper elegance
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

const style06Monochrome: DocumentStyle = {
  id: 'style-06',
  name: 'Monochrome',
  category: 'clean',
  description: 'NYT editorial elegance — serif typography, dense columns, ink-on-paper authority',
  keywords: ['monochrome', 'editorial', 'newspaper', 'serif', 'georgia', 'black-white', 'nyt'],

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
    const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const titleLabel = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Detect stat sections
    const isStatSection = (title: string) =>
      /metric|stat|number|result|roi|kpi|outcome|impact/i.test(title);

    const css = `
      ${brandCSSVars(brand)}
      ${professionalSymbolCSS('#222222')}

      @page {
        size: letter;
        margin: 0.75in 0.85in;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .mono-section { page-break-inside: avoid; }
      }

      body {
        font-family: Georgia, 'Times New Roman', 'Noto Serif', serif;
        color: #222222;
        background: #ffffff;
        line-height: 1.6;
        font-size: 15px;
        margin: 0;
        padding: 0;
        overflow-wrap: break-word;
        word-wrap: break-word;
      }

      /* ── Masthead / Header ── */
      .mono-masthead {
        width: 100%;
        max-width: 816px;
        margin: 0 auto;
        padding: 40px 48px 0;
        box-sizing: border-box;
      }
      .mono-logo-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid #cccccc;
        margin-bottom: 10px;
      }
      .mono-logo-area {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .mono-logo-area img {
        height: 30px;
      }
      .mono-logo-accent {
        width: 4px;
        height: 30px;
        background: ${accent};
      }
      .mono-logo-text {
        font-family: Georgia, 'Times New Roman', serif;
        font-weight: 700;
        font-size: 16px;
        color: #111;
        letter-spacing: -0.01em;
      }
      .mono-prospect-logo img {
        height: 24px;
        filter: grayscale(100%);
        opacity: 0.6;
      }
      .mono-header-rule-thin {
        border: none;
        border-top: 1px solid #cccccc;
        margin: 0;
      }
      .mono-header-rule-thick {
        border: none;
        border-top: 3px double #222222;
        margin: 10px 0 20px;
      }
      .mono-headline-area {
        text-align: center;
        padding: 0 24px;
        margin-bottom: 4px;
      }
      .mono-doc-type {
        font-family: Georgia, serif;
        font-size: 11px;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #888;
        margin-bottom: 12px;
      }
      .mono-headline {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 34px;
        font-weight: 700;
        color: #000000;
        letter-spacing: -0.02em;
        line-height: 1.2;
        margin-bottom: 10px;
      }
      .mono-subheadline {
        font-family: Georgia, serif;
        font-size: 16px;
        font-weight: 400;
        color: #555555;
        font-style: italic;
        line-height: 1.45;
        margin-bottom: 6px;
      }
      .mono-dateline {
        font-family: Georgia, serif;
        font-size: 12px;
        color: #999999;
        margin-bottom: 0;
        letter-spacing: 0.02em;
      }
      .mono-header-rule-bottom {
        border: none;
        border-top: 1px solid #cccccc;
        margin: 20px 0 0;
      }

      /* ── Wrapper ── */
      .mono-wrapper {
        width: 100%;
        max-width: 816px;
        margin: 0 auto;
        padding: 0 48px;
        box-sizing: border-box;
      }

      /* ── Sections ── */
      .mono-section {
        padding: 32px 0;
        border-bottom: 1px solid #dddddd;
        page-break-inside: avoid;
      }
      .mono-section:last-child { border-bottom: none; }

      .mono-section-title {
        font-family: Georgia, serif;
        font-size: 13px;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: #444444;
        margin-bottom: 18px;
        padding-bottom: 8px;
        border-bottom: 1px solid #dddddd;
        font-variant: small-caps;
      }

      /* Typography */
      .mono-section-body h2 { display: none; }
      .mono-section-body h3 {
        font-family: Georgia, serif;
        font-size: 20px;
        font-weight: 700;
        color: #111111;
        margin: 24px 0 10px;
        line-height: 1.3;
      }
      .mono-section-body h4 {
        font-family: Georgia, serif;
        font-size: 15px;
        font-weight: 700;
        color: #222222;
        margin: 20px 0 8px;
        font-style: italic;
      }
      .mono-section-body p {
        margin-bottom: 14px;
        color: #222222;
        line-height: 1.65;
        text-align: justify;
        hyphens: auto;
      }
      .mono-section-body strong { font-weight: 700; color: #000000; }
      .mono-section-body em { font-style: italic; color: #444444; }
      .mono-section-body hr {
        border: none;
        height: 1px;
        background: #cccccc;
        margin: 24px 0;
      }

      /* Lists */
      .mono-section-body ul, .mono-section-body ol {
        margin: 10px 0 16px 20px;
        padding: 0;
      }
      .mono-section-body li {
        margin-bottom: 6px;
        line-height: 1.6;
        color: #222222;
      }
      .mono-section-body ul li::marker { color: #444444; }

      /* Pull quotes */
      .mono-section-body blockquote {
        border-left: 2px solid #333333;
        margin: 28px 32px 28px 0;
        padding: 0 0 0 20px;
        font-family: Georgia, serif;
        font-size: 17px;
        font-style: italic;
        color: #333333;
        line-height: 1.55;
        background: transparent;
      }

      /* ── Stat boxes (serif bold numbers) ── */
      .mono-stat-row {
        display: flex;
        gap: 24px;
        margin: 20px 0;
        flex-wrap: nowrap;
      }
      .mono-stat-item {
        flex: 1;
        min-width: 0;
        padding: 20px 16px;
        border: 1px solid #cccccc;
        text-align: center;
      }
      .mono-stat-value {
        font-family: Georgia, serif;
        font-size: 32px;
        font-weight: 700;
        color: #000000;
        line-height: 1.1;
        margin-bottom: 6px;
      }
      .mono-stat-label {
        font-family: Georgia, serif;
        font-size: 11px;
        color: #777777;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .mono-stat-content p { text-align: left; }

      /* ── Tables ── */
      .mono-section-body table {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
        font-size: 14px;
        font-family: Georgia, serif;
      }
      .mono-section-body thead th {
        background: #ffffff;
        color: #000000;
        font-weight: 700;
        text-align: left;
        padding: 8px 12px;
        border-top: 1px solid #222222;
        border-bottom: 1px solid #222222;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .mono-section-body td {
        padding: 8px 12px;
        border-bottom: 1px solid #dddddd;
        color: #333333;
      }
      .mono-section-body tr:last-child td {
        border-bottom: 1px solid #222222;
      }

      /* ── Footer ── */
      .mono-footer {
        width: 100%;
        max-width: 816px;
        margin: 0 auto;
        padding: 24px 48px 40px;
        box-sizing: border-box;
        border-top: 1px solid #cccccc;
      }
      .mono-footer-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: Georgia, serif;
        font-size: 10px;
        color: #aaaaaa;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-variant: small-caps;
      }
      .mono-footer-company { font-weight: 700; color: #888888; }
    `;

    // Logo with accent bar (only place accent color appears)
    const logoArea = logoBase64
      ? `<div class="mono-logo-area"><div class="mono-logo-accent"></div><img src="${logoBase64}" alt="${companyName}" /></div>`
      : `<div class="mono-logo-area"><div class="mono-logo-accent"></div><span class="mono-logo-text">${companyName}</span></div>`;

    const prospectLogoHtml = prospectLogoBase64
      ? `<div class="mono-prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}" /></div>`
      : '';

    // Build sections
    const filteredSections = sections.filter(s => s.content && s.content.trim().length > 0);
    const sectionsHtml = filteredSections.map((s, i) => {
      const title = stripEmojis(s.title);
      const content = stripEmojis(s.content);

      if (isStatSection(title)) {
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

        return `
          <div class="mono-section">
            <div class="mono-section-title">${title}</div>
            ${statItems.length > 0 ? `
              <div class="mono-stat-row">
                ${statItems.map(st => `
                  <div class="mono-stat-item">
                    <div class="mono-stat-value">${st.value}</div>
                    <div class="mono-stat-label">${st.label}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${otherLines.length > 0 ? `<div class="mono-stat-content">${formatMarkdown(otherLines.join('\n'))}</div>` : ''}
          </div>
        `;
      }

      return `
        <div class="mono-section">
          <div class="mono-section-title">${title}</div>
          <div class="mono-section-body">${formatMarkdown(content)}</div>
        </div>
      `;
    }).join('');

    const body = `
      <div class="mono-masthead">
        <div class="mono-logo-bar">
          ${logoArea}
          ${prospectLogoHtml}
        </div>
        <hr class="mono-header-rule-thick" />
        <div class="mono-headline-area">
          <div class="mono-doc-type">${titleLabel}</div>
          <div class="mono-headline">${titleLabel} for ${prospect.companyName}</div>
          <div class="mono-subheadline">Prepared by ${companyName}${prospect.industry ? ' for the ' + prospect.industry + ' sector' : ''}</div>
          <div class="mono-dateline">${dateStr}</div>
        </div>
        <hr class="mono-header-rule-bottom" />
      </div>

      <div class="mono-wrapper">
        ${sectionsHtml}
      </div>

      <div class="mono-footer">
        <div class="mono-footer-inner">
          <div><span class="mono-footer-company">${companyName}</span>${companyDescription ? ' &middot; ' + companyDescription : ''}</div>
          <div>${dateStr}</div>
          <div>Page 1</div>
        </div>
      </div>
    `;

    return wrapDocument({
      title: `${titleLabel} - ${prospect.companyName} - ${companyName}`,
      css,
      body,
      fonts: ['Noto Serif'],
    });
  },

  thumbnail(accentColor: string): string {
    return `
    <div style="width:1000px;font-family:Georgia,'Times New Roman',serif;background:#fff;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="padding:20px 32px 0;">
        <div style="display:flex;align-items:center;gap:8px;padding-bottom:10px;border-bottom:1px solid #ccc;margin-bottom:8px;">
          <div style="width:3px;height:22px;background:${accentColor};"></div>
          <span style="font-weight:700;font-size:14px;color:#111;">Company</span>
        </div>
        <div style="border-top:3px double #222;padding-top:14px;text-align:center;margin-bottom:12px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:#888;margin-bottom:8px;">Proposal</div>
          <div style="font-size:22px;font-weight:700;color:#000;letter-spacing:-0.02em;margin-bottom:6px;">Document Title</div>
          <div style="font-size:13px;font-style:italic;color:#555;">Prepared for the enterprise sector</div>
        </div>
        <div style="border-top:1px solid #ccc;padding-top:16px;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#444;font-variant:small-caps;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #ddd;">Section One</div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:95%;"></div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:80%;"></div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;width:65%;"></div>
        </div>
      </div>
      <div style="padding:16px 32px;">
        <div style="display:flex;gap:16px;">
          <div style="flex:1;border:1px solid #ccc;padding:12px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#000;">42%</div>
            <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.1em;color:#777;">Metric</div>
          </div>
          <div style="flex:1;border:1px solid #ccc;padding:12px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#000;">3.2x</div>
            <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.1em;color:#777;">Return</div>
          </div>
        </div>
      </div>
    </div>`;
  },
};

export default style06Monochrome;
