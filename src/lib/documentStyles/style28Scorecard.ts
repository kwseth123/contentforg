// ════════════════════════════════════════════════════════
// Style 28 — Scorecard
// Balanced scorecard / KPI dashboard document.
// Kaplan & Norton meets modern design — grid of KPI cards,
// traffic-light indicators, progress bars, RAG tables,
// aggregate summary row, data-first layout.
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
  darken,
  contrastText,
  hexToRgb,
  buildOnePagerDocument,
  professionalSymbolCSS,
  stripEmojis,
} from './shared';

// ── Score / grade helpers ──────────────────────────────

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'] as const;

function sectionGrade(idx: number, total: number): string {
  const ratio = total <= 1 ? 0 : idx / (total - 1);
  const gradeIdx = Math.min(Math.floor(ratio * 4), GRADES.length - 1);
  return GRADES[gradeIdx];
}

function sectionScore(idx: number, total: number): number {
  return Math.round(95 - (idx / Math.max(total - 1, 1)) * 27);
}

function ragStatus(score: number): 'green' | 'amber' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

function ragColor(status: 'green' | 'amber' | 'red'): string {
  if (status === 'green') return '#22c55e';
  if (status === 'amber') return '#eab308';
  return '#ef4444';
}

function extractFindings(content: string): string[] {
  const findings: string[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      findings.push(trimmed.replace(/^[-*•]\s+/, ''));
    }
  }
  return findings.slice(0, 5);
}

function extractStatValue(content: string): { value: string; label: string } | null {
  const patterns = [
    /(\d{1,3}(?:\.\d+)?%)\s*(.{0,30})/,
    /(\$[\d,.]+[MBKmk]?)\s*(.{0,30})/,
    /(\d+[xX])\s*(.{0,30})/,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return { value: m[1], label: m[2]?.trim() || '' };
  }
  return null;
}

