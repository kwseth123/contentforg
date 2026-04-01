// ════════════════════════════════════════════════════════
// Style 06 — Monochrome
// Black, white, gray — serious financial institution feel
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

const style06Monochrome: DocumentStyle = {
  id: 'style-06',
  name: 'Monochrome',
  category: 'clean',
  description: 'Minimal black-and-white design with a single accent line — serious and authoritative',
  keywords: ['monochrome', 'black', 'white', 'minimal', 'financial', 'corporate', 'ibm-plex'],

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
        color: #333333;
        background: #FFFFFF;
        line-height: 1.65;
        font-size: var(--brand-font-body-size);
      }

      /* ── Header ── */
      .doc-header {
        padding: 40px 64px 32px;
        border-bottom: 1px solid #222222;
        position: relative;
      }
      .doc-header::after {
        content: '';
        position: absolute;
        bottom: -3px;
        left: 64px;
        width: 80px;
        height: 3px;
        background: var(--brand-primary);
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }
      .header-logo img {
        height: 32px;
        filter: grayscale(100%);
      }
      .header-prospect-logo img {
        height: 28px;
        filter: grayscale(100%);
        opacity: 0.7;
      }
      .header-title {
        font-size: var(--brand-font-h1-size);
        font-weight: 700;
        color: #000000;
        letter-spacing: -0.02em;
        margin-bottom: 4px;
      }
      .header-meta {
        font-size: 13px;
        color: #888888;
        font-weight: 400;
      }

      /* ── Section wrapper ── */
      .sections-wrapper {
        max-width: 100%;
      }
      .section {
        padding: 40px 64px;
      }
      .section:nth-child(odd) {
        background: #FFFFFF;
      }
      .section:nth-child(even) {
        background: #F9F9F9;
      }

      /* ── Section headers ── */
      .section h2 {
        font-size: var(--brand-font-h2-size);
        font-weight: 700;
        color: #000000;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #222222;
      }
      .section h3 {
        font-size: var(--brand-font-h3-size);
        font-weight: 700;
        color: #111111;
        margin: 24px 0 8px;
      }
      .section h4 {
        font-size: 14px;
        font-weight: 700;
        color: #222222;
        margin: 18px 0 6px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .section p {
        margin-bottom: 12px;
        color: #333333;
      }
      .section strong {
        font-weight: 600;
        color: #000000;
      }
      .section em {
        font-style: italic;
        color: #555555;
      }
      .section hr {
        border: none;
        height: 1px;
        background: #CCCCCC;
        margin: 24px 0;
      }

      /* ── Lists ── */
      .section ul, .section ol {
        margin: 10px 0 14px 22px;
        padding: 0;
      }
      .section li {
        margin-bottom: 5px;
      }
      .section ul li::marker {
        color: #222222;
      }

      /* ── Tables ── */
      .section table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 13px;
      }
      .section th {
        background: #222222;
        color: #FFFFFF;
        font-weight: 600;
        text-align: left;
        padding: 10px 14px;
        border: 1px solid #222222;
      }
      .section td {
        padding: 9px 14px;
        border: 1px solid #DDDDDD;
        color: #333333;
      }
      .section tr:nth-child(even) td {
        background: #F5F5F5;
      }

      /* ── Blockquotes / callouts ── */
      .section blockquote {
        border-left: 3px solid #222222;
        padding: 14px 18px;
        margin: 18px 0;
        background: #F5F5F5;
        color: #333333;
        font-size: 14px;
      }

      /* ── Footer ── */
      .footer {
        text-align: center;
        padding: 28px 64px;
        font-size: 11px;
        color: #AAAAAA;
        border-top: 1px solid #DDDDDD;
        background: #FFFFFF;
      }
    `;

    const logoHtml = logoBase64
      ? `<div class="header-logo"><img src="${logoBase64}" alt="${companyName}" /></div>`
      : `<div class="header-logo">${brandLogoHtml(input)}</div>`;
    const prospectLogoHtml = prospectLogoBase64
      ? `<div class="header-prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}" /></div>`
      : `<div></div>`;

    const sectionsHtml = sections
      .map((s) => {
        const rendered = formatMarkdown(s.content);
        return `<div class="section"><h2>${s.title}</h2>${rendered}</div>`;
      })
      .join('');

    const body = `
      <div class="doc-header">
        <div class="header-row">
          ${logoHtml}
          ${prospectLogoHtml}
        </div>
        <div class="header-title">${contentType}</div>
        <div class="header-meta">${prospect.companyName}${prospect.industry ? ` · ${prospect.industry}` : ''} · ${dateStr}</div>
      </div>
      <div class="sections-wrapper">
        ${sectionsHtml}
      </div>
      <div class="footer">${companyName} | ${dateStr} | Generated by ContentForg</div>
    `;

    return wrapDocument({ title: `${contentType} — ${prospect.companyName}`, css, body, fonts: brandFonts(brand) });
  },

  thumbnail(accentColor: string): string {
    return `
    <div style="width:1000px;font-family:'IBM Plex Sans',sans-serif;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="padding:24px 32px 20px;border-bottom:1px solid #222;position:relative;">
        <div style="position:absolute;bottom:-2px;left:32px;width:60px;height:3px;background:${accentColor};"></div>
        <div style="font-size:20px;font-weight:700;color:#000;margin-bottom:4px;">Document Title</div>
        <div style="font-size:11px;color:#888;">Company · Industry · Date</div>
      </div>
      <div style="padding:20px 32px;background:#fff;">
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px solid #222;padding-bottom:6px;margin-bottom:10px;">Section One</div>
        <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:95%;"></div>
        <div style="height:8px;background:#E5E5E5;border-radius:4px;margin-bottom:6px;width:80%;"></div>
        <div style="height:8px;background:#E5E5E5;border-radius:4px;width:60%;"></div>
      </div>
      <div style="padding:20px 32px;background:#F9F9F9;">
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px solid #222;padding-bottom:6px;margin-bottom:10px;">Section Two</div>
        <div style="height:8px;background:#DCDCDC;border-radius:4px;margin-bottom:6px;width:90%;"></div>
        <div style="height:8px;background:#DCDCDC;border-radius:4px;width:70%;"></div>
      </div>
    </div>`;
  },
};

export default style06Monochrome;
