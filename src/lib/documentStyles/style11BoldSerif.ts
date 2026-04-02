import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, lighten, darken, contrastText, hexToRgb, buildOnePagerDocument, professionalSymbolCSS, stripEmojis } from './shared';

// ── Stat extraction ─────────────────────────────────────────

function extractStats(sections: StyleInput['sections']): { value: string; label: string }[] {
  const allContent = sections.map(s => s.content).join('\n');
  const stats: { value: string; label: string }[] = [];
  const pctMatches = allContent.match(/(\d{1,4}(?:\.\d+)?%)/g);
  if (pctMatches) {
    for (const m of pctMatches.slice(0, 2)) {
      const idx = allContent.indexOf(m);
      const surrounding = allContent.substring(Math.max(0, idx - 40), idx + m.length + 40);
      const words = surrounding.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
      stats.push({ value: m, label: words.join(' ') || 'improvement' });
    }
  }
  const dollarMatches = allContent.match(/\$[\d,.]+[KkMmBb]?/g);
  if (dollarMatches) {
    for (const m of dollarMatches.slice(0, 1)) stats.push({ value: m, label: 'value' });
  }
  const multMatches = allContent.match(/(\d+(?:\.\d+)?)[xX]\b/g);
  if (multMatches) {
    for (const m of multMatches.slice(0, 1)) stats.push({ value: m, label: 'multiplier' });
  }
  return stats.slice(0, 4);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager support
  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const accent = brand.accent || brand.primary;
  const navy = '#1b2a4a';
  const charcoal = '#2c3e50';
  const gold = accent;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const contentTypeLabel = stripEmojis(contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

  const statsHtml = stats.length > 0 ? `
    <div class="stats-bar">
      ${stats.map(s => `
        <div class="stat-item">
          <div class="stat-value">${s.value}</div>
          <div class="stat-underline"></div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>` : '';

  const validSections = sections.filter(s => s.content && s.content.trim().length > 0);
  const sectionsHtml = validSections.map((s, i) => {
    const cleanTitle = stripEmojis(s.title);
    const cleanContent = stripEmojis(s.content);
    return `
    <div class="section">
      <div class="section-header-group">
        <h2 class="section-title">${cleanTitle}</h2>
        <div class="section-title-border"></div>
      </div>
      <div class="section-content">${formatMarkdown(cleanContent)}</div>
    </div>`;
  }).join('');

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0.7in 0.8in;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; max-width: none; }
      .section { break-inside: avoid; }
    }

    ${professionalSymbolCSS(gold)}

    body {
      font-family: var(--brand-font-secondary), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: ${charcoal};
      background: #ffffff;
      line-height: 1.75;
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
      padding: 44px 52px 36px;
      border-bottom: 1px solid #e8e8e8;
      background: #ffffff;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 36px;
    }
    .header-logo-block {
      flex-shrink: 0;
    }
    .header-wordmark {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 20px;
      font-weight: 700;
      color: ${navy};
      letter-spacing: 0.02em;
    }
    .header-meta-block {
      text-align: right;
      font-size: 12px;
      color: #888;
      line-height: 1.7;
    }
    .header-meta-block .prospect-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #aaa;
    }
    .header-meta-block .prospect-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      font-size: 15px;
      color: ${navy};
    }
    .header-meta-block .meta-date {
      color: #999;
      font-size: 12px;
    }

    .header-title-area {
      padding-top: 4px;
    }
    .header-doc-type {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: ${gold};
      margin-bottom: 12px;
    }
    .header-title {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: calc(var(--brand-font-h1-size) + 6px);
      font-weight: 700;
      color: ${navy};
      line-height: 1.15;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    .header-subtitle {
      font-size: 15px;
      color: #888;
      line-height: 1.5;
    }
    .header-accent-line {
      width: 80px;
      height: 4px;
      background: ${gold};
      margin-top: 24px;
    }

    /* ── Stats Bar ──────────────────────────────── */
    .stats-bar {
      display: flex;
      flex-wrap: nowrap;
      gap: 48px;
      padding: 36px 52px;
      background: #fafaf8;
      border-bottom: 1px solid #e8e8e8;
    }
    .stat-item {
      flex: 1;
      min-width: 0;
      text-align: center;
    }
    .stat-value {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 42px;
      font-weight: 700;
      color: ${navy};
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .stat-underline {
      width: 32px;
      height: 2px;
      background: ${gold};
      margin: 12px auto;
    }
    .stat-label {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #999;
      font-weight: 500;
    }

    /* ── Content Area ───────────────────────────── */
    .content-area {
      padding: 44px 52px 20px;
    }

    /* ── Sections ───────────────────────────────── */
    .section {
      margin-bottom: 44px;
      padding-bottom: 44px;
      border-bottom: 1px solid #eee;
      page-break-inside: avoid;
    }
    .section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }
    .section-header-group {
      margin-bottom: 20px;
    }
    .section-title {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
      color: ${navy};
      line-height: 1.25;
      margin-bottom: 10px;
    }
    .section-title-border {
      width: 60px;
      height: 4px;
      background: ${gold};
    }

    /* ── Section content typography ─────────────── */
    .section-content {
      color: ${charcoal};
    }
    .section-content p {
      margin-bottom: 16px;
      line-height: 1.8;
    }
    .section-content h1, .section-content h2 {
      font-family: 'Playfair Display', Georgia, serif;
      color: ${navy};
      margin: 32px 0 12px;
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
    }
    .section-content h3 {
      font-family: 'Playfair Display', Georgia, serif;
      color: ${charcoal};
      margin: 24px 0 10px;
      font-size: var(--brand-font-h3-size);
      font-weight: 600;
    }
    .section-content h4 {
      color: #555;
      margin: 20px 0 8px;
      font-size: 15px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .section-content strong {
      font-weight: 700;
      color: ${navy};
    }
    .section-content em {
      font-style: italic;
    }
    .section-content ul, .section-content ol {
      padding-left: 24px;
      margin: 14px 0;
    }
    .section-content li {
      margin-bottom: 8px;
      line-height: 1.7;
    }
    .section-content li::marker {
      color: ${gold};
    }
    .section-content hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 28px 0;
    }

    /* ── Tables ─────────────────────────────────── */
    .section-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .section-content thead tr {
      border-top: 3px solid ${navy};
      border-bottom: 2px solid ${navy};
    }
    .section-content th {
      text-align: left;
      padding: 12px 14px;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${navy};
      background: transparent;
    }
    .section-content tbody tr {
      border-bottom: 1px solid #eee;
    }
    .section-content tbody tr:nth-child(even) {
      background: #fafaf8;
    }
    .section-content td {
      padding: 11px 14px;
      color: ${charcoal};
    }

    /* ── Decorative quote styling for even sections */
    .section:nth-child(even) .section-content > p:first-child {
      position: relative;
      padding-left: 36px;
      font-size: calc(var(--brand-font-body-size) + 1px);
      font-style: italic;
      color: #555;
    }
    .section:nth-child(even) .section-content > p:first-child::before {
      content: '\\201C';
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 72px;
      font-weight: 700;
      color: ${gold};
      opacity: 0.25;
      position: absolute;
      left: -4px;
      top: -16px;
      line-height: 1;
    }

    /* ── Visual Break ──────────────────────────── */
    .visual-break {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px 52px;
    }
    .visual-break-line {
      flex: 1;
      height: 1px;
      background: #e0e0e0;
    }
    .visual-break-diamond {
      width: 8px;
      height: 8px;
      background: ${gold};
      transform: rotate(45deg);
    }

    /* ── Footer ─────────────────────────────────── */
    .footer {
      padding: 20px 52px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #bbb;
      letter-spacing: 0.04em;
      margin-top: auto;
    }
    .footer-left {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 600;
      color: #999;
      font-size: 11px;
    }
    .footer-center {
      text-align: center;
      color: #ccc;
    }
    .footer-right {
      text-align: right;
      color: #bbb;
    }
  `;

  const body = `
    <div class="page">
      <div class="header">
        <div class="header-top">
          <div class="header-logo-block">
            ${input.logoBase64
              ? brandLogoHtml(input, 'height:38px;')
              : `<div class="header-wordmark">${companyName}</div>`}
          </div>
          <div class="header-meta-block">
            <div class="prospect-label">Prepared For</div>
            <div class="prospect-name">${prospect.companyName}</div>
            <div class="meta-date">${dateStr}</div>
          </div>
        </div>
        <div class="header-title-area">
          <div class="header-doc-type">${contentTypeLabel}</div>
          <h1 class="header-title">${contentTypeLabel} for ${prospect.companyName}</h1>
          <div class="header-subtitle">
            ${prospect.industry ? prospect.industry + ' &mdash; ' : ''}${prospect.companySize ? prospect.companySize + ' &mdash; ' : ''}Strategic Analysis &amp; Recommendations
          </div>
          <div class="header-accent-line"></div>
        </div>
      </div>

      ${statsHtml}

      <div class="content-area">
        ${sectionsHtml}
      </div>

      <div class="visual-break">
        <div class="visual-break-line"></div>
        <div class="visual-break-diamond"></div>
        <div class="visual-break-line"></div>
      </div>

      <div class="footer">
        <div class="footer-left">${companyName}</div>
        <div class="footer-center">${input.companyDescription ? stripEmojis(input.companyDescription) : 'Confidential'}</div>
        <div class="footer-right">${dateStr}</div>
      </div>
    </div>
  `;

  const fonts = [...brandFonts(brand)];
  if (!fonts.includes('Playfair Display')) fonts.push('Playfair Display');

  return wrapDocument({
    title: `${contentTypeLabel} — ${prospect.companyName}`,
    css,
    body,
    fonts,
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#ffffff;border-radius:6px;overflow:hidden;font-family:Georgia,serif;padding:12px;">
    <div style="width:30%;height:6px;background:#ddd;border-radius:2px;margin-bottom:8px;"></div>
    <div style="font-size:6px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${accentColor};margin-bottom:4px;">Case Study</div>
    <div style="font-size:14px;font-weight:700;color:#1b2a4a;line-height:1.1;margin-bottom:6px;font-family:Georgia,serif;">Bold Serif Title</div>
    <div style="width:50px;height:3px;background:${accentColor};margin-bottom:10px;"></div>
    <div style="display:flex;gap:16px;margin-bottom:10px;">
      <div style="text-align:center;"><div style="font-size:14px;font-weight:700;color:#1b2a4a;font-family:Georgia,serif;">47%</div><div style="width:16px;height:1px;background:${accentColor};margin:2px auto;"></div><div style="font-size:5px;color:#999;text-transform:uppercase;">growth</div></div>
      <div style="text-align:center;"><div style="font-size:14px;font-weight:700;color:#1b2a4a;font-family:Georgia,serif;">$2M</div><div style="width:16px;height:1px;background:${accentColor};margin:2px auto;"></div><div style="font-size:5px;color:#999;text-transform:uppercase;">value</div></div>
    </div>
    <div style="width:100%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:85%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:92%;height:3px;background:#eee;border-radius:1px;"></div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style11BoldSerif: DocumentStyle = {
  id: 'style-11',
  name: 'Bold Serif',
  category: 'bold',
  description: 'Large serif headlines with sans body — premium consulting feel',
  keywords: ['serif', 'bold', 'consulting', 'premium', 'sophisticated'],
  render,
  thumbnail,
};

export default style11BoldSerif;
