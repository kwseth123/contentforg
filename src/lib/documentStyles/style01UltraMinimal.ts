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

// ── Stat extraction ─────────────────────────────────────────

function extractStats(sections: StyleInput['sections']): { value: string; label: string }[] {
  const allContent = sections.map(s => s.content).join('\n');
  const stats: { value: string; label: string }[] = [];

  // Percentages like "45%" or "300%"
  const pctMatches = allContent.match(/(\d{1,4}(?:\.\d+)?%)/g);
  if (pctMatches) {
    for (const m of pctMatches.slice(0, 2)) {
      const idx = allContent.indexOf(m);
      const surrounding = allContent.substring(Math.max(0, idx - 40), idx + m.length + 40);
      const words = surrounding.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
      stats.push({ value: m, label: words.join(' ') || 'improvement' });
    }
  }

  // Dollar amounts like "$1.2M" or "$500K"
  const dollarMatches = allContent.match(/\$[\d,.]+[KkMmBb]?/g);
  if (dollarMatches) {
    for (const m of dollarMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'value' });
    }
  }

  // Multipliers like "3x" or "10x"
  const multMatches = allContent.match(/(\d+(?:\.\d+)?)[xX]\b/g);
  if (multMatches) {
    for (const m of multMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'multiplier' });
    }
  }

  return stats.slice(0, 3);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager support
  if (input.contentType === 'solution-one-pager') {
    return buildOnePagerDocument(input, brand);
  }

  const { sections, contentType, prospect, companyName, logoBase64, prospectLogoBase64, date } = input;
  const cleanSections = sections.map(s => ({
    ...s,
    title: stripEmojis(s.title),
    content: stripEmojis(s.content),
  }));
  const stats = extractStats(cleanSections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accent = brand.accent || brand.primary;
  const totalPages = Math.max(1, Math.ceil(cleanSections.length / 3));

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0;
    }

    ${professionalSymbolCSS(accent)}

    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #333;
      background: #fff;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .page {
      max-width: 8.5in;
      min-height: 11in;
      margin: 0 auto;
      padding: 80px 72px 60px;
      position: relative;
    }

    /* ── Header ── */
    .doc-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .doc-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .doc-header-left img {
      height: 32px;
      width: auto;
      object-fit: contain;
    }
    .doc-header-left .company-wordmark {
      font-size: 15px;
      font-weight: 700;
      color: #111;
      letter-spacing: -0.01em;
    }
    .doc-header-right {
      text-align: right;
      font-size: 11px;
      color: #999;
      letter-spacing: 0.02em;
    }
    .doc-header-right .doc-type {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #bbb;
      margin-bottom: 2px;
    }
    .doc-header-right .doc-date {
      color: #ccc;
    }
    .header-rule {
      height: 1px;
      background: ${accent};
      margin-bottom: 64px;
      opacity: 0.4;
    }

    /* ── Title block ── */
    .title-block {
      margin-bottom: 64px;
    }
    .title-block .meta-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 16px;
    }
    .title-block h1 {
      font-size: 36px;
      font-weight: 700;
      color: #111;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .title-block .prospect-detail {
      font-size: 13px;
      color: #999;
      font-weight: 400;
    }

    /* ── Stats row ── */
    .stats-row {
      display: flex;
      gap: 64px;
      margin-bottom: 56px;
      padding-bottom: 48px;
    }
    .stat-item {
      text-align: left;
    }
    .stat-item .stat-value {
      font-size: 42px;
      font-weight: 700;
      color: #111;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .stat-item .stat-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #bbb;
      margin-top: 8px;
    }

    /* ── Sections ── */
    .section {
      margin-bottom: 56px;
    }
    .section-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 20px;
    }
    .section-content {
      max-width: 620px;
    }
    .section-content p {
      margin-bottom: 20px;
      color: #333;
      line-height: 1.8;
    }
    .section-content h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111;
      margin: 40px 0 16px;
      line-height: 1.25;
    }
    .section-content h2 {
      font-size: 22px;
      font-weight: 600;
      color: #111;
      margin: 36px 0 14px;
      line-height: 1.3;
    }
    .section-content h3 {
      font-size: 17px;
      font-weight: 600;
      color: #222;
      margin: 28px 0 12px;
    }
    .section-content h4 {
      font-size: 14px;
      font-weight: 600;
      color: #444;
      margin: 24px 0 8px;
    }
    .section-content strong {
      font-weight: 600;
      color: #111;
    }
    .section-content em {
      font-style: italic;
    }
    .section-content ul, .section-content ol {
      padding-left: 0;
      margin: 16px 0;
      list-style: none;
    }
    .section-content li {
      position: relative;
      padding-left: 18px;
      margin-bottom: 10px;
      line-height: 1.7;
      color: #333;
    }
    .section-content li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${accent};
      opacity: 0.5;
    }
    .section-content ol li {
      counter-increment: item;
    }
    .section-content ol {
      counter-reset: item;
    }
    .section-content ol li::before {
      content: counter(item) '.';
      background: none;
      width: auto;
      height: auto;
      border-radius: 0;
      font-size: 12px;
      font-weight: 600;
      color: #bbb;
      top: 0;
    }
    .section-content hr {
      border: none;
      margin: 48px 0;
    }

    /* ── Tables ── */
    .section-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 13px;
    }
    .section-content thead th {
      text-align: left;
      padding: 12px 16px;
      font-weight: 600;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #999;
      border-bottom: 2px solid #eee;
      background: transparent;
    }
    .section-content tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #f5f5f5;
      color: #444;
    }
    .section-content tbody tr:nth-child(even) td {
      background: #fafafa;
    }

    /* ── Footer ── */
    .doc-footer {
      margin-top: auto;
      padding-top: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #ccc;
      letter-spacing: 0.02em;
      position: relative;
    }
    .doc-footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: #f0f0f0;
    }
    .doc-footer .footer-company {
      font-weight: 500;
      color: #bbb;
    }

    /* ── Print ── */
    @media print {
      .page {
        padding: 60px 72px 48px;
      }
      .doc-footer {
        position: fixed;
        bottom: 40px;
        left: 72px;
        right: 72px;
      }
    }
  `;

  // Build logo area
  let logoHtml = '';
  if (logoBase64) {
    logoHtml = `<img src="${logoBase64}" alt="${companyName}"/>`;
  } else {
    logoHtml = `<span class="company-wordmark">${companyName}</span>`;
  }

  const body = `
    <div class="page">
      <!-- Header -->
      <div class="doc-header">
        <div class="doc-header-left">
          ${logoHtml}
        </div>
        <div class="doc-header-right">
          <div class="doc-type">${stripEmojis(contentType)}</div>
          <div class="doc-date">${dateStr}</div>
        </div>
      </div>
      <div class="header-rule"></div>

      <!-- Title -->
      <div class="title-block">
        <div class="meta-label">Prepared for ${prospect.companyName}</div>
        <h1>${stripEmojis(contentType)} for ${prospect.companyName}</h1>
        ${prospect.industry ? `<div class="prospect-detail">${prospect.industry}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>` : ''}
      </div>

      <!-- Stats -->
      ${stats.length > 0 ? `
      <div class="stats-row">
        ${stats.map(s => `
        <div class="stat-item">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('')}
      </div>` : ''}

      <!-- Sections -->
      ${cleanSections.map(s => `
      <div class="section">
        <div class="section-label">${s.title}</div>
        <div class="section-content">${formatMarkdown(s.content)}</div>
      </div>`).join('')}

      <!-- Footer -->
      <div class="doc-footer">
        <span class="footer-company">${companyName}</span>
        <span>${dateStr}</span>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${contentType} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Inter'],
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:1000px;height:1294px;background:#fff;font-family:'Inter',sans-serif;padding:80px 72px;box-sizing:border-box;display:flex;flex-direction:column;">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
    <div style="width:44px;height:9px;background:#ddd;border-radius:2px;"></div>
    <div style="text-align:right;">
      <div style="font-size:8px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#ccc;margin-bottom:2px;">Case Study</div>
      <div style="font-size:8px;color:#ddd;">April 2026</div>
    </div>
  </div>
  <div style="height:1px;background:${accentColor};opacity:0.4;margin-bottom:56px;"></div>

  <!-- Title -->
  <div style="margin-bottom:56px;">
    <div style="font-size:8px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-bottom:14px;">Prepared for Acme Corp</div>
    <div style="font-size:32px;font-weight:700;color:#111;line-height:1.2;letter-spacing:-0.02em;margin-bottom:10px;">Document Title Here</div>
    <div style="font-size:11px;color:#999;">Technology &middot; Enterprise</div>
  </div>

  <!-- Stats -->
  <div style="display:flex;gap:52px;margin-bottom:48px;padding-bottom:40px;">
    <div>
      <div style="font-size:38px;font-weight:700;color:#111;line-height:1;letter-spacing:-0.02em;">47%</div>
      <div style="font-size:8px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#bbb;margin-top:6px;">Growth</div>
    </div>
    <div>
      <div style="font-size:38px;font-weight:700;color:#111;line-height:1;letter-spacing:-0.02em;">$2.4M</div>
      <div style="font-size:8px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#bbb;margin-top:6px;">Revenue</div>
    </div>
    <div>
      <div style="font-size:38px;font-weight:700;color:#111;line-height:1;letter-spacing:-0.02em;">3x</div>
      <div style="font-size:8px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#bbb;margin-top:6px;">ROI</div>
    </div>
  </div>

  <!-- Section 1 -->
  <div style="margin-bottom:48px;">
    <div style="font-size:8px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-bottom:16px;">Overview</div>
    <div style="max-width:540px;">
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:100%;margin-bottom:8px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:92%;margin-bottom:8px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:85%;margin-bottom:8px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:96%;margin-bottom:8px;"></div>
    </div>
  </div>

  <!-- Section 2 -->
  <div style="margin-bottom:48px;">
    <div style="font-size:8px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-bottom:16px;">Details</div>
    <div style="max-width:540px;">
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:100%;margin-bottom:8px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:88%;margin-bottom:8px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:94%;margin-bottom:8px;"></div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;display:flex;justify-content:space-between;font-size:8px;color:#ddd;padding-top:20px;border-top:1px solid #f0f0f0;">
    <span>Company Name</span>
    <span>April 2026</span>
  </div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style01UltraMinimal: DocumentStyle = {
  id: 'style-01',
  name: 'Ultra Minimal',
  category: 'clean',
  description: 'Pure white canvas with maximum breathing room and typographic precision',
  keywords: ['minimal', 'clean', 'white', 'simple', 'modern', 'elegant', 'whitespace'],
  render,
  thumbnail,
};

export default style01UltraMinimal;
