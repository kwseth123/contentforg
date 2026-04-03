// ═══════════════════════════════════════════════════════════════════════════════
// ContentForge — Schema-Driven Template Renderers
//
// Each renderer takes typed schema data (not raw sections/markdown) and renders
// pixel-perfect HTML. Content and template are designed together.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  OnePagerData,
  BattleCardData,
  CompetitiveAnalysisData,
  ExecutiveSummaryData,
  DiscoveryCallPrepData,
  ROIBusinessCaseData,
  CaseStudyData,
} from './contentSchemas';
import { BrandVars, StyleInput } from './documentStyles/types';
import {
  resolveBrand,
  brandCSSVars,
  brandLogoHtml,
  wrapDocument,
  lighten,
  darken,
  contrastText,
  hexToRgb,
} from './documentStyles/shared';

// ── Helpers ──────────────────────────────────────────────────────────────────

function needsVerification(val: string): boolean {
  return !val || val === 'NEEDS_VERIFICATION' || val.includes('NEEDS_VERIFICATION');
}

/** Render a stat value — highlighted yellow if unverified */
function statHtml(value: string, label: string, context?: string, accentColor?: string): string {
  if (needsVerification(value)) {
    return `<div class="stat-card needs-verification">
      <div class="stat-value">—</div>
      <div class="stat-label">${label || 'Add proof point'}</div>
      <div class="stat-context">Needs verification</div>
    </div>`;
  }
  return `<div class="stat-card">
    <div class="stat-value">${value}</div>
    <div class="stat-label">${label}</div>
    ${context ? `<div class="stat-context">${context}</div>` : ''}
  </div>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SOLUTION ONE-PAGER / ULTRA MINIMAL (style-01)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderOnePagerSchema(data: OnePagerData, input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;
  const textOnAccent = contrastText(accent);
  const lightAccent = lighten(accent, 0.92);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const headerLogo = input.logoBase64
    ? `<div class="header-logo"><img src="${input.logoBase64}" alt="${input.companyName}" style="height:28px;"></div>`
    : `<div class="header-logo" style="font-weight:700;font-size:16px;">${escHtml(input.companyName)}</div>`;

  const css = `
    ${brandCSSVars(brand)}
    @page { margin: 0; size: letter; }
    body { font-family: var(--brand-font-primary); color: ${brand.text}; background: #fff; margin: 0; }

    .wrapper { width: 100%; max-width: 8.5in; min-height: 11in; max-height: 11in; overflow: hidden; margin: 0 auto; display: flex; flex-direction: column; }

    /* Header band */
    .header { background: ${brand.primary}; color: ${textOnAccent}; padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; }
    .header-right { text-align: right; font-size: 12px; opacity: 0.9; }
    .header-right .prospect-name { font-weight: 700; font-size: 14px; opacity: 1; }

    /* Hero */
    .hero { padding: 28px 40px 12px; }
    .hero h1 { font-size: 22px; font-weight: 800; line-height: 1.2; color: ${brand.primary}; margin: 0 0 6px; }
    .hero p { font-size: 13px; line-height: 1.5; color: ${brand.text}; margin: 0; opacity: 0.8; }

    /* Stat bar */
    .stats { display: flex; gap: 16px; padding: 0 40px 20px; }
    .stat-card { flex: 1; background: ${lightAccent}; border-radius: 8px; padding: 16px 20px; text-align: center; }
    .stat-card.needs-verification { background: #fef3c7; border: 1px dashed #f59e0b; }
    .stat-value { font-size: 28px; font-weight: 800; color: ${accent}; line-height: 1.1; }
    .stat-label { font-size: 10px; color: ${brand.text}; opacity: 0.7; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-context { font-size: 9px; color: ${brand.text}; opacity: 0.5; margin-top: 2px; }
    .needs-verification .stat-value { color: #92400e; font-size: 20px; }

    /* Two-column body */
    .body { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; padding: 0 40px 20px; flex: 1; }

    /* Section headers */
    .section-header { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${accent}; margin-bottom: 10px; padding-left: 12px; border-left: 3px solid ${accent}; }

    /* Bullets */
    .bullet-list { list-style: none; padding: 0; margin: 0 0 16px; }
    .bullet-list li { position: relative; padding-left: 16px; margin-bottom: 6px; font-size: 12px; line-height: 1.5; }
    .bullet-list li::before { content: ''; position: absolute; left: 0; top: 7px; width: 5px; height: 5px; border-radius: 50%; background: ${accent}; }

    /* Why Us */
    .why-us { background: #fff; border-left: 3px solid ${accent}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 16px; }
    .why-us-item { font-size: 12px; font-weight: 700; color: ${brand.primary}; margin-bottom: 6px; line-height: 1.4; }

    /* Proof quote */
    .proof { background: #f8f9fa; padding: 14px 18px; border-radius: 8px; font-size: 12px; line-height: 1.5; font-style: italic; color: #555; }
    .proof-attribution { font-style: normal; font-size: 10px; color: ${accent}; margin-top: 6px; font-weight: 600; }

    /* CTA bar */
    .cta-bar { background: ${darken(brand.primary, 0.1)}; color: ${textOnAccent}; padding: 14px 40px; text-align: center; font-size: 13px; font-weight: 700; }

    /* Footer */
    .footer { background: ${brand.primary}; color: ${textOnAccent}; padding: 12px 40px; display: flex; align-items: center; justify-content: space-between; font-size: 10px; opacity: 0.9; margin-top: auto; }
  `;

  const body = `
    <div class="wrapper">
      <div class="header">
        ${headerLogo}
        <div class="header-right">
          <div class="prospect-name">${escHtml(input.prospect.companyName)}</div>
          <div>Solution Overview | ${dateStr}</div>
        </div>
      </div>

      <div class="hero">
        <h1>${escHtml(data.headline)}</h1>
        <p>${escHtml(data.subheadline)}</p>
      </div>

      <div class="stats">
        ${statHtml(data.stat1_value, data.stat1_label, data.stat1_context, accent)}
        ${statHtml(data.stat2_value, data.stat2_label, data.stat2_context, accent)}
        ${statHtml(data.stat3_value, data.stat3_label, data.stat3_context, accent)}
      </div>

      <div class="body">
        <div class="left">
          <div class="section-header">The Challenge</div>
          <ul class="bullet-list">
            ${data.challenge_bullets.map(b => `<li>${escHtml(b)}</li>`).join('')}
          </ul>

          <div class="section-header">The Solution</div>
          <ul class="bullet-list">
            ${data.solution_bullets.map(b => `<li>${escHtml(b)}</li>`).join('')}
          </ul>
        </div>

        <div class="right">
          <div class="section-header">Why Us</div>
          <div class="why-us">
            <div class="why-us-item">${escHtml(data.differentiator1)}</div>
            <div class="why-us-item">${escHtml(data.differentiator2)}</div>
            <div class="why-us-item">${escHtml(data.differentiator3)}</div>
          </div>

          <div class="proof">
            "${escHtml(data.proof_quote)}"
            <div class="proof-attribution">— ${escHtml(data.proof_attribution)}</div>
          </div>
        </div>
      </div>

      <div class="cta-bar">${escHtml(data.cta)}</div>

      <div class="footer">
        <div>${escHtml(input.companyName)}${input.companyDescription ? ` | ${escHtml(input.companyDescription)}` : ''}</div>
        <div>Prepared for ${escHtml(input.prospect.companyName)}</div>
        <div>${dateStr}</div>
      </div>
    </div>
  `;

  return wrapDocument({ title: `${input.companyName} - Solution Overview - ${input.prospect.companyName}`, css, body, fonts: [brand.fontPrimary, brand.fontSecondary] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BATTLE CARD / DARK MODE (style-09)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderBattleCardSchema(data: BattleCardData, input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;
  const { r, g, b } = hexToRgb(accent);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const css = `
    ${brandCSSVars(brand)}
    @page { margin: 0; size: letter; }
    body { font-family: var(--brand-font-primary); color: #e0e0e0; background: #0a0a0a; margin: 0; }

    .wrapper { max-width: 8.5in; margin: 0 auto; padding: 0; }

    .header { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); padding: 32px 48px; border-bottom: 2px solid ${accent}; position: relative; }
    .header::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: ${accent}; box-shadow: 0 0 20px rgba(${r},${g},${b},0.5); }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 28px; font-weight: 800; color: #fff; margin: 8px 0 0; text-shadow: 0 0 24px rgba(${r},${g},${b},0.3); }
    .header-badge { display: inline-block; padding: 4px 12px; background: ${accent}; color: ${contrastText(accent)}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
    .header-meta { font-size: 11px; color: #888; }

    .vs-badge { display: inline-block; background: ${accent}; color: ${contrastText(accent)}; font-weight: 800; font-size: 14px; padding: 6px 16px; border-radius: 6px; margin: 16px 0; }

    .section { padding: 24px 48px; border-bottom: 1px solid #222; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${accent}; margin-bottom: 16px; border-left: 3px solid ${accent}; padding-left: 12px; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .col-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #22c55e; margin-bottom: 12px; }
    .col-title.weakness { color: #ef4444; }

    .item { font-size: 13px; line-height: 1.6; margin-bottom: 8px; padding-left: 16px; position: relative; }
    .item::before { content: ''; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; border-radius: 50%; }
    .strength .item::before { background: #22c55e; }
    .weakness-col .item::before { background: #ef4444; }

    .objection-card { background: #151515; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; }
    .objection-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ef4444; margin-bottom: 4px; }
    .objection-text { font-size: 13px; color: #ccc; font-style: italic; margin-bottom: 8px; }
    .response-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #22c55e; margin-bottom: 4px; }
    .response-text { font-size: 13px; color: #fff; line-height: 1.5; }

    .landmine { background: #151515; border-left: 3px solid #f59e0b; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 6px 6px 0; font-size: 13px; color: #fbbf24; }

    .win-themes { display: flex; gap: 12px; flex-wrap: wrap; }
    .win-theme { background: ${accent}; color: ${contrastText(accent)}; font-weight: 700; font-size: 13px; padding: 8px 20px; border-radius: 6px; box-shadow: 0 0 16px rgba(${r},${g},${b},0.3); }

    .pricing { background: #151515; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px 20px; font-size: 13px; line-height: 1.6; color: #ccc; }

    .footer { padding: 16px 48px; font-size: 10px; color: #555; text-align: center; border-top: 1px solid #222; }
    .footer strong { color: #888; }
  `;

  const body = `
    <div class="wrapper">
      <div class="header">
        <div class="header-top">
          <span class="header-badge">INTERNAL — BATTLE CARD</span>
          <span class="header-meta">${dateStr}</span>
        </div>
        <h1>${escHtml(data.win_headline)}</h1>
        <div class="vs-badge">VS ${escHtml(data.competitor_name).toUpperCase()}</div>
      </div>

      <div class="section">
        <div class="two-col">
          <div class="strength">
            <div class="col-title">Our Strengths</div>
            ${data.our_strengths.map(s => `<div class="item">${escHtml(s)}</div>`).join('')}
          </div>
          <div class="weakness-col">
            <div class="col-title weakness">Their Weaknesses</div>
            ${data.their_weaknesses.map(w => `<div class="item">${escHtml(w)}</div>`).join('')}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Objection Handling</div>
        ${data.objection_responses.map(o => `
          <div class="objection-card">
            <div class="objection-label">They say</div>
            <div class="objection-text">"${escHtml(o.objection)}"</div>
            <div class="response-label">You say</div>
            <div class="response-text">${escHtml(o.response)}</div>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <div class="section-title">Landmine Questions</div>
        ${data.landmine_questions.map(q => `<div class="landmine">"${escHtml(q)}"</div>`).join('')}
      </div>

      <div class="section">
        <div class="section-title">Pricing Comparison</div>
        <div class="pricing">${escHtml(data.pricing_comparison)}</div>
      </div>

      <div class="section">
        <div class="section-title">Win Themes</div>
        <div class="win-themes">
          ${data.win_themes.map(t => `<div class="win-theme">${escHtml(t)}</div>`).join('')}
        </div>
      </div>

      <div class="footer">
        <strong>${escHtml(input.companyName)}</strong> — Confidential Internal Use Only — ${dateStr}
      </div>
    </div>
  `;

  return wrapDocument({ title: `Battle Card: ${data.competitor_name} - ${input.companyName}`, css, body, fonts: [brand.fontPrimary] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. COMPETITIVE ANALYSIS / COMPARISON MATRIX (style-29)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderCompetitiveAnalysisSchema(data: CompetitiveAnalysisData, input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;
  const lightAccent = lighten(accent, 0.92);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const supportIcon = (level: string) => {
    if (level === 'full') return '<span class="support-icon full" title="Full support">&#10004;</span>';
    if (level === 'partial') return '<span class="support-icon partial" title="Partial support">&#9679;</span>';
    return '<span class="support-icon none" title="Not supported">&#10006;</span>';
  };

  const css = `
    ${brandCSSVars(brand)}
    @page { margin: 0.5in; size: letter; }
    body { font-family: var(--brand-font-primary); color: ${brand.text}; background: #fff; margin: 0; font-size: 13px; }

    .wrapper { max-width: 8in; margin: 0 auto; padding: 40px; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid ${accent}; }
    .header h1 { font-size: 24px; font-weight: 700; color: ${brand.primary}; margin: 0; }
    .header-meta { text-align: right; font-size: 11px; color: #888; }

    .exec-summary { background: ${lightAccent}; border-left: 4px solid ${accent}; padding: 16px 20px; margin-bottom: 32px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: ${darken(brand.text, 0.1)}; }

    .comparison-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .comparison-table th { background: ${accent}; color: ${contrastText(accent)}; padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .comparison-table .category-row td { background: ${lighten(accent, 0.85)}; font-weight: 700; font-size: 12px; color: ${darken(accent, 0.2)}; padding: 8px 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .comparison-table td { padding: 10px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
    .comparison-table tr:hover td { background: #f8f9fa; }
    .comparison-table .advantage { font-size: 11px; color: ${accent}; font-weight: 600; }

    .support-icon { display: inline-block; width: 20px; height: 20px; text-align: center; line-height: 20px; border-radius: 50%; font-size: 12px; }
    .support-icon.full { background: #dcfce7; color: #16a34a; }
    .support-icon.partial { background: #fef3c7; color: #d97706; font-size: 8px; }
    .support-icon.none { background: #fee2e2; color: #dc2626; font-size: 10px; }

    .verdict { background: ${brand.primary}; color: ${contrastText(brand.primary)}; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; font-size: 15px; font-weight: 600; text-align: center; }

    .proof-section { margin-bottom: 24px; }
    .proof-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${accent}; margin-bottom: 12px; }
    .proof-item { padding-left: 16px; margin-bottom: 8px; position: relative; font-size: 13px; line-height: 1.5; }
    .proof-item::before { content: ''; position: absolute; left: 0; top: 7px; width: 6px; height: 6px; border-radius: 50%; background: ${accent}; }

    .footer { text-align: center; font-size: 10px; color: #999; padding-top: 24px; border-top: 1px solid #eee; }
  `;

  const tableRows = data.feature_categories.map(cat => {
    const categoryRow = `<tr class="category-row"><td colspan="4">${escHtml(cat.category_name)}</td></tr>`;
    const featureRows = cat.features.map(f => `
      <tr>
        <td>${escHtml(f.feature_name)}</td>
        <td style="text-align:center;">${supportIcon(f.our_support)}</td>
        <td style="text-align:center;">${supportIcon(f.competitor_support)}</td>
        <td class="advantage">${escHtml(f.our_advantage)}</td>
      </tr>
    `).join('');
    return categoryRow + featureRows;
  }).join('');

  const body = `
    <div class="wrapper">
      <div class="header">
        <div>
          <h1>Competitive Analysis</h1>
          <div style="font-size:12px;color:#888;margin-top:4px;">Prepared for ${escHtml(input.prospect.companyName)}</div>
        </div>
        <div class="header-meta">
          ${brandLogoHtml(input, 'height:32px;')}<br/>
          ${dateStr}
        </div>
      </div>

      <div class="exec-summary">${escHtml(data.executive_summary)}</div>

      <table class="comparison-table">
        <thead>
          <tr>
            <th style="width:35%;">Feature</th>
            <th style="width:15%;text-align:center;">${escHtml(input.companyName)}</th>
            <th style="width:15%;text-align:center;">Competitor</th>
            <th style="width:35%;">Our Advantage</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="verdict">${escHtml(data.overall_verdict)}</div>

      <div class="proof-section">
        <div class="proof-title">Proof Points</div>
        ${data.proof_points.map(p => `<div class="proof-item">${escHtml(p)}</div>`).join('')}
      </div>

      <div class="footer">${escHtml(input.companyName)} — Confidential — ${dateStr}</div>
    </div>
  `;

  return wrapDocument({ title: `Competitive Analysis - ${input.prospect.companyName}`, css, body, fonts: [brand.fontPrimary] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. EXECUTIVE SUMMARY / DRAMATIC CONTRAST (style-14)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderExecutiveSummarySchema(data: ExecutiveSummaryData, input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const css = `
    ${brandCSSVars(brand)}
    @page { margin: 0; size: letter; }
    body { font-family: var(--brand-font-secondary); color: ${brand.text}; background: #fff; margin: 0; }

    .wrapper { max-width: 8.5in; margin: 0 auto; padding: 0; }

    .header { padding: 40px 64px 24px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e5e5; }
    .header-meta { font-size: 11px; color: #888; text-align: right; }

    .impact { padding: 48px 64px 40px; }
    .impact h1 { font-size: 48px; font-weight: 800; line-height: 1.1; color: ${brand.primary}; margin: 0 0 16px; font-family: var(--brand-font-primary); }
    .impact .impact-needs-verification { background: #fef3c7; border: 1px dashed #f59e0b; padding: 4px 12px; border-radius: 4px; }

    .situation { padding: 0 64px 32px; font-size: 16px; line-height: 1.7; color: #555; border-bottom: 1px solid #e5e5e5; }

    .outcomes { padding: 32px 64px; }
    .outcomes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: ${accent}; margin-bottom: 20px; }
    .outcomes-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
    .outcome-card { border-left: 3px solid ${accent}; padding: 16px 20px; }
    .outcome-headline { font-size: 18px; font-weight: 700; color: ${brand.primary}; margin-bottom: 6px; }
    .outcome-detail { font-size: 13px; line-height: 1.5; color: #666; }

    .bottom-section { padding: 24px 64px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; border-top: 1px solid #e5e5e5; }
    .bottom-block-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${accent}; margin-bottom: 12px; }
    .bottom-block-content { font-size: 14px; line-height: 1.6; color: #444; }

    .risk { background: #fef2f2; border-left: 3px solid #ef4444; padding: 16px 20px; margin: 24px 64px; border-radius: 0 8px 8px 0; }
    .risk-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #dc2626; margin-bottom: 4px; }
    .risk-text { font-size: 14px; color: #991b1b; line-height: 1.5; }

    .cta { background: ${brand.primary}; color: ${contrastText(brand.primary)}; padding: 20px 64px; text-align: center; font-size: 16px; font-weight: 700; margin-top: auto; }

    .footer { padding: 16px 64px; font-size: 10px; color: #999; display: flex; justify-content: space-between; border-top: 1px solid #eee; }
  `;

  const impactDisplay = needsVerification(data.impact_statement)
    ? `<h1><span class="impact-needs-verification">Add verified impact metric</span></h1>`
    : `<h1>${escHtml(data.impact_statement)}</h1>`;

  const body = `
    <div class="wrapper">
      <div class="header">
        ${brandLogoHtml(input, 'height:36px;')}
        <div class="header-meta">
          <div style="font-weight:600;color:#333;">Executive Summary</div>
          <div>${escHtml(input.prospect.companyName)} | ${dateStr}</div>
        </div>
      </div>

      <div class="impact">${impactDisplay}</div>

      <div class="situation">${escHtml(data.situation_summary)}</div>

      <div class="outcomes">
        <div class="outcomes-title">Expected Outcomes</div>
        <div class="outcomes-grid">
          ${data.three_outcomes.map(o => `
            <div class="outcome-card">
              <div class="outcome-headline">${escHtml(o.outcome_headline)}</div>
              <div class="outcome-detail">${escHtml(o.outcome_detail)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bottom-section">
        <div>
          <div class="bottom-block-title">Investment</div>
          <div class="bottom-block-content">${escHtml(data.investment_summary)}</div>
        </div>
        <div>
          <div class="bottom-block-title">Recommended Next Step</div>
          <div class="bottom-block-content">${escHtml(data.recommended_next_step)}</div>
        </div>
      </div>

      <div class="risk">
        <div class="risk-label">Risk of Inaction</div>
        <div class="risk-text">${escHtml(data.risk_of_inaction)}</div>
      </div>

      <div class="footer">
        <span>${escHtml(input.companyName)} — Confidential</span>
        <span>${dateStr}</span>
      </div>
    </div>
  `;

  return wrapDocument({ title: `Executive Summary - ${input.prospect.companyName}`, css, body, fonts: [brand.fontPrimary, brand.fontSecondary] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DISCOVERY CALL PREP / TECHNICAL BRIEF (style-20)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderDiscoveryCallPrepSchema(data: DiscoveryCallPrepData, input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const docId = `DC-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const css = `
    ${brandCSSVars(brand)}
    @page { margin: 0.4in; size: letter; }
    body { font-family: var(--brand-font-primary); color: ${brand.text}; background: #fff; margin: 0; font-size: 13px; }

    .wrapper { max-width: 8in; margin: 0 auto; }

    .header { background: #0f172a; color: #e2e8f0; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; }
    .header-left { font-size: 11px; }
    .header-id { font-family: 'Courier New', monospace; font-size: 10px; color: ${accent}; }
    .header h2 { font-size: 18px; font-weight: 700; color: #fff; margin: 4px 0 0; }

    .context { background: #f8fafc; border-left: 3px solid ${accent}; padding: 16px 20px; margin: 24px 0; border-radius: 0 6px 6px 0; font-size: 14px; line-height: 1.6; }

    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${accent}; margin: 28px 0 16px; padding-bottom: 8px; border-bottom: 2px solid ${lighten(accent, 0.8)}; }

    .question-card { display: grid; grid-template-columns: 1fr 200px; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .question-text { font-size: 14px; font-weight: 600; color: ${brand.primary}; }
    .question-why { font-size: 11px; color: #888; font-style: italic; }

    .stakeholder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stakeholder-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
    .stakeholder-role { font-weight: 700; color: ${brand.primary}; font-size: 13px; margin-bottom: 4px; }
    .stakeholder-concern { font-size: 12px; color: #666; }
    .stakeholder-message { font-size: 12px; color: ${accent}; margin-top: 4px; font-weight: 600; }

    .objection-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .objection-text { font-size: 13px; color: #dc2626; font-weight: 600; }
    .objection-response { font-size: 13px; color: #16a34a; }

    .success-box { background: ${lighten(accent, 0.92)}; border: 1px solid ${lighten(accent, 0.7)}; border-radius: 8px; padding: 16px 20px; margin: 24px 0; text-align: center; }
    .success-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${accent}; margin-bottom: 6px; }
    .success-text { font-size: 14px; color: ${brand.primary}; font-weight: 600; }

    .next-step { background: ${brand.primary}; color: ${contrastText(brand.primary)}; padding: 16px 24px; border-radius: 8px; text-align: center; font-size: 15px; font-weight: 700; margin: 16px 0; }

    .footer { text-align: center; font-size: 10px; color: #999; padding: 16px 0; border-top: 1px solid #eee; }
  `;

  const body = `
    <div class="wrapper">
      <div class="header">
        <div class="header-left">
          <div class="header-id">${docId} | ${dateStr}</div>
          <h2>Discovery Call Prep: ${escHtml(input.prospect.companyName)}</h2>
        </div>
        ${brandLogoHtml(input, 'height:28px;filter:brightness(10);')}
      </div>

      <div class="context">${escHtml(data.prospect_context)}</div>

      <div class="section-title">Discovery Questions</div>
      ${data.discovery_questions.map((q, i) => `
        <div class="question-card">
          <div class="question-text">${i + 1}. ${escHtml(q.question)}</div>
          <div class="question-why">${escHtml(q.why_ask)}</div>
        </div>
      `).join('')}

      <div class="section-title">Stakeholder Map</div>
      <div class="stakeholder-grid">
        ${data.stakeholder_map.map(s => `
          <div class="stakeholder-card">
            <div class="stakeholder-role">${escHtml(s.role)}</div>
            <div class="stakeholder-concern">${escHtml(s.likely_concern)}</div>
            <div class="stakeholder-message">&rarr; ${escHtml(s.what_they_need_to_hear)}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-title">Likely Objections</div>
      ${data.likely_objections.map(o => `
        <div class="objection-row">
          <div class="objection-text">"${escHtml(o.objection)}"</div>
          <div class="objection-response">${escHtml(o.response)}</div>
        </div>
      `).join('')}

      <div class="success-box">
        <div class="success-label">Success Criteria</div>
        <div class="success-text">${escHtml(data.success_criteria)}</div>
      </div>

      <div class="next-step">${escHtml(data.next_step_ask)}</div>

      <div class="footer">${escHtml(input.companyName)} — Internal Use Only — ${dateStr}</div>
    </div>
  `;

  return wrapDocument({ title: `Discovery Call Prep - ${input.prospect.companyName}`, css, body, fonts: [brand.fontPrimary] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ROI BUSINESS CASE / FINANCIAL REPORT (style-18)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderROIBusinessCaseSchema(data: ROIBusinessCaseData, input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  function finValue(val: string): string {
    if (needsVerification(val)) return `<span class="needs-verification">Needs data</span>`;
    return escHtml(val);
  }

  const css = `
    ${brandCSSVars(brand)}
    @page { margin: 0.5in; size: letter; }
    body { font-family: 'Georgia', var(--brand-font-secondary), serif; color: #1b2a4a; background: #fff; margin: 0; font-size: 13px; }

    .wrapper { max-width: 8in; margin: 0 auto; padding: 32px; }

    .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; border-bottom: 2px solid #1b2a4a; margin-bottom: 32px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #1b2a4a; margin: 0; }
    .header-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; border: 1px solid #ddd; padding: 3px 8px; border-radius: 3px; }
    .header-meta { text-align: right; font-size: 11px; color: #888; }

    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .kpi-card { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; text-align: center; }
    .kpi-card.needs-verification-card { background: #fef3c7; border: 1px dashed #f59e0b; }
    .kpi-value { font-size: 24px; font-weight: 700; color: ${accent}; font-family: var(--brand-font-primary); }
    .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-top: 4px; }

    .needs-verification { background: #fef3c7; border: 1px dashed #f59e0b; padding: 2px 8px; border-radius: 3px; color: #92400e; font-style: italic; font-size: 12px; }

    .section-number { font-size: 12px; color: ${accent}; font-weight: 700; font-family: var(--brand-font-primary); }
    .section-title { font-size: 16px; font-weight: 700; color: #1b2a4a; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }

    .savings-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .savings-table th { background: #1b2a4a; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .savings-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .savings-table tr:nth-child(even) td { background: #f9fafb; }
    .savings-table .amount { font-weight: 700; font-family: var(--brand-font-primary); color: ${accent}; }

    .projections { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .projection-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; text-align: center; }
    .projection-year { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
    .projection-value { font-size: 20px; font-weight: 700; color: #1b2a4a; font-family: var(--brand-font-primary); }

    .risk-box { background: #fef2f2; border-left: 3px solid #ef4444; padding: 14px 18px; margin-bottom: 24px; border-radius: 0 6px 6px 0; }
    .risk-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #dc2626; margin-bottom: 4px; }

    .assumptions { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px; }
    .assumptions li { margin-bottom: 4px; font-size: 12px; color: #666; }

    .footer { text-align: center; font-size: 10px; color: #999; padding-top: 16px; border-top: 1px solid #eee; }
  `;

  const body = `
    <div class="wrapper">
      <div class="header">
        <div>
          <span class="header-badge">CONFIDENTIAL</span>
          <h1>ROI Business Case</h1>
        </div>
        <div class="header-meta">
          ${escHtml(input.prospect.companyName)}<br/>
          ${dateStr}
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card ${needsVerification(data.investment_total) ? 'needs-verification-card' : ''}">
          <div class="kpi-value">${finValue(data.investment_total)}</div>
          <div class="kpi-label">Annual Investment</div>
        </div>
        <div class="kpi-card ${needsVerification(data.roi_percentage) ? 'needs-verification-card' : ''}">
          <div class="kpi-value">${finValue(data.roi_percentage)}</div>
          <div class="kpi-label">ROI</div>
        </div>
        <div class="kpi-card ${needsVerification(data.payback_months) ? 'needs-verification-card' : ''}">
          <div class="kpi-value">${finValue(data.payback_months)}</div>
          <div class="kpi-label">Payback Period</div>
        </div>
        <div class="kpi-card ${needsVerification(data.annual_savings_total) ? 'needs-verification-card' : ''}">
          <div class="kpi-value">${finValue(data.annual_savings_total)}</div>
          <div class="kpi-label">Annual Savings</div>
        </div>
      </div>

      <div class="section-title"><span class="section-number">1.0</span> Savings Breakdown</div>
      <table class="savings-table">
        <thead><tr><th>Category</th><th>Amount</th><th>Basis</th></tr></thead>
        <tbody>
          ${data.savings_breakdown.map(s => `
            <tr>
              <td>${escHtml(s.category)}</td>
              <td class="amount">${finValue(s.amount)}</td>
              <td>${escHtml(s.calculation_basis)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title"><span class="section-number">2.0</span> Multi-Year Projections</div>
      <div class="projections">
        <div class="projection-card">
          <div class="projection-year">Year 1</div>
          <div class="projection-value">${finValue(data.year1_projection)}</div>
        </div>
        <div class="projection-card">
          <div class="projection-year">Year 2</div>
          <div class="projection-value">${finValue(data.year2_projection)}</div>
        </div>
        <div class="projection-card">
          <div class="projection-year">Year 3</div>
          <div class="projection-value">${finValue(data.year3_projection)}</div>
        </div>
      </div>

      <div class="risk-box">
        <div class="risk-label">Cost of Inaction</div>
        <div>${escHtml(data.risk_of_status_quo)}</div>
      </div>

      <div class="section-title"><span class="section-number">3.0</span> Assumptions</div>
      <div class="assumptions">
        <ul>${data.assumptions.map(a => `<li>${escHtml(a)}</li>`).join('')}</ul>
      </div>

      <div class="footer">${escHtml(input.companyName)} — Confidential — ${dateStr}</div>
    </div>
  `;

  return wrapDocument({ title: `ROI Business Case - ${input.prospect.companyName}`, css, body, fonts: ['Georgia', brand.fontPrimary] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. CASE STUDY / STORYTELLING (style-25)
// ═══════════════════════════════════════════════════════════════════════════════

export function renderCaseStudySchema(data: CaseStudyData, input: StyleInput): string {
  const brand = resolveBrand(input);
  const accent = brand.accent || brand.primary;
  const lightAccent = lighten(accent, 0.92);
  const { r, g, b } = hexToRgb(accent);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const css = `
    ${brandCSSVars(brand)}
    @page { margin: 0; size: letter; }
    body { font-family: 'Nunito', var(--brand-font-primary), sans-serif; color: ${brand.text}; background: #fff; margin: 0; }

    .wrapper { max-width: 8.5in; margin: 0 auto; }

    .hero { background: linear-gradient(135deg, ${brand.primary} 0%, ${darken(brand.primary, 0.2)} 100%); color: ${contrastText(brand.primary)}; padding: 56px 64px 48px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.05); }
    .hero-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 12px; }
    .hero h1 { font-size: 36px; font-weight: 800; line-height: 1.15; margin: 0; }

    .results-bar { background: ${accent}; color: ${contrastText(accent)}; padding: 0; display: flex; }
    .result-stat { flex: 1; text-align: center; padding: 20px 16px; border-right: 1px solid rgba(255,255,255,0.2); }
    .result-stat:last-child { border-right: none; }
    .result-stat.needs-verification { background: rgba(0,0,0,0.1); }
    .result-value { font-size: 28px; font-weight: 800; }
    .result-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85; margin-top: 4px; }

    .chapter { padding: 32px 64px; }
    .chapter:nth-child(odd) { background: #fff; }
    .chapter:nth-child(even) { background: ${lightAccent}; }
    .chapter-marker { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .chapter-line { flex: 1; height: 1px; background: ${lighten(accent, 0.7)}; }
    .chapter-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${accent}; white-space: nowrap; }
    .chapter-content { font-size: 15px; line-height: 1.7; color: #444; }

    .quote-section { background: ${brand.primary}; color: ${contrastText(brand.primary)}; padding: 40px 64px; position: relative; }
    .quote-mark { font-size: 64px; line-height: 1; opacity: 0.2; position: absolute; top: 16px; left: 48px; font-family: Georgia, serif; }
    .quote-text { font-size: 18px; font-style: italic; line-height: 1.6; margin-left: 32px; }
    .quote-attribution { font-size: 12px; margin-top: 12px; margin-left: 32px; opacity: 0.8; }

    .success-factors { padding: 32px 64px; }
    .success-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${accent}; margin-bottom: 16px; }
    .success-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; font-size: 14px; line-height: 1.5; }
    .success-dot { width: 8px; height: 8px; border-radius: 50%; background: ${accent}; flex-shrink: 0; margin-top: 6px; }

    .footer { background: ${brand.primary}; color: ${contrastText(brand.primary)}; padding: 16px 64px; display: flex; justify-content: space-between; font-size: 10px; opacity: 0.8; }
  `;

  function resultStat(val: string, label: string): string {
    if (needsVerification(val)) {
      return `<div class="result-stat needs-verification"><div class="result-value">—</div><div class="result-label">${escHtml(label)} (needs data)</div></div>`;
    }
    return `<div class="result-stat"><div class="result-value">${escHtml(val)}</div><div class="result-label">${escHtml(label)}</div></div>`;
  }

  const body = `
    <div class="wrapper">
      <div class="hero">
        <div class="hero-label">Customer Success Story</div>
        <h1>${escHtml(data.result_headline)}</h1>
      </div>

      <div class="results-bar">
        ${resultStat(data.result_stat1_value, data.result_stat1_label)}
        ${resultStat(data.result_stat2_value, data.result_stat2_label)}
        ${resultStat(data.result_stat3_value, data.result_stat3_label)}
      </div>

      <div class="chapter">
        <div class="chapter-marker">
          <span class="chapter-label">The Customer</span>
          <div class="chapter-line"></div>
        </div>
        <div class="chapter-content">${escHtml(data.customer_context)}</div>
      </div>

      <div class="chapter">
        <div class="chapter-marker">
          <span class="chapter-label">The Challenge</span>
          <div class="chapter-line"></div>
        </div>
        <div class="chapter-content">${escHtml(data.the_challenge)}</div>
      </div>

      <div class="chapter">
        <div class="chapter-marker">
          <span class="chapter-label">The Solution</span>
          <div class="chapter-line"></div>
        </div>
        <div class="chapter-content">${escHtml(data.the_solution)}</div>
      </div>

      <div class="quote-section">
        <div class="quote-mark">&ldquo;</div>
        <div class="quote-text">${escHtml(data.customer_quote)}</div>
        <div class="quote-attribution">— ${escHtml(data.customer_quote_attribution)}</div>
      </div>

      <div class="success-factors">
        <div class="success-title">What Made It Work</div>
        ${data.what_made_it_work.map(w => `
          <div class="success-item">
            <div class="success-dot"></div>
            <div>${escHtml(w)}</div>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <span>${escHtml(input.companyName)}</span>
        <span>Prepared for ${escHtml(input.prospect.companyName)}</span>
        <span>${dateStr}</span>
      </div>
    </div>
  `;

  return wrapDocument({ title: `Case Study - ${input.prospect.companyName}`, css, body, fonts: ['Nunito', brand.fontPrimary] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Renderer Lookup
// ═══════════════════════════════════════════════════════════════════════════════

const SCHEMA_RENDERERS: Record<string, (data: any, input: StyleInput) => string> = {
  'solution-one-pager:style-01': renderOnePagerSchema,
  'battle-card:style-09': renderBattleCardSchema,
  'competitive-analysis:style-29': renderCompetitiveAnalysisSchema,
  'executive-summary:style-14': renderExecutiveSummarySchema,
  'discovery-call-prep:style-20': renderDiscoveryCallPrepSchema,
  'roi-business-case:style-18': renderROIBusinessCaseSchema,
  'case-study:style-25': renderCaseStudySchema,
};

/** Get the schema renderer for a content type + template ID combination */
export function getSchemaRenderer(contentType: string, templateId: string): ((data: any, input: StyleInput) => string) | undefined {
  return SCHEMA_RENDERERS[`${contentType}:${templateId}`];
}

/** Check if a schema renderer exists for this combination */
export function hasSchemaRenderer(contentType: string, templateId: string): boolean {
  return !!SCHEMA_RENDERERS[`${contentType}:${templateId}`];
}
