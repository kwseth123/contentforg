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

// ── Block color palette ─────────────────────────────────────

function blockColors(brand: { primary: string; accent: string }) {
  return [
    { bg: brand.primary, text: contrastText(brand.primary) },
    { bg: '#ffffff', text: '#1a1a1a' },
    { bg: brand.accent, text: contrastText(brand.accent) },
    { bg: '#f4f5f7', text: '#1a1a1a' },
  ];
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager shortcut
  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accent = brand.accent || brand.primary;
  const palette = blockColors(brand);
  const primaryText = contrastText(brand.primary);
  const accentText = contrastText(accent);
  const { r: ar, g: ag, b: ab } = hexToRgb(accent);
  const lightAccent = lighten(accent, 0.88);

  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Build section blocks
  const filteredSections = sections.filter(s => s.title.trim() || s.content.trim());

  const sectionsHtml = filteredSections.map((s, i) => {
    const block = palette[i % palette.length];
    const headingColor = block.bg === '#ffffff' || block.bg === '#f4f5f7' ? brand.primary : block.text;
    const tableHeaderBg = block.bg === '#ffffff' || block.bg === '#f4f5f7' ? brand.primary : darken(block.bg, 0.15);
    const tableHeaderText = contrastText(tableHeaderBg);
    const ruleColor = block.bg === '#ffffff' || block.bg === '#f4f5f7' ? lighten(brand.primary, 0.8) : `rgba(255,255,255,0.18)`;
    const linkColor = block.bg === '#ffffff' || block.bg === '#f4f5f7' ? accent : lighten(accent, 0.3);

    return `
    <div class="cb-block" style="background:${block.bg};color:${block.text};">
      <div class="cb-block-inner">
        <div class="cb-block-label" style="color:${headingColor};opacity:0.5;">Section ${String(i + 1).padStart(2, '0')}</div>
        <h2 class="cb-block-title" style="color:${headingColor};">${stripEmojis(s.title)}</h2>
        <div class="cb-block-content" style="--rule-color:${ruleColor};--heading-color:${headingColor};--link-color:${linkColor};--table-header-bg:${tableHeaderBg};--table-header-text:${tableHeaderText};">
          ${formatMarkdown(stripEmojis(s.content))}
        </div>
      </div>
    </div>`;
  }).join('');

  // Stats block
  const statsHtml = stats.length > 0 ? `
    <div class="cb-block cb-stats-block" style="background:${accent};color:${accentText};">
      <div class="cb-block-inner">
        <div class="cb-stats-grid">
          ${stats.map(s => `
            <div class="cb-stat">
              <div class="cb-stat-value">${s.value}</div>
              <div class="cb-stat-label">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>` : '';

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cb-block { page-break-inside: avoid; }
    }

    body {
      font-family: var(--brand-font-primary);
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.65;
      font-size: var(--brand-font-body-size);
      margin: 0; padding: 0;
      -webkit-font-smoothing: antialiased;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    /* ── Header: full-width brand primary block ── */
    .cb-header {
      background: ${brand.primary};
      color: ${primaryText};
      padding: 56px 64px 48px;
    }
    .cb-header-inner {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 32px;
    }
    .cb-header-left { flex: 1; }
    .cb-header-logo { margin-bottom: 24px; }
    .cb-header-logo img { height: 42px; }
    .cb-header-meta {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.6;
      margin-bottom: 14px;
    }
    .cb-header-title {
      font-family: var(--brand-font-primary);
      font-size: 38px;
      font-weight: 800;
      line-height: 1.1;
      margin: 0 0 12px;
      color: ${primaryText};
    }
    .cb-header-subtitle {
      font-size: 15px;
      opacity: 0.7;
      line-height: 1.5;
    }
    .cb-header-right {
      text-align: right;
      min-width: 160px;
      padding-top: 8px;
    }
    .cb-header-prospect {
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .cb-header-date {
      font-size: 12px;
      opacity: 0.6;
    }

    /* ── Color blocks ── */
    .cb-block {
      padding: 52px 64px;
      page-break-inside: avoid;
    }
    .cb-block-inner {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
    }
    .cb-block-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .cb-block-title {
      font-family: var(--brand-font-primary);
      font-size: 30px;
      font-weight: 800;
      line-height: 1.15;
      margin: 0 0 20px;
    }
    .cb-block-content p { margin-bottom: 14px; }
    .cb-block-content h1,
    .cb-block-content h2 {
      font-family: var(--brand-font-primary);
      font-size: 22px;
      font-weight: 700;
      color: var(--heading-color);
      margin: 28px 0 12px;
      line-height: 1.2;
    }
    .cb-block-content h3 {
      font-family: var(--brand-font-primary);
      font-size: 17px;
      font-weight: 700;
      color: var(--heading-color);
      margin: 22px 0 10px;
    }
    .cb-block-content h4 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--heading-color);
      opacity: 0.7;
      margin: 18px 0 8px;
    }
    .cb-block-content strong { font-weight: 700; }
    .cb-block-content ul, .cb-block-content ol {
      padding-left: 24px;
      margin: 12px 0;
    }
    .cb-block-content li { margin-bottom: 8px; }
    .cb-block-content hr {
      border: none;
      height: 2px;
      background: var(--rule-color);
      margin: 28px 0;
    }

    /* Tables inside blocks */
    .cb-block-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .cb-block-content thead th {
      background: var(--table-header-bg);
      color: var(--table-header-text);
      text-align: left;
      padding: 12px 16px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: none;
    }
    .cb-block-content tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--rule-color);
    }

    /* ── Stats block ── */
    .cb-stats-block {
      padding: 48px 64px;
    }
    .cb-stats-grid {
      display: flex;
      gap: 32px;
      justify-content: center;
      flex-wrap: nowrap;
    }
    .cb-stat {
      text-align: center;
      min-width: 0;
      flex: 1;
    }
    .cb-stat-value {
      font-family: var(--brand-font-primary);
      font-size: 48px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 6px;
    }
    .cb-stat-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      opacity: 0.7;
    }

    /* ── Footer: accent-colored block ── */
    .cb-footer {
      background: ${accent};
      color: ${accentText};
      padding: 28px 64px;
    }
    .cb-footer-inner {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      letter-spacing: 0.03em;
    }
    .cb-footer-company { font-weight: 700; }
    .cb-footer-page {
      font-size: 10px;
      opacity: 0.7;
    }
  `;

  const body = `
    <!-- Header -->
    <div class="cb-header">
      <div class="cb-header-inner">
        <div class="cb-header-left">
          <div class="cb-header-logo">${brandLogoHtml(input, `height:42px;filter:brightness(${primaryText === '#FFFFFF' ? '10' : '0.2'});`)}</div>
          <div class="cb-header-meta">${contentType.replace(/-/g, ' ')}${prospect.industry ? ` &mdash; ${prospect.industry}` : ''}</div>
          <h1 class="cb-header-title">${title} for ${prospect.companyName}</h1>
          <div class="cb-header-subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
        </div>
        <div class="cb-header-right">
          <div class="cb-header-prospect">${prospect.companyName}</div>
          <div class="cb-header-date">${dateStr}</div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    ${statsHtml}

    <!-- Sections -->
    ${sectionsHtml}

    <!-- Footer -->
    <div class="cb-footer">
      <div class="cb-footer-inner">
        <div class="cb-footer-company">${companyName}</div>
        <div>${input.companyDescription || ''}</div>
        <div>${dateStr}</div>
        <div class="cb-footer-page">Page 1</div>
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
  const textOnAccent = contrastText(accentColor);
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;">
    <div style="background:${accentColor};padding:8px 10px;">
      <div style="width:40%;height:6px;background:${textOnAccent};opacity:0.9;border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:55%;height:4px;background:${textOnAccent};opacity:0.4;border-radius:2px;"></div>
    </div>
    <div style="padding:6px 10px;">
      <div style="width:35%;height:5px;background:${accentColor};border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:90%;height:3px;background:#ddd;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:80%;height:3px;background:#ddd;border-radius:1px;"></div>
    </div>
    <div style="background:${accentColor};padding:6px 10px;">
      <div style="width:30%;height:5px;background:${textOnAccent};opacity:0.9;border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:85%;height:3px;background:${textOnAccent};opacity:0.3;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:70%;height:3px;background:${textOnAccent};opacity:0.3;border-radius:1px;"></div>
    </div>
    <div style="padding:6px 10px;">
      <div style="width:40%;height:5px;background:${accentColor};border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:100%;height:3px;background:#ddd;border-radius:1px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style13ColorBlock: DocumentStyle = {
  id: 'style-13',
  name: 'Color Block',
  category: 'bold',
  description: 'Alternating accent and white sections — bold rhythmic design',
  keywords: ['color', 'block', 'alternating', 'bold', 'energetic', 'modern'],
  render,
  thumbnail,
};

export default style13ColorBlock;
