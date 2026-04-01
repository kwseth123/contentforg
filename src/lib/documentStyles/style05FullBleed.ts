// ════════════════════════════════════════════════════════
// Style 05 — Full Bleed Image
// Cinematic hero gradient, refined single-column layout
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

const style05FullBleed: DocumentStyle = {
  id: 'style-05',
  name: 'Full Bleed',
  category: 'clean',
  description: 'Cinematic hero gradient with refined typography and stat callout boxes',
  keywords: ['hero', 'cinematic', 'full-bleed', 'gradient', 'modern', 'poppins'],

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

    const darker = darken(brand.primary, 0.35);
    const lighter = lighten(brand.primary, 0.92);
    const borderAccent = lighten(brand.primary, 0.6);
    const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const css = `
      ${brandCSSVars(brand)}

      body {
        font-family: var(--brand-font-primary);
        color: #2D2D2D;
        background: #FFFFFF;
        line-height: 1.7;
        font-size: var(--brand-font-body-size);
      }

      /* ── Hero ── */
      .hero {
        position: relative;
        width: 100%;
        min-height: 40vh;
        background: linear-gradient(135deg, var(--brand-primary) 0%, ${darker} 100%);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 48px 64px;
        overflow: hidden;
      }
      .hero::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%);
        pointer-events: none;
      }
      .hero-logo {
        position: absolute;
        top: 32px;
        left: 64px;
        z-index: 2;
      }
      .hero-logo img {
        height: 40px;
        filter: brightness(0) invert(1);
      }
      .hero-prospect-logo {
        position: absolute;
        top: 32px;
        right: 64px;
        z-index: 2;
      }
      .hero-prospect-logo img {
        height: 36px;
        filter: brightness(0) invert(1);
        opacity: 0.85;
      }
      .hero-title {
        position: relative;
        z-index: 2;
        font-size: var(--brand-font-h1-size);
        font-weight: 700;
        color: #FFFFFF;
        text-shadow: 0 2px 12px rgba(0,0,0,0.3);
        margin-bottom: 8px;
        max-width: 700px;
      }
      .hero-subtitle {
        position: relative;
        z-index: 2;
        font-size: 16px;
        font-weight: 400;
        color: rgba(255,255,255,0.85);
        max-width: 600px;
      }

      /* ── Content ── */
      .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        padding: 56px 64px 40px;
      }

      /* ── Sections ── */
      .section {
        margin-bottom: 48px;
      }
      .section h2 {
        font-size: var(--brand-font-h2-size);
        font-weight: 600;
        color: #1A1A1A;
        margin-bottom: 6px;
        padding-bottom: 10px;
        border-bottom: 3px solid var(--brand-primary);
        display: inline-block;
      }
      .section h3 {
        font-size: var(--brand-font-h3-size);
        font-weight: 600;
        color: #333;
        margin: 20px 0 8px;
      }
      .section h4 {
        font-size: 15px;
        font-weight: 600;
        color: #444;
        margin: 16px 0 6px;
      }
      .section p {
        margin-bottom: 12px;
        color: #3A3A3A;
      }
      .section strong {
        font-weight: 600;
        color: #1A1A1A;
      }
      .section em {
        font-style: italic;
        color: #555;
      }
      .section hr {
        border: none;
        height: 1px;
        background: #E0E0E0;
        margin: 28px 0;
      }

      /* ── Lists ── */
      .section ul, .section ol {
        margin: 12px 0 16px 24px;
        padding: 0;
      }
      .section li {
        margin-bottom: 6px;
        padding-left: 4px;
      }
      .section ul li::marker {
        color: var(--brand-primary);
      }

      /* ── Stat callout boxes ── */
      .section blockquote,
      .section .callout {
        background: ${lighter};
        border-left: 4px solid var(--brand-primary);
        padding: 16px 20px;
        margin: 20px 0;
        border-radius: 0 6px 6px 0;
        font-size: 15px;
        color: #2D2D2D;
      }

      /* ── Tables ── */
      .section table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 14px;
      }
      .section th {
        background: var(--brand-primary);
        color: ${contrastText(brand.primary)};
        font-weight: 600;
        text-align: left;
        padding: 10px 14px;
      }
      .section td {
        padding: 10px 14px;
        border-bottom: 1px solid #E8E8E8;
        color: #3A3A3A;
      }
      .section tr:nth-child(even) td {
        background: #FAFAFA;
      }

      /* ── Footer ── */
      .footer {
        text-align: center;
        padding: 32px 64px;
        font-size: 12px;
        color: #999;
        border-top: 1px solid #ECECEC;
      }
    `;

    const logoHtml = logoBase64
      ? `<div class="hero-logo"><img src="${logoBase64}" alt="${companyName}" /></div>`
      : `<div class="hero-logo">${brandLogoHtml(input)}</div>`;
    const prospectLogoHtml = prospectLogoBase64
      ? `<div class="hero-prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}" /></div>`
      : '';

    const sectionsHtml = sections
      .map((s) => {
        const rendered = formatMarkdown(s.content);
        return `<div class="section"><h2>${s.title}</h2>${rendered}</div>`;
      })
      .join('');

    const body = `
      <div class="hero">
        ${logoHtml}
        ${prospectLogoHtml}
        <div class="hero-title">${contentType} for ${prospect.companyName}</div>
        <div class="hero-subtitle">Prepared by ${companyName}${prospect.industry ? ` · ${prospect.industry}` : ''}</div>
      </div>
      <div class="content-wrapper">
        ${sectionsHtml}
      </div>
      <div class="footer">${companyName} | ${dateStr} | Generated by ContentForg</div>
    `;

    return wrapDocument({ title: `${contentType} — ${prospect.companyName}`, css, body, fonts: brandFonts(brand) });
  },

  thumbnail(accentColor: string): string {
    const darker = darken(accentColor, 0.35);
    return `
    <div style="width:1000px;font-family:'Poppins',sans-serif;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="height:180px;background:linear-gradient(135deg,${accentColor} 0%,${darker} 100%);position:relative;display:flex;align-items:flex-end;padding:24px 32px;">
        <div style="color:#fff;font-size:22px;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,0.3);">Document Title</div>
      </div>
      <div style="padding:24px 32px;">
        <div style="width:120px;height:3px;background:${accentColor};margin-bottom:10px;border-radius:2px;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:8px;width:90%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:8px;width:75%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:16px;width:60%;"></div>
        <div style="background:${lighten(accentColor, 0.92)};border-left:4px solid ${accentColor};padding:12px 16px;border-radius:0 4px 4px 0;margin-bottom:16px;">
          <div style="height:8px;background:#D0D0D0;border-radius:4px;width:70%;"></div>
        </div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:8px;width:85%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;width:50%;"></div>
      </div>
    </div>`;
  },
};

export default style05FullBleed;
