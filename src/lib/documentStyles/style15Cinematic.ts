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

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager shortcut
  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections, contentType, prospect, companyName, date } = input;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accent = brand.accent || brand.primary;
  const { r: ar, g: ag, b: ab } = hexToRgb(accent);
  const { r: pr, g: pg, b: pb } = hexToRgb(brand.primary);
  const darkBase = '#141820';
  const darkMid = '#1c2230';
  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const filteredSections = sections.filter(s => s.title.trim() || s.content.trim());

  // Alternating light/dark sections for cinematic rhythm
  const sectionsHtml = filteredSections.map((s, i) => {
    const isDark = i % 3 === 0;
    return `
    <div class="cn-section ${isDark ? 'cn-section-dark' : 'cn-section-light'}">
      <div class="cn-section-inner">
        <div class="cn-section-badge">Scene ${String(i + 1).padStart(2, '0')}</div>
        <h2 class="cn-section-title">${stripEmojis(s.title)}</h2>
        <div class="cn-section-body">${formatMarkdown(stripEmojis(s.content))}</div>
      </div>
    </div>`;
  }).join('');

  // Stats as "scene cards"
  const statsHtml = stats.length > 0 ? `
    <div class="cn-scene-cards">
      <div class="cn-scene-cards-inner">
        <div class="cn-scene-label">Key Figures</div>
        <div class="cn-scene-grid">
          ${stats.map((s, i) => `
            <div class="cn-scene-card">
              <div class="cn-scene-card-num">${String(i + 1).padStart(2, '0')}</div>
              <div class="cn-scene-card-value">${s.value}</div>
              <div class="cn-scene-card-label">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
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
      .cn-section { page-break-inside: avoid; }
    }

    body {
      font-family: var(--brand-font-primary);
      color: #dde0e6;
      background: ${darkBase};
      line-height: 1.65;
      font-size: var(--brand-font-body-size);
      margin: 0; padding: 0;
      -webkit-font-smoothing: antialiased;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    /* ── Hero header: dark gradient, widescreen feel ── */
    .cn-hero {
      background: linear-gradient(180deg, #0a0e14 0%, ${darkBase} 60%, ${darkMid} 100%);
      padding: 72px 64px 56px;
      position: relative;
      overflow: hidden;
    }
    .cn-hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, ${accent}, rgba(${ar},${ag},${ab},0.3), transparent);
    }
    .cn-hero-inner {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
    }
    .cn-hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 48px;
    }
    .cn-hero-logo img { height: 36px; filter: brightness(1.8); }
    .cn-hero-meta-right {
      text-align: right;
      font-size: 11px;
      color: rgba(255,255,255,0.45);
    }
    .cn-hero-meta-right .cn-prospect {
      font-weight: 700;
      font-size: 14px;
      color: rgba(255,255,255,0.85);
      margin-bottom: 2px;
    }
    .cn-hero-type {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 16px;
      padding: 4px 14px;
      border: 1px solid rgba(${ar},${ag},${ab},0.35);
    }
    .cn-hero-title {
      font-family: var(--brand-font-primary);
      font-size: 46px;
      font-weight: 800;
      line-height: 1.08;
      color: #ffffff;
      margin: 0 0 16px;
      max-width: 700px;
      letter-spacing: -0.01em;
    }
    .cn-hero-subtitle {
      font-size: 15px;
      color: rgba(255,255,255,0.5);
      max-width: 500px;
    }
    .cn-hero-accent-bar {
      width: 80px;
      height: 3px;
      background: ${accent};
      margin-top: 32px;
      box-shadow: 0 0 12px rgba(${ar},${ag},${ab},0.4);
    }

    /* ── Horizontal letterbox bands ── */
    .cn-letterbox-top,
    .cn-letterbox-bottom {
      height: 6px;
      background: #000;
    }

    /* ── Scene cards (stats) ── */
    .cn-scene-cards {
      background: linear-gradient(180deg, ${darkMid}, ${darkBase});
      padding: 44px 64px;
    }
    .cn-scene-cards-inner {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
    }
    .cn-scene-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.35);
      margin-bottom: 20px;
    }
    .cn-scene-grid {
      display: flex;
      gap: 20px;
      flex-wrap: nowrap;
    }
    .cn-scene-card {
      flex: 1;
      min-width: 0;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 28px 24px;
      position: relative;
    }
    .cn-scene-card-num {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: ${accent};
      opacity: 0.7;
      margin-bottom: 10px;
    }
    .cn-scene-card-value {
      font-family: var(--brand-font-primary);
      font-size: 40px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
      margin-bottom: 8px;
    }
    .cn-scene-card-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(255,255,255,0.4);
    }
    .cn-scene-card::after {
      content: '';
      position: absolute;
      bottom: 0; left: 24px; right: 24px;
      height: 2px;
      background: ${accent};
      opacity: 0.5;
    }

    /* ── Sections ── */
    .cn-section {
      padding: 52px 64px;
      page-break-inside: avoid;
    }
    .cn-section-inner {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
    }
    .cn-section-dark {
      background: ${darkBase};
      color: #dde0e6;
    }
    .cn-section-light {
      background: #f6f7f9;
      color: #1a1d24;
    }
    .cn-section-badge {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .cn-section-dark .cn-section-badge { color: ${accent}; }
    .cn-section-light .cn-section-badge { color: ${accent}; }

    .cn-section-title {
      font-family: var(--brand-font-primary);
      font-size: 30px;
      font-weight: 800;
      line-height: 1.15;
      margin: 0 0 22px;
    }
    .cn-section-dark .cn-section-title { color: #ffffff; }
    .cn-section-light .cn-section-title { color: #111318; }

    .cn-section-body p { margin-bottom: 14px; }
    .cn-section-body h1,
    .cn-section-body h2 {
      font-family: var(--brand-font-primary);
      font-size: 22px;
      font-weight: 700;
      margin: 28px 0 12px;
      line-height: 1.2;
    }
    .cn-section-dark .cn-section-body h1,
    .cn-section-dark .cn-section-body h2 { color: #ffffff; }
    .cn-section-light .cn-section-body h1,
    .cn-section-light .cn-section-body h2 { color: #111318; }

    .cn-section-body h3 {
      font-family: var(--brand-font-primary);
      font-size: 17px;
      font-weight: 700;
      margin: 22px 0 10px;
    }
    .cn-section-dark .cn-section-body h3 { color: #ccd0d8; }
    .cn-section-light .cn-section-body h3 { color: #222; }

    .cn-section-body h4 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 18px 0 8px;
    }
    .cn-section-body strong { font-weight: 700; }
    .cn-section-dark .cn-section-body strong { color: #ffffff; }
    .cn-section-light .cn-section-body strong { color: #111; }

    .cn-section-body ul, .cn-section-body ol {
      padding-left: 24px;
      margin: 12px 0;
    }
    .cn-section-body li { margin-bottom: 8px; }
    .cn-section-body li::marker { color: ${accent}; }

    .cn-section-body hr {
      border: none;
      height: 1px;
      margin: 28px 0;
    }
    .cn-section-dark .cn-section-body hr { background: rgba(255,255,255,0.1); }
    .cn-section-light .cn-section-body hr { background: #e0e2e6; }

    /* Tables */
    .cn-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .cn-section-dark .cn-section-body thead th {
      background: rgba(${ar},${ag},${ab},0.15);
      color: ${accent};
      text-align: left;
      padding: 12px 16px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 2px solid rgba(${ar},${ag},${ab},0.3);
    }
    .cn-section-light .cn-section-body thead th {
      background: #111318;
      color: #ffffff;
      text-align: left;
      padding: 12px 16px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border: none;
    }
    .cn-section-dark .cn-section-body tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .cn-section-light .cn-section-body tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #e8eaed;
    }

    /* ── Footer: dark gradient matching header ── */
    .cn-footer {
      background: linear-gradient(180deg, ${darkMid} 0%, #0a0e14 100%);
      padding: 32px 64px;
      position: relative;
    }
    .cn-footer::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(${ar},${ag},${ab},0.4), transparent);
    }
    .cn-footer-inner {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: rgba(255,255,255,0.35);
    }
    .cn-footer-company {
      font-weight: 700;
      color: rgba(255,255,255,0.5);
    }
  `;

  const body = `
    <!-- Letterbox top -->
    <div class="cn-letterbox-top"></div>

    <!-- Hero -->
    <div class="cn-hero">
      <div class="cn-hero-inner">
        <div class="cn-hero-top">
          <div class="cn-hero-logo">${brandLogoHtml(input, 'height:36px;filter:brightness(1.8);')}</div>
          <div class="cn-hero-meta-right">
            <div class="cn-prospect">${prospect.companyName}</div>
            <div>${dateStr}</div>
          </div>
        </div>
        <div class="cn-hero-type">${contentType.replace(/-/g, ' ')}${prospect.industry ? ' &mdash; ' + prospect.industry : ''}</div>
        <h1 class="cn-hero-title">${title} for ${prospect.companyName}</h1>
        <div class="cn-hero-subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
        <div class="cn-hero-accent-bar"></div>
      </div>
    </div>

    <!-- Letterbox band -->
    <div class="cn-letterbox-bottom"></div>

    <!-- Stats -->
    ${statsHtml}

    <!-- Sections -->
    ${sectionsHtml}

    <!-- Footer -->
    <div class="cn-footer">
      <div class="cn-footer-inner">
        <div class="cn-footer-company">${companyName}</div>
        <div>${input.companyDescription || ''}</div>
        <div>${dateStr}</div>
        <div>Page 1</div>
      </div>
    </div>

    <!-- Letterbox bottom -->
    <div class="cn-letterbox-top"></div>
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
  const { r, g, b } = hexToRgb(accentColor);
  return `<div style="width:100%;height:100%;background:#141820;border-radius:6px;overflow:hidden;font-family:sans-serif;">
    <div style="height:3px;background:#000;"></div>
    <div style="background:linear-gradient(180deg,#0a0e14,#1c2230);padding:10px 10px 8px;">
      <div style="width:30%;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin-bottom:6px;"></div>
      <div style="font-size:12px;font-weight:800;color:#fff;line-height:1;margin-bottom:4px;">Cinematic</div>
      <div style="width:50%;height:3px;background:rgba(255,255,255,0.1);border-radius:1px;margin-bottom:6px;"></div>
      <div style="width:40px;height:2px;background:${accentColor};box-shadow:0 0 6px rgba(${r},${g},${b},0.4);"></div>
    </div>
    <div style="height:3px;background:#000;"></div>
    <div style="display:flex;gap:4px;padding:8px 10px;">
      <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:6px;text-align:center;">
        <div style="font-size:10px;font-weight:800;color:#fff;">47%</div>
        <div style="font-size:4px;color:rgba(255,255,255,0.3);text-transform:uppercase;">growth</div>
      </div>
      <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:6px;text-align:center;">
        <div style="font-size:10px;font-weight:800;color:#fff;">$2M</div>
        <div style="font-size:4px;color:rgba(255,255,255,0.3);text-transform:uppercase;">value</div>
      </div>
    </div>
    <div style="padding:4px 10px;">
      <div style="width:90%;height:3px;background:rgba(255,255,255,0.06);margin-bottom:3px;"></div>
      <div style="width:75%;height:3px;background:rgba(255,255,255,0.06);"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style15Cinematic: DocumentStyle = {
  id: 'style-15',
  name: 'Cinematic',
  category: 'bold',
  description: 'Wide format with filmstrip header and full-width color transitions',
  keywords: ['cinematic', 'filmstrip', 'wide', 'production', 'creative'],
  render,
  thumbnail,
};

export default style15Cinematic;
