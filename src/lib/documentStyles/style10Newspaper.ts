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
  return stats.slice(0, 3);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager support
  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const accent = brand.accent || brand.primary;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const contentTypeLabel = stripEmojis(contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  const volumeDate = new Date();
  const volumeStr = `VOL. ${volumeDate.getFullYear() - 2020}, NO. ${volumeDate.getMonth() + 1}`;

  // Build sections: first section gets a lead paragraph (no columns), rest get columns
  const sectionsHtml = sections.map((s, i) => {
    const cleanTitle = stripEmojis(s.title);
    const cleanContent = stripEmojis(s.content);
    const isFirst = i === 0;

    // Insert a pull-quote stat for section 2 and 4 if available
    const pullStat = (i === 1 && stats.length > 1)
      ? `<div class="pull-quote-block">
           <div class="pull-quote-mark">&ldquo;</div>
           <div class="pull-quote-value">${stats[1].value}</div>
           <div class="pull-quote-label">${stats[1].label}</div>
           <div class="pull-quote-mark pull-quote-mark-close">&rdquo;</div>
         </div>`
      : '';

    return `
    <div class="article-section ${isFirst ? 'article-lead' : ''}">
      <div class="section-rule"></div>
      <h2 class="section-headline">${cleanTitle}</h2>
      ${isFirst && stats.length > 0 ? `
        <div class="sidebar-stats">
          ${stats.map(st => `
            <div class="sidebar-stat">
              <div class="sidebar-stat-value">${st.value}</div>
              <div class="sidebar-stat-label">${st.label}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div class="section-body ${isFirst ? 'lead-body' : 'columned'}">
        ${pullStat}
        ${formatMarkdown(cleanContent)}
      </div>
    </div>`;
  }).join('');

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0.5in 0.6in;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; max-width: none; }
      .article-section { break-inside: avoid; }
    }

    ${professionalSymbolCSS(accent)}

    body {
      font-family: Georgia, 'Times New Roman', 'Noto Serif', serif;
      color: #1a1a1a;
      background: #FAFAF5;
      line-height: 1.65;
      font-size: var(--brand-font-body-size);
    }

    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 36px 48px;
    }

    /* ── Nameplate / Masthead ──────────────────── */
    .nameplate {
      text-align: center;
      padding-bottom: 12px;
      margin-bottom: 0;
      border-bottom: 4px solid #111;
      position: relative;
    }
    .nameplate::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 1px;
      background: #111;
    }
    .nameplate-logo {
      margin-bottom: 6px;
    }
    .nameplate-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 52px;
      font-weight: 700;
      color: #111;
      line-height: 1;
      letter-spacing: -0.02em;
      margin-bottom: 0;
      text-transform: uppercase;
    }
    .nameplate-accent {
      display: inline-block;
      color: ${accent};
    }

    /* ── Dateline ──────────────────────────────── */
    .dateline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 10px 0;
      margin-top: 10px;
      border-bottom: 1px solid #ccc;
      margin-bottom: 20px;
      font-family: Georgia, serif;
    }
    .dateline-center {
      font-weight: 700;
      color: #111;
    }

    /* ── Main Headline ─────────────────────────── */
    .main-headline {
      text-align: center;
      margin-bottom: 6px;
      padding-bottom: 16px;
    }
    .main-headline h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: calc(var(--brand-font-h1-size) + 8px);
      font-weight: 700;
      color: #111;
      line-height: 1.1;
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }
    .main-headline .deck {
      font-family: Georgia, serif;
      font-size: 16px;
      color: #555;
      font-style: italic;
      line-height: 1.4;
    }
    .headline-rule {
      border: none;
      border-top: 1px solid #ccc;
      margin: 0 auto 24px;
      width: 100%;
    }

    /* ── Sidebar Stats ─────────────────────────── */
    .sidebar-stats {
      float: right;
      width: 180px;
      margin: 0 0 16px 24px;
      padding: 16px;
      border: 1px solid #ddd;
      border-top: 3px solid #111;
      background: #fafafa;
    }
    .sidebar-stat {
      text-align: center;
      padding: 12px 0;
      border-bottom: 1px solid #ddd;
    }
    .sidebar-stat:last-child {
      border-bottom: none;
    }
    .sidebar-stat-value {
      font-family: Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: #111;
      line-height: 1;
    }
    .sidebar-stat-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #888;
      margin-top: 4px;
    }

    /* ── Article Sections ──────────────────────── */
    .article-section {
      margin-bottom: 28px;
      position: relative;
    }
    .section-rule {
      border: none;
      border-top: 2px solid #111;
      margin-bottom: 10px;
    }
    .section-headline {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: var(--brand-font-h2-size);
      font-weight: 800;
      text-transform: uppercase;
      color: #111;
      margin-bottom: 12px;
      letter-spacing: 0.03em;
      line-height: 1.2;
    }

    /* ── Column layout ─────────────────────────── */
    .columned {
      column-count: 2;
      column-gap: 32px;
      column-rule: 1px solid #ddd;
    }
    .lead-body {
      font-size: calc(var(--brand-font-body-size) + 1px);
    }
    .section-body p {
      margin-bottom: 12px;
      text-align: justify;
      hyphens: auto;
    }

    /* ── Pull Quote ────────────────────────────── */
    .pull-quote-block {
      column-span: all;
      text-align: center;
      padding: 20px 32px;
      margin: 16px 0;
      border-top: 2px solid #111;
      border-bottom: 2px solid #111;
      position: relative;
    }
    .pull-quote-mark {
      font-family: Georgia, serif;
      font-size: 48px;
      color: ${accent};
      line-height: 0.5;
      opacity: 0.6;
      display: inline-block;
      vertical-align: top;
    }
    .pull-quote-mark-close {
      vertical-align: bottom;
    }
    .pull-quote-value {
      font-family: Georgia, serif;
      font-size: 36px;
      font-weight: 700;
      color: #111;
      display: inline-block;
      margin: 0 12px;
      line-height: 1;
    }
    .pull-quote-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #888;
      margin-top: 8px;
    }

    /* ── Section body typography ────────────────── */
    .section-body h1, .section-body h2 {
      font-family: Georgia, 'Times New Roman', serif;
      color: #111;
      margin: 18px 0 10px;
      font-size: 20px;
      font-weight: 700;
      column-span: all;
    }
    .section-body h3, .section-body h4 {
      font-family: Georgia, serif;
      color: #333;
      margin: 14px 0 8px;
      font-size: 16px;
      font-weight: 700;
    }
    .section-body strong {
      font-weight: 700;
    }
    .section-body em {
      font-style: italic;
    }
    .section-body ul, .section-body ol {
      padding-left: 20px;
      margin: 10px 0;
    }
    .section-body li {
      margin-bottom: 5px;
      line-height: 1.55;
    }
    .section-body hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 16px 0;
      column-span: all;
    }

    /* ── Tables ─────────────────────────────────── */
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 12px;
      column-span: all;
      font-family: Georgia, serif;
    }
    .section-body thead tr {
      border-bottom: 2px solid #333;
    }
    .section-body th {
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #111;
      border-bottom: 2px solid #333;
    }
    .section-body tbody tr:nth-child(even) {
      background: #f5f5f0;
    }
    .section-body td {
      padding: 7px 10px;
      border-bottom: 1px solid #ddd;
      color: #333;
    }

    /* ── Footer ─────────────────────────────────── */
    .footer {
      margin-top: 32px;
      padding-top: 10px;
      border-top: 3px double #111;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #999;
      letter-spacing: 0.04em;
      font-family: Georgia, serif;
    }
    .footer-left {
      max-width: 40%;
    }
    .footer-center {
      text-align: center;
      font-style: italic;
    }
    .footer-right {
      text-align: right;
    }
  `;

  const body = `
    <div class="page">
      <div class="nameplate">
        <div class="nameplate-logo">${brandLogoHtml(input, 'height:24px;')}</div>
        <div class="nameplate-title">${companyName.toUpperCase()}</div>
      </div>

      <div class="dateline">
        <span>${volumeStr}</span>
        <span class="dateline-center">${dateStr.toUpperCase()}</span>
        <span>${(prospect.industry || 'Industry Intelligence').toUpperCase()}</span>
      </div>

      <div class="main-headline">
        <h1>${contentTypeLabel} for ${prospect.companyName}</h1>
        <div class="deck">Prepared exclusively for ${prospect.companyName}${prospect.companySize ? ' &mdash; ' + prospect.companySize : ''} &mdash; ${prospect.industry || 'Strategic Analysis'}</div>
      </div>
      <hr class="headline-rule" />

      ${sectionsHtml}

      <div class="footer">
        <div class="footer-left">${companyName}${input.companyDescription ? ' &mdash; ' + stripEmojis(input.companyDescription) : ''}</div>
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
  return `<div style="width:100%;height:100%;background:#FAFAF5;border-radius:6px;overflow:hidden;font-family:Georgia,serif;padding:10px 12px;">
    <div style="text-align:center;border-bottom:3px double #111;padding-bottom:6px;margin-bottom:6px;">
      <div style="font-size:16px;font-weight:700;color:#111;">THE DAILY</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:5px;color:#888;text-transform:uppercase;margin-bottom:6px;">
      <span>Report</span><span>Today</span>
    </div>
    <div style="font-size:9px;font-weight:700;color:#111;text-align:center;margin-bottom:6px;">Headline Goes Here</div>
    <div style="column-count:3;column-gap:6px;column-rule:1px solid #ddd;">
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="text-align:center;font-size:10px;font-weight:800;color:${accentColor};padding:3px 0;border-top:1px solid #111;border-bottom:1px solid #111;column-span:all;margin:4px 0;">47%</div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style10Newspaper: DocumentStyle = {
  id: 'style-10',
  name: 'Newspaper',
  category: 'bold',
  description: 'Multi-column newspaper layout with masthead and pull statistics',
  keywords: ['newspaper', 'columns', 'masthead', 'serif', 'authoritative'],
  render,
  thumbnail,
};

export default style10Newspaper;
