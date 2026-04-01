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
    for (const m of dollarMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'value' });
    }
  }

  const multMatches = allContent.match(/(\d+(?:\.\d+)?)[xX]\b/g);
  if (multMatches) {
    for (const m of multMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'multiplier' });
    }
  }

  return stats.slice(0, 4);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager support
  if (input.contentType === 'solution-one-pager') {
    return buildOnePagerDocument(input, brand);
  }

  const { sections, contentType, prospect, companyName, date } = input;
  const cleanSections = sections.map(s => ({
    ...s,
    title: stripEmojis(s.title),
    content: stripEmojis(s.content),
  }));
  const stats = extractStats(cleanSections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const accent = brand.accent || brand.primary;
  const finBlue = '#0c2340';
  const finLightBlue = '#1a3a5c';
  const finGray = '#f5f6f8';
  const totalPages = Math.max(1, Math.ceil(cleanSections.length / 3));

  const sectionsHtml = cleanSections.map((s, i) => {
    return `
      <div class="fr-section">
        <div class="fr-section-bar">
          <span class="fr-section-label">${s.title}</span>
        </div>
        <div class="fr-section-body">${formatMarkdown(s.content)}</div>
      </div>`;
  }).join('\n');

  const statsHtml = stats.length > 0 ? `
    <div class="fr-metrics-banner">
      <div class="fr-metrics-label">KEY METRICS</div>
      <div class="fr-metrics-row">
        ${stats.map(s => `
          <div class="fr-metric">
            <div class="fr-metric-value">${s.value}</div>
            <div class="fr-metric-label">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0.85in 1in;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .fr-page { padding: 0; max-width: none; }
      .fr-section { page-break-inside: avoid; }
    }

    body {
      font-family: 'Inter', var(--brand-font-secondary), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: var(--brand-font-body-size);
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    ${professionalSymbolCSS(accent)}

    .fr-page {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 48px 72px;
    }

    /* ══ Institutional Header ══ */
    .fr-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 3px solid ${finBlue};
      margin-bottom: 4px;
    }
    .fr-header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .fr-header-company {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${finBlue};
    }
    .fr-header-type {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .fr-header-right {
      text-align: right;
      font-size: 10px;
      color: #6b7280;
      line-height: 1.8;
    }
    .fr-header-right strong {
      color: #1a1a1a;
      font-weight: 600;
    }
    .fr-header-subrule {
      border: none;
      border-top: 1px solid ${finBlue};
      margin: 0 0 28px 0;
    }

    /* ══ Title Block ══ */
    .fr-title-block {
      margin-bottom: 24px;
    }
    .fr-doc-title {
      font-family: 'Inter', var(--brand-font-primary), sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: ${finBlue};
      line-height: 1.2;
      margin: 0 0 6px 0;
      letter-spacing: -0.01em;
    }
    .fr-doc-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 20px;
    }

    /* ══ Metrics Banner ══ */
    .fr-metrics-banner {
      background: ${finGray};
      border: 1px solid #e5e7eb;
      border-top: 3px solid ${finBlue};
      padding: 20px 24px;
      margin-bottom: 32px;
    }
    .fr-metrics-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${finBlue};
      margin-bottom: 14px;
    }
    .fr-metrics-row {
      display: flex;
      gap: 24px;
    }
    .fr-metric {
      flex: 1;
      text-align: center;
      padding: 12px 8px;
      border-right: 1px solid #e5e7eb;
    }
    .fr-metric:last-child {
      border-right: none;
    }
    .fr-metric-value {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 28px;
      font-weight: 700;
      color: ${finBlue};
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .fr-metric-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 6px;
    }

    /* ══ Sections ══ */
    .fr-section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .fr-section-bar {
      background: ${finGray};
      border-left: 4px solid ${finBlue};
      padding: 10px 18px;
      margin-bottom: 16px;
    }
    .fr-section-label {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${finBlue};
    }
    .fr-section-body p {
      margin-bottom: 12px;
      text-align: justify;
    }
    .fr-section-body h1,
    .fr-section-body h2,
    .fr-section-body h3,
    .fr-section-body h4 {
      color: ${finBlue};
      margin: 20px 0 8px;
      font-weight: 700;
    }
    .fr-section-body h2 { font-size: 17px; }
    .fr-section-body h3 { font-size: 15px; }
    .fr-section-body h4 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .fr-section-body strong { font-weight: 600; color: #111; }
    .fr-section-body ul,
    .fr-section-body ol {
      padding-left: 24px;
      margin: 10px 0;
    }
    .fr-section-body li {
      margin-bottom: 5px;
      line-height: 1.6;
    }
    .fr-section-body hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }

    /* ══ Tables — Financial Style ══ */
    .fr-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      border-top: 2px solid ${finBlue};
      border-bottom: 2px solid ${finBlue};
    }
    .fr-section-body th {
      background: transparent;
      color: ${finBlue};
      font-weight: 700;
      text-align: left;
      padding: 8px 14px;
      font-size: 10px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-bottom: 1px solid ${finBlue};
    }
    .fr-section-body td {
      padding: 7px 14px;
      border-bottom: 1px solid #e5e7eb;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', var(--brand-font-secondary), monospace;
    }
    .fr-section-body tr:hover td {
      background: #f8f9fb;
    }

    /* ══ Footer ══ */
    .fr-footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 2px solid ${finBlue};
    }
    .fr-footer-disclaimer {
      font-size: 9px;
      color: #9ca3af;
      line-height: 1.5;
      font-style: italic;
      margin-bottom: 10px;
      max-width: 80%;
    }
    .fr-footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #9ca3af;
    }
    .fr-footer-left { text-align: left; }
    .fr-footer-center {
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .fr-footer-right {
      text-align: right;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 9px;
    }
  `;

  const body = `
    <div class="fr-page">
      <!-- Institutional Header -->
      <div class="fr-header">
        <div class="fr-header-left">
          ${brandLogoHtml(input, 'height:28px;')}
          <div class="fr-header-company">${companyName}</div>
          <div class="fr-header-type">Research Report</div>
        </div>
        <div class="fr-header-right">
          <strong>Date:</strong> ${dateStr}<br/>
          <strong>Prepared for:</strong> ${prospect.companyName}<br/>
          ${prospect.industry ? `<strong>Industry:</strong> ${prospect.industry}<br/>` : ''}
          <strong>Classification:</strong> Confidential
        </div>
      </div>
      <hr class="fr-header-subrule" />

      <!-- Title Block -->
      <div class="fr-title-block">
        <h1 class="fr-doc-title">${title}</h1>
        <div class="fr-doc-subtitle">Analysis prepared for ${prospect.companyName}${prospect.companySize ? ` (${prospect.companySize})` : ''}</div>
      </div>

      <!-- Key Metrics -->
      ${statsHtml}

      <!-- Sections -->
      ${sectionsHtml}

      <!-- Footer -->
      <div class="fr-footer">
        <div class="fr-footer-disclaimer">
          This document contains confidential and proprietary information. Distribution is restricted to intended recipients only. Past performance does not guarantee future results.
        </div>
        <div class="fr-footer-content">
          <div class="fr-footer-left">${companyName} | ${dateStr}</div>
          <div class="fr-footer-center">Page 1 of ${totalPages}</div>
          <div class="fr-footer-right">For internal use only</div>
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

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const finBlue = '#0c2340';
  return `<div style="width:100%;height:100%;background:#fff;font-family:sans-serif;padding:20px 18px;box-sizing:border-box;position:relative;">
    <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:3px solid ${finBlue};margin-bottom:2px;">
      <div>
        <div style="width:40px;height:8px;background:${finBlue};border-radius:1px;margin-bottom:3px;"></div>
        <div style="font-size:5px;color:${finBlue};font-weight:700;letter-spacing:0.1em;">RESEARCH REPORT</div>
      </div>
      <div style="text-align:right;">
        <div style="width:30px;height:3px;background:#ccc;border-radius:1px;margin-bottom:2px;margin-left:auto;"></div>
        <div style="width:20px;height:3px;background:#ccc;border-radius:1px;margin-left:auto;"></div>
      </div>
    </div>
    <div style="border-bottom:1px solid ${finBlue};margin-bottom:12px;"></div>
    <div style="font-size:11px;font-weight:700;color:${finBlue};margin-bottom:8px;">Financial Report</div>
    <div style="background:#f5f6f8;border:1px solid #e5e7eb;border-top:3px solid ${finBlue};padding:8px;margin-bottom:12px;">
      <div style="font-size:5px;font-weight:700;color:${finBlue};letter-spacing:0.1em;margin-bottom:6px;">KEY METRICS</div>
      <div style="display:flex;gap:6px;">
        <div style="flex:1;text-align:center;border-right:1px solid #e5e7eb;">
          <div style="font-size:10px;font-weight:700;color:${finBlue};font-family:monospace;">45%</div>
          <div style="width:60%;height:2px;background:#ddd;margin:2px auto 0;border-radius:1px;"></div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:${finBlue};font-family:monospace;">$1.2M</div>
          <div style="width:60%;height:2px;background:#ddd;margin:2px auto 0;border-radius:1px;"></div>
        </div>
      </div>
    </div>
    <div style="background:#f5f6f8;border-left:3px solid ${finBlue};padding:4px 8px;margin-bottom:6px;">
      <div style="font-size:7px;font-weight:700;color:${finBlue};letter-spacing:0.04em;">SECTION TITLE</div>
    </div>
    <div style="width:100%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:90%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:95%;height:3px;background:#eee;border-radius:1px;"></div>
    <div style="position:absolute;bottom:8px;left:18px;right:18px;border-top:2px solid ${finBlue};padding-top:4px;">
      <div style="font-size:5px;color:#9ca3af;font-style:italic;margin-bottom:3px;">Confidential</div>
      <div style="display:flex;justify-content:space-between;font-size:5px;color:#aaa;">
        <span>Company | Date</span><span>Page 1</span><span style="font-weight:600;letter-spacing:0.06em;">FOR INTERNAL USE</span>
      </div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style18FinancialReport: DocumentStyle = {
  id: 'style-18',
  name: 'Financial Report',
  category: 'corporate',
  description: 'Data tables, bordered callouts, understated headers — Goldman Sachs feel',
  keywords: ['financial', 'report', 'data', 'tables', 'metrics', 'research'],
  render,
  thumbnail,
};

export default style18FinancialReport;
