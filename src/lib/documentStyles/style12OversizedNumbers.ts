import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, lighten, darken, contrastText, hexToRgb, buildOnePagerDocument, professionalSymbolCSS, stripEmojis } from './shared';

// ── Number extraction ───────────────────────────────────────

function extractNumbers(sections: StyleInput['sections']): { value: string; label: string }[] {
  const allContent = sections.map(s => s.content).join('\n');
  const results: { value: string; label: string }[] = [];

  // Percentages
  const pctMatches = allContent.match(/(\d{1,4}(?:\.\d+)?%)/g);
  if (pctMatches) {
    for (const m of pctMatches.slice(0, 3)) {
      const idx = allContent.indexOf(m);
      const surrounding = allContent.substring(Math.max(0, idx - 40), idx + m.length + 40);
      const words = surrounding.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
      results.push({ value: m, label: words.join(' ') || 'improvement' });
    }
  }
  // Dollar amounts
  const dollars = allContent.match(/\$[\d,.]+[KkMmBb]?/g);
  if (dollars) {
    for (const m of dollars.slice(0, 2)) {
      results.push({ value: m, label: 'value' });
    }
  }
  // Multipliers
  const mults = allContent.match(/(\d+(?:\.\d+)?)[xX]\b/g);
  if (mults) {
    for (const m of mults.slice(0, 2)) {
      results.push({ value: m, label: 'multiplier' });
    }
  }
  // Plain large numbers
  const plains = allContent.match(/\b\d{4,}\b/g);
  if (plains) {
    for (const m of plains.slice(0, 1)) {
      results.push({ value: m, label: 'total' });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.value)) return false;
    seen.add(r.value);
    return true;
  }).slice(0, 6);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager support
  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const accent = brand.accent || brand.primary;
  const { r, g, b } = hexToRgb(accent);
  const lightAccent = lighten(accent, 0.92);
  const textOnAccent = contrastText(accent);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const contentTypeLabel = stripEmojis(contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

  const allNumbers = extractNumbers(sections);
  const heroNumbers = allNumbers.slice(0, 4);
  const remainingNumbers = allNumbers.slice(4);

  // Hero number grid
  const heroGridHtml = heroNumbers.length > 0 ? `
    <div class="hero-numbers-grid">
      ${heroNumbers.map(n => `
        <div class="hero-number-card">
          <div class="hero-number-value">${n.value}</div>
          <div class="hero-number-label">${n.label}</div>
        </div>
      `).join('')}
    </div>` : '';

  // Sections with watermark numbers
  const validSections = sections.filter(s => s.content && s.content.trim().length > 0);
  const sectionsHtml = validSections.map((s, i) => {
    const cleanTitle = stripEmojis(s.title);
    const cleanContent = stripEmojis(s.content);
    const watermark = allNumbers[i % allNumbers.length];

    return `
    <div class="section">
      ${watermark ? `<div class="section-watermark">${watermark.value}</div>` : ''}
      <div class="section-inner">
        <h2 class="section-title">${cleanTitle}</h2>
        <div class="section-content">${formatMarkdown(cleanContent)}</div>
      </div>
    </div>`;
  }).join('');

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0.6in 0.7in;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; max-width: none; }
      .section { break-inside: avoid; }
    }

    ${professionalSymbolCSS(accent)}

    body {
      font-family: var(--brand-font-secondary), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #333;
      background: #ffffff;
      line-height: 1.7;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    .page {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Header ─────────────────────────────────── */
    .header {
      padding: 40px 52px 36px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${accent};
    }
    .header-left {
      flex-shrink: 0;
    }
    .header-logo {
      margin-bottom: 8px;
    }
    .header-company {
      font-size: 11px;
      color: #999;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .header-right {
      text-align: right;
    }
    .header-doc-number {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: 48px;
      font-weight: 800;
      color: ${accent};
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .header-doc-label {
      font-size: 10px;
      color: #999;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .header-date {
      font-size: 13px;
      color: #888;
      margin-top: 8px;
    }

    /* ── Title Block ────────────────────────────── */
    .title-block {
      padding: 36px 52px 28px;
    }
    .title-doc-type {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 10px;
    }
    .title-main {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      color: #111;
      line-height: 1.2;
      margin-bottom: 10px;
    }
    .title-subtitle {
      font-size: 15px;
      color: #777;
    }

    /* ── Hero Numbers Grid ──────────────────────── */
    .hero-numbers-grid {
      display: grid;
      grid-template-columns: repeat(${Math.min(heroNumbers.length, 4)}, 1fr);
      gap: 0;
      margin: 0;
    }
    .hero-number-card {
      background: ${accent};
      padding: 36px 24px;
      text-align: center;
      position: relative;
    }
    .hero-number-card:nth-child(even) {
      background: ${darken(accent, 0.1)};
    }
    .hero-number-value {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: 56px;
      font-weight: 800;
      color: ${textOnAccent};
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .hero-number-label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${textOnAccent};
      opacity: 0.8;
      margin-top: 10px;
      font-weight: 500;
    }

    /* ── Content Area ───────────────────────────── */
    .content-area {
      padding: 40px 52px 20px;
    }

    /* ── Sections ───────────────────────────────── */
    .section {
      position: relative;
      overflow: hidden;
      margin-bottom: 44px;
      padding-bottom: 44px;
      border-bottom: 1px solid #eee;
      min-height: 100px;
      page-break-inside: avoid;
    }
    .section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }
    .section-watermark {
      position: absolute;
      top: -20px;
      right: -10px;
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: 120px;
      font-weight: 800;
      color: rgba(${r},${g},${b},0.06);
      line-height: 1;
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
      user-select: none;
      letter-spacing: -0.03em;
    }
    .section-inner {
      position: relative;
      z-index: 1;
    }
    .section-title {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
      color: #111;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid ${accent};
      display: inline-block;
    }

    /* ── Section content typography ─────────────── */
    .section-content {
      color: #444;
    }
    .section-content p {
      margin-bottom: 14px;
      line-height: 1.75;
    }
    .section-content h1, .section-content h2 {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      color: #111;
      margin: 28px 0 12px;
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
    }
    .section-content h3 {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      color: #333;
      margin: 22px 0 10px;
      font-size: var(--brand-font-h3-size);
      font-weight: 600;
    }
    .section-content h4 {
      color: #555;
      margin: 18px 0 8px;
      font-size: 15px;
      font-weight: 600;
    }
    .section-content strong {
      font-weight: 700;
      color: #111;
    }
    .section-content em {
      font-style: italic;
      color: #666;
    }
    .section-content ul, .section-content ol {
      padding-left: 24px;
      margin: 14px 0;
    }
    .section-content li {
      margin-bottom: 8px;
      line-height: 1.65;
    }
    .section-content li::marker {
      color: ${accent};
    }
    .section-content hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 24px 0;
    }

    /* ── Inline number highlights ───────────────── */
    .section-content strong {
      font-weight: 700;
      color: #111;
    }

    /* ── Tables ─────────────────────────────────── */
    .section-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      border-radius: 6px;
      overflow: hidden;
    }
    .section-content thead tr {
      background: ${accent};
    }
    .section-content th {
      text-align: left;
      padding: 12px 16px;
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${textOnAccent};
      border: none;
    }
    .section-content tbody tr:nth-child(odd) {
      background: #ffffff;
    }
    .section-content tbody tr:nth-child(even) {
      background: ${lightAccent};
    }
    .section-content td {
      padding: 11px 16px;
      color: #444;
      border: none;
      border-bottom: 1px solid #eee;
    }
    .section-content tbody tr:last-child td {
      border-bottom: none;
    }

    /* ── Inline Stat Boxes (for content with numbers) */
    .inline-stat-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .inline-stat-box {
      background: ${lightAccent};
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .inline-stat-box .number {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: 36px;
      font-weight: 800;
      color: ${accent};
      line-height: 1;
    }
    .inline-stat-box .desc {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 8px;
    }

    /* ── Visual Break ──────────────────────────── */
    .visual-break {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 8px 52px 0;
    }
    .visual-break-line {
      flex: 1;
      height: 2px;
      background: ${accent};
      opacity: 0.15;
    }
    .visual-break-number {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: ${accent};
      opacity: 0.3;
    }

    /* ── Footer ─────────────────────────────────── */
    .footer {
      padding: 24px 52px;
      border-top: 3px solid ${accent};
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #aaa;
      letter-spacing: 0.04em;
      margin-top: auto;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .footer-accent-block {
      width: 16px;
      height: 16px;
      background: ${accent};
      border-radius: 3px;
    }
    .footer-company {
      font-weight: 600;
      color: #888;
    }
    .footer-center {
      text-align: center;
      color: #bbb;
    }
    .footer-right {
      text-align: right;
    }
  `;

  // Build the ordered date number for the header
  const dateObj = new Date();
  const yearMonth = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

  const body = `
    <div class="page">
      <div class="header">
        <div class="header-left">
          <div class="header-logo">${brandLogoHtml(input, 'height:36px;')}</div>
          <div class="header-company">${companyName}</div>
        </div>
        <div class="header-right">
          <div class="header-doc-number">${yearMonth}</div>
          <div class="header-doc-label">${contentTypeLabel}</div>
          <div class="header-date">${dateStr}</div>
        </div>
      </div>

      <div class="title-block">
        <div class="title-doc-type">${prospect.industry ? prospect.industry.toUpperCase() + ' &mdash; ' : ''}${contentTypeLabel.toUpperCase()}</div>
        <h1 class="title-main">${contentTypeLabel} for ${prospect.companyName}</h1>
        <div class="title-subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
      </div>

      ${heroGridHtml}

      <div class="content-area">
        ${sectionsHtml}
      </div>

      <div class="visual-break">
        <div class="visual-break-line"></div>
        ${allNumbers[0] ? `<div class="visual-break-number">${allNumbers[0].value}</div>` : ''}
        <div class="visual-break-line"></div>
      </div>

      <div class="footer">
        <div class="footer-left">
          <div class="footer-accent-block"></div>
          <span class="footer-company">${companyName}</span>
          <span>${input.companyDescription ? '&mdash; ' + stripEmojis(input.companyDescription) : ''}</span>
        </div>
        <div class="footer-center">Prepared for ${prospect.companyName}</div>
        <div class="footer-right">${dateStr}</div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${contentTypeLabel} — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const { r, g, b } = hexToRgb(accentColor);
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;padding:12px;">
    <div style="width:35%;height:6px;background:#eee;border-radius:2px;margin-bottom:6px;"></div>
    <div style="font-size:11px;font-weight:700;color:#111;margin-bottom:8px;">Title Here</div>
    <div style="display:flex;gap:0;margin-bottom:10px;">
      <div style="flex:1;background:${accentColor};padding:8px 4px;text-align:center;"><div style="font-size:18px;font-weight:800;color:#fff;">47%</div><div style="font-size:5px;color:#fff;opacity:0.7;text-transform:uppercase;">growth</div></div>
      <div style="flex:1;background:${accentColor};opacity:0.85;padding:8px 4px;text-align:center;"><div style="font-size:18px;font-weight:800;color:#fff;">$2M</div><div style="font-size:5px;color:#fff;opacity:0.7;text-transform:uppercase;">value</div></div>
    </div>
    <div style="position:relative;margin-bottom:8px;">
      <div style="position:absolute;top:-4px;right:0;font-size:36px;font-weight:800;color:rgba(${r},${g},${b},0.06);">47%</div>
      <div style="width:100%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:85%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:92%;height:3px;background:#eee;border-radius:1px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style12OversizedNumbers: DocumentStyle = {
  id: 'style-12',
  name: 'Oversized Numbers',
  category: 'bold',
  description: 'Giant statistics as watermark-style visual anchors behind content',
  keywords: ['numbers', 'oversized', 'statistics', 'infographic', 'data'],
  render,
  thumbnail,
};

export default style12OversizedNumbers;
