// ════════════════════════════════════════════════════════
// Style 26 — Infographic
// Professional data visualization document. Information
// is Beautiful quality. Icon-heavy, stats as primary
// visual elements, flow diagrams, comparison blocks.
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

// ── Data extraction helpers ─────────────────────────────

function extractPercentages(text: string): { value: number; label: string }[] {
  const results: { value: number; label: string }[] = [];
  const re = /(\d{1,3})%\s*([^,.\n]{0,40})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    results.push({ value: parseInt(m[1], 10), label: m[2].trim() || 'metric' });
  }
  return results.slice(0, 6);
}

function extractNumbers(text: string): { value: string; label: string }[] {
  const results: { value: string; label: string }[] = [];
  const re = /(\$[\d,.]+[KkMmBb]?|\d{1,3}(?:\.\d+)?[xX])\s*([^,.\n]{0,30})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    results.push({ value: m[1], label: m[2].trim() || 'value' });
  }
  return results.slice(0, 4);
}

// ── Section color rotation ─────────────────────────────

function sectionColor(accent: string, idx: number): string {
  const hueShifts = [0, 30, 60, 90, 120, 150];
  const rgb = hexToRgb(accent);
  const shift = hueShifts[idx % hueShifts.length];
  // Simple hue rotation approximation
  const r = Math.round(rgb.r * Math.cos(shift * Math.PI / 180) + rgb.g * Math.sin(shift * Math.PI / 180));
  const g = Math.round(rgb.g * Math.cos(shift * Math.PI / 180) + rgb.b * Math.sin(shift * Math.PI / 180));
  const b = Math.round(rgb.b * Math.cos(shift * Math.PI / 180) + rgb.r * Math.sin(shift * Math.PI / 180));
  return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections: rawSections, contentType, prospect, companyName, date } = input;
  const sections = rawSections.filter(s => s.title?.trim() || s.content?.trim());
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const allContent = sections.map(s => s.content).join('\n');
  const percentages = extractPercentages(allContent);
  const bigNumbers = extractNumbers(allContent);
  const rgb = hexToRgb(accent);
  const lightBg = lighten(accent, 0.95);
  const darkPrimary = darken(brand.primary, 0.1);

  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Big number callouts
  const bigNumHtml = bigNumbers.length > 0 ? `
    <div class="ig-big-numbers">
      ${bigNumbers.map((n, i) => `
        <div class="ig-big-num-card">
          <div class="ig-big-num-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="${accent}" stroke-width="2"/><path d="M7 10l2 2 4-4" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="ig-big-num-value">${n.value}</div>
          <div class="ig-big-num-label">${n.label}</div>
        </div>
      `).join('')}
    </div>` : '';

  // Horizontal bar chart
  const barChartHtml = percentages.length > 0 ? `
    <div class="ig-bar-chart-card">
      <div class="ig-card-header">
        <div class="ig-card-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="10" width="4" height="7" rx="1" fill="${accent}"/><rect x="7" y="6" width="4" height="11" rx="1" fill="${accent}" opacity="0.7"/><rect x="13" y="2" width="4" height="15" rx="1" fill="${accent}" opacity="0.5"/></svg>
        </div>
        <span>Key Metrics</span>
      </div>
      ${percentages.map(p => `
        <div class="ig-bar-row">
          <span class="ig-bar-label">${p.label}</span>
          <div class="ig-bar-track">
            <div class="ig-bar-fill" style="width:${Math.min(p.value, 100)}%;background:${accent};"></div>
          </div>
          <span class="ig-bar-value">${p.value}%</span>
        </div>
      `).join('')}
    </div>` : '';

  // Process flow
  const processFlowHtml = sections.length >= 3 ? `
    <div class="ig-process-flow">
      <div class="ig-card-header">
        <div class="ig-card-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9h14M12 5l4 4-4 4" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <span>Process Flow</span>
      </div>
      <div class="ig-flow-steps">
        ${sections.map((s, i) => `
          <div class="ig-flow-step">
            <div class="ig-flow-num" style="background:${accent};">${i + 1}</div>
            <div class="ig-flow-title">${stripEmojis(s.title)}</div>
          </div>
          ${i < sections.length - 1 ? '<div class="ig-flow-arrow"><svg width="24" height="12" viewBox="0 0 24 12"><path d="M0 6h20M16 1l5 5-5 5" stroke="' + accent + '" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/></svg></div>' : ''}
        `).join('')}
      </div>
    </div>` : '';

  // Icon array for first metric
  const iconArrayHtml = percentages.length > 0 ? (() => {
    const pct = percentages[0];
    const filled = Math.round(pct.value / 10);
    const empty = 10 - filled;
    return `
      <div class="ig-icon-array-card">
        <div class="ig-card-header">
          <div class="ig-card-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="5" r="3" fill="${accent}"/><circle cx="13" cy="5" r="3" fill="${accent}" opacity="0.5"/><circle cx="5" cy="13" r="3" fill="${accent}" opacity="0.7"/><circle cx="13" cy="13" r="3" fill="${accent}" opacity="0.3"/></svg>
          </div>
          <span>${pct.label}: ${pct.value}%</span>
        </div>
        <div class="ig-icon-dots">
          ${'<span class="ig-dot ig-dot-filled"></span>'.repeat(filled)}${'<span class="ig-dot ig-dot-empty"></span>'.repeat(empty)}
        </div>
      </div>`;
  })() : '';

  // Section cards with color coding
  const sectionsHtml = sections.map((s, i) => {
    const cleanContent = stripEmojis(s.content);
    const sectionPercentages = extractPercentages(s.content);
    const cardColor = accent;

    return `
      <div class="ig-section-card">
        <div class="ig-section-color-bar" style="background:${cardColor};"></div>
        <div class="ig-section-inner">
          <div class="ig-section-header">
            <div class="ig-section-num" style="background:${cardColor};color:${contrastText(accent)};">${String(i + 1).padStart(2, '0')}</div>
            <h2 class="ig-section-title">${stripEmojis(s.title)}</h2>
          </div>
          ${sectionPercentages.length > 0 ? `
            <div class="ig-section-mini-bars">
              ${sectionPercentages.slice(0, 3).map(p => `
                <div class="ig-mini-bar-row">
                  <span class="ig-mini-label">${p.label}</span>
                  <div class="ig-mini-track"><div class="ig-mini-fill" style="width:${Math.min(p.value, 100)}%;"></div></div>
                  <span class="ig-mini-value">${p.value}%</span>
                </div>
              `).join('')}
            </div>` : ''}
          <div class="ig-section-body">${formatMarkdown(cleanContent)}</div>
        </div>
      </div>`;
  }).join('');

  // Comparison blocks if we have enough data
  const comparisonHtml = percentages.length >= 2 ? `
    <div class="ig-comparison">
      <div class="ig-card-header">
        <div class="ig-card-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" stroke="${accent}" stroke-width="1.5"/><rect x="10" y="10" width="7" height="7" rx="2" stroke="${accent}" stroke-width="1.5"/><path d="M9 5h4M5 13h4" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <span>Comparison</span>
      </div>
      <div class="ig-comparison-blocks">
        ${percentages.slice(0, 2).map((p, i) => `
          <div class="ig-compare-block">
            <div class="ig-compare-value" style="color:${i === 0 ? accent : darken(accent, 0.2)};">${p.value}%</div>
            <div class="ig-compare-label">${p.label}</div>
            <div class="ig-compare-bar"><div class="ig-compare-fill" style="width:${Math.min(p.value, 100)}%;background:${i === 0 ? accent : darken(accent, 0.2)};"></div></div>
          </div>
        `).join('<div class="ig-compare-vs">vs</div>')}
      </div>
    </div>` : '';

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0.5in;
      @bottom-center {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9px;
        color: #bbb;
      }
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .ig-section-card { break-inside: avoid; page-break-inside: avoid; }
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: ${brand.text};
      background: #f0f2f5;
      line-height: 1.6;
      font-size: ${brand.bodySize}px;
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 0;
    }

    .ig-wrapper {
      width: 100%; max-width: 816px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Header ── */
    .ig-header {
      background: linear-gradient(135deg, ${brand.primary} 0%, ${darken(brand.primary, 0.25)} 100%);
      color: ${contrastText(brand.primary)};
      padding: 44px 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .ig-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 20px,
        rgba(255,255,255,0.02) 20px,
        rgba(255,255,255,0.02) 40px
      );
    }
    .ig-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      position: relative;
      z-index: 1;
    }
    .ig-header-logo img { height: 32px; filter: brightness(10); }
    .ig-header-meta {
      text-align: right;
      font-size: 12px;
      opacity: 0.85;
    }
    .ig-header-prospect {
      font-weight: 700;
      font-size: 13px;
      opacity: 1;
    }
    .ig-header-content {
      position: relative;
      z-index: 1;
    }
    .ig-header h1 {
      font-size: ${brand.h1Size + 8}px;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .ig-header-sub {
      font-size: 15px;
      opacity: 0.75;
    }
    .ig-header-shapes {
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 100%;
      z-index: 0;
      overflow: hidden;
    }
    .ig-header-shapes::before {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.1);
    }
    .ig-header-shapes::after {
      content: '';
      position: absolute;
      bottom: -20px;
      right: 40px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }

    /* ── Content area ── */
    .ig-content {
      padding: 32px 36px;
    }

    /* ── Big numbers ── */
    .ig-big-numbers {
      display: flex;
      flex-wrap: nowrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .ig-big-num-card {
      flex: 1;
      min-width: 0;
      background: #fff;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
    }
    .ig-big-num-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: ${accent};
    }
    .ig-big-num-icon { margin-bottom: 10px; }
    .ig-big-num-value {
      font-size: 36px;
      font-weight: 800;
      color: ${accent};
      line-height: 1;
    }
    .ig-big-num-label {
      font-size: 11px;
      color: #888;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ── Bar chart card ── */
    .ig-bar-chart-card, .ig-icon-array-card, .ig-process-flow, .ig-comparison {
      background: #fff;
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .ig-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 700;
      color: #333;
      margin-bottom: 18px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ig-card-icon { flex-shrink: 0; }
    .ig-bar-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }
    .ig-bar-row:last-child { margin-bottom: 0; }
    .ig-bar-label {
      width: 130px;
      font-size: 12px;
      color: #666;
      text-align: right;
      flex-shrink: 0;
    }
    .ig-bar-track {
      flex: 1;
      height: 22px;
      background: ${lighten(accent, 0.9)};
      border-radius: 11px;
      overflow: hidden;
    }
    .ig-bar-fill {
      height: 100%;
      border-radius: 11px;
      transition: width 0.5s ease;
    }
    .ig-bar-value {
      width: 48px;
      font-size: 15px;
      font-weight: 800;
      color: ${accent};
      text-align: right;
    }

    /* ── Icon array ── */
    .ig-icon-dots {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .ig-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: inline-block;
    }
    .ig-dot-filled { background: ${accent}; }
    .ig-dot-empty { background: ${lighten(accent, 0.85)}; }

    /* ── Process flow ── */
    .ig-flow-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      flex-wrap: wrap;
    }
    .ig-flow-step { text-align: center; min-width: 80px; }
    .ig-flow-num {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      margin: 0 auto 8px;
    }
    .ig-flow-title {
      font-size: 11px;
      color: #555;
      max-width: 100px;
      line-height: 1.3;
    }
    .ig-flow-arrow {
      margin: 0 8px;
      margin-bottom: 20px;
    }

    /* ── Comparison ── */
    .ig-comparison-blocks {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
    }
    .ig-compare-block {
      flex: 1;
      text-align: center;
    }
    .ig-compare-value {
      font-size: 32px;
      font-weight: 800;
      line-height: 1;
    }
    .ig-compare-label {
      font-size: 11px;
      color: #888;
      margin: 6px 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ig-compare-bar {
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
    }
    .ig-compare-fill {
      height: 100%;
      border-radius: 4px;
    }
    .ig-compare-vs {
      font-size: 12px;
      font-weight: 700;
      color: #bbb;
      text-transform: uppercase;
    }

    /* ── Section cards ── */
    .ig-sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .ig-section-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: row;
      page-break-inside: avoid;
    }
    .ig-section-color-bar {
      width: 5px;
      flex-shrink: 0;
    }
    .ig-section-inner {
      padding: 24px 28px;
      flex: 1;
    }
    .ig-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .ig-section-num {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .ig-section-title {
      font-size: ${brand.h2Size}px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.25;
    }

    /* ── Mini bars inside sections ── */
    .ig-section-mini-bars {
      margin-bottom: 16px;
      padding: 14px 16px;
      background: ${lighten(accent, 0.96)};
      border-radius: 8px;
    }
    .ig-mini-bar-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .ig-mini-bar-row:last-child { margin-bottom: 0; }
    .ig-mini-label { width: 100px; font-size: 11px; color: #666; text-align: right; flex-shrink: 0; }
    .ig-mini-track { flex: 1; height: 10px; background: #e9e9e9; border-radius: 5px; overflow: hidden; }
    .ig-mini-fill { height: 100%; background: ${accent}; border-radius: 5px; }
    .ig-mini-value { width: 36px; font-size: 12px; font-weight: 700; color: ${accent}; }

    /* ── Section body ── */
    .ig-section-body { color: #555; font-size: 13px; line-height: 1.65; overflow-wrap: break-word; }
    .ig-section-body p { margin-bottom: 10px; }
    .ig-section-body h1, .ig-section-body h2,
    .ig-section-body h3, .ig-section-body h4 { color: #1a1a1a; margin: 14px 0 8px; }
    .ig-section-body ul, .ig-section-body ol { padding-left: 20px; margin: 10px 0; }
    .ig-section-body li { margin-bottom: 5px; }
    .ig-section-body strong { font-weight: 700; color: #1a1a1a; }
    .ig-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 12px;
    }
    .ig-section-body th {
      background: ${lighten(accent, 0.92)};
      font-weight: 700;
      padding: 9px 12px;
      border-bottom: 2px solid ${accent};
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ig-section-body td {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
    }
    .ig-section-body hr { border: none; border-top: 1px solid #eee; margin: 14px 0; }

    /* ── Footer ── */
    .ig-footer {
      background: ${darken(brand.primary, 0.15)};
      color: ${contrastText(darken(brand.primary, 0.15))};
      padding: 28px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
    }
    .ig-footer-left { opacity: 0.8; }
    .ig-footer-company { font-weight: 700; opacity: 1; }
    .ig-footer-right { opacity: 0.6; text-align: right; }
  `;

  const body = `
    <div class="ig-wrapper">
      <div class="ig-header">
        <div class="ig-header-shapes"></div>
        <div class="ig-header-top">
          <div class="ig-header-logo">${brandLogoHtml(input, 'height:32px;filter:brightness(10);')}</div>
          <div class="ig-header-meta">
            <div class="ig-header-prospect">${prospect.companyName}</div>
            <div>${dateStr}</div>
          </div>
        </div>
        <div class="ig-header-content">
          <h1>${title}</h1>
          <div class="ig-header-sub">Data-driven insights for ${prospect.companyName}${prospect.industry ? ' | ' + prospect.industry : ''}</div>
        </div>
      </div>

      <div class="ig-content">
        ${bigNumHtml}
        ${barChartHtml}

        <div class="ig-sections-grid">
          ${iconArrayHtml}
          ${comparisonHtml}
        </div>

        ${processFlowHtml}
        ${sectionsHtml}
      </div>

      <div class="ig-footer">
        <div class="ig-footer-left">
          <span class="ig-footer-company">${companyName}</span>${input.companyDescription ? ' | ' + input.companyDescription : ''}
        </div>
        <div class="ig-footer-right">
          Prepared for ${prospect.companyName} &middot; ${dateStr}
        </div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Inter', ...brandFonts(brand)],
  });
}

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#f0f2f5;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="background:${accentColor};border-radius:6px 6px 0 0;padding:8px 10px;text-align:center;">
      <div style="width:50%;height:6px;background:#fff;opacity:0.9;border-radius:2px;margin:0 auto 3px;"></div>
      <div style="width:35%;height:4px;background:#fff;opacity:0.5;border-radius:2px;margin:0 auto;"></div>
    </div>
    <div style="padding:6px 8px;">
      <div style="display:flex;gap:4px;margin-bottom:5px;">
        <div style="flex:1;background:#fff;border-radius:4px;padding:4px;text-align:center;border-top:2px solid ${accentColor};">
          <div style="font-size:10px;font-weight:700;color:${accentColor};">85%</div>
          <div style="width:80%;height:2px;background:#ddd;border-radius:1px;margin:2px auto 0;"></div>
        </div>
        <div style="flex:1;background:#fff;border-radius:4px;padding:4px;text-align:center;border-top:2px solid ${accentColor};">
          <div style="font-size:10px;font-weight:700;color:${accentColor};">3.2x</div>
          <div style="width:60%;height:2px;background:#ddd;border-radius:1px;margin:2px auto 0;"></div>
        </div>
      </div>
      <div style="background:#fff;border-radius:4px;padding:4px 6px;margin-bottom:5px;">
        <div style="height:6px;background:${accentColor};border-radius:3px;width:70%;margin-bottom:3px;"></div>
        <div style="height:6px;background:${accentColor};border-radius:3px;width:50%;opacity:0.6;"></div>
      </div>
      <div style="display:flex;justify-content:center;gap:3px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${accentColor};"></div>
        <div style="width:20px;height:2px;background:${accentColor};opacity:0.3;align-self:center;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${accentColor};"></div>
        <div style="width:20px;height:2px;background:${accentColor};opacity:0.3;align-self:center;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${accentColor};"></div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;">Infographic</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style26Infographic: DocumentStyle = {
  id: 'style-26',
  name: 'Infographic',
  category: 'creative',
  description: 'Visual-first — bar charts, icon arrays, process flows, minimal prose',
  keywords: ['infographic', 'visual', 'icons', 'charts', 'data', 'callouts'],
  render,
  thumbnail,
};

export default style26Infographic;
