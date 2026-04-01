import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, formatMarkdown, brandLogoHtml, wrapDocument, lighten, darken, contrastText, hexToRgb, brandFonts, buildOnePagerDocument, professionalSymbolCSS, stripEmojis } from './shared';

// ── Icon selection by keyword ───────────────────────────────

const ICON_MAP: [string[], string][] = [
  [['overview', 'summary', 'introduction', 'about'], 'icon-grid'],
  [['solution', 'product', 'platform', 'technology', 'tech'], 'icon-layers'],
  [['security', 'compliance', 'risk', 'protect'], 'icon-shield'],
  [['integration', 'connect', 'api', 'workflow'], 'icon-link'],
  [['performance', 'speed', 'scale', 'optimization'], 'icon-chart'],
  [['cost', 'price', 'roi', 'value', 'savings', 'financial'], 'icon-dollar'],
  [['team', 'people', 'support', 'service', 'customer'], 'icon-users'],
  [['timeline', 'schedule', 'implementation', 'deploy', 'phase'], 'icon-clock'],
  [['data', 'analytics', 'report', 'insight', 'metrics'], 'icon-chart'],
  [['competitive', 'comparison', 'market', 'landscape'], 'icon-compare'],
  [['benefit', 'advantage', 'feature', 'capability'], 'icon-star'],
  [['next', 'action', 'step', 'plan', 'recommendation'], 'icon-arrow'],
  [['training', 'onboarding', 'education', 'learn'], 'icon-book'],
  [['infrastructure', 'architecture', 'system'], 'icon-layers'],
];

function getIconClass(title: string): string {
  const lower = title.toLowerCase();
  for (const [keywords, cls] of ICON_MAP) {
    if (keywords.some(k => lower.includes(k))) return cls;
  }
  return 'icon-grid';
}

// ── Category badge mapping ───────────────────────────────

const CATEGORY_BADGES: [string[], string, string][] = [
  [['overview', 'summary', 'introduction'], 'Overview', '#3b82f6'],
  [['solution', 'product', 'platform'], 'Solution', '#10b981'],
  [['security', 'compliance', 'risk'], 'Security', '#ef4444'],
  [['timeline', 'implementation', 'deploy'], 'Timeline', '#f59e0b'],
  [['cost', 'price', 'roi', 'value'], 'Financial', '#8b5cf6'],
  [['team', 'people', 'support'], 'Team', '#06b6d4'],
  [['data', 'analytics', 'metrics'], 'Analytics', '#ec4899'],
];

function getCategoryBadge(title: string): { label: string; color: string } {
  const lower = title.toLowerCase();
  for (const [keywords, label, color] of CATEGORY_BADGES) {
    if (keywords.some(k => lower.includes(k))) return { label, color };
  }
  return { label: 'Details', color: '#6b7280' };
}

// ── Status pill injection ───────────────────────────────────

function injectStatusPills(html: string): string {
  return html
    .replace(/\[GREEN\]/gi, '<span class="status-pill status-green"><span class="status-dot dot-green"></span> On Track</span>')
    .replace(/\[AMBER\]/gi, '<span class="status-pill status-amber"><span class="status-dot dot-amber"></span> At Risk</span>')
    .replace(/\[RED\]/gi, '<span class="status-pill status-red"><span class="status-dot dot-red"></span> Blocked</span>')
    .replace(/\[COMPLETE\]/gi, '<span class="status-pill status-green"><span class="status-dot dot-green"></span> Complete</span>')
    .replace(/\[IN.?PROGRESS\]/gi, '<span class="status-pill status-amber"><span class="status-dot dot-amber"></span> In Progress</span>')
    .replace(/\[PENDING\]/gi, '<span class="status-pill status-red"><span class="status-dot dot-red"></span> Pending</span>')
    .replace(/\[CERTIFIED\]/gi, '<span class="cert-badge">Certified</span>')
    .replace(/\[VERIFIED\]/gi, '<span class="cert-badge">Verified</span>')
    .replace(/\[ISO.?\d*\]/gi, (m) => `<span class="cert-badge">${m.replace(/[\[\]]/g, '')}</span>`)
    .replace(/\[SOC.?\d*\]/gi, (m) => `<span class="cert-badge">${m.replace(/[\[\]]/g, '')}</span>`)
    .replace(/\[(\d+)%\]/g, (_: string, pct: string) => {
      const p = parseInt(pct);
      const color = p >= 75 ? '#22c55e' : p >= 40 ? '#f59e0b' : '#ef4444';
      return `<div class="progress-bar-wrap"><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${p}%;background:${color};"></div></div><span class="progress-bar-label">${p}%</span></div>`;
    });
}

