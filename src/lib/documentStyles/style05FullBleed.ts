// ════════════════════════════════════════════════════════
// Style 05 — Full Bleed
// Premium annual report / product launch — bold color blocking
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

const style05FullBleed: DocumentStyle = {
  id: 'style-05',
  name: 'Full Bleed',
  category: 'clean',
  description: 'Premium full-bleed color blocking with bold stat bands and architectural edges',
  keywords: ['full-bleed', 'annual-report', 'color-block', 'premium', 'modern', 'architectural'],

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
    const accentDark = darken(accent, 0.25);
    const accentLight = lighten(accent, 0.94);
    const accentMid = lighten(accent, 0.85);
    const textOnAccent = contrastText(accent);
    const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const titleLabel = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Detect stat-like sections for the stat band treatment
    const isStatSection = (title: string) =>
      /metric|stat|number|result|roi|kpi|outcome|impact/i.test(title);

    const css = `
      ${brandCSSVars(brand)}
      ${professionalSymbolCSS(accent)}

      @page {
        size: letter;
        margin: 0;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fb-section { page-break-inside: avoid; }
        .fb-stat-band { page-break-inside: avoid; }
      }

      body {
        font-family: var(--brand-font-primary);
        color: ${brand.text};
        background: #ffffff;
        line-height: 1.7;
        font-size: var(--brand-font-body-size);
        margin: 0;
        padding: 0;
        overflow-wrap: break-word;
        word-wrap: break-word;
      }

      /* ── Full-Bleed Header ── */
      .fb-header {
        width: 100%;
        background: ${accent};
        color: ${textOnAccent};
        padding: 56px 0 52px;
        position: relative;
        overflow: hidden;
      }
      .fb-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: ${accentDark};
      }
      .fb-header-inner {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 48px;
      }
      .fb-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
      }
      .fb-header-logo img {
        height: 38px;
        filter: brightness(0) invert(1);
      }
      .fb-header-logo-text {
        font-weight: 700;
        font-size: 18px;
        color: ${textOnAccent};
        letter-spacing: -0.01em;
      }
      .fb-header-meta {
        text-align: right;
        font-size: 12px;
        opacity: 0.85;
        line-height: 1.6;
      }
      .fb-header-meta .prospect-name {
        font-weight: 700;
        font-size: 14px;
        opacity: 1;
      }
      .fb-prospect-logo img {
        height: 28px;
        filter: brightness(0) invert(1);
        opacity: 0.8;
        margin-bottom: 4px;
      }
      .fb-header-title {
        font-size: calc(var(--brand-font-h1-size) + 4px);
        font-weight: 800;
        line-height: 1.15;
        margin-bottom: 8px;
        letter-spacing: -0.02em;
        color: ${textOnAccent};
      }
      .fb-header-subtitle {
        font-size: 16px;
        font-weight: 400;
        opacity: 0.85;
        color: ${textOnAccent};
      }
      .fb-header-type {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        background: rgba(255,255,255,0.18);
        padding: 4px 14px;
        margin-bottom: 16px;
      }

      /* ── Content Wrapper ── */
      .fb-content {
        width: 100%;
        max-width: 816px;
        margin: 0 auto;
      }

      /* ── Alternating Section Bands ── */
      .fb-band {
        width: 100%;
        padding: 0;
      }
      .fb-band-white { background: #ffffff; }
      .fb-band-gray { background: ${accentLight}; }

      .fb-section {
        max-width: 800px;
        margin: 0 auto;
        padding: 44px 48px;
        page-break-inside: avoid;
      }

      /* Section header */
      .fb-section-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 24px;
        padding-bottom: 14px;
        border-bottom: 3px solid ${accent};
      }
      .fb-section-num {
        font-size: 12px;
        font-weight: 700;
        color: ${accent};
        text-transform: uppercase;
        letter-spacing: 0.1em;
        flex-shrink: 0;
      }
      .fb-section-title {
        font-size: var(--brand-font-h2-size);
        font-weight: 700;
        color: #1a1a1a;
        letter-spacing: -0.01em;
      }

      /* Typography within sections */
      .fb-section h2 { display: none; }
      .fb-section h3 {
        font-size: var(--brand-font-h3-size);
        font-weight: 600;
        color: #222;
        margin: 28px 0 10px;
        padding-left: 14px;
        border-left: 3px solid ${lighten(accent, 0.5)};
      }
      .fb-section h4 {
        font-size: 15px;
        font-weight: 600;
        color: #333;
        margin: 20px 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .fb-section p {
        margin-bottom: 14px;
        color: #3a3a3a;
        line-height: 1.75;
      }
      .fb-section strong { font-weight: 600; color: #1a1a1a; }
      .fb-section em { font-style: italic; color: #555; }
      .fb-section hr {
        border: none;
        height: 1px;
        background: #e0e0e0;
        margin: 28px 0;
      }

      /* Lists */
      .fb-section ul, .fb-section ol {
        margin: 12px 0 18px 0;
        padding: 0 0 0 24px;
      }
      .fb-section li {
        margin-bottom: 8px;
        padding-left: 4px;
        line-height: 1.65;
      }
      .fb-section ul li::marker { color: ${accent}; font-weight: 700; }

      /* ── Stat Band (full-bleed accent) ── */
      .fb-stat-band {
        width: 100%;
        background: ${accent};
        color: ${textOnAccent};
        padding: 0;
      }
      .fb-stat-band-inner {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 48px;
      }
      .fb-stat-band-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        opacity: 0.8;
        margin-bottom: 20px;
        color: ${textOnAccent};
      }
      .fb-stat-grid {
        display: flex;
        gap: 32px;
        flex-wrap: nowrap;
      }
      .fb-stat-item {
        flex: 1;
        min-width: 0;
        text-align: center;
        padding: 20px 16px;
        background: rgba(255,255,255,0.12);
      }
      .fb-stat-value {
        font-size: 36px;
        font-weight: 800;
        line-height: 1.1;
        color: ${textOnAccent};
        margin-bottom: 6px;
      }
      .fb-stat-label {
        font-size: 12px;
        font-weight: 500;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: ${textOnAccent};
      }
      .fb-stat-content {
        color: ${textOnAccent};
        line-height: 1.65;
      }
      .fb-stat-content p { color: ${textOnAccent}; }
      .fb-stat-content strong { color: ${textOnAccent}; font-weight: 700; }
      .fb-stat-content li { color: ${textOnAccent}; }
      .fb-stat-content ul li::marker { color: rgba(255,255,255,0.6); }

      /* ── Tables ── */
      .fb-section table {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
        font-size: 14px;
      }
      .fb-section thead th {
        background: ${accent};
        color: ${textOnAccent};
        font-weight: 600;
        text-align: left;
        padding: 12px 16px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .fb-section td {
        padding: 11px 16px;
        border-bottom: 1px solid #e5e5e5;
        color: #3a3a3a;
      }
      .fb-section tr:nth-child(even) td {
        background: #fafafa;
      }
      .fb-section th:first-child { padding-left: 16px; }

      /* Blockquotes as callouts */
      .fb-section blockquote {
        background: ${accentMid};
        border-left: 4px solid ${accent};
        padding: 18px 24px;
        margin: 24px 0;
        font-size: 15px;
        color: #2d2d2d;
      }

      /* ── Footer ── */
      .fb-footer {
        width: 100%;
        background: #1a1a1a;
        color: #999;
        padding: 0;
      }
      .fb-footer-inner {
        max-width: 800px;
        margin: 0 auto;
        padding: 28px 48px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      .fb-footer-company {
        font-weight: 600;
        color: #ccc;
      }
      .fb-footer-page {
        font-size: 10px;
        color: #777;
      }
    `;

    // Build logo HTML
    const logoHtml = logoBase64
      ? `<div class="fb-header-logo"><img src="${logoBase64}" alt="${companyName}" /></div>`
      : `<div class="fb-header-logo-text">${companyName}</div>`;

    const prospectMeta = `
      <div class="fb-header-meta">
        ${prospectLogoBase64 ? `<div class="fb-prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}" /></div>` : ''}
        <div class="prospect-name">${prospect.companyName}</div>
        <div>${prospect.industry ? prospect.industry + ' &middot; ' : ''}${dateStr}</div>
      </div>
    `;

    // Build sections with alternating bands and stat detection
    const filteredSections = sections.filter(s => s.content && s.content.trim().length > 0);
    let sectionIndex = 0;
    const sectionsHtml = filteredSections.map((s, i) => {
      const title = stripEmojis(s.title);
      const content = stripEmojis(s.content);
      const num = String(i + 1).padStart(2, '0');

      if (isStatSection(title)) {
        // Parse simple stat lines from content
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

        const statsGrid = statItems.length > 0 ? `
          <div class="fb-stat-grid">
            ${statItems.map(st => `
              <div class="fb-stat-item">
                <div class="fb-stat-value">${st.value}</div>
                <div class="fb-stat-label">${st.label}</div>
              </div>
            `).join('')}
          </div>
        ` : '';

        const otherContent = otherLines.length > 0
          ? `<div class="fb-stat-content">${formatMarkdown(otherLines.join('\n'))}</div>`
          : '';

        return `
          <div class="fb-stat-band">
            <div class="fb-stat-band-inner">
              <div class="fb-stat-band-title">${num} &mdash; ${title}</div>
              ${statsGrid}
              ${otherContent}
            </div>
          </div>
        `;
      }

      // Normal section with alternating bands
      const bandClass = sectionIndex % 2 === 0 ? 'fb-band-white' : 'fb-band-gray';
      sectionIndex++;
      const rendered = formatMarkdown(content);
      return `
        <div class="fb-band ${bandClass}">
          <div class="fb-section">
            <div class="fb-section-header">
              <span class="fb-section-num">${num}</span>
              <span class="fb-section-title">${title}</span>
            </div>
            ${rendered}
          </div>
        </div>
      `;
    }).join('');

    const body = `
      <div class="fb-header">
        <div class="fb-header-inner">
          <div class="fb-header-top">
            ${logoHtml}
            ${prospectMeta}
          </div>
          <div class="fb-header-type">${titleLabel}</div>
          <div class="fb-header-title">${titleLabel} for ${prospect.companyName}</div>
          <div class="fb-header-subtitle">Prepared by ${companyName}${prospect.industry ? ' &middot; ' + prospect.industry : ''}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
        </div>
      </div>

      ${sectionsHtml}

      <div class="fb-footer">
        <div class="fb-footer-inner">
          <div>
            <span class="fb-footer-company">${companyName}</span>
            ${companyDescription ? ' &middot; ' + companyDescription : ''}
          </div>
          <div>${dateStr}</div>
          <div class="fb-footer-page">Page 1</div>
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
    const darker = darken(accentColor, 0.25);
    const lighter = lighten(accentColor, 0.94);
    const textOn = contrastText(accentColor);
    return `
    <div style="width:1000px;font-family:'Inter',sans-serif;background:#fff;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="background:${accentColor};padding:28px 32px;color:${textOn};">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;margin-bottom:12px;">Proposal</div>
        <div style="font-size:22px;font-weight:800;margin-bottom:4px;">Document Title</div>
        <div style="font-size:12px;opacity:0.8;">Prepared by Company</div>
      </div>
      <div style="padding:20px 32px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:3px solid ${accentColor};">
          <span style="font-size:10px;font-weight:700;color:${accentColor};">01</span>
          <span style="font-size:15px;font-weight:700;color:#1a1a1a;">Section Title</span>
        </div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:8px;width:90%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;margin-bottom:8px;width:75%;"></div>
        <div style="height:8px;background:#E8E8E8;border-radius:4px;width:55%;"></div>
      </div>
      <div style="background:${accentColor};padding:16px 32px;display:flex;gap:16px;">
        <div style="flex:1;background:rgba(255,255,255,0.12);padding:12px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:${textOn};">42%</div>
          <div style="font-size:9px;color:${textOn};opacity:0.7;text-transform:uppercase;">Metric</div>
        </div>
        <div style="flex:1;background:rgba(255,255,255,0.12);padding:12px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:${textOn};">3.2x</div>
          <div style="font-size:9px;color:${textOn};opacity:0.7;text-transform:uppercase;">ROI</div>
        </div>
        <div style="flex:1;background:rgba(255,255,255,0.12);padding:12px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:${textOn};">98%</div>
          <div style="font-size:9px;color:${textOn};opacity:0.7;text-transform:uppercase;">Score</div>
        </div>
      </div>
      <div style="background:${lighter};padding:20px 32px;">
        <div style="height:8px;background:#ddd;border-radius:4px;margin-bottom:8px;width:85%;"></div>
        <div style="height:8px;background:#ddd;border-radius:4px;width:60%;"></div>
      </div>
    </div>`;
  },
};

export default style05FullBleed;
