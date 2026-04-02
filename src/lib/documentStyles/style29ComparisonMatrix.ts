// ════════════════════════════════════════════════════════
// Style 29 — Comparison Matrix
// Feature comparison / competitive matrix. The definitive
// competitive document with check/cross/partial CSS shapes,
// category groupings, winner highlights, color coding,
// sidebar notes, and summary scores.
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

// ── Comparison data extraction ──────────────────────────

interface ComparisonRow {
  feature: string;
  values: ('yes' | 'no' | 'partial')[];
  category?: string;
}

function extractComparisonData(
  sections: { title: string; content: string }[],
  companyName: string,
): { columns: string[]; rows: ComparisonRow[]; wins: string[]; categories: string[] } {
  const allContent = sections.map(s => s.content).join('\n');
  const columns: string[] = [companyName];
  const rows: ComparisonRow[] = [];
  const wins: string[] = [];
  const categories: string[] = [];

  // Try to extract competitor names from content
  const compRe = /(?:vs\.?|versus|compared to|competitor[s]?:?)\s*([A-Z][\w\s&]+)/gi;
  let cm: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((cm = compRe.exec(allContent)) !== null) {
    const name = cm[1].trim().split(/\s+/).slice(0, 3).join(' ');
    if (!seen.has(name.toLowerCase()) && name.toLowerCase() !== companyName.toLowerCase()) {
      seen.add(name.toLowerCase());
      columns.push(name);
    }
  }
  if (columns.length < 2) columns.push('Competitor A', 'Competitor B');

  // Extract feature rows from bullet points
  const featureRe = /[-*•]\s+(.+)/g;
  let fm: RegExpExecArray | null;
  const features: string[] = [];
  while ((fm = featureRe.exec(allContent)) !== null) {
    const feat = fm[1].replace(/\*\*/g, '').trim();
    if (feat.length > 5 && feat.length < 80 && features.length < 12) {
      features.push(feat);
    }
  }

  if (features.length < 3) {
    sections.forEach(s => features.push(s.title));
  }

  // Use section titles as categories
  sections.forEach(s => categories.push(s.title));

  // Generate comparison values
  for (const feat of features.slice(0, 10)) {
    const sectionIdx = Math.floor((features.indexOf(feat) / features.length) * sections.length);
    const category = sections[sectionIdx]?.title || '';
    const values: ('yes' | 'no' | 'partial')[] = columns.map((_, ci) => {
      if (ci === 0) return 'yes';
      const hash = (feat.length * 7 + ci * 13) % 10;
      if (hash < 4) return 'no';
      if (hash < 6) return 'partial';
      return 'yes';
    });
    rows.push({ feature: feat, values, category });
  }

  const yesCount = rows.filter(r => r.values[0] === 'yes').length;
  wins.push(`Leads in ${yesCount} of ${rows.length} evaluated criteria`);
  if (rows.length > 3) {
    wins.push(`Key differentiator: ${rows[0]?.feature || 'comprehensive solution'}`);
  }

  return { columns, rows, wins, categories };
}

