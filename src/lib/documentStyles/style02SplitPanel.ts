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
  }));
  const stats = extractStats(cleanSections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accent = brand.accent || brand.primary;
  const primary = brand.primary;
  const primaryDark = darken(primary, 0.1);
  const accentLight = lighten(accent, 0.85);
  const textOnPrimary = contrastText(primary);
  const textOnPrimaryMuted = textOnPrimary === '#FFFFFF' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)';
  const textOnPrimaryFaint = textOnPrimary === '#FFFFFF' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';

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

    /* ── Layout: split panel ── */
    .split-wrapper {
      display: flex;
      min-height: 100vh;
      max-width: 8.5in;
      margin: 0 auto;
    }

    /* ── Left panel ── */
    .panel-left {
      width: 35%;
      background: ${primary};
      color: ${textOnPrimary};
      padding: 56px 36px 40px;
      display: flex;
      flex-direction: column;
      position: relative;
      min-height: 100vh;
    }
    .panel-left::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      background: ${darken(primary, 0.15)};
    }

    /* Logo */
    .panel-logo {
      margin-bottom: 48px;
    }
    .panel-logo img {
      max-height: 32px;
      width: auto;
      filter: brightness(0) invert(${textOnPrimary === '#FFFFFF' ? '1' : '0'});
    }
    .panel-logo .wordmark {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    /* Doc meta on left panel */
    .panel-doc-type {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${textOnPrimaryMuted};
      margin-bottom: 10px;
    }
    .panel-doc-title {
      font-size: 20px;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 8px;
      color: ${textOnPrimary};
    }
    .panel-prospect {
      font-size: 12px;
      color: ${textOnPrimaryMuted};
      margin-bottom: 8px;
    }
    .panel-date {
      font-size: 11px;
      color: ${textOnPrimaryFaint};
      margin-bottom: 40px;
    }
    .panel-accent-line {
      width: 32px;
      height: 2px;
      background: ${accent};
      margin-bottom: 36px;
    }

    /* Prospect logo */
    .panel-prospect-logo {
      margin-bottom: 40px;
    }
    .panel-prospect-logo img {
      max-height: 24px;
      width: auto;
      opacity: 0.8;
    }

    /* Stats in left panel */
    .panel-stats {
      margin-bottom: 40px;
    }
    .panel-stat {
      margin-bottom: 28px;
    }
    .panel-stat-value {
      font-size: 32px;
      font-weight: 700;
      color: ${textOnPrimary};
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .panel-stat-label {
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${textOnPrimaryMuted};
      margin-top: 6px;
    }

    /* Section nav */
    .panel-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .panel-nav-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 10px 0;
    }
    .panel-nav-dot {
      width: 8px;
      height: 8px;
      border: 2px solid ${textOnPrimaryFaint};
      border-radius: 0;
      flex-shrink: 0;
      margin-top: 3px;
    }
    .panel-nav-label {
      font-size: 11px;
      color: ${textOnPrimaryMuted};
      line-height: 1.3;
      font-weight: 400;
    }

    /* Left panel footer */
    .panel-footer {
      margin-top: auto;
      padding-top: 32px;
      font-size: 9px;
      color: ${textOnPrimaryFaint};
      letter-spacing: 0.04em;
    }

    /* ── Right panel ── */
    .panel-right {
      width: 65%;
      background: #fff;
      padding: 56px 52px 48px;
      min-height: 100vh;
    }

    /* Sections */
    .section {
      margin-bottom: 48px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: ${primary};
      margin-bottom: 20px;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .section-body {
      font-size: 13px;
      color: #444;
      line-height: 1.75;
    }
    .section-body p {
      margin-bottom: 16px;
    }
    .section-body h1 {
      font-size: 22px;
      font-weight: 700;
      color: #111;
      margin: 32px 0 12px;
    }
    .section-body h2 {
      font-size: 18px;
      font-weight: 600;
      color: ${primary};
      margin: 28px 0 12px;
    }
    .section-body h3 {
      font-size: 15px;
      font-weight: 600;
      color: #222;
      margin: 24px 0 10px;
    }
    .section-body h4 {
      font-size: 13px;
      font-weight: 600;
      color: #444;
      margin: 20px 0 8px;
    }
    .section-body strong {
      font-weight: 600;
      color: #222;
    }
    .section-body em {
      font-style: italic;
    }

    /* Square bullets */
    .section-body ul, .section-body ol {
      padding-left: 0;
      margin: 14px 0;
      list-style: none;
    }
    .section-body li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 10px;
      line-height: 1.7;
    }
    .section-body ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
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
      position: absolute;
      left: 0;
      top: 0;
      font-size: 11px;
      font-weight: 700;
      color: ${accent};
    }
    .section-body hr {
      border: none;
      border-top: 1px solid #f0f0f0;
      margin: 32px 0;
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
      padding: 10px 14px;
      font-weight: 600;
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${darken(primary, 0.1)};
      background: ${accentLight};
      border-bottom: 2px solid ${primary};
    }
    .section-body tbody td {
      padding: 10px 14px;
      border-bottom: 1px solid #f3f3f3;
      color: #444;
    }
    .section-body tbody tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Section divider */
    .section-divider {
      height: 1px;
      background: #f0f0f0;
      margin-bottom: 48px;
    }

    /* Right panel footer */
    .right-footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #ccc;
    }

    /* ── Print ── */
    @media print {
      .panel-left {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 35%;
      }
      .panel-right {
        margin-left: 35%;
      }
    }
  `;

  // Logo HTML
  let logoHtml = '';
  if (logoBase64) {
    logoHtml = `<img src="${logoBase64}" alt="${companyName}"/>`;
  } else {
    logoHtml = `<span class="wordmark">${companyName}</span>`;
  }

  const body = `
    <div class="split-wrapper">
      <!-- Left Panel -->
      <div class="panel-left">
        <div class="panel-logo">${logoHtml}</div>
        <div class="panel-doc-type">${stripEmojis(contentType)}</div>
        <div class="panel-doc-title">${stripEmojis(contentType)} for ${prospect.companyName}</div>
        <div class="panel-prospect">${prospect.industry || ''}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
        <div class="panel-date">${dateStr}</div>
        <div class="panel-accent-line"></div>

        ${prospectLogoBase64 ? `<div class="panel-prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}"/></div>` : ''}

        <!-- Stats -->
        ${stats.length > 0 ? `
        <div class="panel-stats">
          ${stats.map(s => `
          <div class="panel-stat">
            <div class="panel-stat-value">${s.value}</div>
            <div class="panel-stat-label">${s.label}</div>
          </div>`).join('')}
        </div>` : ''}

        <!-- Section Nav -->
        <div class="panel-nav">
          ${cleanSections.map(s => `
          <div class="panel-nav-item">
            <div class="panel-nav-dot"></div>
            <div class="panel-nav-label">${s.title}</div>
          </div>`).join('')}
        </div>

        <div class="panel-footer">${companyName} &middot; Confidential</div>
      </div>

      <!-- Right Panel -->
      <div class="panel-right">
        ${cleanSections.map((s, i) => `
        ${i > 0 ? '<div class="section-divider"></div>' : ''}
        <div class="section">
          <h2 class="section-title">${s.title}</h2>
          <div class="section-body">${formatMarkdown(s.content)}</div>
        </div>`).join('')}

        <div class="right-footer">
          <span>${companyName}</span>
          <span>${dateStr}</span>
        </div>
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
  const textColor = contrastText(accentColor);
  const mutedColor = textColor === '#FFFFFF' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const faintColor = textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';

  return `<div style="width:1000px;height:1294px;display:flex;font-family:'Inter',sans-serif;box-sizing:border-box;">
  <!-- Left panel -->
  <div style="width:35%;background:${accentColor};padding:48px 32px;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="width:48px;height:9px;background:${faintColor};border-radius:2px;margin-bottom:44px;"></div>
    <div style="font-size:8px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${mutedColor};margin-bottom:8px;">Case Study</div>
    <div style="font-size:17px;font-weight:600;color:${textColor};line-height:1.3;margin-bottom:6px;">Document Title</div>
    <div style="font-size:10px;color:${mutedColor};margin-bottom:6px;">Technology &middot; Enterprise</div>
    <div style="font-size:9px;color:${faintColor};margin-bottom:28px;">April 2026</div>
    <div style="width:28px;height:2px;background:${lighten(accentColor, 0.3)};margin-bottom:32px;"></div>

    <!-- Stats -->
    <div style="margin-bottom:32px;">
      <div style="margin-bottom:20px;">
        <div style="font-size:28px;font-weight:700;color:${textColor};line-height:1;">47%</div>
        <div style="font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:${mutedColor};margin-top:4px;">Growth</div>
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-size:28px;font-weight:700;color:${textColor};line-height:1;">$2.4M</div>
        <div style="font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:${mutedColor};margin-top:4px;">Revenue</div>
      </div>
    </div>

    <!-- Nav -->
    ${[1, 2, 3, 4].map(() => `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;"><div style="width:6px;height:6px;border:2px solid ${faintColor};flex-shrink:0;"></div><div style="font-size:9px;color:${mutedColor};">Section</div></div>`).join('\n    ')}
  </div>

  <!-- Right panel -->
  <div style="width:65%;background:#fff;padding:48px 44px;box-sizing:border-box;">
    <div style="font-size:15px;font-weight:600;color:${accentColor};margin-bottom:16px;">Section Title</div>
    <div style="height:7px;background:#f3f3f3;border-radius:2px;width:100%;margin-bottom:7px;"></div>
    <div style="height:7px;background:#f3f3f3;border-radius:2px;width:90%;margin-bottom:7px;"></div>
    <div style="height:7px;background:#f3f3f3;border-radius:2px;width:95%;margin-bottom:7px;"></div>
    <div style="height:7px;background:#f3f3f3;border-radius:2px;width:82%;margin-bottom:36px;"></div>
    <div style="height:1px;background:#f0f0f0;margin-bottom:36px;"></div>
    <div style="font-size:15px;font-weight:600;color:${accentColor};margin-bottom:16px;">Next Section</div>
    <div style="height:7px;background:#f3f3f3;border-radius:2px;width:100%;margin-bottom:7px;"></div>
    <div style="height:7px;background:#f3f3f3;border-radius:2px;width:88%;margin-bottom:7px;"></div>
    <div style="height:7px;background:#f3f3f3;border-radius:2px;width:93%;margin-bottom:7px;"></div>

    <!-- Table preview -->
    <div style="margin-top:36px;border:1px solid #f0f0f0;border-radius:0;">
      <div style="display:flex;background:${lighten(accentColor, 0.92)};padding:8px 12px;border-bottom:2px solid ${accentColor};">
        <div style="flex:1;font-size:8px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${darken(accentColor, 0.1)};">Column</div>
        <div style="flex:1;font-size:8px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${darken(accentColor, 0.1)};">Column</div>
      </div>
      ${[1, 2, 3].map((_, i) => `<div style="display:flex;padding:8px 12px;border-bottom:1px solid #f5f5f5;${i % 2 === 1 ? 'background:#fafafa;' : ''}"><div style="flex:1;height:6px;background:#eee;border-radius:1px;width:60%;margin-top:2px;"></div><div style="flex:1;height:6px;background:#eee;border-radius:1px;width:50%;margin-top:2px;"></div></div>`).join('\n      ')}
    </div>
  </div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style02SplitPanel: DocumentStyle = {
  id: 'style-02',
  name: 'Split Panel',
  category: 'clean',
  description: 'Two-panel layout with accent sidebar navigation and clean content area',
  keywords: ['split', 'sidebar', 'panel', 'navigation', 'two-column', 'modern', 'professional'],
  render,
  thumbnail,
};

export default style02SplitPanel;
