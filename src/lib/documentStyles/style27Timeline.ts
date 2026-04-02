// ════════════════════════════════════════════════════════
// Style 27 — Timeline
// Professional project plan / implementation roadmap.
// Vertical timeline with phase markers, milestones,
// Gantt-style bars, status indicators, and connecting lines.
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

// ── Phase color rotation ────────────────────────────────

function phaseColor(brand: { primary: string; secondary: string; accent: string }, idx: number): string {
  const colors = [brand.primary, brand.secondary, brand.accent, darken(brand.primary, 0.15), lighten(brand.accent, 0.2)];
  return colors[idx % colors.length];
}

// ── Extract milestones from content ─────────────────────

function extractMilestones(content: string): string[] {
  const milestones: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*\u2022]\s+/.test(trimmed)) {
      // Strip bullet prefix, then convert inline markdown bold/italic to HTML
      let text = trimmed.replace(/^[-*\u2022]\s+/, '');
      text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/(?<!\w)\*(?!\*)(.+?)(?<!\*)\*(?!\w)/g, '<em>$1</em>');
      milestones.push(text);
    }
  }
  return milestones.slice(0, 8);
}

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
  return stats.slice(0, 3);
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

  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Status indicators: first third = complete, second third = in-progress, rest = upcoming
  const completedCount = Math.ceil(sections.length / 3);
  const inProgressCount = Math.ceil(sections.length / 3);

  function getStatus(idx: number): { label: string; colorClass: string } {
    if (idx < completedCount) return { label: 'Complete', colorClass: 'tl-status-complete' };
    if (idx < completedCount + inProgressCount) return { label: 'In Progress', colorClass: 'tl-status-progress' };
    return { label: 'Upcoming', colorClass: 'tl-status-upcoming' };
  }

  // Overview stats
  const overviewHtml = stats.length > 0 ? `
    <div class="tl-overview">
      ${stats.map(s => `
        <div class="tl-overview-stat">
          <div class="tl-overview-value">${s.value}</div>
          <div class="tl-overview-label">${s.label}</div>
        </div>
      `).join('')}
      <div class="tl-overview-stat">
        <div class="tl-overview-value">${sections.length}</div>
        <div class="tl-overview-label">Total Phases</div>
      </div>
    </div>` : '';

  // Gantt-style overview bar
  const ganttHtml = `
    <div class="tl-gantt-card">
      <div class="tl-gantt-header">Project Timeline Overview</div>
      <div class="tl-gantt-bars">
        ${sections.map((s, i) => {
          const color = phaseColor(brand, i);
          const widthPct = Math.max(20, 100 - (i * 8));
          const status = getStatus(i);
          return `
            <div class="tl-gantt-row">
              <span class="tl-gantt-label">${stripEmojis(s.title)}</span>
              <div class="tl-gantt-track">
                <div class="tl-gantt-fill" style="width:${widthPct}%;background:${color};opacity:${status.colorClass === 'tl-status-upcoming' ? '0.35' : status.colorClass === 'tl-status-progress' ? '0.7' : '1'};"></div>
              </div>
              <span class="tl-gantt-status ${status.colorClass}">${status.label}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;

  // Timeline sections
  const sectionsHtml = sections.map((s, i) => {
    const color = phaseColor(brand, i);
    const milestones = extractMilestones(s.content);
    const cleanContent = stripEmojis(s.content);
    const status = getStatus(i);
    const isLast = i === sections.length - 1;

    const milestonesHtml = milestones.length > 0 ? `
      <div class="tl-milestones">
        <div class="tl-milestones-header">Key Milestones</div>
        ${milestones.map((m, mi) => `
          <div class="tl-milestone-item">
            <div class="tl-milestone-dot ${status.colorClass === 'tl-status-complete' ? 'tl-dot-checked' : ''}" style="border-color:${color};">
              ${status.colorClass === 'tl-status-complete' ? '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="' + color + '" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
            </div>
            <span class="tl-milestone-text">${stripEmojis(m)}</span>
          </div>
        `).join('')}
      </div>` : '';

    return `
      <div class="tl-entry">
        <div class="tl-marker-col">
          <div class="tl-dot-outer" style="border-color:${color};">
            <div class="tl-dot-inner" style="background:${color};${status.colorClass === 'tl-status-upcoming' ? 'opacity:0.3;' : ''}"></div>
          </div>
          ${!isLast ? `<div class="tl-line" style="background:linear-gradient(to bottom, ${color}, ${phaseColor(brand, i + 1)});"></div>` : ''}
        </div>
        <div class="tl-content-card">
          <div class="tl-card-top" style="border-left:4px solid ${color};">
            <div class="tl-card-header">
              <div class="tl-phase-badge" style="background:${lighten(color, 0.9)};color:${color};">Phase ${i + 1}</div>
              <div class="tl-status-badge ${status.colorClass}">${status.label}</div>
            </div>
            <h2 class="tl-title">${stripEmojis(s.title)}</h2>
            <div class="tl-body">${formatMarkdown(cleanContent)}</div>
            ${milestonesHtml}
          </div>
        </div>
      </div>`;
  }).join('');

  // Data tables if any sections have tables
  const hasTable = sections.some(s => s.content.includes('|'));

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0.65in 0.75in;
      @bottom-center {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9px;
        color: #bbb;
      }
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .tl-entry { break-inside: avoid; page-break-inside: avoid; }
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: ${brand.text};
      background: #f8f9fb;
      line-height: 1.65;
      font-size: ${brand.bodySize}px;
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 0;
    }

    .tl-wrapper {
      width: 100%; max-width: 816px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .tl-header {
      background: #ffffff;
      padding: 40px 48px;
      border-bottom: 3px solid ${brand.primary};
      position: relative;
    }
    .tl-header::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      right: 0;
      height: 1px;
      background: ${lighten(brand.primary, 0.5)};
    }
    .tl-header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .tl-header-logo { flex-shrink: 0; }
    .tl-header-meta {
      text-align: right;
      font-size: 12px;
      color: #888;
      line-height: 1.6;
    }
    .tl-header-prospect {
      font-weight: 700;
      color: ${brand.primary};
      font-size: 13px;
    }
    .tl-header-title {
      font-size: ${brand.h1Size + 4}px;
      font-weight: 800;
      color: #1a1a1a;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .tl-header-subtitle {
      font-size: 15px;
      color: #777;
    }
    .tl-header-range {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 6px 14px;
      background: ${lightBg};
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: ${accent};
    }
    .tl-header-range svg {
      width: 14px;
      height: 14px;
    }

    /* ── Overview stats ── */
    .tl-overview {
      display: flex;
      flex-wrap: nowrap;
      gap: 16px;
      padding: 24px 48px;
      background: #ffffff;
    }
    .tl-overview-stat {
      flex: 1;
      min-width: 0;
      text-align: center;
      padding: 16px;
      background: ${lightBg};
      border-radius: 10px;
    }
    .tl-overview-value {
      font-size: 28px;
      font-weight: 800;
      color: ${accent};
      line-height: 1.1;
    }
    .tl-overview-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-top: 4px;
    }

    /* ── Gantt card ── */
    .tl-gantt-card {
      background: #ffffff;
      margin: 24px 48px;
      border-radius: 12px;
      padding: 24px 28px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .tl-gantt-header {
      font-size: 13px;
      font-weight: 700;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 18px;
    }
    .tl-gantt-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 12px;
    }
    .tl-gantt-row:last-child { margin-bottom: 0; }
    .tl-gantt-label {
      width: 140px;
      font-size: 12px;
      color: #555;
      text-align: right;
      flex-shrink: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tl-gantt-track {
      flex: 1;
      height: 16px;
      background: #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .tl-gantt-fill {
      height: 100%;
      border-radius: 8px;
    }
    .tl-gantt-status {
      width: 80px;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      padding: 3px 8px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    /* Status colors */
    .tl-status-complete {
      background: #dcfce7;
      color: #16a34a;
    }
    .tl-status-progress {
      background: #fef3c7;
      color: #d97706;
    }
    .tl-status-upcoming {
      background: #f1f5f9;
      color: #94a3b8;
    }

    /* ── Timeline content ── */
    .tl-content-area {
      padding: 32px 48px;
    }

    .tl-entry {
      display: flex;
      gap: 24px;
      min-height: 80px;
      margin-bottom: 4px;
      page-break-inside: avoid;
    }
    .tl-marker-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 32px;
    }
    .tl-dot-outer {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      flex-shrink: 0;
      z-index: 1;
    }
    .tl-dot-inner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .tl-line {
      width: 2px;
      flex: 1;
      opacity: 0.25;
      min-height: 40px;
    }

    /* ── Content cards ── */
    .tl-content-card {
      flex: 1;
      padding-bottom: 24px;
    }
    .tl-card-top {
      background: #ffffff;
      border-radius: 0 10px 10px 0;
      padding: 24px 28px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .tl-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .tl-phase-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .tl-status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 10px;
    }
    .tl-title {
      font-size: ${brand.h2Size + 2}px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.25;
      margin-bottom: 14px;
    }

    /* ── Body prose ── */
    .tl-body { color: #555; line-height: 1.7; overflow-wrap: break-word; }
    .tl-body p { margin-bottom: 12px; }
    .tl-body h1, .tl-body h2, .tl-body h3, .tl-body h4 {
      color: #1a1a1a;
      margin: 18px 0 8px;
    }
    .tl-body h1 { font-size: 20px; font-weight: 700; }
    .tl-body h2 { font-size: 17px; font-weight: 700; }
    .tl-body h3 { font-size: 15px; font-weight: 600; }
    .tl-body ul, .tl-body ol { padding-left: 22px; margin: 10px 0; }
    .tl-body li { margin-bottom: 6px; }
    .tl-body strong { font-weight: 700; color: #1a1a1a; }
    .tl-body em { font-style: italic; }

    /* ── Tables ── */
    .tl-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      border-radius: 8px;
      overflow: hidden;
    }
    .tl-body th {
      background: ${lighten(accent, 0.92)};
      font-weight: 700;
      padding: 10px 14px;
      border-bottom: 2px solid ${accent};
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .tl-body td {
      padding: 9px 14px;
      border-bottom: 1px solid #eee;
    }
    .tl-body tr:last-child td { border-bottom: none; }
    .tl-body hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }

    /* ── Milestones ── */
    .tl-milestones {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid #eee;
    }
    .tl-milestones-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #999;
      margin-bottom: 10px;
    }
    .tl-milestone-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .tl-milestone-dot {
      width: 18px;
      height: 18px;
      border: 2px solid;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #fff;
    }
    .tl-dot-checked {
      background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08);
    }
    .tl-milestone-text {
      font-size: 13px;
      color: #555;
      line-height: 1.4;
    }

    /* ── Footer ── */
    .tl-footer {
      background: #ffffff;
      border-top: 3px solid ${brand.primary};
      padding: 24px 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #999;
      position: relative;
    }
    .tl-footer::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 0;
      right: 0;
      height: 1px;
      background: ${lighten(brand.primary, 0.5)};
    }
    .tl-footer-left {}
    .tl-footer-company {
      font-weight: 700;
      color: #777;
    }
    .tl-footer-center {
      text-align: center;
    }
    .tl-footer-right {
      text-align: right;
    }
  `;

  const body = `
    <div class="tl-wrapper">
      <header class="tl-header">
        <div class="tl-header-top">
          <div class="tl-header-logo">${brandLogoHtml(input, 'height:36px;')}</div>
          <div class="tl-header-meta">
            <div class="tl-header-prospect">${prospect.companyName}</div>
            <div>${prospect.industry || ''}</div>
            <div>${dateStr}</div>
          </div>
        </div>
        <h1 class="tl-header-title">${title}</h1>
        <div class="tl-header-subtitle">Implementation roadmap for ${prospect.companyName}</div>
        <div class="tl-header-range">
          <svg viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="2" stroke="${accent}" stroke-width="1.5"/><path d="M1 6h12M4 1v2M10 1v2" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/></svg>
          ${sections.length} Phases &middot; ${dateStr}
        </div>
      </header>

      ${overviewHtml}
      ${ganttHtml}

      <div class="tl-content-area">
        ${sectionsHtml}
      </div>

      <footer class="tl-footer">
        <div class="tl-footer-left">
          <span class="tl-footer-company">${companyName}</span>${input.companyDescription ? ' | ' + input.companyDescription : ''}
        </div>
        <div class="tl-footer-center">
          Last updated: ${dateStr} &middot; Rev 1.0
        </div>
        <div class="tl-footer-right">
          Prepared for ${prospect.companyName}
        </div>
      </footer>
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
  return `<div style="width:100%;height:100%;background:#f8f9fb;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="padding:8px 12px 6px;background:#fff;border-bottom:3px solid ${accentColor};">
      <div style="width:50%;height:6px;background:#111;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:35%;height:4px;background:#999;border-radius:2px;"></div>
    </div>
    <div style="padding:4px 12px;">
      <div style="display:flex;gap:8px;">
        <div style="display:flex;flex-direction:column;align-items:center;width:10px;">
          <div style="width:10px;height:10px;border-radius:50%;border:2px solid ${accentColor};display:flex;align-items:center;justify-content:center;">
            <div style="width:5px;height:5px;border-radius:50%;background:${accentColor};"></div>
          </div>
          <div style="width:2px;flex:1;background:${accentColor};opacity:0.2;"></div>
        </div>
        <div style="flex:1;background:#fff;border-left:3px solid ${accentColor};border-radius:0 4px 4px 0;padding:4px 6px;margin-bottom:4px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <div style="display:flex;gap:3px;margin-bottom:3px;">
            <div style="font-size:5px;background:${accentColor}15;color:${accentColor};padding:1px 4px;border-radius:6px;font-weight:700;">PHASE 1</div>
            <div style="font-size:5px;background:#dcfce7;color:#16a34a;padding:1px 4px;border-radius:6px;font-weight:700;">Done</div>
          </div>
          <div style="width:60%;height:4px;background:#222;border-radius:2px;margin-bottom:2px;"></div>
          <div style="width:80%;height:3px;background:#ddd;border-radius:2px;"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <div style="display:flex;flex-direction:column;align-items:center;width:10px;">
          <div style="width:10px;height:10px;border-radius:50%;border:2px solid ${accentColor};display:flex;align-items:center;justify-content:center;">
            <div style="width:5px;height:5px;border-radius:50%;background:${accentColor};opacity:0.5;"></div>
          </div>
        </div>
        <div style="flex:1;background:#fff;border-left:3px solid ${accentColor};border-radius:0 4px 4px 0;padding:4px 6px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <div style="display:flex;gap:3px;margin-bottom:3px;">
            <div style="font-size:5px;background:${accentColor}15;color:${accentColor};padding:1px 4px;border-radius:6px;font-weight:700;">PHASE 2</div>
            <div style="font-size:5px;background:#fef3c7;color:#d97706;padding:1px 4px;border-radius:6px;font-weight:700;">Active</div>
          </div>
          <div style="width:50%;height:4px;background:#222;border-radius:2px;"></div>
        </div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;background:#fff;border-top:2px solid ${accentColor};">Timeline</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style27Timeline: DocumentStyle = {
  id: 'style-27',
  name: 'Timeline',
  category: 'creative',
  description: 'Vertical timeline with milestone markers and phase-coded colors',
  keywords: ['timeline', 'milestones', 'chronological', 'implementation', 'phases'],
  render,
  thumbnail,
};

export default style27Timeline;