// ── Render ─────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const { sections: rawSections, contentType, prospect, companyName, date } = input;
  const sections = rawSections.filter(s => s.title?.trim() || s.content?.trim());
  const dateStr =
    date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const scored = sections.map((s, i) => ({
    ...s,
    grade: sectionGrade(i, sections.length),
    score: sectionScore(i, sections.length),
    content: stripEmojis(s.content),
  }));

  const overallScore = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length)
    : 82;
  const overallGrade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B+' : overallScore >= 70 ? 'B' : 'C+';
  const overallRag = ragStatus(overallScore);

  // ── Aggregate summary cards ─────────────────────────
  const greenCount = scored.filter(s => ragStatus(s.score) === 'green').length;
  const amberCount = scored.filter(s => ragStatus(s.score) === 'amber').length;
  const redCount = scored.filter(s => ragStatus(s.score) === 'red').length;

  const summaryCardsHtml = `
    <div class="sc-agg-row">
      <div class="sc-agg-card sc-agg-overall">
        <div class="sc-agg-label">Overall Score</div>
        <div class="sc-agg-value" style="color:${accent};">${overallScore}<span class="sc-agg-unit">/100</span></div>
        <div class="sc-agg-grade" style="background:${accent};color:${contrastText(accent)};">${overallGrade}</div>
      </div>
      <div class="sc-agg-card">
        <div class="sc-agg-label">On Track</div>
        <div class="sc-agg-value" style="color:#22c55e;">${greenCount}</div>
        <div class="sc-agg-indicator"><span class="sc-traffic-light" style="background:#22c55e;"></span></div>
      </div>
      <div class="sc-agg-card">
        <div class="sc-agg-label">At Risk</div>
        <div class="sc-agg-value" style="color:#eab308;">${amberCount}</div>
        <div class="sc-agg-indicator"><span class="sc-traffic-light" style="background:#eab308;"></span></div>
      </div>
      <div class="sc-agg-card">
        <div class="sc-agg-label">Needs Attention</div>
        <div class="sc-agg-value" style="color:#ef4444;">${redCount}</div>
        <div class="sc-agg-indicator"><span class="sc-traffic-light" style="background:#ef4444;"></span></div>
      </div>
    </div>`;

  // ── Summary table rows ───────────────────────────────
  const summaryRows = scored
    .map(s => {
      const status = ragStatus(s.score);
      const color = ragColor(status);
      return `<tr>
        <td class="sum-status"><span class="sc-traffic-light" style="background:${color};"></span></td>
        <td class="sum-name">${stripEmojis(s.title)}</td>
        <td class="sum-grade" style="color:${accent};">${s.grade}</td>
        <td class="sum-score">${s.score}</td>
        <td class="sum-bar-cell">
          <div class="sum-bar-track">
            <div class="sum-bar-fill" style="width:${s.score}%;background:${color};"></div>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  // ── KPI cards grid ──────────────────────────────────
  const kpiCardsHtml = scored
    .map((s, i) => {
      const status = ragStatus(s.score);
      const color = ragColor(status);
      const stat = extractStatValue(s.content);
      const findings = extractFindings(s.content);
      const trendUp = s.score >= 75;

      return `
      <div class="sc-kpi-card">
        <div class="sc-kpi-header">
          <div class="sc-kpi-category">${stripEmojis(s.title)}</div>
          <span class="sc-traffic-light" style="background:${color};"></span>
        </div>
        <div class="sc-kpi-metrics">
          <div class="sc-kpi-score-block">
            <div class="sc-kpi-score-value">${s.score}</div>
            <div class="sc-kpi-score-label">Score</div>
          </div>
          <div class="sc-kpi-grade-block" style="background:${lighten(accent, 0.88)};color:${accent};">
            ${s.grade}
          </div>
          <div class="sc-kpi-trend ${trendUp ? 'trend-up' : 'trend-down'}">
            <span class="sc-trend-arrow">${trendUp ? '&#9650;' : '&#9660;'}</span>
          </div>
        </div>
        <div class="sc-kpi-bar">
          <div class="sc-kpi-bar-track">
            <div class="sc-kpi-bar-fill" style="width:${s.score}%;background:${color};"></div>
            <div class="sc-kpi-bar-target" style="left:80%;"></div>
          </div>
          <div class="sc-kpi-bar-labels">
            <span>0</span>
            <span class="sc-kpi-target-label">Target: 80</span>
            <span>100</span>
          </div>
        </div>
        ${stat ? `<div class="sc-kpi-stat"><span class="sc-kpi-stat-value">${stat.value}</span> ${stat.label}</div>` : ''}
        <div class="sc-kpi-body">${formatMarkdown(s.content)}</div>
        ${findings.length > 0 ? `
        <div class="sc-kpi-findings">
          ${findings.map(f => `<div class="sc-finding-row"><span class="sc-finding-check" style="color:${color};">&#10003;</span> ${stripEmojis(f)}</div>`).join('')}
        </div>` : ''}
      </div>`;
    })
    .join('');

  // ── RAG comparison table ────────────────────────────
  const ragTableHtml = `
    <div class="sc-rag-section">
      <h2 class="sc-rag-title">Performance Assessment Overview</h2>
      <table class="sc-rag-table">
        <thead>
          <tr>
            <th class="rag-th-status">Status</th>
            <th class="rag-th-category">Performance Category</th>
            <th class="rag-th-grade">Grade</th>
            <th class="rag-th-score">Score</th>
            <th class="rag-th-progress">Progress to Target</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows}
        </tbody>
        <tfoot>
          <tr class="sc-rag-total">
            <td><span class="sc-traffic-light" style="background:${ragColor(overallRag)};"></span></td>
            <td class="sum-name"><strong>Overall Assessment</strong></td>
            <td class="sum-grade" style="color:${accent};"><strong>${overallGrade}</strong></td>
            <td class="sum-score"><strong>${overallScore}</strong></td>
            <td class="sum-bar-cell">
              <div class="sum-bar-track">
                <div class="sum-bar-fill" style="width:${overallScore}%;background:${accent};"></div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>`;

  // ── CSS ──────────────────────────────────────────────
  const rgb = hexToRgb(accent);
  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0.6in 0.7in;
    }

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #ffffff;
      line-height: 1.6;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }

    .sc-page {
      width: 100%; max-width: 816px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Print-ready header ── */
    .sc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 36px;
      background: ${brand.primary};
      color: ${contrastText(brand.primary)};
      border-radius: 0 0 12px 12px;
      margin-bottom: 28px;
    }
    .sc-header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .sc-header-logo img { height: 36px; filter: brightness(0) invert(1); }
    .sc-header-logo span { color: ${contrastText(brand.primary)}; }
    .sc-header-divider {
      width: 1px;
      height: 36px;
      background: rgba(255,255,255,0.25);
    }
    .sc-header-title {
      font-family: var(--brand-font-primary);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .sc-header-right {
      text-align: right;
      font-size: 12px;
      opacity: 0.9;
    }
    .sc-header-prospect {
      font-weight: 700;
      font-size: 14px;
      opacity: 1;
      margin-bottom: 2px;
    }

    .sc-body { padding: 0 8px; }

    /* ── Reporting period bar ── */
    .sc-period-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: ${lighten(accent, 0.94)};
      border-left: 4px solid ${accent};
      border-radius: 0 8px 8px 0;
      margin-bottom: 28px;
      font-size: 13px;
      color: ${darken(brand.text, 0.1)};
    }
    .sc-period-bar strong { color: ${accent}; font-weight: 700; }

    /* ── Aggregate summary row ── */
    .sc-agg-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    .sc-agg-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      position: relative;
    }
    .sc-agg-card.sc-agg-overall {
      border-color: ${lighten(accent, 0.6)};
      background: linear-gradient(135deg, ${lighten(accent, 0.96)}, #ffffff);
    }
    .sc-agg-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .sc-agg-value {
      font-family: var(--brand-font-primary);
      font-size: 36px;
      font-weight: 800;
      line-height: 1.1;
    }
    .sc-agg-unit {
      font-size: 16px;
      font-weight: 500;
      opacity: 0.6;
    }
    .sc-agg-grade {
      display: inline-block;
      padding: 3px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 800;
      margin-top: 8px;
    }
    .sc-agg-indicator { margin-top: 8px; }

    /* ── Traffic light dots ── */
    .sc-traffic-light {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ── Visual section break ── */
    .sc-section-break {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 36px 0 24px;
    }
    .sc-section-break-line {
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }
    .sc-section-break-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${accent};
      white-space: nowrap;
    }

    /* ── RAG table ── */
    .sc-rag-section {
      margin-bottom: 36px;
    }
    .sc-rag-title {
      font-family: var(--brand-font-primary);
      font-size: 18px;
      font-weight: 700;
      color: ${darken(brand.text, 0.1)};
      margin-bottom: 16px;
      padding-left: 14px;
      border-left: 4px solid ${accent};
    }
    .sc-rag-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .sc-rag-table thead th {
      background: ${lighten(brand.primary, 0.92)};
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${darken(brand.text, 0.05)};
      padding: 12px 14px;
      text-align: left;
      border-bottom: 2px solid ${lighten(accent, 0.6)};
    }
    .rag-th-status { width: 50px; text-align: center !important; }
    .rag-th-grade { width: 60px; text-align: center !important; }
    .rag-th-score { width: 60px; text-align: center !important; }
    .rag-th-progress { width: 200px; }
    .sc-rag-table tbody tr { border-bottom: 1px solid #f3f4f6; }
    .sc-rag-table tbody tr:hover { background: ${lighten(accent, 0.97)}; }
    .sum-status { text-align: center; padding: 10px 14px; }
    .sum-name { padding: 10px 14px; font-weight: 500; color: #1f2937; font-size: 14px; }
    .sum-grade { padding: 10px 14px; text-align: center; font-weight: 800; font-size: 14px; }
    .sum-score { padding: 10px 14px; text-align: center; font-weight: 600; font-size: 14px; color: #374151; }
    .sum-bar-cell { padding: 10px 14px; }
    .sum-bar-track {
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }
    .sum-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .sc-rag-total {
      background: ${lighten(accent, 0.95)} !important;
      border-top: 2px solid ${lighten(accent, 0.6)};
    }
    .sc-rag-total td { padding: 12px 14px !important; }

    /* ── KPI card grid ── */
    .sc-kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }
    .sc-kpi-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sc-kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .sc-kpi-category {
      font-family: var(--brand-font-primary);
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
    }
    .sc-kpi-metrics {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }
    .sc-kpi-score-block { }
    .sc-kpi-score-value {
      font-family: var(--brand-font-primary);
      font-size: 32px;
      font-weight: 800;
      line-height: 1;
      color: ${darken(brand.text, 0.1)};
    }
    .sc-kpi-score-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #9ca3af;
      font-weight: 600;
    }
    .sc-kpi-grade-block {
      font-family: var(--brand-font-primary);
      font-size: 18px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 8px;
      line-height: 1;
    }
    .sc-kpi-trend {
      margin-left: auto;
    }
    .sc-trend-arrow { font-size: 14px; }
    .trend-up .sc-trend-arrow { color: #22c55e; }
    .trend-down .sc-trend-arrow { color: #ef4444; }

    /* ── Progress bar with target marker ── */
    .sc-kpi-bar { margin-bottom: 14px; }
    .sc-kpi-bar-track {
      height: 10px;
      background: #f3f4f6;
      border-radius: 5px;
      overflow: visible;
      position: relative;
    }
    .sc-kpi-bar-fill {
      height: 100%;
      border-radius: 5px;
      position: absolute;
      top: 0;
      left: 0;
    }
    .sc-kpi-bar-target {
      position: absolute;
      top: -3px;
      width: 2px;
      height: 16px;
      background: #374151;
      border-radius: 1px;
    }
    .sc-kpi-bar-labels {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #9ca3af;
      margin-top: 4px;
    }
    .sc-kpi-target-label {
      font-weight: 600;
      color: #374151;
    }

    /* ── KPI stat highlight ── */
    .sc-kpi-stat {
      background: ${lighten(accent, 0.94)};
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      color: #4b5563;
      margin-bottom: 12px;
    }
    .sc-kpi-stat-value {
      font-weight: 800;
      color: ${accent};
      font-size: 16px;
    }

    /* ── KPI body content ── */
    .sc-kpi-body {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.6;
      overflow-wrap: break-word;
    }
    .sc-kpi-body h1, .sc-kpi-body h2, .sc-kpi-body h3, .sc-kpi-body h4 {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      margin: 12px 0 6px;
    }
    .sc-kpi-body ul, .sc-kpi-body ol { padding-left: 18px; margin: 8px 0; }
    .sc-kpi-body li { margin-bottom: 4px; }
    .sc-kpi-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 12px;
    }
    .sc-kpi-body th {
      background: ${lighten(brand.primary, 0.93)};
      font-weight: 600;
      padding: 8px 10px;
      border-bottom: 2px solid ${lighten(accent, 0.6)};
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .sc-kpi-body td {
      padding: 6px 10px;
      border-bottom: 1px solid #f3f4f6;
    }
    .sc-kpi-body hr { border: none; border-top: 1px solid #f3f4f6; margin: 12px 0; }
    .sc-kpi-body strong { font-weight: 600; color: #1f2937; }
    .sc-kpi-body p { margin-bottom: 8px; }

    /* ── Findings checklist ── */
    .sc-kpi-findings {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed #e5e7eb;
    }
    .sc-finding-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 12px;
      color: #4b5563;
      padding: 3px 0;
    }
    .sc-finding-check {
      font-weight: 700;
      font-size: 12px;
      flex-shrink: 0;
    }

    /* ── Footer ── */
    .sc-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 36px;
      background: ${brand.primary};
      color: ${contrastText(brand.primary)};
      border-radius: 12px 12px 0 0;
      margin-top: 40px;
      font-size: 11px;
    }
    .sc-footer-left { }
    .sc-footer-company {
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 2px;
    }
    .sc-footer-center {
      text-align: center;
      font-size: 10px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .sc-footer-right {
      text-align: right;
    }
    .sc-footer-date { opacity: 0.85; }
    .sc-footer-page {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 2px;
    }

    @media print {
      .sc-header, .sc-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sc-kpi-card { break-inside: avoid; page-break-inside: avoid; }
      .sc-rag-table { break-inside: avoid; page-break-inside: avoid; }
    }
  `;

  // ── Body ─────────────────────────────────────────────
  const body = `
    <div class="sc-page">
      <div class="sc-header">
        <div class="sc-header-left">
          <div class="sc-header-logo">${brandLogoHtml(input, 'height:34px;')}</div>
          <div class="sc-header-divider"></div>
          <div class="sc-header-title">${title}</div>
        </div>
        <div class="sc-header-right">
          <div class="sc-header-prospect">${prospect.companyName}</div>
          <div>${dateStr}</div>
        </div>
      </div>

      <div class="sc-body">
        <div class="sc-period-bar">
          <span><strong>Reporting Period:</strong> ${dateStr}</span>
          <span>Prepared by ${companyName} for ${prospect.companyName}</span>
        </div>

        ${summaryCardsHtml}

        <div class="sc-section-break">
          <div class="sc-section-break-line"></div>
          <div class="sc-section-break-label">Assessment Overview</div>
          <div class="sc-section-break-line"></div>
        </div>

        ${ragTableHtml}

        <div class="sc-section-break">
          <div class="sc-section-break-line"></div>
          <div class="sc-section-break-label">Detailed KPI Dashboard</div>
          <div class="sc-section-break-line"></div>
        </div>

        <div class="sc-kpi-grid">
          ${kpiCardsHtml}
        </div>
      </div>

      <div class="sc-footer">
        <div class="sc-footer-left">
          <div class="sc-footer-company">${companyName}</div>
          <div>${input.companyDescription || ''}</div>
        </div>
        <div class="sc-footer-center">Confidential &mdash; Prepared exclusively for ${prospect.companyName}</div>
        <div class="sc-footer-right">
          <div class="sc-footer-date">Data as of ${dateStr}</div>
          <div class="sc-footer-page">Page 1</div>
        </div>
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

// ── Thumbnail ─────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#f4f5f7;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="padding:8px 10px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="width:48%;height:6px;background:#111;border-radius:2px;margin-bottom:3px;"></div>
        <div style="width:32%;height:4px;background:#999;border-radius:2px;"></div>
      </div>
      <div style="width:26px;height:26px;border-radius:50%;border:2px solid ${accentColor};display:flex;align-items:center;justify-content:center;background:#fff;">
        <span style="font-size:8px;font-weight:800;color:${accentColor};">A</span>
      </div>
    </div>
    <div style="padding:0 10px;margin-bottom:5px;">
      <div style="background:#fff;border-radius:4px;padding:4px 6px;box-shadow:0 1px 2px rgba(0,0,0,0.05);font-size:0;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
          <div style="width:28%;height:3px;background:#222;border-radius:2px;"></div>
          <div style="width:20px;height:4px;background:#eee;border-radius:2px;overflow:hidden;"><div style="width:85%;height:100%;background:${accentColor};border-radius:2px;"></div></div>
          <span style="width:6px;height:6px;border-radius:50%;background:${accentColor};display:inline-block;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <div style="width:24%;height:3px;background:#222;border-radius:2px;"></div>
          <div style="width:20px;height:4px;background:#eee;border-radius:2px;overflow:hidden;"><div style="width:65%;height:100%;background:${lighten(accentColor, 0.4)};border-radius:2px;"></div></div>
          <span style="width:6px;height:6px;border-radius:50%;background:${lighten(accentColor, 0.4)};display:inline-block;"></span>
        </div>
      </div>
    </div>
    <div style="padding:0 10px;">
      <div style="display:flex;margin-bottom:4px;">
        <div style="width:14px;background:${accentColor};border-radius:3px 0 0 3px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:6px;color:#fff;font-weight:800;">A</span>
        </div>
        <div style="flex:1;background:#fff;border-radius:0 3px 3px 0;padding:3px 5px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="width:70%;height:3px;background:#ddd;border-radius:2px;margin-bottom:2px;"></div>
          <div style="width:50%;height:3px;background:#eee;border-radius:2px;"></div>
        </div>
      </div>
      <div style="display:flex;">
        <div style="width:14px;background:${darken(accentColor, 0.15)};border-radius:3px 0 0 3px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:6px;color:#fff;font-weight:800;">B</span>
        </div>
        <div style="flex:1;background:#fff;border-radius:0 3px 3px 0;padding:3px 5px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="width:60%;height:3px;background:#ddd;border-radius:2px;margin-bottom:2px;"></div>
          <div style="width:45%;height:3px;background:#eee;border-radius:2px;"></div>
        </div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;">Scorecard</div>
  </div>`;
}

// ── Export ─────────────────────────────────────────────

const style28Scorecard: DocumentStyle = {
  id: 'style-28',
  name: 'Scorecard',
  category: 'creative',
  description: 'Evaluation framework with grades, rating bars, and traffic-light indicators',
  keywords: ['scorecard', 'evaluation', 'ratings', 'assessment', 'audit', 'maturity'],
  render,
  thumbnail,
};

export default style28Scorecard;