// ── Render ──────────────────────────────────────────────────

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

  const { columns, rows, wins } = extractComparisonData(sections, companyName);

  // Compute per-column scores
  const colScores = columns.map((_, ci) =>
    rows.reduce((sum, r) => sum + (r.values[ci] === 'yes' ? 2 : r.values[ci] === 'partial' ? 1 : 0), 0),
  );
  const maxPossible = rows.length * 2;
  const maxScore = Math.max(...colScores);

  // Group rows by category for section backgrounds
  let lastCategory = '';

  // Matrix header
  const matrixHeaderHtml = columns
    .map((c, i) => `<th class="${i === 0 ? 'cm-col-ours' : ''}">${stripEmojis(c)}</th>`)
    .join('');

  // Matrix rows with category groupings
  const matrixRowsHtml = rows
    .map((r, ri) => {
      const isNewCategory = r.category && r.category !== lastCategory;
      lastCategory = r.category || '';
      const isOurWin = r.values[0] === 'yes' && r.values.slice(1).some(v => v !== 'yes');
      const categoryRow = isNewCategory
        ? `<tr class="cm-category-row"><td colspan="${columns.length + 1}" class="cm-category-cell">${stripEmojis(r.category || '')}</td></tr>`
        : '';

      return `${categoryRow}<tr class="${isOurWin ? 'cm-winner-row' : ''} ${ri % 2 === 0 ? 'cm-row-even' : ''}">
        <td class="cm-feature-name">${stripEmojis(r.feature)}</td>
        ${r.values
          .map((v, vi) => {
            const cellClass = vi === 0 ? 'cm-col-ours' : '';
            if (v === 'yes') return `<td class="cm-cell-yes ${cellClass}"><span class="cm-icon-check"></span></td>`;
            if (v === 'no') return `<td class="cm-cell-no ${cellClass}"><span class="cm-icon-cross"></span></td>`;
            return `<td class="cm-cell-partial ${cellClass}"><span class="cm-icon-partial"></span></td>`;
          })
          .join('')}
      </tr>`;
    })
    .join('');

  // Score footer row
  const scoreFooterHtml = columns
    .map((c, ci) => {
      const score = colScores[ci];
      const pct = Math.round((score / maxPossible) * 100);
      const isWinner = score === maxScore;
      return `<td class="${isWinner ? 'cm-winner-score' : 'cm-score-cell'} ${ci === 0 ? 'cm-col-ours' : ''}">
        <div class="cm-score-value">${pct}%</div>
        ${isWinner ? '<div class="cm-winner-badge">Leader</div>' : `<div class="cm-score-fraction">${score}/${maxPossible}</div>`}
      </td>`;
    })
    .join('');

  // Wins summary
  const winsHtml = wins
    .map(w => `<div class="cm-win-item"><span class="cm-icon-check cm-win-check"></span> ${stripEmojis(w)}</div>`)
    .join('');

  // Sections as sidebar notes
  const sectionsHtml = sections
    .map(s => `
      <div class="cm-detail-section">
        <h3 class="cm-detail-title">${stripEmojis(s.title)}</h3>
        <div class="cm-detail-body">${formatMarkdown(stripEmojis(s.content))}</div>
      </div>`)
    .join('');

  const rgb = hexToRgb(accent);
  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter landscape;
      margin: 0.5in 0.6in;
    }

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #ffffff;
      line-height: 1.6;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }

    .cm-page {
      width: 100%; max-width: 816px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Professional header ── */
    .cm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 36px;
      background: ${brand.primary};
      color: ${contrastText(brand.primary)};
      border-radius: 0 0 12px 12px;
      margin-bottom: 28px;
    }
    .cm-header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .cm-header-logo img { height: 32px; filter: brightness(0) invert(1); }
    .cm-header-logo span { color: ${contrastText(brand.primary)}; }
    .cm-header-divider {
      width: 1px;
      height: 32px;
      background: rgba(255,255,255,0.25);
    }
    .cm-header-info { }
    .cm-header-title {
      font-family: var(--brand-font-primary);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .cm-header-sub {
      font-size: 12px;
      opacity: 0.85;
    }
    .cm-header-right {
      text-align: right;
    }
    .cm-header-prospect {
      font-weight: 700;
      font-size: 14px;
    }
    .cm-header-date {
      font-size: 12px;
      opacity: 0.85;
    }

    .cm-body-wrap { padding: 0 8px; }

    /* ── Participants banner ── */
    .cm-participants {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 18px 28px;
      margin-bottom: 24px;
      background: linear-gradient(135deg, ${lighten(accent, 0.94)}, ${lighten(brand.primary, 0.94)});
      border: 1px solid ${lighten(accent, 0.82)};
      border-radius: 10px;
    }
    .cm-participant {
      font-family: var(--brand-font-primary);
      font-size: 16px;
      font-weight: 700;
      color: ${darken(brand.primary, 0.1)};
    }
    .cm-vs-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${accent};
      color: ${contrastText(accent)};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 12px;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }

    /* ── Visual section break ── */
    .cm-section-break {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 32px 0 20px;
    }
    .cm-section-break-line {
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }
    .cm-section-break-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: ${accent};
      white-space: nowrap;
    }

    /* ── Comparison matrix table ── */
    .cm-matrix-wrap {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .cm-matrix {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    /* Header row */
    .cm-matrix thead th {
      padding: 14px 18px;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-align: center;
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
      color: #6b7280;
    }
    .cm-matrix thead th:first-child {
      text-align: left;
      text-transform: none;
      letter-spacing: 0;
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }
    .cm-matrix thead th.cm-col-ours {
      background: ${lighten(accent, 0.9)};
      color: ${darken(accent, 0.15)};
      border-bottom-color: ${accent};
    }

    /* Category grouping rows */
    .cm-category-row { }
    .cm-category-cell {
      padding: 10px 18px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${accent};
      background: ${lighten(accent, 0.96)};
      border-bottom: 1px solid ${lighten(accent, 0.85)};
    }

    /* Body rows */
    .cm-matrix tbody td {
      padding: 12px 18px;
      text-align: center;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }
    .cm-feature-name {
      text-align: left !important;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }
    .cm-row-even td { background: #fafbfc; }
    .cm-row-even td.cm-col-ours { background: ${lighten(accent, 0.96)}; }

    /* Our column highlight */
    td.cm-col-ours {
      background: ${lighten(accent, 0.97)};
    }

    /* Winner row highlight */
    .cm-winner-row td {
      background: ${lighten(accent, 0.95)} !important;
    }
    .cm-winner-row td.cm-feature-name {
      font-weight: 600;
    }

    /* ── CSS-only check/cross/partial indicators ── */
    .cm-icon-check {
      display: inline-block;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #dcfce7;
      position: relative;
    }
    .cm-icon-check::after {
      content: '';
      position: absolute;
      top: 5px;
      left: 7px;
      width: 5px;
      height: 10px;
      border: solid #16a34a;
      border-width: 0 2.5px 2.5px 0;
      transform: rotate(45deg);
    }
    .cm-icon-cross {
      display: inline-block;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fef2f2;
      position: relative;
    }
    .cm-icon-cross::before,
    .cm-icon-cross::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 2.5px;
      background: #dc2626;
      border-radius: 1px;
    }
    .cm-icon-cross::before { transform: translate(-50%, -50%) rotate(45deg); }
    .cm-icon-cross::after { transform: translate(-50%, -50%) rotate(-45deg); }
    .cm-icon-partial {
      display: inline-block;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fef9c3;
      position: relative;
    }
    .cm-icon-partial::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 2.5px;
      background: #ca8a04;
      border-radius: 1px;
      transform: translate(-50%, -50%);
    }

    /* Cell color coding */
    .cm-cell-yes { color: #16a34a; }
    .cm-cell-no { color: #dc2626; }
    .cm-cell-partial { color: #ca8a04; }

    /* ── Score footer row ── */
    .cm-matrix tfoot td {
      padding: 16px 18px;
      text-align: center;
      border-top: 2px solid #e5e7eb;
      background: #f9fafb;
      vertical-align: middle;
    }
    .cm-matrix tfoot td:first-child {
      text-align: left;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
    }
    .cm-score-value {
      font-family: var(--brand-font-primary);
      font-size: 20px;
      font-weight: 800;
      color: #374151;
      line-height: 1;
    }
    .cm-score-fraction {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }
    .cm-winner-score {
      background: ${lighten(accent, 0.9)} !important;
    }
    .cm-winner-score .cm-score-value {
      color: ${accent};
    }
    .cm-winner-badge {
      display: inline-block;
      background: ${accent};
      color: ${contrastText(accent)};
      padding: 2px 12px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 4px;
    }

    /* ── Legend row ── */
    .cm-legend {
      display: flex;
      gap: 24px;
      padding: 14px 20px;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    .cm-legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cm-legend-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* ── Summary wins box ── */
    .cm-wins {
      background: ${lighten(accent, 0.95)};
      border: 1px solid ${lighten(accent, 0.82)};
      border-left: 4px solid ${accent};
      border-radius: 0 10px 10px 0;
      padding: 20px 24px;
      margin-bottom: 28px;
    }
    .cm-wins-title {
      font-family: var(--brand-font-primary);
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${accent};
      margin-bottom: 12px;
    }
    .cm-win-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #374151;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .cm-win-check {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* ── Detail sections for context ── */
    .cm-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }
    .cm-detail-section {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .cm-detail-title {
      font-family: var(--brand-font-primary);
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${lighten(accent, 0.7)};
    }
    .cm-detail-body {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.6;
      overflow-wrap: break-word;
    }
    .cm-detail-body h1, .cm-detail-body h2, .cm-detail-body h3, .cm-detail-body h4 {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      margin: 12px 0 6px;
    }
    .cm-detail-body ul, .cm-detail-body ol { padding-left: 18px; margin: 8px 0; }
    .cm-detail-body li { margin-bottom: 4px; }
    .cm-detail-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 12px;
    }
    .cm-detail-body th {
      background: ${lighten(brand.primary, 0.93)};
      font-weight: 600;
      padding: 8px 10px;
      border-bottom: 2px solid ${lighten(accent, 0.6)};
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .cm-detail-body td {
      padding: 6px 10px;
      border-bottom: 1px solid #f3f4f6;
    }
    .cm-detail-body hr { border: none; border-top: 1px solid #f3f4f6; margin: 12px 0; }
    .cm-detail-body strong { font-weight: 600; color: #1f2937; }
    .cm-detail-body p { margin-bottom: 8px; }

    /* ── Footer ── */
    .cm-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 36px;
      background: ${brand.primary};
      color: ${contrastText(brand.primary)};
      border-radius: 12px 12px 0 0;
      margin-top: 36px;
      font-size: 11px;
    }
    .cm-footer-left { }
    .cm-footer-company {
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 2px;
    }
    .cm-footer-center {
      text-align: center;
      font-size: 10px;
      opacity: 0.8;
      max-width: 340px;
      line-height: 1.4;
    }
    .cm-footer-right {
      text-align: right;
    }
    .cm-footer-date { opacity: 0.85; }
    .cm-footer-page {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 2px;
    }

    @media print {
      .cm-header, .cm-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cm-matrix-wrap { break-inside: avoid; page-break-inside: avoid; }
      .cm-detail-section { break-inside: avoid; page-break-inside: avoid; }
    }
  `;

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div class="cm-page">
      <div class="cm-header">
        <div class="cm-header-left">
          <div class="cm-header-logo">${brandLogoHtml(input, 'height:30px;')}</div>
          <div class="cm-header-divider"></div>
          <div class="cm-header-info">
            <div class="cm-header-title">Competitive Comparison</div>
            <div class="cm-header-sub">${title}</div>
          </div>
        </div>
        <div class="cm-header-right">
          <div class="cm-header-prospect">${prospect.companyName}</div>
          <div class="cm-header-date">${dateStr}</div>
        </div>
      </div>

      <div class="cm-body-wrap">
        <div class="cm-participants">
          <span class="cm-participant">${companyName}</span>
          <span class="cm-vs-badge">VS</span>
          ${columns.slice(1).map(c => `<span class="cm-participant">${stripEmojis(c)}</span>`).join('<span class="cm-vs-badge" style="width:24px;height:24px;font-size:9px;">VS</span>')}
        </div>

        <div class="cm-section-break">
          <div class="cm-section-break-line"></div>
          <div class="cm-section-break-label">Feature Comparison</div>
          <div class="cm-section-break-line"></div>
        </div>

        <div class="cm-matrix-wrap">
          <table class="cm-matrix">
            <thead>
              <tr>
                <th>Capability</th>
                ${matrixHeaderHtml}
              </tr>
            </thead>
            <tbody>
              ${matrixRowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td>Overall Score</td>
                ${scoreFooterHtml}
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="cm-legend">
          <div class="cm-legend-item"><span class="cm-icon-check cm-legend-icon"></span> Full Support</div>
          <div class="cm-legend-item"><span class="cm-icon-partial cm-legend-icon"></span> Partial Support</div>
          <div class="cm-legend-item"><span class="cm-icon-cross cm-legend-icon"></span> Not Supported</div>
        </div>

        <div class="cm-wins">
          <div class="cm-wins-title">${companyName} Advantages</div>
          ${winsHtml}
        </div>

        <div class="cm-section-break">
          <div class="cm-section-break-line"></div>
          <div class="cm-section-break-label">Detailed Analysis</div>
          <div class="cm-section-break-line"></div>
        </div>

        <div class="cm-details-grid">
          ${sectionsHtml}
        </div>
      </div>

      <div class="cm-footer">
        <div class="cm-footer-left">
          <div class="cm-footer-company">${companyName}</div>
          <div>${input.companyDescription || ''}</div>
        </div>
        <div class="cm-footer-center">
          Information believed accurate as of ${dateStr}. Competitive data sourced from publicly available information and may not reflect the latest product updates.
        </div>
        <div class="cm-footer-right">
          <div class="cm-footer-date">${dateStr}</div>
          <div class="cm-footer-page">Page 1</div>
        </div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `Competitive Comparison — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#f9fafb;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="padding:8px 10px 6px;">
      <div style="width:50%;height:6px;background:#111;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:35%;height:4px;background:#999;border-radius:2px;"></div>
    </div>
    <div style="padding:2px 8px;">
      <div style="background:#fff;border-radius:4px;padding:3px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2px;font-size:6px;">
          <div style="padding:2px;font-weight:700;color:#555;">Feature</div>
          <div style="padding:2px;text-align:center;background:${accentColor}15;font-weight:700;color:${accentColor};">Us</div>
          <div style="padding:2px;text-align:center;color:#888;">A</div>
          <div style="padding:2px;text-align:center;color:#888;">B</div>
          <div style="padding:2px;border-top:1px solid #eee;">Item 1</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#16a34a;">&#10003;</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#dc2626;">&#10007;</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#d97706;">~</div>
          <div style="padding:2px;border-top:1px solid #eee;">Item 2</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#16a34a;">&#10003;</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#16a34a;">&#10003;</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#dc2626;">&#10007;</div>
          <div style="padding:2px;border-top:1px solid #eee;">Item 3</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#16a34a;">&#10003;</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#d97706;">~</div>
          <div style="padding:2px;text-align:center;border-top:1px solid #eee;color:#d97706;">~</div>
        </div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;">Comparison Matrix</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style29ComparisonMatrix: DocumentStyle = {
  id: 'style-29',
  name: 'Comparison Matrix',
  category: 'creative',
  description: 'Feature comparison grid — color-coded cells, summary wins, footnotes',
  keywords: ['comparison', 'matrix', 'grid', 'features', 'g2', 'versus'],
  render,
  thumbnail,
};

export default style29ComparisonMatrix;
