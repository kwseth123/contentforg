import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, lighten, darken, contrastText } from './shared';

// ── Icon selection by keyword ───────────────────────────────

const ICON_MAP: [string[], string][] = [
  [['overview', 'summary', 'introduction', 'about'], '\u25CF'],   // ●
  [['solution', 'product', 'platform', 'technology', 'tech'], '\u2605'], // ★
  [['security', 'compliance', 'risk', 'protect'], '\u25C6'],      // ◆
  [['integration', 'connect', 'api', 'workflow'], '\u2713'],      // ✓
  [['performance', 'speed', 'scale', 'optimization'], '\u25B2'],  // ▲
  [['cost', 'price', 'roi', 'value', 'savings', 'financial'], '\u25CF'], // ●
  [['team', 'people', 'support', 'service', 'customer'], '\u2605'], // ★
  [['timeline', 'schedule', 'implementation', 'deploy', 'phase'], '\u25C6'], // ◆
  [['data', 'analytics', 'report', 'insight', 'metrics'], '\u25B2'], // ▲
  [['competitive', 'comparison', 'market', 'landscape'], '\u2713'], // ✓
  [['benefit', 'advantage', 'feature', 'capability'], '\u2605'],  // ★
  [['next', 'action', 'step', 'plan', 'recommendation'], '\u25B6'], // ▶
  [['training', 'onboarding', 'education', 'learn'], '\u25CF'],   // ●
  [['infrastructure', 'architecture', 'system'], '\u25C6'],       // ◆
];

function getIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [keywords, icon] of ICON_MAP) {
    if (keywords.some(k => lower.includes(k))) return icon;
  }
  return '\u25CF'; // ●
}

// ── Section accent colors (rotating) ────────────────────────

const SECTION_BORDER_HUES = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

function sectionBorderColor(index: number, brandPrimary: string): string {
  // First section uses brand primary, rest rotate through hues
  if (index === 0) return brandPrimary;
  return SECTION_BORDER_HUES[(index - 1) % SECTION_BORDER_HUES.length];
}

