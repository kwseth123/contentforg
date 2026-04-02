// ════════════════════════════════════════════════════════
// Style 25 — Storytelling
// Beautifully produced case study / brand story.
// Narrative flow with chapter markers, hero headlines,
// background transitions, and warm inviting typography.
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
  return stats.slice(0, 3);
}

// ── Customer quote extraction ──────────────────────────────

function extractCustomerQuote(content: string): string | null {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const candidate = sentences.find(s => s.length > 30 && s.length < 200);
  return candidate || null;
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections: rawSections, contentType, prospect, companyName, date } = input;
  const sections = rawSections.filter(s => s.title?.trim() || s.content?.trim());
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const stats = extractStats(sections);
  const rgb = hexToRgb(accent);
  const lightBg = lighten(accent, 0.96);
  const warmBg = lighten(accent, 0.93);

  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Find a good pull quote from mid-document
  const midIdx = Math.floor(sections.length / 2);
  const customerQuote = extractCustomerQuote(sections[midIdx]?.content || sections[0]?.content || '');

  // Inline stat highlights
  const inlineStatsHtml = stats.length > 0 ? `
    <div class="st-inline-stats">
      ${stats.map(s => `
        <div class="st-inline-stat">
          <span class="st-inline-value">${s.value}</span>
          <span class="st-inline-label">${s.label}</span>
        </div>
      `).join('')}
    </div>` : '';

  // Sections HTML with alternating backgrounds
  const sectionsHtml = sections.map((s, i) => {
    const chapterNum = String(i + 1).padStart(2, '0');
    const isAlternate = i % 2 === 1;
    const bgClass = isAlternate ? 'st-section-alt' : '';
    const cleanContent = stripEmojis(s.content);
    const showQuote = i === midIdx && customerQuote;

    return `
      <div class="st-chapter ${bgClass}">
        <div class="st-chapter-inner">
          <div class="st-chapter-marker">
            <span class="st-chapter-line"></span>
            <span class="st-chapter-label">Chapter ${chapterNum}</span>
            <span class="st-chapter-line"></span>
          </div>
          <h2 class="st-chapter-title">${stripEmojis(s.title)}</h2>
          <div class="st-chapter-body">${formatMarkdown(cleanContent)}</div>
          ${showQuote ? `
            <div class="st-callout">
              <div class="st-callout-mark">&ldquo;</div>
              <p class="st-callout-text">${stripEmojis(customerQuote!)}</p>
              <p class="st-callout-attr">&mdash; ${prospect.companyName} stakeholder</p>
            </div>` : ''}
          ${i === Math.floor(sections.length / 3) && stats.length > 0 ? inlineStatsHtml : ''}
        </div>
      </div>`;
  }).join('');

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0.7in 0.85in;
      @bottom-center {
        content: counter(page);
        font-family: 'Nunito', sans-serif;
        font-size: 9px;
        color: #bbb;
      }
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .st-chapter { break-inside: avoid; page-break-inside: avoid; }
    }

    body {
      font-family: 'Nunito', 'Quicksand', sans-serif;
      color: ${brand.text};
      background: #ffffff;
      line-height: 1.8;
      font-size: ${brand.bodySize}px;
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 0;
    }

    /* ── Wrapper ── */
    .st-wrapper {
      width: 100%; max-width: 816px;
      margin: 0 auto;
    }

    /* ── Hero header ── */
    .st-hero {
      background: linear-gradient(135deg, ${brand.primary} 0%, ${darken(brand.primary, 0.2)} 100%);
      color: ${contrastText(brand.primary)};
      padding: 64px 60px 56px;
      position: relative;
      overflow: hidden;
    }
    .st-hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .st-hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    .st-hero-logo img { height: 32px; filter: brightness(10); }
    .st-hero-meta {
      text-align: right;
      font-size: 12px;
      opacity: 0.85;
    }
    .st-hero-prospect {
      font-weight: 700;
      font-size: 13px;
      opacity: 1;
    }
    .st-hero-overline {
      font-size: 12px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.7;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .st-hero-title {
      font-family: 'Nunito', sans-serif;
      font-size: ${brand.h1Size + 10}px;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .st-hero-subtitle {
      font-size: 17px;
      line-height: 1.6;
      opacity: 0.85;
      max-width: 540px;
      position: relative;
      z-index: 1;
    }
    .st-hero-byline {
      margin-top: 24px;
      font-size: 12px;
      opacity: 0.6;
      position: relative;
      z-index: 1;
    }

    /* ── Photography placeholder ── */
    .st-photo-band {
      height: 6px;
      background: linear-gradient(to right, ${accent}, ${lighten(accent, 0.3)}, ${accent});
    }

    /* ── Chapters ── */
    .st-chapter {
      padding: 48px 60px;
      background: #ffffff;
      transition: background 0.3s;
      page-break-inside: avoid;
    }
    .st-chapter-alt {
      background: ${lightBg};
    }
    .st-chapter-inner {
      max-width: 640px;
      margin: 0 auto;
    }
    .st-chapter-marker {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }
    .st-chapter-line {
      flex: 1;
      height: 1px;
      background: ${lighten(accent, 0.7)};
    }
    .st-chapter-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${accent};
      white-space: nowrap;
    }
    .st-chapter-title {
      font-family: 'Nunito', sans-serif;
      font-size: ${brand.h2Size + 4}px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.25;
      margin-bottom: 20px;
    }

    /* ── Chapter body ── */
    .st-chapter-body {
      color: #444;
      line-height: 1.85;
      overflow-wrap: break-word;
    }
    .st-chapter-body p { margin-bottom: 16px; }
    .st-chapter-body h1, .st-chapter-body h2,
    .st-chapter-body h3, .st-chapter-body h4 {
      font-family: 'Nunito', sans-serif;
      color: #1a1a1a;
      margin: 24px 0 12px;
    }
    .st-chapter-body h1 { font-size: 22px; font-weight: 700; }
    .st-chapter-body h2 { font-size: 18px; font-weight: 700; }
    .st-chapter-body h3 { font-size: 16px; font-weight: 600; }
    .st-chapter-body ul, .st-chapter-body ol {
      padding-left: 24px;
      margin: 14px 0;
    }
    .st-chapter-body li {
      margin-bottom: 8px;
      line-height: 1.7;
    }
    .st-chapter-body strong { font-weight: 700; color: #1a1a1a; }
    .st-chapter-body em { font-style: italic; }

    /* ── Tables ── */
    .st-chapter-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      border-radius: 8px;
      overflow: hidden;
    }
    .st-chapter-body th {
      background: ${warmBg};
      font-weight: 700;
      padding: 12px 14px;
      border-bottom: 2px solid ${accent};
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${darken(accent, 0.2)};
    }
    .st-chapter-body td {
      padding: 10px 14px;
      border-bottom: 1px solid #eee;
    }
    .st-chapter-body tr:last-child td { border-bottom: none; }
    .st-chapter-body hr {
      border: none;
      border-top: 1px solid #e5e5e5;
      margin: 24px 0;
    }

    /* ── Callout / pull quote ── */
    .st-callout {
      background: ${warmBg};
      border-radius: 12px;
      padding: 36px 40px 28px;
      margin: 32px 0;
      position: relative;
    }
    .st-callout-mark {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 64px;
      color: ${accent};
      opacity: 0.25;
      line-height: 0.6;
      position: absolute;
      top: 16px;
      left: 24px;
    }
    .st-callout-text {
      font-size: 18px;
      font-style: italic;
      color: #333;
      line-height: 1.65;
      margin-bottom: 12px;
      padding-left: 8px;
    }
    .st-callout-attr {
      font-size: 13px;
      font-weight: 700;
      color: ${accent};
      padding-left: 8px;
    }

    /* ── Inline stats ── */
    .st-inline-stats {
      display: flex;
      flex-wrap: nowrap;
      gap: 20px;
      margin: 32px 0;
    }
    .st-inline-stat {
      flex: 1;
      min-width: 0;
      background: #ffffff;
      border: 1px solid ${lighten(accent, 0.8)};
      border-radius: 10px;
      padding: 20px 16px;
      text-align: center;
    }
    .st-chapter-alt .st-inline-stat {
      background: #ffffff;
    }
    .st-inline-value {
      display: block;
      font-size: 30px;
      font-weight: 800;
      color: ${accent};
      line-height: 1.1;
    }
    .st-inline-label {
      display: block;
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 6px;
    }

    /* ── Footer ── */
    .st-footer {
      background: ${lighten(brand.primary, 0.96)};
      padding: 36px 60px;
      text-align: center;
    }
    .st-footer-end {
      font-size: 22px;
      font-weight: 700;
      color: ${brand.primary};
      margin-bottom: 12px;
      letter-spacing: 0.05em;
    }
    .st-footer-divider {
      width: 40px;
      height: 2px;
      background: ${accent};
      margin: 0 auto 16px;
      border-radius: 1px;
    }
    .st-footer-info {
      font-size: 11px;
      color: #999;
      line-height: 1.8;
    }
    .st-footer-company {
      font-weight: 700;
      color: #777;
    }
  `;

  const body = `
    <div class="st-wrapper">
      <div class="st-hero">
        <div class="st-hero-top">
          <div class="st-hero-logo">${brandLogoHtml(input, 'height:32px;filter:brightness(10);')}</div>
          <div class="st-hero-meta">
            <div class="st-hero-prospect">${prospect.companyName}</div>
            <div>${dateStr}</div>
          </div>
        </div>
        <div class="st-hero-overline">A ${prospect.industry || 'Transformation'} Story</div>
        <h1 class="st-hero-title">${title}</h1>
        <p class="st-hero-subtitle">How ${prospect.companyName} partnered with ${companyName} to achieve transformative results${prospect.industry ? ' in ' + prospect.industry : ''}.</p>
        <div class="st-hero-byline">By ${companyName} &middot; ${dateStr}</div>
      </div>

      <div class="st-photo-band"></div>

      ${sectionsHtml}

      <footer class="st-footer">
        <div class="st-footer-end">The End</div>
        <div class="st-footer-divider"></div>
        <div class="st-footer-info">
          <span class="st-footer-company">${companyName}</span>${input.companyDescription ? ' | ' + input.companyDescription : ''}<br/>
          Prepared for ${prospect.companyName} &middot; ${dateStr}
        </div>
      </footer>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Nunito', ...brandFonts(brand)],
  });
}

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="background:linear-gradient(135deg,${accentColor},#333);padding:10px 12px 8px;color:#fff;">
      <div style="font-size:5px;letter-spacing:1px;text-transform:uppercase;opacity:0.6;margin-bottom:3px;">A STORY</div>
      <div style="width:70%;height:7px;background:#fff;opacity:0.9;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:45%;height:4px;background:#fff;opacity:0.5;border-radius:2px;"></div>
    </div>
    <div style="height:3px;background:linear-gradient(to right,${accentColor},transparent);"></div>
    <div style="padding:6px 12px;">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
        <div style="flex:1;height:1px;background:#eee;"></div>
        <div style="font-size:6px;color:${accentColor};font-weight:700;letter-spacing:1px;">CH 01</div>
        <div style="flex:1;height:1px;background:#eee;"></div>
      </div>
      <div style="width:50%;height:5px;background:#222;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:90%;height:3px;background:#ddd;border-radius:2px;margin-bottom:2px;"></div>
      <div style="width:75%;height:3px;background:#ddd;border-radius:2px;margin-bottom:5px;"></div>
      <div style="background:${accentColor}11;border-radius:4px;padding:5px 6px;">
        <div style="width:70%;height:3px;background:#bbb;border-radius:2px;margin-bottom:2px;"></div>
        <div style="width:50%;height:3px;background:${accentColor};border-radius:2px;opacity:0.5;"></div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;background:#fafafa;">Storytelling</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style25Storytelling: DocumentStyle = {
  id: 'style-25',
  name: 'Storytelling',
  category: 'creative',
  description: 'Narrative arc — customer scenario, solution, transformation chapters',
  keywords: ['story', 'narrative', 'chapters', 'case-study', 'journalism'],
  render,
  thumbnail,
};

export default style25Storytelling;
