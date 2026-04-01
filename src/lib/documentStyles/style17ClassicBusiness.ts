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
  const navy = '#1b2a4a';
  const charcoal = '#2d3748';
  const lightGray = '#f7f8fa';
  const totalPages = Math.max(1, Math.ceil(cleanSections.length / 3));

  const sectionsHtml = cleanSections.map((s, i) => {
    const num = `${i + 1}.0`;
    return `
      <div class="cb-section">
        <div class="cb-section-header">
          <span class="cb-section-num">${num}</span>
          <h2 class="cb-section-title">${s.title}</h2>
        </div>
        <div class="cb-section-rule"></div>
        <div class="cb-section-body">${formatMarkdown(s.content)}</div>
      </div>`;
  }).join('\n');

  const statsHtml = stats.length > 0 ? `
    <div class="cb-stats-row">
      ${stats.map(s => `
        <div class="cb-stat-box">
          <div class="cb-stat-value">${s.value}</div>
          <div class="cb-stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>` : '';

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 1in;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cb-page { padding: 0; max-width: none; }
      .cb-section { page-break-inside: avoid; }
    }

    body {
      font-family: 'Inter', var(--brand-font-secondary), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: var(--brand-font-body-size);
      color: ${charcoal};
      background: #ffffff;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    ${professionalSymbolCSS(accent)}

    .cb-page {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 60px 72px;
    }

    /* ══ Header ══ */
    .cb-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      margin-bottom: 8px;
    }
    .cb-header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .cb-header-right {
      text-align: right;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #b91c1c;
    }
    .cb-header-rule {
      border: none;
      border-top: 1px solid ${navy};
      margin: 0 0 2px 0;
    }
    .cb-header-rule-2 {
      border: none;
      border-top: 3px solid ${navy};
      margin: 0 0 32px 0;
    }

    /* ══ Title Block ══ */
    .cb-title-block {
      margin-bottom: 8px;
    }
    .cb-doc-title {
      font-family: 'Georgia', 'Times New Roman', var(--brand-font-primary), serif;
      font-size: 32px;
      font-weight: 700;
      color: ${navy};
      line-height: 1.2;
      margin: 0 0 8px 0;
      letter-spacing: -0.01em;
    }
    .cb-doc-meta {
      display: flex;
      gap: 24px;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .cb-doc-meta strong {
      color: ${charcoal};
      font-weight: 600;
    }

    /* ══ Stats Row ══ */
    .cb-stats-row {
      display: flex;
      gap: 16px;
      margin-bottom: 36px;
    }
    .cb-stat-box {
      flex: 1;
      background: ${lightGray};
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 20px 16px;
      text-align: center;
    }
    .cb-stat-value {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      color: ${navy};
      line-height: 1.1;
    }
    .cb-stat-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 6px;
    }

    /* ══ Sections ══ */
    .cb-section {
      margin-bottom: 36px;
      page-break-inside: avoid;
    }
    .cb-section-header {
      display: flex;
      align-items: baseline;
      gap: 14px;
      margin-bottom: 6px;
    }
    .cb-section-num {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      flex-shrink: 0;
      min-width: 28px;
    }
    .cb-section-title {
      font-family: 'Georgia', 'Times New Roman', var(--brand-font-primary), serif;
      font-size: 20px;
      font-weight: 700;
      color: ${navy};
      margin: 0;
      line-height: 1.3;
    }
    .cb-section-rule {
      height: 1px;
      background: linear-gradient(to right, #d1d5db, transparent);
      margin-bottom: 16px;
    }
    .cb-section-body p {
      margin-bottom: 14px;
      text-align: justify;
      hyphens: auto;
    }
    .cb-section-body h1,
    .cb-section-body h2,
    .cb-section-body h3,
    .cb-section-body h4 {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: ${navy};
      margin: 24px 0 10px;
    }
    .cb-section-body h2 { font-size: 18px; font-weight: 700; }
    .cb-section-body h3 { font-size: 16px; font-weight: 700; }
    .cb-section-body h4 { font-size: 14px; font-weight: 600; font-style: italic; }
    .cb-section-body strong { font-weight: 600; color: ${charcoal}; }
    .cb-section-body ul,
    .cb-section-body ol {
      padding-left: 28px;
      margin: 12px 0;
    }
    .cb-section-body li {
      margin-bottom: 6px;
      line-height: 1.6;
    }
    .cb-section-body hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 28px 0;
    }

    /* ══ Tables ══ */
    .cb-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      border: 1px solid #e5e7eb;
    }
    .cb-section-body th {
      background: ${navy};
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 10px 16px;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border-right: 1px solid rgba(255,255,255,0.1);
    }
    .cb-section-body td {
      padding: 10px 16px;
      border-bottom: 1px solid #e5e7eb;
      border-right: 1px solid #f3f4f6;
    }
    .cb-section-body tr:nth-child(even) td {
      background: ${lightGray};
    }
    .cb-section-body tr:hover td {
      background: #eef0f4;
    }

    /* ══ Visual Section Break ══ */
    .cb-section + .cb-section::before {
      content: '';
      display: block;
      width: 60px;
      height: 1px;
      background: ${navy};
      margin: 0 auto 36px;
      opacity: 0.2;
    }

    /* ══ Footer ══ */
    .cb-footer {
      margin-top: 48px;
      padding-top: 12px;
      border-top: 1px solid ${navy};
    }
    .cb-footer-rule-2 {
      border-top: 3px solid ${navy};
      margin-top: 2px;
      padding-top: 12px;
    }
    .cb-footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #9ca3af;
    }
    .cb-footer-left {
      text-align: left;
    }
    .cb-footer-center {
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .cb-footer-right {
      text-align: right;
    }
  `;

  const body = `
    <div class="cb-page">
      <!-- Header -->
      <div class="cb-header">
        <div class="cb-header-left">
          ${brandLogoHtml(input, 'height:36px;')}
        </div>
        <div class="cb-header-right">CONFIDENTIAL</div>
      </div>
      <hr class="cb-header-rule" />
      <hr class="cb-header-rule-2" />

      <!-- Title Block -->
      <div class="cb-title-block">
        <h1 class="cb-doc-title">${title}</h1>
        <div class="cb-doc-meta">
          <span><strong>Prepared for:</strong> ${prospect.companyName}</span>
          ${prospect.industry ? `<span><strong>Industry:</strong> ${prospect.industry}</span>` : ''}
          ${prospect.companySize ? `<span><strong>Size:</strong> ${prospect.companySize}</span>` : ''}
          <span><strong>Date:</strong> ${dateStr}</span>
        </div>
      </div>

      <!-- Key Metrics -->
      ${statsHtml}

      <!-- Sections -->
      ${sectionsHtml}

      <!-- Footer -->
      <div class="cb-footer">
        <div class="cb-footer-rule-2">
          <div class="cb-footer-content">
            <div class="cb-footer-left">${dateStr}</div>
            <div class="cb-footer-center">Page 1 of ${totalPages}</div>
            <div class="cb-footer-right">${companyName}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Inter', 'Georgia', ...brandFonts(brand)],
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const navy = '#1b2a4a';
  return `<div style="width:100%;height:100%;background:#fff;font-family:Georgia,serif;padding:24px 20px;box-sizing:border-box;position:relative;">
    <div style="display:flex;justify-content:space-between;padding-bottom:6px;">
      <div style="width:50px;height:10px;background:${navy};border-radius:2px;"></div>
      <div style="font-size:5px;color:#b91c1c;font-weight:700;letter-spacing:0.1em;">CONFIDENTIAL</div>
    </div>
    <div style="border-top:1px solid ${navy};margin-bottom:2px;"></div>
    <div style="border-top:3px solid ${navy};margin-bottom:14px;"></div>
    <div style="font-size:13px;font-weight:700;color:${navy};margin-bottom:4px;">Document Title</div>
    <div style="width:60%;height:4px;background:#ddd;border-radius:1px;margin-bottom:6px;"></div>
    <div style="border-bottom:1px solid #e5e7eb;margin-bottom:12px;padding-bottom:6px;display:flex;gap:12px;">
      <div style="width:30px;height:3px;background:#ccc;border-radius:1px;"></div>
      <div style="width:25px;height:3px;background:#ccc;border-radius:1px;"></div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:14px;">
      <div style="flex:1;background:#f7f8fa;border:1px solid #e5e7eb;padding:6px 4px;text-align:center;border-radius:2px;">
        <div style="font-size:10px;font-weight:700;color:${navy};">45%</div>
        <div style="width:80%;height:2px;background:#ddd;margin:2px auto 0;border-radius:1px;"></div>
      </div>
      <div style="flex:1;background:#f7f8fa;border:1px solid #e5e7eb;padding:6px 4px;text-align:center;border-radius:2px;">
        <div style="font-size:10px;font-weight:700;color:${navy};">3x</div>
        <div style="width:80%;height:2px;background:#ddd;margin:2px auto 0;border-radius:1px;"></div>
      </div>
    </div>
    <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px;">
      <span style="font-size:6px;color:#9ca3af;">1.0</span>
      <span style="font-size:8px;color:${navy};font-weight:700;">Section Title</span>
    </div>
    <div style="height:1px;background:linear-gradient(to right,#d1d5db,transparent);margin-bottom:6px;"></div>
    <div style="width:100%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:90%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:95%;height:3px;background:#eee;border-radius:1px;"></div>
    <div style="position:absolute;bottom:8px;left:0;right:0;margin:0 20px;">
      <div style="border-top:1px solid ${navy};margin-bottom:1px;"></div>
      <div style="border-top:3px solid ${navy};padding-top:4px;display:flex;justify-content:space-between;font-size:5px;color:#9ca3af;">
        <span>Date</span><span>Page 1</span><span>Company</span>
      </div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style17ClassicBusiness: DocumentStyle = {
  id: 'style-17',
  name: 'Classic Business',
  category: 'corporate',
  description: 'Conservative and professional — serif headers, navy accent, Big 4 feel',
  keywords: ['classic', 'business', 'formal', 'serif', 'traditional', 'consulting'],
  render,
  thumbnail,
};

export default style17ClassicBusiness;
