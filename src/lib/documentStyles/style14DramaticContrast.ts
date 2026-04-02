import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, formatMarkdown, brandLogoHtml, wrapDocument, lighten, darken, contrastText, hexToRgb, brandFonts, buildOnePagerDocument, professionalSymbolCSS, stripEmojis } from './shared';

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

// ── Pull quote extraction ───────────────────────────────────

function extractPullQuote(sections: StyleInput['sections']): string {
  for (const s of sections) {
    const lines = s.content.split('\n').filter(l => l.trim().length > 40 && l.trim().length < 200);
    for (const line of lines) {
      if (line.includes('"') || line.includes('\u201c')) {
        return line.replace(/[""\u201c\u201d]/g, '').trim();
      }
    }
  }
  // Fallback: use first substantial paragraph
  for (const s of sections) {
    const lines = s.content.split('\n').filter(l => l.trim().length > 50);
    if (lines.length > 0) return lines[0].replace(/\*+/g, '').trim().slice(0, 160);
  }
  return '';
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager shortcut
  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const stats = extractStats(sections);
  const pullQuote = extractPullQuote(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accent = brand.accent || brand.primary;
  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const filteredSections = sections.filter(s => s.title.trim() || s.content.trim());

  // Build sections with dramatic type hierarchy
  const sectionsHtml = filteredSections.map((s, i) => `
    <div class="dc-section">
      <div class="dc-section-rule"></div>
      <div class="dc-section-meta">${String(i + 1).padStart(2, '0')} / ${String(filteredSections.length).padStart(2, '0')}</div>
      <h2 class="dc-section-title">${stripEmojis(s.title)}</h2>
      <div class="dc-section-body">${formatMarkdown(stripEmojis(s.content))}</div>
    </div>
  `).join('');

  // Stats row with dramatic number sizing
  const statsHtml = stats.length > 0 ? `
    <div class="dc-stats">
      ${stats.map(s => `
        <div class="dc-stat">
          <div class="dc-stat-number">${s.value}</div>
          <div class="dc-stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>
    <div class="dc-thin-rule"></div>
  ` : '';

  // Pull quote
  const pullQuoteHtml = pullQuote ? `
    <div class="dc-pullquote">
      <div class="dc-pullquote-mark">&ldquo;</div>
      <div class="dc-pullquote-text">${pullQuote}</div>
    </div>
    <div class="dc-thin-rule"></div>
  ` : '';

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .dc-section { page-break-inside: avoid; }
    }

    body {
      font-family: var(--brand-font-secondary);
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.7;
      font-size: var(--brand-font-body-size);
      margin: 0; padding: 0;
      -webkit-font-smoothing: antialiased;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    .dc-page {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
      padding: 80px 48px 60px;
      box-sizing: border-box;
    }

    /* ── Header: minimal, dramatic type ── */
    .dc-header {
      margin-bottom: 56px;
    }
    .dc-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 48px;
    }
    .dc-header-logo img { height: 28px; }
    .dc-header-meta-right {
      text-align: right;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #999;
    }
    .dc-header-meta-right .dc-prospect-name {
      font-size: 12px;
      font-weight: 700;
      color: #111;
      letter-spacing: 0.05em;
      text-transform: none;
    }
    .dc-header-type {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 16px;
    }
    .dc-header-title {
      font-family: var(--brand-font-primary);
      font-size: 64px;
      font-weight: 800;
      line-height: 1.0;
      color: #000;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
    }
    .dc-header-subtitle {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 8px;
    }
    .dc-header-accent-line {
      width: 64px;
      height: 4px;
      background: ${accent};
      margin-top: 32px;
    }

    /* ── Thin rules ── */
    .dc-thin-rule {
      width: 100%;
      height: 1px;
      background: #e0e0e0;
      margin: 40px 0;
    }

    /* ── Pull Quote ── */
    .dc-pullquote {
      padding: 32px 0;
      position: relative;
    }
    .dc-pullquote-mark {
      font-family: var(--brand-font-primary);
      font-size: 80px;
      font-weight: 800;
      color: ${accent};
      line-height: 0.6;
      margin-bottom: 8px;
    }
    .dc-pullquote-text {
      font-family: var(--brand-font-primary);
      font-size: 28px;
      font-weight: 400;
      font-style: italic;
      line-height: 1.35;
      color: #333;
      max-width: 560px;
    }

    /* ── Stats ── */
    .dc-stats {
      display: flex;
      gap: 48px;
      padding: 36px 0;
      flex-wrap: nowrap;
    }
    .dc-stat {
      flex: 1;
      min-width: 0;
    }
    .dc-stat-number {
      font-family: var(--brand-font-primary);
      font-size: 56px;
      font-weight: 800;
      line-height: 1;
      color: #000;
      margin-bottom: 6px;
    }
    .dc-stat-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #999;
    }

    /* ── Sections ── */
    .dc-section {
      margin-bottom: 48px;
      page-break-inside: avoid;
    }
    .dc-section-rule {
      width: 100%;
      height: 1px;
      background: #e0e0e0;
      margin-bottom: 24px;
    }
    .dc-section-meta {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.2em;
      color: #bbb;
      margin-bottom: 12px;
    }
    .dc-section-title {
      font-family: var(--brand-font-primary);
      font-size: 36px;
      font-weight: 800;
      line-height: 1.1;
      color: #111;
      margin: 0 0 20px;
      letter-spacing: -0.01em;
    }
    .dc-section-body {
      color: #444;
      font-size: var(--brand-font-body-size);
    }
    .dc-section-body p { margin-bottom: 16px; }
    .dc-section-body h1,
    .dc-section-body h2 {
      font-family: var(--brand-font-primary);
      font-size: 26px;
      font-weight: 700;
      color: #111;
      margin: 32px 0 12px;
      line-height: 1.15;
    }
    .dc-section-body h3 {
      font-family: var(--brand-font-primary);
      font-size: 18px;
      font-weight: 700;
      color: #222;
      margin: 24px 0 10px;
    }
    .dc-section-body h4 {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #999;
      margin: 20px 0 8px;
    }
    .dc-section-body strong { font-weight: 700; color: #111; }
    .dc-section-body em { font-style: italic; color: #555; }
    .dc-section-body ul, .dc-section-body ol {
      padding-left: 20px;
      margin: 12px 0;
    }
    .dc-section-body li { margin-bottom: 8px; }
    .dc-section-body li::marker { color: ${accent}; }
    .dc-section-body hr {
      border: none;
      height: 1px;
      background: #e8e8e8;
      margin: 28px 0;
    }

    /* Tables */
    .dc-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .dc-section-body thead th {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 2px solid #000;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #555;
    }
    .dc-section-body tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #f0f0f0;
    }

    /* ── Footer ── */
    .dc-footer {
      margin-top: 64px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dc-footer-text {
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #bbb;
    }
    .dc-footer-accent {
      width: 32px;
      height: 3px;
      background: ${accent};
    }
  `;

  const body = `
    <div class="dc-page">
      <!-- Header -->
      <div class="dc-header">
        <div class="dc-header-top">
          <div class="dc-header-logo">${brandLogoHtml(input, 'height:28px;')}</div>
          <div class="dc-header-meta-right">
            <div class="dc-prospect-name">${prospect.companyName}</div>
            <div>${dateStr}</div>
          </div>
        </div>
        <div class="dc-header-type">${contentType.replace(/-/g, ' ')}${prospect.industry ? ' / ' + prospect.industry : ''}</div>
        <h1 class="dc-header-title">${title}</h1>
        <div class="dc-header-subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
        <div class="dc-header-accent-line"></div>
      </div>

      <!-- Pull Quote -->
      ${pullQuoteHtml}

      <!-- Stats -->
      ${statsHtml}

      <!-- Sections -->
      ${sectionsHtml}

      <!-- Footer -->
      <div class="dc-footer">
        <div class="dc-footer-text">${companyName}${input.companyDescription ? ' &mdash; ' + input.companyDescription : ''}</div>
        <div class="dc-footer-text">${dateStr}</div>
        <div class="dc-footer-text">Page 1</div>
        <div class="dc-footer-accent"></div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;display:flex;justify-content:center;">
    <div style="width:60%;padding:12px 0;">
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:4px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#ccc;margin-bottom:4px;">REPORT</div>
        <div style="font-size:14px;font-weight:800;color:#111;line-height:1;margin-bottom:4px;">Big Title</div>
        <div style="font-size:4px;letter-spacing:0.15em;color:#aaa;text-transform:uppercase;">Prepared for client</div>
        <div style="height:2px;background:${accentColor};margin-top:6px;width:30px;"></div>
      </div>
      <div style="font-size:4px;color:#ccc;letter-spacing:0.15em;margin-bottom:3px;">01 / 03</div>
      <div style="font-size:12px;font-weight:800;color:#111;margin-bottom:6px;">Section</div>
      <div style="width:100%;height:3px;background:#eee;margin-bottom:3px;"></div>
      <div style="width:85%;height:3px;background:#eee;margin-bottom:3px;"></div>
      <div style="width:92%;height:3px;background:#eee;margin-bottom:6px;"></div>
      <div style="height:1px;background:#e0e0e0;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style14DramaticContrast: DocumentStyle = {
  id: 'style-14',
  name: 'Dramatic Contrast',
  category: 'bold',
  description: 'Extreme type hierarchy — enormous headers, tiny labels, wide margins',
  keywords: ['dramatic', 'contrast', 'luxury', 'fashion', 'editorial'],
  render,
  thumbnail,
};

export default style14DramaticContrast;
