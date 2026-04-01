// ════════════════════════════════════════════════════════
// Style 08 — Swiss Grid
// Mathematical precision, modernist design, engineering feel
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
} from './shared';

const style08SwissGrid: DocumentStyle = {
  id: 'style-08',
  name: 'Swiss Grid',
  category: 'clean',
  description: 'Strict 12-column grid with modernist precision and restrained color',
  keywords: ['swiss', 'grid', 'modernist', 'helvetica', 'inter', 'precision', 'minimal'],

  render(input: StyleInput): string {
    const brand = resolveBrand(input);
    const {
      sections,
      contentType,
      prospect,
      companyName,
      logoBase64,
      prospectLogoBase64,
      date,
    } = input;

    const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const css = `
      ${brandCSSVars(brand)}

      body {
        font-family: var(--brand-font-primary);
        color: #222222;
        background: #FFFFFF;
        line-height: 20px;
        font-size: var(--brand-font-body-size);
      }

      /* ── 12-Column Grid Container ── */
      .grid-page {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        column-gap: 16px;
        max-width: 1040px;
        margin: 0 auto;
        padding: 0 32px;
      }

      /* ── Header ── */
      .doc-header {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        column-gap: 16px;
        padding: 48px 0 32px;
        border-bottom: 1px solid #CCCCCC;
        align-items: end;
      }
      .header-accent {
        grid-column: 1 / 3;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .accent-rect {
        width: 32px;
        height: 8px;
        background: var(--brand-primary);
      }
      .header-logo img {
        height: 28px;
      }
      .header-content {
        grid-column: 3 / 11;
      }
      .header-title {
        font-size: var(--brand-font-h1-size);
        font-weight: 700;
        color: #000000;
        letter-spacing: -0.03em;
        line-height: 1.15;
        margin-bottom: 6px;
      }
      .header-meta {
        font-size: 10px;
        color: #999999;
        text-transform: uppercase;
        letter-spacing: 0.15em;
      }
      .header-prospect {
        grid-column: 11 / 13;
        text-align: right;
      }
      .header-prospect img {
        height: 24px;
        opacity: 0.6;
      }

      /* ── Section ── */
      .section-row {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        column-gap: 16px;
        padding: 36px 0;
        border-bottom: 1px solid #CCCCCC;
      }

      .section-label {
        grid-column: 1 / 3;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #999999;
        padding-top: 4px;
        line-height: 16px;
      }
      .section-label .sec-num {
        color: var(--brand-primary);
        font-weight: 700;
      }

      .section-body {
        grid-column: 3 / 11;
      }

      /* ── Section content typography ── */
      .section-body h2 {
        font-size: var(--brand-font-h2-size);
        font-weight: 700;
        color: #000000;
        letter-spacing: -0.02em;
        margin-bottom: 14px;
        line-height: 24px;
        display: none; /* title shown in label column */
      }
      .section-body h3 {
        font-size: var(--brand-font-h3-size);
        font-weight: 600;
        color: #111111;
        margin: 22px 0 8px;
        line-height: 20px;
      }
      .section-body h4 {
        font-size: 13px;
        font-weight: 600;
        color: #333333;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 18px 0 6px;
        line-height: 18px;
      }
      .section-body p {
        margin-bottom: 10px;
        color: #333333;
        line-height: 20px;
      }
      .section-body strong {
        font-weight: 600;
        color: #000000;
      }
      .section-body em {
        font-style: italic;
        color: #555555;
      }
      .section-body hr {
        border: none;
        height: 1px;
        background: #E0E0E0;
        margin: 20px 0;
      }

      /* ── Lists ── */
      .section-body ul, .section-body ol {
        margin: 8px 0 14px 20px;
        padding: 0;
      }
      .section-body li {
        margin-bottom: 4px;
        line-height: 20px;
      }
      .section-body ul li::marker {
        color: #999999;
      }

      /* ── Tables ── */
      .section-body table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 13px;
        line-height: 18px;
      }
      .section-body th {
        background: #F5F5F5;
        color: #222222;
        font-weight: 600;
        text-align: left;
        padding: 8px 12px;
        border-bottom: 2px solid #CCCCCC;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .section-body td {
        padding: 8px 12px;
        border-bottom: 1px solid #E8E8E8;
        color: #333333;
      }

      /* ── Blockquotes ── */
      .section-body blockquote {
        border-left: 3px solid var(--brand-primary);
        padding: 10px 16px;
        margin: 16px 0;
        background: #FAFAFA;
        color: #333333;
        font-size: 14px;
      }

      /* ── Accent sidebar column ── */
      .section-accent {
        grid-column: 11 / 13;
        padding-top: 4px;
      }
      .accent-bar {
        width: 3px;
        height: 28px;
        background: var(--brand-primary);
        opacity: 0.4;
      }

      /* ── Footer ── */
      .doc-footer {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        column-gap: 16px;
        padding: 24px 0 40px;
      }
      .footer-content {
        grid-column: 3 / 11;
        font-size: 10px;
        color: #BBBBBB;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        text-align: center;
      }
    `;

    const logoHtml = logoBase64
      ? `<div class="header-logo"><img src="${logoBase64}" alt="${companyName}" /></div>`
      : `<div class="header-logo">${brandLogoHtml(input)}</div>`;
    const prospectLogoHtml = prospectLogoBase64
      ? `<img src="${prospectLogoBase64}" alt="${prospect.companyName}" />`
      : '';

    const sectionsHtml = sections
      .map((s, i) => {
        const num = String(i + 1).padStart(2, '0');
        const rendered = formatMarkdown(s.content);
        const labelText = s.title.toUpperCase();
        return `
          <div class="section-row">
            <div class="section-label">
              <span class="sec-num">${num}</span> — ${labelText}
            </div>
            <div class="section-body">
              ${rendered}
            </div>
            <div class="section-accent">
              <div class="accent-bar"></div>
            </div>
          </div>`;
      })
      .join('');

    const body = `
      <div class="grid-page">
        <div class="doc-header">
          <div class="header-accent">
            <div class="accent-rect"></div>
            ${logoHtml}
          </div>
          <div class="header-content">
            <div class="header-title">${contentType}</div>
            <div class="header-meta">${prospect.companyName}${prospect.industry ? ` · ${prospect.industry}` : ''} · ${dateStr}</div>
          </div>
          <div class="header-prospect">
            ${prospectLogoHtml}
          </div>
        </div>
        ${sectionsHtml}
        <div class="doc-footer">
          <div class="footer-content">${companyName} | ${dateStr} | Generated by ContentForg</div>
        </div>
      </div>
    `;

    return wrapDocument({ title: `${contentType} — ${prospect.companyName}`, css, body, fonts: brandFonts(brand) });
  },

  thumbnail(accentColor: string): string {
    return `
    <div style="width:1000px;font-family:'Inter','Helvetica Neue',sans-serif;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:8px;padding:20px 24px;">
        <!-- Header -->
        <div style="grid-column:1/3;display:flex;flex-direction:column;gap:8px;">
          <div style="width:24px;height:6px;background:${accentColor};"></div>
        </div>
        <div style="grid-column:3/11;">
          <div style="font-size:18px;font-weight:700;color:#000;letter-spacing:-0.02em;margin-bottom:4px;">Document Title</div>
          <div style="font-size:8px;color:#999;text-transform:uppercase;letter-spacing:0.15em;">COMPANY · INDUSTRY · DATE</div>
        </div>
        <div style="grid-column:11/13;"></div>
      </div>
      <div style="height:1px;background:#CCC;margin:0 24px;"></div>
      <!-- Section 1 -->
      <div style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:8px;padding:16px 24px;">
        <div style="grid-column:1/3;font-size:8px;text-transform:uppercase;letter-spacing:0.12em;color:#999;"><span style="color:${accentColor};font-weight:700;">01</span> — SECTION</div>
        <div style="grid-column:3/11;">
          <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:90%;"></div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:75%;"></div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;width:55%;"></div>
        </div>
        <div style="grid-column:11/13;"><div style="width:3px;height:20px;background:${accentColor};opacity:0.4;"></div></div>
      </div>
      <div style="height:1px;background:#CCC;margin:0 24px;"></div>
      <!-- Section 2 -->
      <div style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:8px;padding:16px 24px;">
        <div style="grid-column:1/3;font-size:8px;text-transform:uppercase;letter-spacing:0.12em;color:#999;"><span style="color:${accentColor};font-weight:700;">02</span> — SECTION</div>
        <div style="grid-column:3/11;">
          <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:85%;"></div>
          <div style="height:8px;background:#E5E5E5;border-radius:4px;width:65%;"></div>
        </div>
        <div style="grid-column:11/13;"><div style="width:3px;height:20px;background:${accentColor};opacity:0.4;"></div></div>
      </div>
      <div style="height:1px;background:#CCC;margin:0 24px;"></div>
      <div style="padding:12px 24px;text-align:center;font-size:8px;color:#BBB;text-transform:uppercase;letter-spacing:0.12em;">Company | Date | Generated by ContentForg</div>
    </div>`;
  },
};

export default style08SwissGrid;
