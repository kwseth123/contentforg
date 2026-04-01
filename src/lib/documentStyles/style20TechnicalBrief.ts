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
  const techBlue = '#2563eb';
  const darkSlate = '#0f172a';
  const sidebarGray = '#f1f5f9';
  const totalPages = Math.max(1, Math.ceil(cleanSections.length / 3));
  const docId = `TB-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const sectionsHtml = cleanSections.map((s, i) => {
    const num = `${i + 1}`;
    return `
      <div class="tb-section" id="section-${num}">
        <div class="tb-section-header">
          <span class="tb-section-num">${num}.</span>
          <h2 class="tb-section-title">${s.title}</h2>
        </div>
        <div class="tb-section-body">${formatMarkdown(s.content)}</div>
      </div>`;
  }).join('\n');

  const statsHtml = stats.length > 0 ? `
    <div class="tb-specs-grid">
      <div class="tb-specs-header">SPECIFICATIONS</div>
      <div class="tb-specs-row">
        ${stats.map(s => `
          <div class="tb-spec">
            <div class="tb-spec-value">${s.value}</div>
            <div class="tb-spec-label">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const sidebarNav = cleanSections.map((s, i) => `
    <a class="tb-nav-item" href="#section-${i + 1}">
      <span class="tb-nav-num">${i + 1}.</span> ${s.title}
    </a>
  `).join('');

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0.75in 1in;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .tb-layout { display: block; }
      .tb-sidebar { display: none; }
      .tb-main { max-width: 100%; }
      .tb-section { page-break-inside: avoid; }
    }

    body {
      font-family: 'Inter', var(--brand-font-secondary), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: var(--brand-font-body-size);
      color: ${darkSlate};
      background: #ffffff;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    ${professionalSymbolCSS(accent)}

    .tb-page {
      max-width: 8.5in;
      margin: 0 auto;
    }

    /* ══ Technical Header ══ */
    .tb-header {
      background: ${darkSlate};
      color: #e2e8f0;
      padding: 20px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tb-header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .tb-header-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }
    .tb-header-right {
      display: flex;
      gap: 24px;
      font-size: 10px;
      color: #94a3b8;
    }
    .tb-header-right dt {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #64748b;
      margin-bottom: 1px;
    }
    .tb-header-right dd {
      margin: 0;
      color: #e2e8f0;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 11px;
    }
    .tb-header-accent {
      height: 3px;
      background: linear-gradient(to right, ${techBlue}, ${lighten(techBlue, 0.3)});
    }

    /* ══ Layout: sidebar + main ══ */
    .tb-layout {
      display: flex;
      min-height: calc(100vh - 120px);
    }
    .tb-sidebar {
      width: 220px;
      background: ${sidebarGray};
      border-right: 1px solid #e2e8f0;
      padding: 24px 20px;
      flex-shrink: 0;
    }
    .tb-sidebar-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #64748b;
      margin-bottom: 14px;
    }
    .tb-nav-item {
      display: block;
      font-size: 12px;
      color: #475569;
      text-decoration: none;
      padding: 6px 10px;
      margin-bottom: 2px;
      border-radius: 4px;
      border-left: 2px solid transparent;
      transition: all 0.15s;
    }
    .tb-nav-item:hover {
      background: #e2e8f0;
      border-left-color: ${techBlue};
      color: ${darkSlate};
    }
    .tb-nav-num {
      color: ${techBlue};
      font-weight: 600;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 11px;
    }
    .tb-sidebar-meta {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .tb-sidebar-meta dt {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 2px;
    }
    .tb-sidebar-meta dd {
      margin: 0 0 12px 0;
      font-size: 12px;
      color: #334155;
    }

    .tb-main {
      flex: 1;
      padding: 32px 48px;
      max-width: calc(8.5in - 220px);
    }

    /* ══ Title Block ══ */
    .tb-title-block {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${techBlue};
    }
    .tb-doc-title {
      font-size: 26px;
      font-weight: 800;
      color: ${darkSlate};
      line-height: 1.2;
      margin: 0 0 6px 0;
    }
    .tb-doc-subtitle {
      font-size: 13px;
      color: #64748b;
    }

    /* ══ Specifications Grid ══ */
    .tb-specs-grid {
      background: ${sidebarGray};
      border: 1px solid #e2e8f0;
      border-left: 4px solid ${techBlue};
      margin-bottom: 32px;
      overflow: hidden;
    }
    .tb-specs-header {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${techBlue};
      padding: 12px 20px 0;
    }
    .tb-specs-row {
      display: flex;
      padding: 16px 20px;
      gap: 20px;
    }
    .tb-spec {
      flex: 1;
      text-align: center;
      padding: 12px 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .tb-spec-value {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 24px;
      font-weight: 700;
      color: ${techBlue};
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .tb-spec-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 4px;
    }

    /* ══ Sections ══ */
    .tb-section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .tb-section-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 4px;
    }
    .tb-section-num {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 14px;
      font-weight: 700;
      color: ${techBlue};
    }
    .tb-section-title {
      font-size: 20px;
      font-weight: 700;
      color: ${darkSlate};
      margin: 0;
      line-height: 1.3;
    }
    .tb-section + .tb-section {
      border-top: 2px solid ${techBlue};
      padding-top: 28px;
    }

    .tb-section-body p {
      margin-bottom: 12px;
    }
    .tb-section-body h1,
    .tb-section-body h2,
    .tb-section-body h3,
    .tb-section-body h4 {
      color: ${darkSlate};
      margin: 20px 0 8px;
      font-weight: 700;
    }
    .tb-section-body h2 { font-size: 18px; }
    .tb-section-body h3 { font-size: 16px; }
    .tb-section-body h4 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${techBlue};
    }
    .tb-section-body strong { font-weight: 600; }

    /* ── Checkmark bullets ── */
    .tb-section-body ul {
      list-style: none;
      padding-left: 0;
      margin: 12px 0;
    }
    .tb-section-body ul li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 8px;
      line-height: 1.6;
    }
    .tb-section-body ul li::before {
      content: '';
      position: absolute;
      left: 2px;
      top: 6px;
      width: 12px;
      height: 12px;
      border: 2px solid ${techBlue};
      border-radius: 2px;
      background: ${lighten(techBlue, 0.92)};
    }
    .tb-section-body ul li::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 8px;
      width: 6px;
      height: 3px;
      border-left: 2px solid ${techBlue};
      border-bottom: 2px solid ${techBlue};
      transform: rotate(-45deg);
    }
    .tb-section-body ol {
      padding-left: 24px;
      margin: 12px 0;
    }
    .tb-section-body ol li {
      margin-bottom: 6px;
      line-height: 1.6;
    }
    .tb-section-body hr {
      border: none;
      border-top: 1px dashed #cbd5e1;
      margin: 24px 0;
    }

    /* ══ Tables ══ */
    .tb-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 12px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', var(--brand-font-secondary), monospace;
      border: 1px solid #e2e8f0;
    }
    .tb-section-body th {
      background: ${darkSlate};
      color: #e2e8f0;
      font-weight: 600;
      text-align: left;
      padding: 8px 14px;
      font-size: 10px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .tb-section-body td {
      padding: 7px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-variant-numeric: tabular-nums;
    }
    .tb-section-body tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* ══ Code blocks ══ */
    .tb-section-body code,
    .tb-section-body pre {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      background: ${sidebarGray};
      border: 1px solid #e2e8f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      color: ${darkSlate};
    }
    .tb-section-body pre {
      padding: 16px 20px;
      overflow-x: auto;
      line-height: 1.5;
    }

    /* ══ Blockquote as spec box ══ */
    .tb-section-body blockquote {
      border: 2px solid ${techBlue};
      border-radius: 4px;
      padding: 16px 20px;
      margin: 16px 0;
      background: ${lighten(techBlue, 0.95)};
      position: relative;
    }
    .tb-section-body blockquote::before {
      content: 'DETAIL';
      position: absolute;
      top: -10px;
      left: 12px;
      background: ${techBlue};
      color: #fff;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.12em;
      padding: 2px 8px;
      border-radius: 2px;
    }

    /* ══ Footer ══ */
    .tb-footer {
      background: ${darkSlate};
      color: #94a3b8;
      padding: 14px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
    }
    .tb-footer-left {
      display: flex;
      gap: 16px;
    }
    .tb-footer-left dt {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
    }
    .tb-footer-left dd {
      margin: 0;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 10px;
      color: #cbd5e1;
    }
    .tb-footer-center {
      font-variant-numeric: tabular-nums;
    }
    .tb-footer-right {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
  `;

  const body = `
    <div class="tb-page">
      <!-- Technical Header -->
      <div class="tb-header">
        <div class="tb-header-left">
          ${brandLogoHtml(input, 'height:24px;filter:brightness(10);')}
          <div class="tb-header-title">${title}</div>
        </div>
        <div class="tb-header-right">
          <div>
            <dt>Document ID</dt>
            <dd>${docId}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>1.0</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>${dateStr}</dd>
          </div>
          <div>
            <dt>Classification</dt>
            <dd>Confidential</dd>
          </div>
        </div>
      </div>
      <div class="tb-header-accent"></div>

      <!-- Layout -->
      <div class="tb-layout">
        <!-- Sidebar -->
        <div class="tb-sidebar">
          <div class="tb-sidebar-label">Contents</div>
          ${sidebarNav}

          <div class="tb-sidebar-meta">
            <dt>Prepared for</dt>
            <dd>${prospect.companyName}</dd>
            ${prospect.industry ? `<dt>Industry</dt><dd>${prospect.industry}</dd>` : ''}
            ${prospect.companySize ? `<dt>Organization</dt><dd>${prospect.companySize}</dd>` : ''}
            <dt>Prepared by</dt>
            <dd>${companyName}</dd>
          </div>
        </div>

        <!-- Main Content -->
        <div class="tb-main">
          <div class="tb-title-block">
            <h1 class="tb-doc-title">${title}</h1>
            <div class="tb-doc-subtitle">Technical analysis for ${prospect.companyName}</div>
          </div>

          <!-- Specifications -->
          ${statsHtml}

          <!-- Sections -->
          ${sectionsHtml}
        </div>
      </div>

      <!-- Footer -->
      <div class="tb-footer">
        <div class="tb-footer-left">
          <div>
            <dt>Document</dt>
            <dd>${docId}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd>1.0 | ${dateStr}</dd>
          </div>
        </div>
        <div class="tb-footer-center">Page 1 of ${totalPages}</div>
        <div class="tb-footer-right">Confidential</div>
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
  const darkSlate = '#0f172a';
  const techBlue = '#2563eb';
  return `<div style="width:100%;height:100%;background:#fff;font-family:monospace,sans-serif;padding:0;box-sizing:border-box;position:relative;overflow:hidden;">
    <!-- Header bar -->
    <div style="background:${darkSlate};color:#e2e8f0;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:6px;">
        <div style="width:16px;height:6px;background:${techBlue};border-radius:1px;"></div>
        <div style="font-size:7px;font-weight:700;color:#fff;">Technical Brief</div>
      </div>
      <div style="display:flex;gap:8px;">
        <div><div style="font-size:4px;color:#64748b;letter-spacing:0.1em;">DOC ID</div><div style="font-size:5px;color:#cbd5e1;font-family:monospace;">TB-A1B2</div></div>
        <div><div style="font-size:4px;color:#64748b;letter-spacing:0.1em;">VER</div><div style="font-size:5px;color:#cbd5e1;font-family:monospace;">1.0</div></div>
      </div>
    </div>
    <div style="height:2px;background:linear-gradient(to right,${techBlue},#93c5fd);"></div>
    <!-- Layout -->
    <div style="display:flex;height:calc(100% - 30px);">
      <!-- Sidebar -->
      <div style="width:50px;background:#f1f5f9;border-right:1px solid #e2e8f0;padding:8px 6px;">
        <div style="font-size:4px;font-weight:700;color:#64748b;letter-spacing:0.1em;margin-bottom:6px;">CONTENTS</div>
        <div style="font-size:5px;color:#475569;margin-bottom:3px;padding:2px 4px;border-left:2px solid ${techBlue};"><span style="color:${techBlue};font-weight:600;">1.</span> Section</div>
        <div style="font-size:5px;color:#475569;margin-bottom:3px;padding:2px 4px;"><span style="color:${techBlue};font-weight:600;">2.</span> Section</div>
        <div style="font-size:5px;color:#475569;padding:2px 4px;"><span style="color:${techBlue};font-weight:600;">3.</span> Section</div>
      </div>
      <!-- Main -->
      <div style="flex:1;padding:8px 10px;">
        <div style="font-size:10px;font-weight:800;color:${darkSlate};margin-bottom:2px;">Document Title</div>
        <div style="width:50%;height:3px;background:#ddd;border-radius:1px;margin-bottom:6px;"></div>
        <div style="border-bottom:2px solid ${techBlue};margin-bottom:8px;"></div>
        <!-- Spec boxes -->
        <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-left:3px solid ${techBlue};padding:4px 6px;margin-bottom:8px;">
          <div style="font-size:4px;font-weight:700;color:${techBlue};letter-spacing:0.1em;margin-bottom:4px;">SPECIFICATIONS</div>
          <div style="display:flex;gap:4px;">
            <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:2px;text-align:center;padding:3px 2px;">
              <div style="font-size:8px;font-weight:700;color:${techBlue};font-family:monospace;">45%</div>
              <div style="width:60%;height:2px;background:#eee;margin:1px auto 0;border-radius:1px;"></div>
            </div>
            <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:2px;text-align:center;padding:3px 2px;">
              <div style="font-size:8px;font-weight:700;color:${techBlue};font-family:monospace;">3x</div>
              <div style="width:60%;height:2px;background:#eee;margin:1px auto 0;border-radius:1px;"></div>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:3px;">
          <span style="font-size:7px;font-weight:700;color:${techBlue};font-family:monospace;">1.</span>
          <span style="font-size:7px;font-weight:700;color:${darkSlate};">Section Title</span>
        </div>
        <div style="width:100%;height:3px;background:#eee;border-radius:1px;margin-bottom:2px;"></div>
        <div style="width:88%;height:3px;background:#eee;border-radius:1px;margin-bottom:2px;"></div>
        <div style="width:92%;height:3px;background:#eee;border-radius:1px;"></div>
      </div>
    </div>
    <!-- Footer -->
    <div style="position:absolute;bottom:0;left:0;right:0;background:${darkSlate};padding:3px 10px;display:flex;justify-content:space-between;font-size:4px;color:#94a3b8;">
      <span>TB-A1B2 | v1.0</span><span>Page 1</span><span>CONFIDENTIAL</span>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style20TechnicalBrief: DocumentStyle = {
  id: 'style-20',
  name: 'Technical Brief',
  category: 'corporate',
  description: 'Dense technical layout — three columns, monospace details, specs',
  keywords: ['technical', 'brief', 'dense', 'specifications', 'aws', 'documentation'],
  render,
  thumbnail,
};

export default style20TechnicalBrief;
