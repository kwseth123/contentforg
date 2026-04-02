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

// ── Pull quote extraction ───────────────────────────────────

function extractPullQuote(content: string): string | null {
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 30 && s.length < 150);
  const ranked = sentences.map(s => {
    let score = 0;
    if (/\d+%/.test(s)) score += 3;
    if (/\$[\d,.]+/.test(s)) score += 3;
    if (/\d+x/i.test(s)) score += 2;
    if (/transform|increase|improve|grow|boost|accelerat|driv|enabl|achiev/i.test(s)) score += 2;
    return { text: s, score };
  }).sort((a, b) => b.score - a.score);
  return ranked.length > 0 && ranked[0].score > 0 ? ranked[0].text : null;
}

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
  })).filter(s => s.content && s.content.trim().length > 0);
  const stats = extractStats(cleanSections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accent = brand.accent || brand.primary;
  const primary = brand.primary;
  const accentLight = lighten(accent, 0.92);
  const { r, g, b } = hexToRgb(accent);

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
      font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #333;
      background: #fff;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    /* ── Page wrapper ── */
    .magazine-page {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
    }

    /* ── Header bar ── */
    .mag-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 48px;
      border-bottom: 1px solid #eee;
      background: #fff;
    }
    .mag-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .mag-header-left img {
      height: 28px;
      width: auto;
    }
    .mag-header-left .sep {
      width: 1px;
      height: 20px;
      background: #ddd;
    }
    .mag-header-left .brand-name {
      font-weight: 700;
      font-size: 14px;
      color: #111;
    }
    .mag-header-right {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 11px;
      color: #999;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    /* ── Hero section ── */
    .mag-hero {
      padding: 56px 48px 48px;
      background: #fff;
    }
    .mag-hero .hero-meta {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 16px;
    }
    .mag-hero h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 40px;
      font-weight: 900;
      color: #111;
      line-height: 1.15;
      margin-bottom: 16px;
      max-width: 85%;
    }
    .mag-hero .hero-accent-line {
      width: 56px;
      height: 3px;
      background: ${accent};
      margin-bottom: 20px;
    }
    .mag-hero .hero-subtitle {
      font-size: 17px;
      color: #666;
      font-weight: 300;
      line-height: 1.5;
      max-width: 65%;
    }

    /* ── Stats grid ── */
    .mag-stats {
      display: grid;
      grid-template-columns: repeat(${Math.min(stats.length, 4)}, 1fr);
      gap: 0;
      margin: 0 48px 0;
      border-top: 2px solid #111;
      border-bottom: 1px solid #eee;
    }
    .mag-stat {
      padding: 28px 24px;
      text-align: center;
      border-right: 1px solid #eee;
    }
    .mag-stat:last-child {
      border-right: none;
    }
    .mag-stat-value {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 900;
      color: #111;
      line-height: 1;
    }
    .mag-stat-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #999;
      margin-top: 8px;
    }

    /* ── Content grid ── */
    .mag-content {
      padding: 0 48px;
    }

    /* First section: full-width multi-column */
    .mag-section-intro {
      padding: 48px 0;
      border-bottom: 1px solid #eee;
    }
    .mag-section-intro .section-body {
      columns: 2;
      column-gap: 40px;
    }
    .mag-section-intro .section-body p {
      break-inside: avoid;
    }

    /* Grid layout for middle sections */
    .mag-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    .mag-grid-item {
      padding: 40px 32px 40px 0;
      border-bottom: 1px solid #eee;
      overflow: hidden;
      overflow-wrap: break-word;
      word-wrap: break-word;
      page-break-inside: avoid;
    }
    .mag-grid-item:nth-child(even) {
      padding: 40px 0 40px 32px;
      border-left: 1px solid #eee;
    }
    .mag-grid-item.full-width {
      grid-column: 1 / -1;
      padding: 40px 0;
    }

    /* Alternating background sections */
    .mag-section-alt {
      background: #f9fafb;
      margin: 0 -48px;
      padding: 48px 48px;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
    }

    /* Section titles */
    .mag-section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      color: #111;
      margin-bottom: 20px;
      line-height: 1.25;
    }

    /* Pull quotes */
    .mag-pullquote {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      font-style: italic;
      color: #444;
      line-height: 1.4;
      padding: 32px 0 32px 24px;
      border-left: 3px solid ${accent};
      margin: 32px 0;
      position: relative;
    }
    .mag-pullquote::before {
      content: '\\201C';
      position: absolute;
      top: 16px;
      left: 24px;
      font-size: 56px;
      color: rgba(${r}, ${g}, ${b}, 0.15);
      font-family: 'Playfair Display', Georgia, serif;
      line-height: 1;
    }

    /* Section body typography */
    .section-body p {
      margin-bottom: 14px;
      color: #444;
      line-height: 1.7;
    }
    .section-body h1, .section-body h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      color: #111;
      margin: 28px 0 12px;
    }
    .section-body h2 { font-size: 20px; }
    .section-body h3 {
      font-size: 16px;
      font-weight: 600;
      color: #222;
      margin: 24px 0 10px;
    }
    .section-body h4 {
      font-size: 13px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 20px 0 8px;
    }
    .section-body strong { font-weight: 600; color: #222; }
    .section-body em { font-style: italic; }

    /* Lists */
    .section-body ul, .section-body ol {
      padding-left: 0;
      margin: 14px 0;
      list-style: none;
    }
    .section-body li {
      position: relative;
      padding-left: 18px;
      margin-bottom: 8px;
      line-height: 1.65;
      color: #444;
    }
    .section-body ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${accent};
    }
    .section-body ol {
      counter-reset: item;
    }
    .section-body ol li {
      counter-increment: item;
    }
    .section-body ol li::before {
      content: counter(item);
      background: none;
      width: auto;
      height: auto;
      border-radius: 0;
      font-size: 11px;
      font-weight: 700;
      color: ${accent};
      top: 0;
    }
    .section-body hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 28px 0;
    }

    /* Tables */
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }
    .section-body thead th {
      text-align: left;
      padding: 12px 14px;
      font-weight: 600;
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #666;
      background: ${accentLight};
      border-bottom: 2px solid ${accent};
    }
    .section-body tbody td {
      padding: 11px 14px;
      border-bottom: 1px solid #f0f0f0;
      color: #444;
    }
    .section-body tbody tr:nth-child(even) td {
      background: #f9fafb;
    }

    /* ── Footer ── */
    .mag-footer {
      background: #111;
      color: #fff;
      padding: 24px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      margin-top: 48px;
    }
    .mag-footer-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .mag-footer-left img {
      height: 20px;
      width: auto;
      filter: brightness(0) invert(1);
    }
    .mag-footer-left .footer-text {
      opacity: 0.7;
    }
    .mag-footer-right {
      opacity: 0.5;
    }

    /* ── Print ── */
    @media print {
      .magazine-page { max-width: none; }
      .mag-section-alt { margin: 0 -48px; }
      .mag-grid-item {
        page-break-inside: avoid;
      }
      .mag-section-intro, .mag-section-alt {
        page-break-inside: avoid;
      }
      .mag-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
      }
    }
  `;

  // Build sections with magazine layout
  const introSection = cleanSections.length > 0 ? cleanSections[0] : null;
  const remainingSections = cleanSections.slice(1);

  // Split remaining into pairs for the grid and singles for alt sections
  const gridPairs: typeof cleanSections[] = [];
  const altSections: typeof cleanSections[0][] = [];
  remainingSections.forEach((s, i) => {
    if (i % 3 < 2) {
      const pairIdx = Math.floor(i / 3);
      if (!gridPairs[pairIdx]) gridPairs[pairIdx] = [];
      gridPairs[pairIdx].push(s);
    } else {
      altSections.push(s);
    }
  });

  let sectionsHtml = '';

  // Intro section: full-width columns
  if (introSection) {
    sectionsHtml += `
    <div class="mag-section-intro">
      <div class="section-body">${formatMarkdown(introSection.content)}</div>
    </div>`;
  }

  // Interleave grid pairs and alt sections
  for (let i = 0; i < Math.max(gridPairs.length, altSections.length); i++) {
    if (gridPairs[i]) {
      sectionsHtml += `
      <div class="mag-grid">
        ${gridPairs[i].map((s, j) => {
          const pullQuote = extractPullQuote(s.content);
          return `
          <div class="mag-grid-item">
            <h3 class="mag-section-title">${s.title}</h3>
            ${pullQuote ? `<div class="mag-pullquote">${pullQuote}</div>` : ''}
            <div class="section-body">${formatMarkdown(s.content)}</div>
          </div>`;
        }).join('')}
        ${gridPairs[i].length === 1 ? '<div class="mag-grid-item"></div>' : ''}
      </div>`;
    }

    if (altSections[i]) {
      sectionsHtml += `
      <div class="mag-section-alt">
        <h3 class="mag-section-title">${altSections[i].title}</h3>
        <div class="section-body">${formatMarkdown(altSections[i].content)}</div>
      </div>`;
    }
  }

  // Logo
  let headerLogoHtml = '';
  if (logoBase64) {
    headerLogoHtml = `<img src="${logoBase64}" alt="${companyName}"/>`;
  } else {
    headerLogoHtml = `<span class="brand-name">${companyName}</span>`;
  }

  const body = `
    <div class="magazine-page">
      <!-- Header -->
      <div class="mag-header">
        <div class="mag-header-left">
          ${headerLogoHtml}
          ${logoBase64 && prospectLogoBase64 ? '<div class="sep"></div>' : ''}
          ${prospectLogoBase64 ? `<img src="${prospectLogoBase64}" alt="${prospect.companyName}" style="height:24px;"/>` : ''}
        </div>
        <div class="mag-header-right">
          <span>${stripEmojis(contentType)}</span>
          <span>${dateStr}</span>
        </div>
      </div>

      <!-- Hero -->
      <div class="mag-hero">
        <div class="hero-meta">${stripEmojis(contentType)}</div>
        <h1>${stripEmojis(contentType)} for ${prospect.companyName}</h1>
        <div class="hero-accent-line"></div>
        ${prospect.industry ? `<div class="hero-subtitle">${prospect.industry}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>` : ''}
      </div>

      <!-- Stats -->
      ${stats.length > 0 ? `
      <div class="mag-stats">
        ${stats.map(s => `
        <div class="mag-stat">
          <div class="mag-stat-value">${s.value}</div>
          <div class="mag-stat-label">${s.label}</div>
        </div>`).join('')}
      </div>` : ''}

      <!-- Content -->
      <div class="mag-content">
        ${sectionsHtml}
      </div>

      <!-- Footer -->
      <div class="mag-footer">
        <div class="mag-footer-left">
          ${logoBase64 ? `<img src="${logoBase64}" alt="${companyName}"/>` : ''}
          <span class="footer-text">${companyName} &middot; Prepared for ${prospect.companyName}</span>
        </div>
        <div class="mag-footer-right">${dateStr}</div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${contentType} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Playfair Display', 'Source Sans 3'],
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const { r, g, b } = hexToRgb(accentColor);
  return `<div style="width:1000px;height:1294px;background:#fff;font-family:Georgia,serif;box-sizing:border-box;display:flex;flex-direction:column;">
  <!-- Header bar -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 40px;border-bottom:1px solid #eee;">
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="width:36px;height:9px;background:#ddd;border-radius:2px;"></div>
      <div style="width:1px;height:16px;background:#ddd;"></div>
      <div style="width:30px;height:9px;background:#ddd;border-radius:2px;"></div>
    </div>
    <div style="font-size:8px;color:#bbb;text-transform:uppercase;letter-spacing:0.06em;">April 2026</div>
  </div>

  <!-- Hero -->
  <div style="padding:44px 40px 36px;">
    <div style="font-size:8px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${accentColor};margin-bottom:12px;">Case Study</div>
    <div style="font-size:34px;font-weight:900;color:#111;line-height:1.15;margin-bottom:12px;">Magazine-Style<br/>Document Title</div>
    <div style="width:48px;height:3px;background:${accentColor};margin-bottom:14px;"></div>
    <div style="font-size:12px;color:#888;">Technology &middot; Enterprise</div>
  </div>

  <!-- Stats bar -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;margin:0 40px;border-top:2px solid #111;border-bottom:1px solid #eee;">
    <div style="padding:20px;text-align:center;border-right:1px solid #eee;">
      <div style="font-size:28px;font-weight:900;color:#111;line-height:1;">47%</div>
      <div style="font-size:8px;letter-spacing:0.08em;text-transform:uppercase;color:#999;margin-top:6px;">Growth</div>
    </div>
    <div style="padding:20px;text-align:center;border-right:1px solid #eee;">
      <div style="font-size:28px;font-weight:900;color:#111;line-height:1;">$2.4M</div>
      <div style="font-size:8px;letter-spacing:0.08em;text-transform:uppercase;color:#999;margin-top:6px;">Revenue</div>
    </div>
    <div style="padding:20px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#111;line-height:1;">3x</div>
      <div style="font-size:8px;letter-spacing:0.08em;text-transform:uppercase;color:#999;margin-top:6px;">ROI</div>
    </div>
  </div>

  <!-- Two column intro -->
  <div style="padding:32px 40px;border-bottom:1px solid #eee;">
    <div style="columns:2;column-gap:28px;">
      <div style="height:7px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:7px;"></div>
      <div style="height:7px;background:#f0f0f0;border-radius:2px;width:90%;margin-bottom:7px;"></div>
      <div style="height:7px;background:#f0f0f0;border-radius:2px;width:95%;margin-bottom:7px;"></div>
      <div style="height:7px;background:#f0f0f0;border-radius:2px;width:85%;margin-bottom:7px;"></div>
      <div style="height:7px;background:#f0f0f0;border-radius:2px;width:92%;margin-bottom:7px;"></div>
      <div style="height:7px;background:#f0f0f0;border-radius:2px;width:88%;margin-bottom:7px;"></div>
    </div>
  </div>

  <!-- Grid sections -->
  <div style="display:grid;grid-template-columns:1fr 1fr;padding:0 40px;">
    <div style="padding:28px 24px 28px 0;border-right:1px solid #eee;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:12px;">Section One</div>
      <div style="font-size:14px;font-style:italic;color:#555;padding-left:14px;border-left:3px solid ${accentColor};line-height:1.3;margin-bottom:12px;">Pull quote text here</div>
      <div style="height:6px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:6px;"></div>
      <div style="height:6px;background:#f0f0f0;border-radius:2px;width:88%;margin-bottom:6px;"></div>
    </div>
    <div style="padding:28px 0 28px 24px;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:12px;">Section Two</div>
      <div style="height:6px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:6px;"></div>
      <div style="height:6px;background:#f0f0f0;border-radius:2px;width:90%;margin-bottom:6px;"></div>
      <div style="height:6px;background:#f0f0f0;border-radius:2px;width:85%;margin-bottom:6px;"></div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;background:#111;color:#fff;padding:18px 40px;display:flex;justify-content:space-between;font-size:9px;">
    <span style="opacity:0.7;">Company Name &middot; Prepared for Client</span>
    <span style="opacity:0.5;">April 2026</span>
  </div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style03MagazineGrid: DocumentStyle = {
  id: 'style-03',
  name: 'Magazine Grid',
  category: 'clean',
  description: 'Editorial magazine layout with asymmetric columns and pull quotes',
  keywords: ['magazine', 'editorial', 'grid', 'columns', 'pull-quote', 'asymmetric', 'elegant'],
  render,
  thumbnail,
};

export default style03MagazineGrid;
