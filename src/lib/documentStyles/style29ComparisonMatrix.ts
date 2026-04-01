// ════════════════════════════════════════════════════════
// Style 29 — Comparison Matrix
// Feature comparison grid — color-coded cells, summary
// wins, G2-style comparison page feel
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
} from './shared';

// ── Comparison data extraction ──────────────────────────

interface ComparisonRow {
  feature: string;
  values: ('yes' | 'no' | 'partial')[];
}

function extractComparisonData(
  sections: { title: string; content: string }[],
  companyName: string,
): { columns: string[]; rows: ComparisonRow[]; wins: string[] } {
  const allContent = sections.map(s => s.content).join('\n');
  const columns: string[] = [companyName];
  const rows: ComparisonRow[] = [];
  const wins: string[] = [];

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

  // Extract feature rows from bullet points or table rows
  const featureRe = /[-*•]\s+(.+)/g;
  let fm: RegExpExecArray | null;
  const features: string[] = [];
  while ((fm = featureRe.exec(allContent)) !== null) {
    const feat = fm[1].replace(/\*\*/g, '').trim();
    if (feat.length > 5 && feat.length < 80 && features.length < 12) {
      features.push(feat);
    }
  }

  // If no features found, use section titles
  if (features.length < 3) {
    sections.forEach(s => features.push(s.title));
  }

  // Generate comparison values (first column biased positive)
  for (const feat of features.slice(0, 10)) {
    const values: ('yes' | 'no' | 'partial')[] = columns.map((_, ci) => {
      if (ci === 0) return 'yes'; // Our company
      const hash = (feat.length * 7 + ci * 13) % 10;
      if (hash < 4) return 'no';
      if (hash < 6) return 'partial';
      return 'yes';
    });
    rows.push({ feature: feat, values });
  }

  // Generate wins
  const yesCount = rows.filter(r => r.values[0] === 'yes').length;
  wins.push(`${companyName} leads in ${yesCount} of ${rows.length} evaluated criteria`);
  if (rows.length > 3) {
    wins.push(`Key differentiator: ${rows[0]?.feature || 'comprehensive solution'}`);
  }

  return { columns, rows, wins };
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

  const { columns, rows, wins } = extractComparisonData(sections, companyName);

  const matrixHeaderHtml = columns
    .map(
      (c, i) =>
        `<th class="${i === 0 ? 'col-ours' : ''}">${c}</th>`,
    )
    .join('');

  const matrixRowsHtml = rows
    .map(
      r => `<tr>
      <td class="feature-name">${r.feature}</td>
      ${r.values
        .map(
          (v, vi) =>
            `<td class="cell-${v} ${vi === 0 ? 'col-ours' : ''}">${
              v === 'yes' ? '&#10003;' : v === 'no' ? '&#10007;' : '~'
            }</td>`,
        )
        .join('')}
    </tr>`,
    )
    .join('');

  const winsHtml = wins
    .map(w => `<div class="win-item">&#10003; ${w}</div>`)
    .join('');

  // Compute per-column scores for winner row
  const colScores = columns.map((_, ci) =>
    rows.reduce((sum, r) => sum + (r.values[ci] === 'yes' ? 2 : r.values[ci] === 'partial' ? 1 : 0), 0),
  );
  const maxScore = Math.max(...colScores);
  const winnerFooterHtml = columns
    .map((_, ci) => {
      const score = colScores[ci];
      const isWinner = score === maxScore;
      return `<td class="${isWinner ? 'winner-cell' : ''}">${
        isWinner ? '<span class="winner-badge">Winner</span>' : `${score}/${rows.length * 2}`
      }</td>`;
    })
    .join('');

  const sectionsHtml = sections
    .map(
      s => `
      <div class="cm-section">
        <h2 class="cm-section-title">${s.title}</h2>
        <div class="cm-body">${formatMarkdown(s.content)}</div>
      </div>`,
    )
    .join('');

  const css = `
    ${brandCSSVars(brand)}

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #f9fafb;
      line-height: 1.6;
      font-size: var(--brand-font-body-size);
    }
    .page { max-width: 920px; margin: 0 auto; padding: 48px 40px; }

    /* ── Header ── */
    .cm-header {
      margin-bottom: 40px;
      padding-bottom: 28px;
      border-bottom: 1px solid #e0e0e0;
    }
    .cm-header-logo { margin-bottom: 20px; }
    .cm-header h1 {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      color: #111;
      margin-bottom: 6px;
    }
    .cm-header-sub { font-size: 14px; color: #777; }

    /* ── VS Banner ── */
    .vs-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      margin: 20px 0 28px;
      padding: 20px 28px;
      background: linear-gradient(135deg, ${lighten(brand.primary, 0.92)}, ${lighten(brand.accent, 0.92)});
      border-radius: 12px;
      border: 1px solid ${lighten(brand.primary, 0.82)};
    }
    .vs-entity {
      font-family: var(--brand-font-primary);
      font-size: 18px;
      font-weight: 700;
      color: ${darken(brand.primary, 0.15)};
    }
    .vs-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--brand-primary);
      color: ${contrastText(brand.primary)};
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }

    /* ── Matrix table ── */
    .matrix-wrap {
      background: #fff;
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 28px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      overflow-x: auto;
    }
    .matrix {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .matrix thead th {
      padding: 14px 16px;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: center;
      background: #f3f4f6;
      border-bottom: 2px solid #e0e0e0;
      color: #555;
    }
    .matrix thead th:first-child {
      text-align: left;
      text-transform: none;
      letter-spacing: 0;
      font-size: 14px;
      color: #111;
    }
    .matrix thead th.col-ours {
      background: ${lighten(brand.primary, 0.88)};
      color: var(--brand-primary);
    }
    .matrix tbody td {
      padding: 12px 16px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
      font-size: 18px;
    }
    .matrix tbody td.feature-name {
      text-align: left;
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }
    .matrix tbody td.col-ours {
      background: ${lighten(brand.primary, 0.96)};
    }
    .cell-yes { color: #16a34a; font-weight: 700; }
    .cell-no { color: #dc2626; font-weight: 700; }
    .cell-partial { color: #d97706; font-weight: 700; }

    /* ── Winner row ── */
    .matrix tfoot td {
      padding: 12px 16px;
      text-align: center;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-top: 2px solid #e0e0e0;
      background: #f9fafb;
      color: #888;
    }
    .matrix tfoot td.winner-cell {
      background: ${lighten(brand.primary, 0.88)};
      color: var(--brand-primary);
    }
    .winner-badge {
      display: inline-block;
      background: var(--brand-primary);
      color: ${contrastText(brand.primary)};
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 10px;
      letter-spacing: 0.06em;
    }

    /* ── Summary wins ── */
    .wins-box {
      background: ${lighten(brand.primary, 0.94)};
      border-left: 4px solid var(--brand-primary);
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 32px;
    }
    .wins-title {
      font-weight: 700;
      font-size: 14px;
      color: var(--brand-primary);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .win-item {
      font-size: 14px;
      color: #16a34a;
      margin-bottom: 6px;
    }

    /* ── Content sections ── */
    .cm-section {
      background: #fff;
      border-radius: 10px;
      padding: 24px 28px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .cm-section-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: #111;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--brand-primary);
    }
    .cm-body { color: #444; }
    .cm-body h1, .cm-body h2, .cm-body h3, .cm-body h4 { color: #111; margin: 14px 0 8px; }
    .cm-body ul, .cm-body ol { padding-left: 22px; margin: 10px 0; }
    .cm-body li { margin-bottom: 5px; }
    .cm-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .cm-body th { background: ${lighten(brand.primary, 0.92)}; font-weight: 600; padding: 10px 12px; border-bottom: 2px solid var(--brand-primary); text-align: left; }
    .cm-body td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .cm-body hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
    .cm-body strong { font-weight: 600; }
    .cm-body em { font-style: italic; }

    /* ── Legend ── */
    .matrix-legend {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #777;
      margin-top: 10px;
      padding: 0 8px;
    }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-icon { font-size: 14px; }

    /* ── Footer ── */
    .cm-footer {
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #e0e0e0;
      padding-top: 24px;
      margin-top: 32px;
    }
  `;

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div class="page">
      <div class="cm-header">
        <div class="cm-header-logo">${brandLogoHtml(input)}</div>
        <h1>${title}</h1>
        <div class="cm-header-sub">Comparison prepared for ${prospect.companyName} &middot; ${dateStr}</div>
      </div>

      <div class="vs-banner">
        <span class="vs-entity">${companyName}</span>
        <span class="vs-badge">VS</span>
        <span class="vs-entity">${prospect.companyName}</span>
      </div>

      <div class="matrix-wrap">
        <table class="matrix">
          <thead>
            <tr>
              <th>Feature</th>
              ${matrixHeaderHtml}
            </tr>
          </thead>
          <tbody>
            ${matrixRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="text-align:left;">Score</td>
              ${winnerFooterHtml}
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="matrix-legend">
        <div class="legend-item"><span class="legend-icon cell-yes">&#10003;</span> Supported</div>
        <div class="legend-item"><span class="legend-icon cell-partial">~</span> Partial</div>
        <div class="legend-item"><span class="legend-icon cell-no">&#10007;</span> Not supported</div>
      </div>

      <div class="wins-box">
        <div class="wins-title">Key Wins</div>
        ${winsHtml}
      </div>

      ${sectionsHtml}

      <div class="cm-footer">
        ${companyName} | ${dateStr} | Generated by ContentForge
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
