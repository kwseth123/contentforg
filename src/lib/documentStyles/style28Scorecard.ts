// ════════════════════════════════════════════════════════
// Style 28 — Scorecard
// Evaluation framework layout — scored/rated sections with
// traffic-light indicators, rating bars, letter grades,
// summary table, and checkmark findings
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

// ── Score / grade helpers ──────────────────────────────

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'] as const;

function sectionGrade(idx: number, total: number): string {
  // Distribute grades across sections so earlier sections score higher
  const ratio = total <= 1 ? 0 : idx / (total - 1);
  const gradeIdx = Math.min(Math.floor(ratio * 4), GRADES.length - 1);
  return GRADES[gradeIdx];
}

function sectionScore(idx: number, total: number): number {
  // 95 down to ~68 spread across sections
  return Math.round(95 - (idx / Math.max(total - 1, 1)) * 27);
}

function trafficColor(
  score: number,
  brand: { accent: string; primary: string },
): string {
  if (score >= 80) return brand.accent;              // green — brand accent
  if (score >= 60) return lighten(brand.accent, 0.4); // amber — lightened accent
  return '#94a3b8';                                    // muted neutral
}

function ratingBarPct(score: number): number {
  return Math.max(10, Math.min(100, score));
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

// ── Render ─────────────────────────────────────────────

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

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // Pre-compute scores for each section
  const scored = sections.map((s, i) => ({
    ...s,
    grade: sectionGrade(i, sections.length),
    score: sectionScore(i, sections.length),
  }));

  const overallScore = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length)
    : 82;
  const overallGrade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B+' : overallScore >= 70 ? 'B' : 'C+';

  // ── Summary table rows ───────────────────────────────
  const summaryRows = scored
    .map(s => {
      const tColor = trafficColor(s.score, brand);
      return `<tr>
        <td class="sum-name">${s.title}</td>
        <td class="sum-grade">${s.grade}</td>
        <td class="sum-bar-cell">
          <div class="sum-bar-track">
            <div class="sum-bar-fill" style="width:${ratingBarPct(s.score)}%;background:${tColor};"></div>
          </div>
        </td>
        <td class="sum-dot"><span class="traffic-dot" style="background:${tColor};"></span></td>
      </tr>`;
    })
    .join('');

  // ── Section cards ────────────────────────────────────
  const sectionsHtml = scored
    .map((s, i) => {
      const tColor = trafficColor(s.score, brand);
      const badgeBg = i % 2 === 0 ? brand.primary : brand.secondary;
      const findings = extractFindings(s.content);

      const findingsHtml =
        findings.length > 0
          ? `<div class="sc-findings">
              <div class="sc-findings-label">Key Findings</div>
              ${findings.map(f => `<div class="sc-finding-item"><span class="sc-check">&#10003;</span> ${f}</div>`).join('')}
            </div>`
          : '';

      return `
      <div class="sc-card">
        <div class="sc-card-badge" style="background:${badgeBg};color:${contrastText(badgeBg)};">
          <span class="sc-badge-grade">${s.grade}</span>
          <span class="sc-badge-score">${s.score}</span>
        </div>
        <div class="sc-card-main">
          <div class="sc-card-top">
            <h2 class="sc-card-title">${s.title}</h2>
            <div class="sc-card-indicators">
              <span class="traffic-dot" style="background:${tColor};"></span>
              <div class="sc-mini-bar">
                <div class="sc-mini-fill" style="width:${ratingBarPct(s.score)}%;background:${tColor};"></div>
              </div>
            </div>
          </div>
          <div class="sc-card-body">${formatMarkdown(s.content)}</div>
          ${findingsHtml}
        </div>
      </div>`;
    })
    .join('');

  // ── CSS ──────────────────────────────────────────────
  const css = `
    ${brandCSSVars(brand)}

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #f4f5f7;
      line-height: 1.65;
      font-size: var(--brand-font-body-size);
    }
    .page { max-width: 860px; margin: 0 auto; padding: 48px 40px; }

    /* ── Header ── */
    .sc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .sc-header-left { flex: 1; }
    .sc-header-logo { margin-bottom: 18px; }
    .sc-header h1 {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      color: #111;
      margin-bottom: 6px;
    }
    .sc-header-sub { font-size: 14px; color: #777; }

    /* ── Overall score hero ── */
    .sc-hero {
      width: 110px;
      text-align: center;
      flex-shrink: 0;
    }
    .sc-hero-circle {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      border: 5px solid var(--brand-primary);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto 6px;
      background: #fff;
    }
    .sc-hero-grade {
      font-family: var(--brand-font-primary);
      font-size: 28px;
      font-weight: 800;
      color: var(--brand-primary);
      line-height: 1;
    }
    .sc-hero-num {
      font-size: 13px;
      font-weight: 600;
      color: #888;
      margin-top: 2px;
    }
    .sc-hero-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #999;
    }

    /* ── Summary scorecard table ── */
    .sc-summary {
      background: #fff;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 28px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .sc-summary-title {
      font-family: var(--brand-font-primary);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-bottom: 12px;
    }
    .sc-summary table { width: 100%; border-collapse: collapse; }
    .sc-summary tr { border-bottom: 1px solid #f0f0f0; }
    .sc-summary tr:last-child { border-bottom: none; }
    .sum-name {
      padding: 9px 8px 9px 0;
      font-weight: 600;
      font-size: 14px;
      color: #222;
      width: 40%;
    }
    .sum-grade {
      padding: 9px 12px;
      font-weight: 700;
      font-size: 14px;
      color: var(--brand-primary);
      width: 50px;
      text-align: center;
    }
    .sum-bar-cell { padding: 9px 12px; width: 35%; }
    .sum-bar-track {
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
    }
    .sum-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .sum-dot { padding: 9px 8px; text-align: center; width: 36px; }
    .traffic-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    /* ── Section cards ── */
    .sc-card {
      display: flex;
      background: #fff;
      border-radius: 10px;
      margin-bottom: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .sc-card-badge {
      width: 72px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 20px 0;
    }
    .sc-badge-grade {
      font-family: var(--brand-font-primary);
      font-size: 24px;
      font-weight: 800;
      line-height: 1;
    }
    .sc-badge-score {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.85;
      margin-top: 4px;
    }
    .sc-card-main {
      flex: 1;
      padding: 22px 26px;
      min-width: 0;
    }
    .sc-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .sc-card-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: #111;
    }
    .sc-card-indicators {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .sc-mini-bar {
      width: 64px;
      height: 6px;
      background: #eee;
      border-radius: 3px;
      overflow: hidden;
    }
    .sc-mini-fill { height: 100%; border-radius: 3px; }

    /* ── Card body typography ── */
    .sc-card-body { color: #444; }
    .sc-card-body h1, .sc-card-body h2, .sc-card-body h3, .sc-card-body h4 {
      color: #111; margin: 14px 0 8px;
    }
    .sc-card-body h1 { font-size: 20px; }
    .sc-card-body h2 { font-size: 17px; }
    .sc-card-body h3 { font-size: 15px; }
    .sc-card-body ul, .sc-card-body ol { padding-left: 22px; margin: 10px 0; }
    .sc-card-body li { margin-bottom: 5px; }
    .sc-card-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .sc-card-body th {
      background: ${lighten(brand.primary, 0.92)};
      font-weight: 600;
      padding: 10px 12px;
      border-bottom: 2px solid var(--brand-primary);
      text-align: left;
    }
    .sc-card-body td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .sc-card-body hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }

    /* ── Key findings checklist ── */
    .sc-findings {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed #e0e0e0;
    }
    .sc-findings-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #999;
      margin-bottom: 8px;
    }
    .sc-finding-item {
      font-size: 13px;
      color: #444;
      padding: 4px 0;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .sc-check {
      color: ${darken(brand.accent, 0.1)};
      font-weight: 700;
      font-size: 12px;
    }

    /* ── Footer ── */
    .sc-footer {
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #e0e0e0;
      padding-top: 24px;
      margin-top: 36px;
      line-height: 1.8;
    }
    .sc-footer-conf {
      font-size: 10px;
      color: #b0b0b0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  `;

  // ── Body ─────────────────────────────────────────────
  const body = `
    <div class="page">
      <div class="sc-header">
        <div class="sc-header-left">
          <div class="sc-header-logo">${brandLogoHtml(input)}</div>
          <h1>${title}</h1>
          <div class="sc-header-sub">Evaluation for ${prospect.companyName} &middot; ${dateStr}</div>
        </div>
        <div class="sc-hero">
          <div class="sc-hero-circle">
            <div class="sc-hero-grade">${overallGrade}</div>
            <div class="sc-hero-num">${overallScore}/100</div>
          </div>
          <div class="sc-hero-label">Overall Score</div>
        </div>
      </div>

      <div class="sc-summary">
        <div class="sc-summary-title">Assessment Overview</div>
        <table>${summaryRows}</table>
      </div>

      ${sectionsHtml}

      <div class="sc-footer">
        ${companyName} &middot; Assessment Date: ${dateStr}<br/>
        <span class="sc-footer-conf">Confidential &mdash; Prepared exclusively for ${prospect.companyName}</span>
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
