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
  const { r, g, b } = hexToRgb(accent);
  const glow = `rgba(${r},${g},${b}`;
  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Sections as glassmorphic cards
  const sectionsHtml = sections.map((s, i) => `
    <div class="na-card">
      <div class="na-card-index">${String(i + 1).padStart(2, '0')}</div>
      <h2 class="na-card-title">${stripEmojis(s.title)}</h2>
      <div class="na-card-body">${formatMarkdown(stripEmojis(s.content))}</div>
    </div>
  `).join('');

  // Glowing stat pills
  const statsHtml = stats.length > 0 ? `
    <div class="na-stats">
      ${stats.map(s => `
        <div class="na-stat">
          <div class="na-stat-value">${s.value}</div>
          <div class="na-stat-label">${s.label}</div>
        </div>
      `).join('')}
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
    }

    body {
      font-family: var(--brand-font-primary);
      color: #c8cad0;
      background: #111111;
      line-height: 1.65;
      font-size: var(--brand-font-body-size);
      margin: 0; padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    .na-page {
      max-width: 920px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Header: dark with neon glow ── */
    .na-header {
      background: #111111;
      padding: 56px 64px 48px;
      position: relative;
      overflow: hidden;
    }
    .na-header::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: ${accent};
      box-shadow: 0 0 20px ${glow},0.6), 0 0 60px ${glow},0.3);
    }
    .na-header-inner {
      max-width: 880px;
      margin: 0 auto;
    }
    .na-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .na-header-logo img {
      height: 38px;
      filter: brightness(1.5) drop-shadow(0 0 8px ${glow},0.4));
    }
    .na-header-logo span {
      text-shadow: 0 0 12px ${glow},0.5);
      color: ${accent} !important;
    }
    .na-header-meta-right {
      text-align: right;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
    }
    .na-header-meta-right .na-prospect {
      font-weight: 700;
      font-size: 14px;
      color: rgba(255,255,255,0.8);
      margin-bottom: 2px;
    }
    .na-header-badge {
      display: inline-block;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${accent};
      border: 1px solid ${glow},0.4);
      padding: 5px 16px;
      margin-bottom: 20px;
      box-shadow: 0 0 12px ${glow},0.15), inset 0 0 12px ${glow},0.05);
    }
    .na-header-title {
      font-family: var(--brand-font-primary);
      font-size: 42px;
      font-weight: 800;
      line-height: 1.08;
      color: #ffffff;
      margin: 0 0 14px;
      text-shadow: 0 0 40px ${glow},0.3);
      letter-spacing: -0.01em;
    }
    .na-header-subtitle {
      font-size: 15px;
      color: rgba(255,255,255,0.4);
    }
    .na-header-glow-line {
      width: 100px;
      height: 3px;
      background: ${accent};
      margin-top: 32px;
      box-shadow: 0 0 16px ${glow},0.5), 0 0 40px ${glow},0.2);
    }

    /* ── Stats: neon glow ── */
    .na-stats {
      display: flex;
      gap: 20px;
      padding: 40px 64px;
      max-width: 920px;
      margin: 0 auto;
      flex-wrap: wrap;
    }
    .na-stat {
      flex: 1;
      min-width: 140px;
      background: rgba(255,255,255,0.03);
      border: 1px solid ${glow},0.25);
      padding: 28px 24px;
      text-align: center;
      position: relative;
      box-shadow: 0 0 24px ${glow},0.08), inset 0 0 24px ${glow},0.03);
    }
    .na-stat-value {
      font-family: var(--brand-font-primary);
      font-size: 44px;
      font-weight: 800;
      color: ${accent};
      line-height: 1;
      margin-bottom: 8px;
      text-shadow: 0 0 24px ${glow},0.7), 0 0 48px ${glow},0.3);
    }
    .na-stat-label {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
    }

    /* ── Glassmorphic section cards ── */
    .na-cards-area {
      max-width: 920px;
      margin: 0 auto;
      padding: 0 64px 48px;
    }
    .na-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-left: 3px solid ${accent};
      padding: 40px 44px;
      margin-bottom: 24px;
      position: relative;
      box-shadow: 0 4px 32px rgba(0,0,0,0.3), 0 0 16px ${glow},0.04);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .na-card-index {
      position: absolute;
      top: 18px; right: 24px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      font-weight: 700;
      color: ${glow},0.3);
      letter-spacing: 0.05em;
    }
    .na-card-title {
      font-family: var(--brand-font-primary);
      font-size: 26px;
      font-weight: 700;
      color: ${accent};
      margin: 0 0 18px;
      text-shadow: 0 0 20px ${glow},0.35);
      line-height: 1.2;
    }
    .na-card-body {
      color: #b0b3bc;
    }
    .na-card-body p { margin-bottom: 14px; }
    .na-card-body h1,
    .na-card-body h2 {
      font-family: var(--brand-font-primary);
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin: 28px 0 12px;
      text-shadow: 0 0 14px ${glow},0.2);
      line-height: 1.2;
    }
    .na-card-body h3 {
      font-family: var(--brand-font-primary);
      font-size: 16px;
      font-weight: 700;
      color: #d0d2d8;
      margin: 22px 0 10px;
    }
    .na-card-body h4 {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${accent};
      opacity: 0.7;
      margin: 18px 0 8px;
    }
    .na-card-body strong { font-weight: 700; color: #e8eaf0; }
    .na-card-body em { font-style: italic; color: #8a8d98; }
    .na-card-body ul, .na-card-body ol {
      padding-left: 24px;
      margin: 12px 0;
    }
    .na-card-body li { margin-bottom: 8px; }
    .na-card-body li::marker { color: ${accent}; }
    .na-card-body hr {
      border: none;
      height: 1px;
      background: rgba(255,255,255,0.08);
      margin: 28px 0;
    }

    /* Tables with neon header */
    .na-card-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .na-card-body thead th {
      text-align: left;
      padding: 12px 16px;
      background: rgba(${r},${g},${b},0.08);
      border-bottom: 2px solid ${accent};
      font-family: 'Courier New', monospace;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${accent};
      box-shadow: 0 2px 8px ${glow},0.1);
    }
    .na-card-body tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      color: #a0a3b0;
    }

    /* ── Footer: dark with thin glow line ── */
    .na-footer {
      background: #0a0a0a;
      padding: 28px 64px;
      position: relative;
    }
    .na-footer::before {
      content: '';
      position: absolute;
      top: 0; left: 64px; right: 64px;
      height: 1px;
      background: ${accent};
      box-shadow: 0 0 12px ${glow},0.4), 0 0 32px ${glow},0.15);
    }
    .na-footer-inner {
      max-width: 880px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: rgba(255,255,255,0.25);
    }
    .na-footer-company {
      font-weight: 700;
      color: rgba(255,255,255,0.4);
    }
    .na-footer-accent {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      letter-spacing: 0.1em;
    }
  `;

  const body = `
    <div class="na-page">
      <!-- Header -->
      <div class="na-header">
        <div class="na-header-inner">
          <div class="na-header-top">
            <div class="na-header-logo">${brandLogoHtml(input, `height:38px;filter:brightness(1.5) drop-shadow(0 0 8px ${glow},0.4));`)}</div>
            <div class="na-header-meta-right">
              <div class="na-prospect">${prospect.companyName}</div>
              <div>${dateStr}</div>
            </div>
          </div>
          <div class="na-header-badge">${contentType.replace(/-/g, ' ')}${prospect.industry ? ' / ' + prospect.industry : ''}</div>
          <h1 class="na-header-title">${title} for ${prospect.companyName}</h1>
          <div class="na-header-subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ' &middot; ' + prospect.companySize : ''}</div>
          <div class="na-header-glow-line"></div>
        </div>
      </div>

      <!-- Stats -->
      ${statsHtml}

      <!-- Sections -->
      <div class="na-cards-area">
        ${sectionsHtml}
      </div>

      <!-- Footer -->
      <div class="na-footer">
        <div class="na-footer-inner">
          <div class="na-footer-company">${companyName}</div>
          <div>${input.companyDescription || ''}</div>
          <div class="na-footer-accent">${dateStr}</div>
          <div class="na-footer-accent">Page 1</div>
        </div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} \u2014 ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const { r, g, b } = hexToRgb(accentColor);
  const glow = `rgba(${r},${g},${b}`;
  return `<div style="width:100%;height:100%;background:#111;border-radius:6px;overflow:hidden;font-family:sans-serif;padding:0;">
    <div style="height:2px;background:${accentColor};box-shadow:0 0 8px ${glow},0.5);"></div>
    <div style="padding:10px 10px 6px;">
      <div style="width:28%;height:5px;background:rgba(255,255,255,0.08);border-radius:2px;margin-bottom:8px;"></div>
      <div style="display:inline-block;font-family:monospace;font-size:6px;color:${accentColor};border:1px solid ${glow},0.35);border-radius:2px;padding:1px 5px;margin-bottom:6px;box-shadow:0 0 4px ${glow},0.2);">TYPE</div>
      <div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:4px;text-shadow:0 0 10px ${glow},0.3);">Title</div>
      <div style="width:50%;height:3px;background:rgba(255,255,255,0.08);margin-bottom:8px;"></div>
      <div style="width:60px;height:2px;background:${accentColor};box-shadow:0 0 8px ${glow},0.4);margin-bottom:8px;"></div>
    </div>
    <div style="display:flex;gap:6px;padding:0 10px 8px;">
      <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid ${glow},0.2);padding:6px;text-align:center;box-shadow:0 0 8px ${glow},0.06);">
        <div style="font-size:11px;font-weight:700;color:${accentColor};text-shadow:0 0 8px ${glow},0.6);">47%</div>
        <div style="font-family:monospace;font-size:5px;color:rgba(255,255,255,0.3);">GROWTH</div>
      </div>
      <div style="flex:1;background:rgba(255,255,255,0.03);border:1px solid ${glow},0.2);padding:6px;text-align:center;box-shadow:0 0 8px ${glow},0.06);">
        <div style="font-size:11px;font-weight:700;color:${accentColor};text-shadow:0 0 8px ${glow},0.6);">$2M</div>
        <div style="font-family:monospace;font-size:5px;color:rgba(255,255,255,0.3);">VALUE</div>
      </div>
    </div>
    <div style="padding:0 10px 6px;">
      <div style="background:rgba(255,255,255,0.03);border-left:2px solid ${accentColor};padding:6px 8px;box-shadow:0 0 8px ${glow},0.04);">
        <div style="width:70%;height:3px;background:rgba(255,255,255,0.06);margin-bottom:3px;"></div>
        <div style="width:90%;height:3px;background:rgba(255,255,255,0.06);"></div>
      </div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style16NeonAccent: DocumentStyle = {
  id: 'style-16',
  name: 'Neon Accent',
  category: 'bold',
  description: 'Deep dark background with vivid neon glows and cyberpunk-inspired accents \u2014 ideal for SaaS launches',
  keywords: ['neon', 'glow', 'dark', 'cyberpunk', 'vivid', 'accent', 'saas', 'tech'],
  render,
  thumbnail,
};

export default style16NeonAccent;
