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
  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const accent = brand.accent || brand.primary;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const { r, g, b } = hexToRgb(accent);
  const accentGlow = `rgba(${r},${g},${b},0.3)`;
  const accentGlowStrong = `rgba(${r},${g},${b},0.5)`;
  const accentDim = `rgba(${r},${g},${b},0.15)`;
  const contentTypeLabel = stripEmojis(contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

  const sectionsHtml = sections.map((s, i) => {
    const cleanTitle = stripEmojis(s.title);
    const cleanContent = stripEmojis(s.content);
    return `
    <div class="section${i === 0 ? ' section-first' : ''}">
      <div class="section-accent-bar"></div>
      <div class="section-inner">
        <div class="section-number">${String(i + 1).padStart(2, '0')}</div>
        <h2 class="section-title">${cleanTitle}</h2>
        <div class="section-content">${formatMarkdown(cleanContent)}</div>
      </div>
    </div>`;
  }).join('');

  const statsHtml = stats.length > 0 ? `
    <div class="stats-grid">
      ${stats.map(s => `
        <div class="stat-card">
          <div class="stat-value">${s.value}</div>
          <div class="stat-divider"></div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>` : '';

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
      color: #e0e0e0;
      background: #0a0a0a;
      line-height: 1.7;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .page {
      max-width: 880px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Header ─────────────────────────────────── */
    .header {
      background: #111111;
      border-bottom: 2px solid ${accent};
      padding: 36px 48px 32px;
      margin-bottom: 0;
      position: relative;
      overflow: hidden;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${accent}, transparent);
      box-shadow: 0 0 20px ${accentGlow}, 0 0 40px ${accentDim};
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .header-logo { flex-shrink: 0; }
    .header-logo img { filter: brightness(1.4); }
    .header-meta {
      text-align: right;
      font-size: 12px;
      color: #888;
      line-height: 1.6;
    }
    .header-meta .prospect-name {
      font-weight: 600;
      color: #ffffff;
      font-size: 14px;
    }
    .header-meta .doc-type {
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 4px;
    }
    .header-title-block {
      margin-top: 8px;
    }
    .header-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 10px;
      text-shadow: 0 0 12px ${accentGlow};
    }
    .header-title {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: calc(var(--brand-font-h1-size) + 2px);
      font-weight: 700;
      color: #ffffff;
      line-height: 1.15;
      margin-bottom: 8px;
      letter-spacing: -0.01em;
    }
    .header-subtitle {
      font-size: 14px;
      color: #777;
    }

    /* ── Stats Grid ─────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(${Math.min(stats.length, 4)}, 1fr);
      gap: 16px;
      padding: 32px 48px;
      background: #0e0e0e;
      border-bottom: 1px solid #1a1a1a;
    }
    .stat-card {
      background: #1a1a1a;
      border: 1px solid #252525;
      border-radius: 10px;
      padding: 24px 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 3px;
      background: ${accent};
      border-radius: 0 0 4px 4px;
      box-shadow: 0 0 12px ${accentGlow};
    }
    .stat-value {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: ${accent};
      line-height: 1;
      text-shadow: 0 0 24px ${accentGlowStrong}, 0 0 48px ${accentGlow};
      letter-spacing: -0.02em;
      margin-top: 8px;
    }
    .stat-divider {
      width: 24px;
      height: 1px;
      background: #333;
      margin: 12px auto;
    }
    .stat-label {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #666;
      font-weight: 500;
    }

    /* ── Content Area ───────────────────────────── */
    .content-area {
      padding: 40px 48px 20px;
    }

    /* ── Sections ───────────────────────────────── */
    .section {
      display: flex;
      gap: 0;
      margin-bottom: 36px;
      padding-bottom: 36px;
      border-bottom: 1px solid #1a1a1a;
    }
    .section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
    }
    .section-accent-bar {
      width: 3px;
      min-height: 100%;
      background: linear-gradient(180deg, ${accent}, ${darken(accent, 0.4)});
      border-radius: 3px;
      flex-shrink: 0;
      box-shadow: 0 0 8px ${accentGlow};
    }
    .section-inner {
      padding-left: 24px;
      flex: 1;
      min-width: 0;
    }
    .section-number {
      font-family: var(--brand-font-primary), monospace;
      font-size: 11px;
      font-weight: 600;
      color: #444;
      letter-spacing: 0.1em;
      margin-bottom: 6px;
    }
    .section-title {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
      line-height: 1.25;
    }
    .section-content {
      color: #cccccc;
    }
    .section-content p {
      margin-bottom: 14px;
      line-height: 1.75;
    }

    /* ── Section content typography ─────────────── */
    .section-content h1, .section-content h2 {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      color: #ffffff;
      margin: 28px 0 12px;
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .section-content h3 {
      font-family: var(--brand-font-primary), -apple-system, sans-serif;
      color: #e0e0e0;
      margin: 22px 0 10px;
      font-size: var(--brand-font-h3-size);
      font-weight: 600;
    }
    .section-content h4 {
      color: #bbb;
      margin: 18px 0 8px;
      font-size: 15px;
      font-weight: 600;
    }
    .section-content strong {
      font-weight: 600;
      color: #ffffff;
    }
    .section-content em {
      font-style: italic;
      color: #aaa;
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
      border-top: 1px solid #252525;
      margin: 24px 0;
    }

    /* ── Tables ─────────────────────────────────── */
    .section-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      border-radius: 8px;
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
      color: ${contrastText(accent)};
      border: none;
    }
    .section-content tbody tr:nth-child(odd) {
      background: #141414;
    }
    .section-content tbody tr:nth-child(even) {
      background: #1a1a1a;
    }
    .section-content td {
      padding: 11px 16px;
      color: #ccc;
      border: none;
      border-bottom: 1px solid #222;
    }
    .section-content tbody tr:last-child td {
      border-bottom: none;
    }

    /* ── Visual Break ──────────────────────────── */
    .visual-break {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 40px 0;
      padding: 0 48px;
    }
    .visual-break-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, #333, transparent);
    }
    .visual-break-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${accent};
      box-shadow: 0 0 8px ${accentGlow};
    }

    /* ── Footer ─────────────────────────────────── */
    .footer {
      background: #111111;
      border-top: 1px solid #1a1a1a;
      padding: 24px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #555;
      letter-spacing: 0.03em;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: ${accent};
      box-shadow: 0 0 6px ${accentGlow};
    }
    .footer-center {
      text-align: center;
    }
    .footer-right {
      text-align: right;
    }
    .footer a {
      color: #666;
      text-decoration: none;
    }

    /* ── Print page counter ─────────────────────── */
    @media print {
      .footer-right::after {
        content: counter(page);
      }
    }
  `;

  const body = `
    <div class="page">
      <div class="header">
        <div class="header-top">
          <div class="header-logo">${brandLogoHtml(input, 'height:36px;filter:brightness(1.5);')}</div>
          <div class="header-meta">
            <div class="doc-type">${contentTypeLabel}</div>
            <div class="prospect-name">${prospect.companyName}</div>
            <div>${dateStr}</div>
          </div>
        </div>
        <div class="header-title-block">
          <div class="header-label">${prospect.industry ? prospect.industry.toUpperCase() : 'STRATEGIC OVERVIEW'}</div>
          <h1 class="header-title">${contentTypeLabel} for ${prospect.companyName}</h1>
          <div class="header-subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
        </div>
      </div>

      ${statsHtml}

      <div class="content-area">
        ${sectionsHtml}
      </div>

      <div class="visual-break">
        <div class="visual-break-line"></div>
        <div class="visual-break-dot"></div>
        <div class="visual-break-line"></div>
      </div>

      <div class="footer">
        <div class="footer-left">
          <div class="footer-dot"></div>
          <span>${companyName}</span>
        </div>
        <div class="footer-center">${input.companyDescription ? stripEmojis(input.companyDescription) : ''}</div>
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
  return `<div style="width:100%;height:100%;background:#0A0A0A;border-radius:6px;overflow:hidden;font-family:sans-serif;padding:12px;">
    <div style="width:30%;height:6px;background:#222;border-radius:2px;margin-bottom:10px;"></div>
    <div style="font-size:14px;font-weight:700;color:${accentColor};margin-bottom:4px;text-shadow:0 0 8px rgba(${r},${g},${b},0.5);">Title</div>
    <div style="width:60%;height:4px;background:#1A1A1A;border-radius:2px;margin-bottom:12px;"></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #1A1A1A;">
      <div><div style="font-size:12px;font-weight:700;color:${accentColor};text-shadow:0 0 6px rgba(${r},${g},${b},0.4);">47%</div><div style="font-size:6px;color:#555;">Growth</div></div>
      <div><div style="font-size:12px;font-weight:700;color:${accentColor};text-shadow:0 0 6px rgba(${r},${g},${b},0.4);">$2M</div><div style="font-size:6px;color:#555;">Value</div></div>
    </div>
    <div style="width:100%;height:3px;background:#1A1A1A;border-radius:2px;margin-bottom:4px;"></div>
    <div style="width:85%;height:3px;background:#1A1A1A;border-radius:2px;margin-bottom:4px;"></div>
    <div style="width:92%;height:3px;background:#1A1A1A;border-radius:2px;"></div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style09DarkMode: DocumentStyle = {
  id: 'style-09',
  name: 'Dark Mode',
  category: 'bold',
  description: 'Full dark background with glowing accent highlights — premium tech feel',
  keywords: ['dark', 'mode', 'vivid', 'tech', 'high-contrast', 'dramatic'],
  render,
  thumbnail,
};

export default style09DarkMode;