// ── Section border color rotation ────────────────────────

const SECTION_HUES = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

function sectionAccent(index: number, brandPrimary: string): string {
  if (index === 0) return brandPrimary;
  return SECTION_HUES[(index - 1) % SECTION_HUES.length];
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const accent = brand.accent || brand.primary;
  const primaryLight = lighten(brand.primary, 0.95);
  const primaryVeryLight = lighten(brand.primary, 0.97);
  const primaryDark = darken(brand.primary, 0.15);
  const headerTextColor = contrastText(brand.primary);
  const { r: pr, g: pg, b: pb } = hexToRgb(brand.primary);

  const sectionsHtml = input.sections.map((s, i) => {
    const cleanContent = stripEmojis(s.content);
    const cleanTitle = stripEmojis(s.title);
    const iconClass = getIconClass(cleanTitle);
    const badge = getCategoryBadge(cleanTitle);
    const borderColor = sectionAccent(i, brand.primary);
    const formatted = injectStatusPills(formatMarkdown(cleanContent));

    return `<div class="card" style="--card-accent:${borderColor};">
      <div class="card-header">
        <div class="card-header-left">
          <div class="card-icon ${iconClass}" style="background:${lighten(borderColor, 0.88)};color:${darken(borderColor, 0.15)};"></div>
          <div class="card-header-text">
            <h2 class="card-title">${cleanTitle}</h2>
            <div class="card-tags">
              <span class="tag" style="background:${lighten(badge.color, 0.88)};color:${darken(badge.color, 0.2)};">${badge.label}</span>
              ${input.prospect.industry ? `<span class="tag tag-outline">${input.prospect.industry}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">${formatted}</div>
    </div>`;
  }).join('\n');

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 0.6in 0.75in;
      @bottom-left {
        content: "${input.companyName} | Support: support@${input.companyName.toLowerCase().replace(/\\s+/g, '')}.com";
        font-size: 7px;
        color: #999;
      }
      @bottom-center {
        content: "CONFIDENTIAL";
        font-size: 7px;
        color: #bbb;
        letter-spacing: 0.1em;
      }
      @bottom-right {
        content: "Page " counter(page);
        font-size: 8px;
        color: #999;
      }
    }

    @media print {
      body { margin: 0; background: #fff; }
      .page { padding: 0; max-width: none; }
      .card { break-inside: avoid; box-shadow: none; }
    }

    body {
      font-family: var(--brand-font-secondary);
      font-size: var(--brand-font-body-size);
      color: var(--brand-text);
      background: #f0f2f5;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Gradient Header ── */
    .header {
      background: linear-gradient(180deg, #ffffff 0%, ${primaryVeryLight} 100%);
      padding: 28px 40px 24px;
      border-bottom: 1px solid ${lighten(brand.primary, 0.8)};
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header-logo-area {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-product-name {
      font-family: var(--brand-font-primary);
      font-size: 16px;
      font-weight: 700;
      color: var(--brand-primary);
    }
    .header-version {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      background: var(--brand-primary);
      color: ${headerTextColor};
      letter-spacing: 0.04em;
    }
    .header-nav {
      display: flex;
      gap: 6px;
      font-size: 11px;
      color: #9ca3af;
    }
    .header-nav span { padding: 4px 0; }
    .header-nav .sep { color: #d1d5db; }
    .header-nav .active {
      color: var(--brand-primary);
      font-weight: 600;
    }

    .header-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-title {
      font-family: var(--brand-font-primary);
      font-size: 28px;
      font-weight: 800;
      color: var(--brand-primary);
      line-height: 1.2;
    }
    .header-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    .header-date {
      font-size: 12px;
      color: #9ca3af;
      text-align: right;
    }

    /* ── Info Chips Bar ── */
    .info-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      padding: 16px 40px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: ${primaryVeryLight};
      border: 1px solid ${lighten(brand.primary, 0.85)};
      border-radius: 20px;
      font-size: 12px;
    }
    .info-chip-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ca3af;
    }
    .info-chip-value {
      font-weight: 600;
      color: var(--brand-text);
    }

    /* ── Card Grid ── */
    .cards {
      padding: 24px 40px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      border-top: 3px solid var(--card-accent, ${brand.primary});
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      background: #fafbfc;
      border-bottom: 1px solid #f0f1f3;
    }
    .card-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* ── Icon Shapes (CSS-only) ── */
    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }
    .card-icon::after {
      content: '';
      display: block;
    }
    .icon-grid::after {
      width: 16px; height: 16px;
      background:
        linear-gradient(90deg, currentColor 45%, transparent 45%, transparent 55%, currentColor 55%) 0 0 / 100% 45% no-repeat,
        linear-gradient(90deg, currentColor 45%, transparent 45%, transparent 55%, currentColor 55%) 0 100% / 100% 45% no-repeat;
    }
    .icon-layers::after {
      width: 16px; height: 14px;
      border: 2px solid currentColor;
      border-radius: 2px;
      box-shadow: 3px -3px 0 -1px currentColor;
    }
    .icon-shield::after {
      width: 14px; height: 16px;
      border: 2px solid currentColor;
      border-radius: 2px 2px 8px 8px;
    }
    .icon-link::after {
      width: 16px; height: 8px;
      border: 2px solid currentColor;
      border-radius: 6px;
    }
    .icon-chart::after {
      width: 16px; height: 14px;
      border-left: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      background:
        linear-gradient(currentColor, currentColor) 3px 10px / 3px 4px no-repeat,
        linear-gradient(currentColor, currentColor) 8px 4px / 3px 10px no-repeat,
        linear-gradient(currentColor, currentColor) 13px 7px / 3px 7px no-repeat;
    }
    .icon-dollar::after {
      width: 14px; height: 14px;
      border: 2px solid currentColor;
      border-radius: 50%;
    }
    .icon-users::after {
      width: 16px; height: 12px;
      border-bottom: 3px solid currentColor;
      border-radius: 0 0 8px 8px;
    }
    .icon-clock::after {
      width: 14px; height: 14px;
      border: 2px solid currentColor;
      border-radius: 50%;
    }
    .icon-star::after {
      width: 14px; height: 14px;
      background: currentColor;
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    }
    .icon-arrow::after {
      width: 14px; height: 14px;
      border-right: 2.5px solid currentColor;
      border-top: 2.5px solid currentColor;
      transform: rotate(45deg);
    }
    .icon-book::after {
      width: 16px; height: 12px;
      border: 2px solid currentColor;
      border-radius: 0 2px 2px 0;
      border-left-width: 4px;
    }
    .icon-compare::after {
      width: 16px; height: 12px;
      border-left: 2px solid currentColor;
      border-right: 2px solid currentColor;
      background: linear-gradient(currentColor, currentColor) center / 2px 100% no-repeat;
    }

    .card-header-text {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .card-title {
      font-family: var(--brand-font-primary);
      font-size: 18px;
      font-weight: 700;
      color: var(--brand-text);
      margin: 0;
      line-height: 1.3;
    }

    /* ── Tags / Chips ── */
    .card-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .tag-outline {
      background: transparent;
      border: 1px solid #d1d5db;
      color: #6b7280;
    }

    /* ── Card Body ── */
    .card-body {
      padding: 22px 28px;
    }
    .card-body p { margin-bottom: 10px; }
    .card-body h1, .card-body h2, .card-body h3, .card-body h4 {
      color: ${primaryDark};
      margin: 18px 0 8px;
      font-weight: 700;
    }
    .card-body h2 { font-size: var(--brand-font-h3-size); }
    .card-body h3 { font-size: 15px; }
    .card-body h4 { font-size: 14px; }
    .card-body strong { font-weight: 700; }
    .card-body ul, .card-body ol { padding-left: 22px; margin: 10px 0; }
    .card-body li { margin-bottom: 6px; }
    .card-body hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 18px 0;
    }

    /* ── Status Indicators ── */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin: 0 4px;
      vertical-align: middle;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-green { background: #22c55e; }
    .dot-amber { background: #eab308; }
    .dot-red { background: #ef4444; }
    .status-green { background: #dcfce7; color: #166534; }
    .status-amber { background: #fef3c7; color: #92400e; }
    .status-red { background: #fee2e2; color: #991b1b; }

    /* ── Certification Badges ── */
    .cert-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: var(--brand-primary);
      color: ${headerTextColor};
      margin: 0 4px;
      vertical-align: middle;
    }

    /* ── Progress Bars ── */
    .progress-bar-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
    }
    .progress-bar-track {
      flex: 1;
      max-width: 220px;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .progress-bar-label {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      white-space: nowrap;
    }

    /* ── Tables (enterprise) ── */
    .card-body table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 16px 0;
      font-size: 13px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .card-body th {
      background: ${primaryDark};
      color: ${headerTextColor};
      font-weight: 600;
      text-align: left;
      padding: 10px 16px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-body td {
      padding: 10px 16px;
      border-bottom: 1px solid #f0f1f3;
    }
    .card-body tr:nth-child(even) td { background: #f9fafb; }
    .card-body tr:hover td { background: ${primaryVeryLight}; }
    .card-body tr:last-child td { border-bottom: none; }

    /* ── Footer ── */
    .footer {
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      font-size: 11px;
      color: #9ca3af;
    }
    .footer-left a {
      color: var(--brand-primary);
      text-decoration: none;
    }
    .footer-center {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #d1d5db;
    }
    .footer-right {
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer-version-tag {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      background: ${primaryVeryLight};
      color: var(--brand-primary);
      font-family: monospace;
    }
  `;

  const body = `
    <div class="page">
      <!-- Gradient Header -->
      <div class="header">
        <div class="header-top">
          <div class="header-logo-area">
            ${brandLogoHtml(input, 'height:32px;')}
            <span class="header-product-name">${input.companyName}</span>
            <span class="header-version">v1.0</span>
          </div>
          <div class="header-nav">
            <span>Documents</span>
            <span class="sep">/</span>
            <span>${input.prospect.companyName}</span>
            <span class="sep">/</span>
            <span class="active">${title}</span>
          </div>
        </div>
        <div class="header-title-row">
          <div>
            <div class="header-title">${title}</div>
            <div class="header-subtitle">Prepared for ${input.prospect.companyName}</div>
          </div>
          <div class="header-date">${dateStr}</div>
        </div>
      </div>

      <!-- Info Chips -->
      <div class="info-bar">
        <div class="info-chip">
          <span class="info-chip-label">Client</span>
          <span class="info-chip-value">${input.prospect.companyName}</span>
        </div>
        ${input.prospect.industry ? `<div class="info-chip">
          <span class="info-chip-label">Industry</span>
          <span class="info-chip-value">${input.prospect.industry}</span>
        </div>` : ''}
        ${input.prospect.companySize ? `<div class="info-chip">
          <span class="info-chip-label">Size</span>
          <span class="info-chip-value">${input.prospect.companySize}</span>
        </div>` : ''}
        <div class="info-chip">
          <span class="info-chip-label">Type</span>
          <span class="info-chip-value">${title}</span>
        </div>
        <div class="info-chip">
          <span class="info-chip-label">Author</span>
          <span class="info-chip-value">${input.companyName}</span>
        </div>
      </div>

      <!-- Section Cards -->
      <div class="cards">
        ${sectionsHtml}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-left">
          ${input.companyName} &middot; ${input.companyDescription || 'Enterprise Documentation'} &middot; ${dateStr}
        </div>
        <div class="footer-center">Confidential</div>
        <div class="footer-right">
          <span>Page 1</span>
          <span class="footer-version-tag">v1.0</span>
        </div>
      </div>
    </div>
  `;

  return wrapDocument({ title: `${title} \u2014 ${input.prospect.companyName}`, css, body, fonts: brandFonts(brand) });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const light = lighten(accentColor, 0.95);
  const textOnAccent = contrastText(accentColor);
  return `<div style="width:100%;height:100%;background:#f0f2f5;font-family:sans-serif;padding:0;box-sizing:border-box;position:relative;overflow:hidden;">
    <div style="background:linear-gradient(180deg,#fff,${light});padding:6px 10px;border-bottom:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:4px;">
          <div style="width:14px;height:5px;background:${accentColor};border-radius:1px;"></div>
          <span style="font-size:5px;font-weight:700;color:${accentColor};">Product</span>
          <span style="padding:1px 4px;border-radius:6px;font-size:4px;font-weight:700;background:${accentColor};color:${textOnAccent};">v1.0</span>
        </div>
        <div style="font-size:4px;color:#9ca3af;">Docs / Client / <span style="color:${accentColor};font-weight:600;">Report</span></div>
      </div>
      <div style="font-size:9px;font-weight:800;color:${accentColor};">Enterprise Report</div>
      <div style="font-size:5px;color:#6b7280;">Prepared for Client</div>
    </div>
    <div style="display:flex;gap:3px;padding:4px 10px;background:#fff;border-bottom:1px solid #e5e7eb;">
      <span style="padding:2px 6px;border-radius:8px;font-size:4px;background:${light};border:0.5px solid ${lighten(accentColor, 0.8)};color:#555;">Client: Acme</span>
      <span style="padding:2px 6px;border-radius:8px;font-size:4px;background:${light};border:0.5px solid ${lighten(accentColor, 0.8)};color:#555;">Type: Report</span>
    </div>
    <div style="padding:5px 10px;">
      <div style="background:#fff;border:0.5px solid #e5e7eb;border-top:2px solid ${accentColor};border-radius:4px;margin-bottom:5px;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:4px;padding:4px 6px;background:#fafbfc;border-bottom:0.5px solid #f0f1f3;">
          <div style="width:14px;height:14px;border-radius:4px;background:${light};"></div>
          <span style="font-size:6px;font-weight:700;color:#333;">Overview</span>
          <span style="margin-left:auto;padding:1px 5px;border-radius:6px;font-size:4px;font-weight:600;background:#dbeafe;color:#1e40af;">Overview</span>
        </div>
        <div style="padding:4px 6px;">
          <div style="width:85%;height:2px;background:#eee;border-radius:1px;margin-bottom:2px;"></div>
          <div style="width:70%;height:2px;background:#eee;border-radius:1px;"></div>
        </div>
      </div>
      <div style="background:#fff;border:0.5px solid #e5e7eb;border-top:2px solid #10b981;border-radius:4px;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:4px;padding:4px 6px;background:#fafbfc;border-bottom:0.5px solid #f0f1f3;">
          <div style="width:14px;height:14px;border-radius:4px;background:#ecfdf5;"></div>
          <span style="font-size:6px;font-weight:700;color:#333;">Solution</span>
          <span style="margin-left:auto;display:flex;align-items:center;gap:2px;padding:1px 5px;border-radius:6px;font-size:4px;background:#dcfce7;color:#166534;"><span style="width:3px;height:3px;border-radius:50%;background:#22c55e;"></span> On Track</span>
        </div>
        <div style="padding:4px 6px;">
          <div style="display:flex;align-items:center;gap:4px;"><div style="flex:1;max-width:60px;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;"><div style="width:72%;height:100%;background:#22c55e;border-radius:2px;"></div></div><span style="font-size:4px;font-weight:700;color:#6b7280;">72%</span></div>
        </div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;background:#fff;border-top:0.5px solid #e5e7eb;padding:3px 10px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:4px;color:#9ca3af;">Company &middot; Date</span>
      <span style="font-size:4px;color:#d1d5db;text-transform:uppercase;letter-spacing:0.05em;">Confidential</span>
      <div style="display:flex;align-items:center;gap:3px;"><span style="font-size:4px;color:#9ca3af;">Page 1</span><span style="padding:1px 3px;border-radius:2px;font-size:3px;font-weight:600;background:${light};color:${accentColor};font-family:monospace;">v1.0</span></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style23Enterprise: DocumentStyle = {
  id: 'style-23',
  name: 'Enterprise',
  category: 'corporate',
  description: 'Salesforce-style enterprise docs — card layout, status indicators, progress bars, tag chips',
  keywords: ['enterprise', 'salesforce', 'sap', 'dashboard', 'data-dense', 'icons', 'badges', 'progress', 'cards'],
  render,
  thumbnail,
};

export default style23Enterprise;
