// ════════════════════════════════════════════════════════
// Style 07 — Asymmetric
// Creative agency pitch — off-center layouts, bold numbers
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

const style07Asymmetric: DocumentStyle = {
  id: 'style-07',
  name: 'Asymmetric',
  category: 'creative',
  description: 'Off-center creative layouts with bold section numbers and diagonal accents',
  keywords: ['asymmetric', 'creative', 'agency', 'pitch', 'diagonal', 'space-grotesk'],

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
    const accentLight = lighten(brand.primary, 0.88);
    const accentMid = lighten(brand.primary, 0.4);

    const css = `
      ${brandCSSVars(brand)}

      body {
        font-family: var(--brand-font-primary);
        color: #2A2A2A;
        background: #FFFFFF;
        line-height: 1.7;
        font-size: var(--brand-font-body-size);
      }

      /* ── Header ── */
      .doc-header {
        padding: 48px 40px 40px 100px;
        position: relative;
        overflow: hidden;
      }
      .doc-header::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 40%;
        height: 100%;
        background: ${accentLight};
        clip-path: polygon(15% 0, 100% 0, 100% 100%, 0% 100%);
      }
      .header-logos {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
        position: relative;
        z-index: 1;
      }
      .header-logos img {
        height: 32px;
      }
      .header-title {
        font-size: var(--brand-font-h1-size);
        font-weight: 700;
        color: #111111;
        position: relative;
        z-index: 1;
        margin-bottom: 6px;
        margin-left: -12px;
      }
      .header-meta {
        font-size: 14px;
        color: #777777;
        position: relative;
        z-index: 1;
      }

      /* ── Sections ── */
      .section {
        position: relative;
        padding: 48px 40px 48px 100px;
        min-height: 80px;
      }
      .section-number {
        position: absolute;
        top: 42px;
        left: 20px;
        font-size: 64px;
        font-weight: 700;
        color: #E8E8E8;
        line-height: 1;
        user-select: none;
      }
      .section-divider {
        position: relative;
        height: 2px;
        margin: 0 40px 0 100px;
        overflow: hidden;
      }
      .section-divider::before {
        content: '';
        position: absolute;
        inset: 0;
        background: #EEEEEE;
        clip-path: polygon(0 0, 97% 0, 100% 100%, 3% 100%);
      }

      /* ── Section content ── */
      .section h2 {
        font-size: var(--brand-font-h2-size);
        font-weight: 700;
        color: #111111;
        margin-bottom: 16px;
        margin-left: -12px;
      }
      .section h3 {
        font-size: var(--brand-font-h3-size);
        font-weight: 600;
        color: #222222;
        margin: 24px 0 8px;
      }
      .section h4 {
        font-size: 15px;
        font-weight: 600;
        color: #333333;
        margin: 18px 0 6px;
      }
      .section p {
        margin-bottom: 12px;
        color: #3A3A3A;
      }
      .section strong {
        font-weight: 600;
        color: #111111;
      }
      .section em {
        font-style: italic;
        color: #666666;
      }
      .section hr {
        border: none;
        height: 1px;
        background: #E0E0E0;
        margin: 24px 0;
      }

      /* ── Lists ── */
      .section ul, .section ol {
        margin: 10px 0 16px 22px;
        padding: 0;
      }
      .section li {
        margin-bottom: 6px;
      }
      .section ul li::marker {
        color: var(--brand-primary);
        font-weight: 700;
      }

      /* ── Pull stat boxes ── */
      .section blockquote {
        background: transparent;
        border: none;
        border-right: 4px solid var(--brand-primary);
        margin: 24px 0 24px auto;
        padding: 14px 20px;
        max-width: 320px;
        text-align: right;
        color: var(--brand-primary);
        font-size: 17px;
        font-weight: 600;
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
        padding: 9px 14px;
        border-bottom: 1px solid #EEEEEE;
        color: #3A3A3A;
      }
      .section tr:nth-child(even) td {
        background: #FAFAFA;
      }

      /* ── Footer ── */
      .footer {
        text-align: center;
        padding: 28px 40px;
        font-size: 12px;
        color: #AAAAAA;
        border-top: 1px solid #EEEEEE;
        margin-left: 60px;
      }
    `;

    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" alt="${companyName}" />`
      : brandLogoHtml(input);
    const prospectLogoHtml = prospectLogoBase64
      ? `<img src="${prospectLogoBase64}" alt="${prospect.companyName}" />`
      : '';

    const sectionsHtml = sections
      .map((s, i) => {
        const num = String(i + 1).padStart(2, '0');
        const rendered = formatMarkdown(s.content);
        const divider = i < sections.length - 1 ? '<div class="section-divider"></div>' : '';
        return `
          <div class="section">
            <div class="section-number">${num}</div>
            <h2>${s.title}</h2>
            ${rendered}
          </div>
          ${divider}`;
      })
      .join('');

    const body = `
      <div class="doc-header">
        <div class="header-logos">
          ${logoHtml}
          ${prospectLogoHtml}
        </div>
        <div class="header-title">${contentType}</div>
        <div class="header-meta">${prospect.companyName}${prospect.industry ? ` · ${prospect.industry}` : ''} · ${dateStr}</div>
      </div>
      <div class="section-divider"></div>
      ${sectionsHtml}
      <div class="footer">${companyName} | ${dateStr} | Generated by ContentForg</div>
    `;

    return wrapDocument({ title: `${contentType} — ${prospect.companyName}`, css, body, fonts: brandFonts(brand) });
  },

  thumbnail(accentColor: string): string {
    const accentLight = lighten(accentColor, 0.88);
    return `
    <div style="width:1000px;font-family:'Space Grotesk',sans-serif;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);position:relative;">
      <div style="position:absolute;top:0;right:0;width:35%;height:100%;background:${accentLight};clip-path:polygon(20% 0,100% 0,100% 100%,0% 100%);"></div>
      <div style="padding:24px 32px 20px 60px;position:relative;z-index:1;">
        <div style="font-size:22px;font-weight:700;color:#111;margin-left:-10px;">Document Title</div>
        <div style="font-size:11px;color:#888;">Company · Date</div>
      </div>
      <div style="height:1px;background:#EEE;margin:0 32px 0 60px;"></div>
      <div style="padding:20px 32px 12px 60px;position:relative;">
        <div style="position:absolute;left:12px;top:16px;font-size:36px;font-weight:700;color:#E8E8E8;">01</div>
        <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:8px;margin-left:-8px;">Section Title</div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:6px;width:85%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:6px;width:70%;"></div>
        <div style="margin-left:auto;width:180px;border-right:3px solid ${accentColor};padding:8px 12px;text-align:right;">
          <div style="height:8px;background:#D0D0D0;border-radius:4px;width:80%;margin-left:auto;"></div>
        </div>
      </div>
      <div style="height:1px;background:#EEE;margin:0 32px 0 60px;"></div>
      <div style="padding:16px 32px 20px 60px;position:relative;">
        <div style="position:absolute;left:12px;top:12px;font-size:36px;font-weight:700;color:#E8E8E8;">02</div>
        <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:8px;margin-left:-8px;">Section Title</div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:6px;width:90%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;width:55%;"></div>
      </div>
    </div>`;
  },
};

export default style07Asymmetric;
