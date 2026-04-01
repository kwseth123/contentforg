// ════════════════════════════════════════════════════════
// Style 26 — Infographic
// Visual-first layout — bar charts, icon arrays, process
// flows, timelines, minimal prose, maximum data viz
// ════════════════════════════════════════════════════════

import type { DocumentStyle, StyleInput } from './types';
import {
  resolveBrand,
  brandCSSVars,
  brandFonts,
  brandLogoHtml,
  formatMarkdown,
  wrapDocument,
  lighten,
  contrastText,
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

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
  const dateStr =
    date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const allContent = sections.map(s => s.content).join('\n');
  const percentages = extractPercentages(allContent);
  const bigNumbers = extractNumbers(allContent);

  // Build bar chart HTML
  const barChartHtml =
    percentages.length > 0
      ? `<div class="bar-chart">
          ${percentages
            .map(
              p => `<div class="bar-row">
              <span class="bar-label">${p.label}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.min(p.value, 100)}%;"></div></div>
              <span class="bar-value">${p.value}%</span>
            </div>`,
            )
            .join('')}
        </div>`
      : '';

  // Build icon array for first percentage
  const iconArrayHtml =
    percentages.length > 0
      ? (() => {
          const pct = percentages[0];
          const filled = Math.round(pct.value / 10);
          const empty = 10 - filled;
          return `<div class="icon-array">
            <div class="icon-array-label">${pct.label}: ${pct.value}%</div>
            <div class="icon-dots">
              ${'<span class="dot filled"></span>'.repeat(filled)}${'<span class="dot empty"></span>'.repeat(empty)}
            </div>
          </div>`;
        })()
      : '';

  // Big number callouts
  const bigNumHtml =
    bigNumbers.length > 0
      ? `<div class="big-numbers">
          ${bigNumbers
            .map(
              n => `<div class="big-num-card">
              <div class="big-num-value">${n.value}</div>
              <div class="big-num-label">${n.label}</div>
            </div>`,
            )
            .join('')}
        </div>`
      : '';

  // Process flow from section titles
  const processFlowHtml =
    sections.length >= 3
      ? `<div class="process-flow">
          ${sections
            .map(
              (s, i) =>
                `<div class="flow-step">
              <div class="flow-circle">${i + 1}</div>
              <div class="flow-label">${s.title}</div>
            </div>${i < sections.length - 1 ? '<div class="flow-connector"></div>' : ''}`,
            )
            .join('')}
        </div>`
      : '';

  const sectionsHtml = sections
    .map(
      s => `
      <div class="info-section">
        <h2 class="info-heading">${s.title}</h2>
        <div class="info-body">${formatMarkdown(s.content)}</div>
      </div>`,
    )
    .join('');

  const css = `
    ${brandCSSVars(brand)}

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #f5f5f5;
      line-height: 1.6;
      font-size: var(--brand-font-body-size);
    }
    .page { max-width: 860px; margin: 0 auto; padding: 48px 40px; }

    /* ── Header ── */
    .info-header {
      text-align: center;
      background: var(--brand-primary);
      color: ${contrastText(brand.primary)};
      border-radius: 12px;
      padding: 40px 32px;
      margin-bottom: 32px;
    }
    .info-header-logo { margin-bottom: 16px; }
    .info-header h1 {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .info-header-sub { opacity: 0.8; font-size: 15px; }

    /* ── Big numbers ── */
    .big-numbers {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
    }
    .big-num-card {
      flex: 1;
      background: #fff;
      border-radius: 10px;
      padding: 24px 16px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .big-num-value {
      font-family: var(--brand-font-primary);
      font-size: 32px;
      font-weight: 700;
      color: var(--brand-primary);
    }
    .big-num-label { font-size: 12px; color: #777; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── Bar chart ── */
    .bar-chart {
      background: #fff;
      border-radius: 10px;
      padding: 24px 28px;
      margin-bottom: 28px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-label { width: 120px; font-size: 13px; color: #555; text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--brand-primary); border-radius: 10px; transition: width 0.3s; }
    .bar-value { width: 40px; font-size: 14px; font-weight: 700; color: var(--brand-primary); }

    /* ── Icon array ── */
    .icon-array {
      background: #fff;
      border-radius: 10px;
      padding: 20px 28px;
      margin-bottom: 28px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .icon-array-label { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 10px; }
    .icon-dots { display: flex; gap: 8px; }
    .dot {
      width: 24px; height: 24px; border-radius: 50%;
      display: inline-block;
    }
    .dot.filled { background: var(--brand-primary); }
    .dot.empty { background: #ddd; }

    /* ── Process flow ── */
    .process-flow {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .flow-step { text-align: center; }
    .flow-circle {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--brand-primary);
      color: ${contrastText(brand.primary)};
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px;
      margin: 0 auto 6px;
    }
    .flow-label { font-size: 11px; color: #555; max-width: 90px; }
    .flow-connector {
      width: 40px; height: 2px;
      background: var(--brand-primary);
      opacity: 0.3;
      margin: 0 4px;
      align-self: center;
      margin-bottom: 20px;
    }

    /* ── Sections ── */
    .info-section {
      background: #fff;
      border-radius: 10px;
      padding: 28px 32px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .info-heading {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: #111;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--brand-primary);
    }
    .info-body { color: #444; }
    .info-body h1, .info-body h2, .info-body h3, .info-body h4 { color: #111; margin: 16px 0 8px; }
    .info-body ul, .info-body ol { padding-left: 22px; margin: 10px 0; }
    .info-body li { margin-bottom: 5px; }
    .info-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .info-body th { background: ${lighten(brand.primary, 0.92)}; font-weight: 600; padding: 10px 12px; border-bottom: 2px solid var(--brand-primary); text-align: left; }
    .info-body td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .info-body hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }

    /* ── Footer ── */
    .info-footer {
      text-align: center;
      font-size: 11px;
      color: #999;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  `;

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div class="page">
      <div class="info-header">
        <div class="info-header-logo">${brandLogoHtml(input, 'height:36px;filter:brightness(10);')}</div>
        <h1>${title}</h1>
        <div class="info-header-sub">Prepared for ${prospect.companyName}</div>
      </div>

      ${bigNumHtml}
      ${barChartHtml}
      ${iconArrayHtml}
      ${processFlowHtml}
      ${sectionsHtml}

      <div class="info-footer">
        ${companyName} | ${dateStr} | Generated by ContentForg
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

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#f5f5f5;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="background:${accentColor};border-radius:6px 6px 0 0;padding:8px 10px;text-align:center;">
      <div style="width:50%;height:6px;background:#fff;opacity:0.9;border-radius:2px;margin:0 auto 3px;"></div>
      <div style="width:35%;height:4px;background:#fff;opacity:0.5;border-radius:2px;margin:0 auto;"></div>
    </div>
    <div style="padding:6px 8px;">
      <div style="display:flex;gap:4px;margin-bottom:5px;">
        <div style="flex:1;background:#fff;border-radius:4px;padding:4px;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:${accentColor};">85%</div>
          <div style="width:80%;height:2px;background:#ddd;border-radius:1px;margin:2px auto 0;"></div>
        </div>
        <div style="flex:1;background:#fff;border-radius:4px;padding:4px;text-align:center;">
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