// ── Status badge category mapping ───────────────────────────

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
    .replace(/\[GREEN\]/gi, '<span class="pill pill-green">\u2713 On Track</span>')
    .replace(/\[AMBER\]/gi, '<span class="pill pill-amber">\u25B2 At Risk</span>')
    .replace(/\[RED\]/gi, '<span class="pill pill-red">\u25CF Blocked</span>')
    .replace(/\[COMPLETE\]/gi, '<span class="pill pill-green">\u2713 Complete</span>')
    .replace(/\[IN.?PROGRESS\]/gi, '<span class="pill pill-amber">\u25B6 In Progress</span>')
    .replace(/\[PENDING\]/gi, '<span class="pill pill-red">\u25CF Pending</span>')
    .replace(/\[CERTIFIED\]/gi, '<span class="badge">\u2713 Certified</span>')
    .replace(/\[VERIFIED\]/gi, '<span class="badge">\u2713 Verified</span>')
    .replace(/\[ISO.?\d*\]/gi, (m) => `<span class="badge">${m.replace(/[\[\]]/g, '')}</span>`)
    .replace(/\[SOC.?\d*\]/gi, (m) => `<span class="badge">${m.replace(/[\[\]]/g, '')}</span>`)
    .replace(/\[(\d+)%\]/g, (_, pct) => {
      const p = parseInt(pct);
      const color = p >= 75 ? '#22c55e' : p >= 40 ? '#f59e0b' : '#ef4444';
      return `<div class="progress-track"><div class="progress-fill" style="width:${p}%;background:${color};"></div><span class="progress-label">${p}%</span></div>`;
    });
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const primaryLight = lighten(brand.primary, 0.92);
  const primaryDark = darken(brand.primary, 0.15);
  const headerTextColor = contrastText(brand.primary);

  const sectionsHtml = input.sections.map((s, i) => {
    const icon = getIcon(s.title);
    const badge = getCategoryBadge(s.title);
    const borderColor = sectionBorderColor(i, brand.primary);
    const formatted = injectStatusPills(formatMarkdown(s.content));

    return `<div class="section" style="border-left:4px solid ${borderColor};">
      <div class="section-header">
        <div class="icon-circle" style="background:${lighten(borderColor, 0.85)};color:${darken(borderColor, 0.2)};">${icon}</div>
        <div class="section-header-text">
          <h2 class="section-heading">${s.title}</h2>
          <span class="category-badge" style="background:${lighten(badge.color, 0.85)};color:${darken(badge.color, 0.25)};">${badge.label}</span>
        </div>
      </div>
      <div class="section-body">${formatted}</div>
    </div>`;
  }).join('\n');

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary);
      font-size: var(--brand-font-body-size);
      color: var(--brand-text);
      background: #f3f4f6;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      max-width: 940px;
      margin: 0 auto;
      padding: 32px 36px;
    }
    /* ── Top navigation header ── */
    .nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: var(--brand-background);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 4px;
    }
    .nav-logo { display: flex; align-items: center; gap: 12px; }
    .breadcrumb {
      font-size: 12px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .breadcrumb-sep { color: #d1d5db; }
    .breadcrumb-active {
      color: var(--brand-primary);
      font-weight: 600;
    }
    /* ── Header banner ── */
    .header-banner {
      background: var(--brand-primary);
      color: ${headerTextColor};
      padding: 32px 36px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-radius: 0 0 8px 8px;
      margin-bottom: 20px;
    }
    .header-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      line-height: 1.2;
    }
    .header-subtitle {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 6px;
    }
    .header-meta {
      font-size: 12px;
      text-align: right;
      opacity: 0.85;
      line-height: 1.6;
    }
    /* ── Info bar ── */
    .info-bar {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      background: var(--brand-background);
      padding: 16px 24px;
      margin-bottom: 24px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ca3af;
    }
    .info-value { font-weight: 600; color: var(--brand-text); }
    /* ── Section cards ── */
    .section {
      background: var(--brand-background);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 24px;
      background: ${primaryLight};
      border-bottom: 1px solid #e5e7eb;
    }
    .icon-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    .section-header-text {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .section-heading {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
      color: ${primaryDark};
      margin: 0;
    }
    .category-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .section-body {
      padding: 22px 28px;
    }
    .section-body p { margin-bottom: 10px; }
    .section-body h1, .section-body h2, .section-body h3, .section-body h4 {
      color: ${primaryDark};
      margin: 18px 0 8px;
      font-weight: 600;
    }
    .section-body h2 { font-size: var(--brand-font-h3-size); }
    .section-body h3 { font-size: 15px; }
    .section-body h4 { font-size: 14px; }
    .section-body strong { font-weight: 600; }
    .section-body ul, .section-body ol { padding-left: 22px; margin: 10px 0; }
    .section-body li { margin-bottom: 5px; }
    .section-body hr { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
    /* ── Tables ── */
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 13px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    .section-body th {
      background: var(--brand-primary);
      color: ${headerTextColor};
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .section-body td {
      padding: 9px 14px;
      border-bottom: 1px solid #f0f0f0;
    }
    .section-body tr:nth-child(even) td { background: #f9fafb; }
    .section-body tr:hover td { background: ${primaryLight}; }
    /* ── Status pills ── */
    .pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin: 0 4px;
      vertical-align: middle;
    }
    .pill-green { background: #dcfce7; color: #166534; }
    .pill-amber { background: #fef3c7; color: #92400e; }
    .pill-red { background: #fee2e2; color: #991b1b; }
    /* ── Compliance badges ── */
    .badge {
      display: inline-block;
      padding: 2px 8px;
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
    /* ── Progress bars ── */
    .progress-track {
      position: relative;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      display: block;
      width: 100%;
      max-width: 220px;
      margin: 6px 0;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      position: absolute;
      left: 0;
      top: 0;
      transition: width 0.3s ease;
    }
    .progress-label {
      position: absolute;
      right: -40px;
      top: -3px;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
    }
    /* ── Footer ── */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: var(--brand-background);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 11px;
      color: #9ca3af;
    }
    .footer-version {
      font-family: monospace;
      font-size: 10px;
      color: #d1d5db;
    }
  `;

  const body = `
    <div class="page">
      <div class="nav-header">
        <div class="nav-logo">${brandLogoHtml(input, 'height:28px;')}</div>
        <div class="breadcrumb">
          <span>Documents</span>
          <span class="breadcrumb-sep">/</span>
          <span>${input.prospect.companyName}</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-active">${title}</span>
        </div>
      </div>
      <div class="header-banner">
        <div>
          <div class="header-title">${title}</div>
          <div class="header-subtitle">Prepared for ${input.prospect.companyName}</div>
        </div>
        <div class="header-meta">
          ${dateStr}<br/>
          v1.0
        </div>
      </div>
      <div class="info-bar">
        <div class="info-item"><span class="info-label">Client</span><span class="info-value">${input.prospect.companyName}</span></div>
        ${input.prospect.industry ? `<div class="info-item"><span class="info-label">Industry</span><span class="info-value">${input.prospect.industry}</span></div>` : ''}
        ${input.prospect.companySize ? `<div class="info-item"><span class="info-label">Company Size</span><span class="info-value">${input.prospect.companySize}</span></div>` : ''}
        <div class="info-item"><span class="info-label">Document Type</span><span class="info-value">${title}</span></div>
        <div class="info-item"><span class="info-label">Prepared By</span><span class="info-value">${input.companyName}</span></div>
      </div>
      ${sectionsHtml}
      <div class="footer">
        <div>${input.companyName} &middot; ${dateStr} &middot; Confidential</div>
        <div class="footer-version">v1.0 &middot; ${new Date().getFullYear()}</div>
      </div>
    </div>
  `;

  return wrapDocument({ title: `${title} \u2014 ${input.prospect.companyName}`, css, body, fonts: brandFonts(brand) });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const light = lighten(accentColor, 0.92);
  const textOnAccent = contrastText(accentColor);
  return `<div style="width:100%;height:100%;background:#f3f4f6;font-family:sans-serif;padding:10px 10px;box-sizing:border-box;position:relative;">
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:4px 8px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;">
      <div style="width:20px;height:5px;background:${accentColor};border-radius:1px;"></div>
      <div style="font-size:5px;color:#9ca3af;">Docs / Client / <span style="color:${accentColor};font-weight:600;">Report</span></div>
    </div>
    <div style="background:${accentColor};color:${textOnAccent};padding:8px 10px;border-radius:0 0 4px 4px;margin-bottom:6px;">
      <div style="font-size:8px;font-weight:700;">Enterprise Report</div>
      <div style="font-size:5px;opacity:0.8;">Prepared for Client</div>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:4px 8px;margin-bottom:6px;display:flex;gap:10px;font-size:5px;color:#6b7280;">
      <div><span style="color:#9ca3af;font-size:4px;text-transform:uppercase;">CLIENT</span><br/>Acme Corp</div>
      <div><span style="color:#9ca3af;font-size:4px;text-transform:uppercase;">TYPE</span><br/>Report</div>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-left:3px solid ${accentColor};border-radius:4px;margin-bottom:5px;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:4px;padding:4px 6px;background:${light};border-bottom:1px solid #e5e7eb;">
        <div style="width:12px;height:12px;border-radius:50%;background:${light};border:1px solid ${accentColor};display:flex;align-items:center;justify-content:center;font-size:6px;color:${accentColor};">\u25CF</div>
        <span style="font-size:6px;font-weight:700;color:${accentColor};">Overview</span>
        <span style="padding:1px 4px;border-radius:6px;background:#dcfce7;font-size:4px;color:#166534;margin-left:auto;">\u2713 On Track</span>
      </div>
      <div style="padding:4px 6px;">
        <div style="width:85%;height:2px;background:#eee;border-radius:1px;margin-bottom:2px;"></div>
        <div style="width:70%;height:2px;background:#eee;border-radius:1px;"></div>
      </div>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-left:3px solid #10b981;border-radius:4px;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:4px;padding:4px 6px;background:${light};border-bottom:1px solid #e5e7eb;">
        <div style="width:12px;height:12px;border-radius:50%;background:#ecfdf5;border:1px solid #10b981;display:flex;align-items:center;justify-content:center;font-size:6px;color:#10b981;">\u2605</div>
        <span style="font-size:6px;font-weight:700;color:${accentColor};">Solution</span>
      </div>
      <div style="padding:4px 6px;">
        <div style="height:4px;background:#e5e7eb;border-radius:2px;position:relative;margin-bottom:3px;"><div style="position:absolute;left:0;top:0;height:100%;width:72%;background:#22c55e;border-radius:2px;"></div></div>
        <div style="width:60%;height:2px;background:#eee;border-radius:1px;"></div>
      </div>
    </div>
    <div style="position:absolute;bottom:4px;left:10px;right:10px;display:flex;justify-content:space-between;font-size:4px;color:#d1d5db;">
      <span>Company &middot; Date</span><span style="font-family:monospace;">v1.0</span>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style23Enterprise: DocumentStyle = {
  id: 'style-23',
  name: 'Enterprise',
  category: 'corporate',
  description: 'Feature-rich dashboard layout with icons, status badges, progress bars, and color-coded sections',
  keywords: ['enterprise', 'salesforce', 'sap', 'dashboard', 'data-dense', 'icons', 'badges', 'progress'],
  render,
  thumbnail,
};

export default style23Enterprise;
