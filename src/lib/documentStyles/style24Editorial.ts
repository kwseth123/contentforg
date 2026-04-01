// ════════════════════════════════════════════════════════
// Style 24 — Editorial
// Harvard Business Review article layout. Premium
// publication quality with serif headlines, drop caps,
// pull quotes, and faded section numbers.
// ════════════════════════════════════════════════════════

import type { DocumentStyle, StyleInput } from './types';
import {
  resolveBrand,
  brandCSSVars,
  formatMarkdown,
  brandLogoHtml,
  wrapDocument,
  lighten,
  darken,
  contrastText,
  hexToRgb,
  brandFonts,
  buildOnePagerDocument,
  professionalSymbolCSS,
  stripEmojis,
} from './shared';

// ── Stat extraction ──────────────────────────────────────

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
    for (const m of dollarMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'value' });
    }
  }
  const multMatches = allContent.match(/(\d+(?:\.\d+)?)[xX]\b/g);
  if (multMatches) {
    for (const m of multMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'multiplier' });
    }
  }
  return stats.slice(0, 4);
}

// ── Pull-quote extraction ──────────────────────────────────

function extractPullQuote(content: string): string | null {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const candidate = sentences.find(
    s => s.length > 40 && s.length < 180 && /\d/.test(s),
  );
  return candidate || (sentences.length > 2 ? sentences[1] : null);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const stats = extractStats(sections);
  const lightBg = lighten(accent, 0.95);
  const lightAccent = lighten(accent, 0.88);
  const darkAccent = darken(accent, 0.15);
  const rgb = hexToRgb(accent);

  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Stats bar HTML
  const statsHtml = stats.length > 0 ? `
    <div class="ed-stats-bar">
      ${stats.map(s => `
        <div class="ed-stat">
          <div class="ed-stat-value">${s.value}</div>
          <div class="ed-stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>` : '';

  // Sections HTML
  const sectionsHtml = sections.map((s, i) => {
    const pullQuote = extractPullQuote(s.content);
    const num = String(i + 1).padStart(2, '0');
    const cleanContent = stripEmojis(s.content);

    const pullQuoteHtml = pullQuote ? `
      <div class="ed-pull-quote">
        <div class="ed-pq-mark">&ldquo;</div>
        <blockquote class="ed-pq-text">${stripEmojis(pullQuote)}</blockquote>
        <div class="ed-pq-rule"></div>
      </div>` : '';

    return `
      <div class="ed-section">
        <div class="ed-section-num-bg">${num}</div>
        <div class="ed-section-header">
          <span class="ed-section-num">${num}</span>
          <div class="ed-section-ornament"></div>
        </div>
        <h2 class="ed-section-title">${stripEmojis(s.title)}</h2>
        ${i === 0 ? `<div class="ed-section-body ed-has-dropcap">${formatMarkdown(cleanContent)}</div>` : `<div class="ed-section-body">${formatMarkdown(cleanContent)}</div>`}
        ${pullQuoteHtml}
        ${i < sections.length - 1 ? '<div class="ed-ornament-break"><span></span><span></span><span></span></div>' : ''}
      </div>`;
  }).join('');

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0.75in 0.85in;
      @bottom-center {
        content: counter(page);
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 10px;
        color: #999;
      }
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .ed-section { break-inside: avoid; }
    }

    body {
      font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
      color: ${brand.text};
      background: #fafaf8;
      line-height: 1.85;
      font-size: ${brand.bodySize}px;
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 0;
    }

    /* ── Publication wrapper ── */
    .ed-wrapper {
      max-width: 780px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Masthead header ── */
    .ed-masthead {
      padding: 48px 80px 40px;
      text-align: center;
      border-bottom: 2px solid ${brand.primary};
      position: relative;
    }
    .ed-masthead::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      height: 1px;
      background: ${brand.primary};
    }
    .ed-masthead-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    .ed-masthead-logo { flex-shrink: 0; }
    .ed-masthead-meta {
      text-align: right;
      font-family: 'Merriweather', Georgia, serif;
      font-size: 11px;
      color: #888;
      line-height: 1.6;
    }
    .ed-masthead-prospect {
      font-weight: 700;
      color: ${brand.primary};
      font-size: 12px;
    }
    .ed-masthead-pub {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 16px;
    }
    .ed-masthead-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: ${brand.h1Size + 6}px;
      font-weight: 700;
      color: #111;
      line-height: 1.15;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .ed-masthead-subtitle {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 16px;
      font-style: italic;
      color: #666;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .ed-masthead-byline {
      font-size: 12px;
      color: #999;
      font-family: 'Merriweather', Georgia, serif;
    }
    .ed-masthead-byline strong {
      color: #555;
      font-weight: 600;
    }

    /* ── Stats bar ── */
    .ed-stats-bar {
      display: flex;
      justify-content: center;
      gap: 40px;
      padding: 28px 80px;
      background: ${lightBg};
      border-bottom: 1px solid ${lighten(accent, 0.85)};
    }
    .ed-stat { text-align: center; }
    .ed-stat-value {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: ${accent};
      line-height: 1.1;
    }
    .ed-stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-top: 4px;
    }

    /* ── Content column ── */
    .ed-content {
      max-width: 620px;
      margin: 0 auto;
      padding: 48px 0 32px;
    }

    /* ── Section ── */
    .ed-section {
      position: relative;
      margin-bottom: 48px;
      text-align: justify;
    }
    .ed-section-num-bg {
      position: absolute;
      top: -24px;
      left: -30px;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 140px;
      font-weight: 700;
      color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06);
      line-height: 1;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }
    .ed-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }
    .ed-section-num {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 13px;
      font-weight: 600;
      color: ${accent};
      letter-spacing: 0.1em;
    }
    .ed-section-ornament {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, ${lighten(accent, 0.6)}, transparent);
    }
    .ed-section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: ${brand.h2Size + 2}px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.25;
      margin-bottom: 20px;
      text-align: left;
      letter-spacing: -0.01em;
      position: relative;
      z-index: 1;
    }

    /* ── Drop cap ── */
    .ed-has-dropcap > p:first-of-type::first-letter {
      font-family: 'Playfair Display', Georgia, serif;
      float: left;
      font-size: 4.2em;
      line-height: 0.8;
      padding-right: 10px;
      padding-top: 6px;
      color: ${accent};
      font-weight: 700;
    }

    /* ── Body prose ── */
    .ed-section-body {
      color: #333;
      line-height: 1.9;
      position: relative;
      z-index: 1;
    }
    .ed-section-body p { margin-bottom: 16px; }
    .ed-section-body h1, .ed-section-body h2,
    .ed-section-body h3, .ed-section-body h4 {
      font-family: 'Playfair Display', Georgia, serif;
      text-align: left;
      color: #1a1a1a;
      margin: 28px 0 12px;
    }
    .ed-section-body h1 { font-size: 22px; }
    .ed-section-body h2 { font-size: 18px; }
    .ed-section-body h3 { font-size: 16px; font-style: italic; }
    .ed-section-body ul, .ed-section-body ol {
      text-align: left;
      padding-left: 24px;
      margin: 14px 0;
    }
    .ed-section-body li {
      margin-bottom: 8px;
      line-height: 1.7;
    }
    .ed-section-body strong { font-weight: 700; color: #1a1a1a; }
    .ed-section-body em { font-style: italic; }

    /* ── Tables ── */
    .ed-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      text-align: left;
      font-family: 'Merriweather', Georgia, serif;
    }
    .ed-section-body th {
      background: ${lightAccent};
      font-weight: 600;
      padding: 11px 14px;
      border-bottom: 2px solid ${accent};
      color: #1a1a1a;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .ed-section-body td {
      padding: 10px 14px;
      border-bottom: 1px solid #e8e8e4;
    }
    .ed-section-body tr:hover td {
      background: ${lighten(accent, 0.97)};
    }
    .ed-section-body hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 28px 0;
    }

    /* ── Pull quote ── */
    .ed-pull-quote {
      margin: 36px -20px;
      padding: 28px 32px 24px;
      position: relative;
      text-align: center;
    }
    .ed-pq-mark {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 72px;
      color: ${accent};
      opacity: 0.2;
      line-height: 0.6;
      margin-bottom: 8px;
    }
    .ed-pq-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 19px;
      font-style: italic;
      color: #333;
      line-height: 1.6;
      max-width: 500px;
      margin: 0 auto 16px;
      border: none;
      padding: 0;
    }
    .ed-pq-rule {
      width: 48px;
      height: 1px;
      background: ${accent};
      margin: 0 auto;
    }

    /* ── Section ornament break ── */
    .ed-ornament-break {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 40px 0;
    }
    .ed-ornament-break span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #ccc;
    }
    .ed-ornament-break span:nth-child(2) {
      width: 6px;
      height: 6px;
      background: ${lighten(accent, 0.5)};
    }

    /* ── Footer ── */
    .ed-footer {
      border-top: 2px solid ${brand.primary};
      position: relative;
      padding: 24px 80px 32px;
      text-align: center;
    }
    .ed-footer::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 0;
      right: 0;
      height: 1px;
      background: ${brand.primary};
    }
    .ed-footer-text {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 10px;
      color: #999;
      line-height: 1.8;
    }
    .ed-footer-company {
      font-weight: 600;
      color: #777;
    }
  `;

  const body = `
    <div class="ed-wrapper">
      <header class="ed-masthead">
        <div class="ed-masthead-top">
          <div class="ed-masthead-logo">${brandLogoHtml(input, 'height:36px;')}</div>
          <div class="ed-masthead-meta">
            <div class="ed-masthead-prospect">Prepared for ${prospect.companyName}</div>
            <div>${dateStr}</div>
          </div>
        </div>
        <div class="ed-masthead-pub">${companyName} Insights</div>
        <h1 class="ed-masthead-title">${title}</h1>
        <div class="ed-masthead-subtitle">A strategic analysis prepared for ${prospect.companyName}${prospect.industry ? ' in the ' + prospect.industry + ' sector' : ''}</div>
        <div class="ed-masthead-byline">By <strong>${companyName}</strong> &middot; ${dateStr}</div>
      </header>

      ${statsHtml}

      <div class="ed-content">
        ${sectionsHtml}
      </div>

      <footer class="ed-footer">
        <div class="ed-footer-text">
          <span class="ed-footer-company">${companyName}</span>${input.companyDescription ? ' | ' + input.companyDescription : ''}<br/>
          Prepared for ${prospect.companyName} &middot; ${dateStr} &middot; Page <span class="page-num"></span>
        </div>
      </footer>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Playfair Display', 'Merriweather', ...brandFonts(brand)],
  });
}

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fafaf8;border-radius:6px;overflow:hidden;font-family:Georgia,serif;position:relative;">
    <div style="text-align:center;padding:12px 10px 8px;border-bottom:2px solid ${accentColor};">
      <div style="width:30px;height:2px;background:${accentColor};margin:0 auto 6px;"></div>
      <div style="width:55%;height:7px;background:#111;border-radius:2px;margin:0 auto 3px;"></div>
      <div style="width:35%;height:5px;background:#999;border-radius:2px;margin:0 auto;font-style:italic;"></div>
    </div>
    <div style="max-width:70%;margin:0 auto;padding:4px 0;">
      <div style="position:relative;">
        <span style="position:absolute;top:-4px;left:-8px;font-size:28px;color:#000;opacity:0.06;font-weight:700;">01</span>
        <div style="width:45%;height:5px;background:#222;border-radius:2px;margin-bottom:5px;"></div>
      </div>
      <div style="border-left:2px solid ${accentColor};padding-left:6px;margin:5px 0;">
        <div style="width:80%;height:3px;background:#ccc;border-radius:2px;margin-bottom:2px;"></div>
        <div style="width:65%;height:3px;background:#ccc;border-radius:2px;"></div>
      </div>
      <div style="width:90%;height:3px;background:#ddd;border-radius:2px;margin:3px 0;"></div>
      <div style="width:75%;height:3px;background:#ddd;border-radius:2px;margin:3px 0;"></div>
      <div style="width:85%;height:3px;background:#ddd;border-radius:2px;margin:3px 0;"></div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;border-top:2px solid ${accentColor};">Editorial</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style24Editorial: DocumentStyle = {
  id: 'style-24',
  name: 'Editorial',
  category: 'creative',
  description: 'Premium magazine editorial — italic pull quotes, narrow columns, HBR feel',
  keywords: ['editorial', 'magazine', 'pull-quotes', 'columns', 'hbr', 'premium'],
  render,
  thumbnail,
};

export default style24Editorial;
