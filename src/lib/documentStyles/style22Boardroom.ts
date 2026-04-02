import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, formatMarkdown, brandLogoHtml, wrapDocument, lighten, darken, contrastText, hexToRgb, brandFonts, buildOnePagerDocument, professionalSymbolCSS, stripEmojis } from './shared';

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const accent = brand.accent || '#c9a84c';
  const navy = brand.primary || '#0c1b33';
  const navyDark = darken(navy, 0.15);
  const navyLight = lighten(navy, 0.92);
  const gold = accent;
  const goldLight = lighten(gold, 0.85);
  const goldDark = darken(gold, 0.2);
  const textOnNavy = contrastText(navy);
  const { r: gr, g: gg, b: gb } = hexToRgb(gold);

  // Build executive summary from first section
  const execSummarySection = input.sections[0];
  const execSummaryContent = execSummarySection
    ? stripEmojis(execSummarySection.content).split(/\n\n/)[0] || stripEmojis(execSummarySection.content).substring(0, 300)
    : '';

  const filteredSections = input.sections.filter(s => s.title.trim() || s.content.trim());
  const sectionsHtml = filteredSections.map((s, i) => {
    const cleanContent = stripEmojis(s.content);
    const cleanTitle = stripEmojis(s.title);
    const formatted = formatMarkdown(cleanContent);

    // Detect action items / key decisions
    const isActionSection = /action|decision|next step|recommendation/i.test(cleanTitle);

    return `<div class="section${isActionSection ? ' section-action' : ''}">
      <div class="section-divider">
        <span class="section-divider-dot"></span>
        <span class="section-divider-line"></span>
        <span class="section-divider-dot"></span>
      </div>
      <h2 class="section-heading">${cleanTitle}</h2>
      <div class="section-body">${formatted}</div>
    </div>`;
  }).join('\n');

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(gold)}

    @page {
      size: letter;
      margin: 0.75in 1in;
      @bottom-left {
        content: "Board Meeting | ${dateStr}";
        font-size: 8px;
        color: #888;
        font-family: Georgia, serif;
      }
      @bottom-center {
        content: "STRICTLY CONFIDENTIAL";
        font-size: 7px;
        letter-spacing: 0.2em;
        color: #aaa;
      }
      @bottom-right {
        content: "Page " counter(page);
        font-size: 8px;
        color: #888;
        font-family: Georgia, serif;
      }
    }

    @media print {
      body { margin: 0; }
      .page { padding: 0; max-width: none; }
      .section { page-break-inside: avoid; }
    }

    body {
      font-family: 'Georgia', 'Times New Roman', var(--brand-font-secondary), serif;
      font-size: 14px;
      color: #2c2c2c;
      background: #ffffff;
      line-height: 1.75;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      width: 100%;
      max-width: 816px;
      margin: 0 auto;
      padding: 0;
      overflow-wrap: break-word;
    }

    /* ── Premium Header with Navy/Gold ── */
    .header {
      background: linear-gradient(135deg, ${navy} 0%, ${navyDark} 100%);
      color: ${textOnNavy};
      padding: 48px 56px 40px;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, ${gold}, ${lighten(gold, 0.3)}, ${gold});
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, ${gold}, ${lighten(gold, 0.3)}, ${gold});
    }
    .header-top {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(${gr},${gg},${gb},0.25);
    }
    .header-logo-wrap {
      text-align: center;
    }
    .header-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.01em;
      text-align: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3), 0 0 20px rgba(${gr},${gg},${gb},0.15);
    }
    .header-subtitle {
      text-align: center;
      font-size: 13px;
      opacity: 0.75;
      margin-top: 8px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .header-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(${gr},${gg},${gb},0.25);
      font-size: 11px;
      opacity: 0.7;
      letter-spacing: 0.03em;
    }

    /* ── Content Area ── */
    .content-area {
      padding: 40px 56px;
    }

    /* ── Executive Summary Box ── */
    .exec-summary {
      border: 2px solid ${gold};
      padding: 28px 32px;
      margin-bottom: 40px;
      position: relative;
      background: linear-gradient(135deg, ${goldLight} 0%, #ffffff 100%);
    }
    .exec-summary::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 24px;
      right: 24px;
      height: 2px;
      background: ${gold};
    }
    .exec-summary-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${goldDark};
      margin-bottom: 12px;
      font-family: 'Arial', 'Helvetica', sans-serif;
    }
    .exec-summary-text {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 16px;
      line-height: 1.7;
      color: ${navyDark};
      font-weight: 500;
    }

    /* ── Section Styling ── */
    .section {
      margin-bottom: 36px;
      page-break-inside: avoid;
    }
    .section-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .section-divider-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${gold};
    }
    .section-divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, ${gold}, ${lighten(gold, 0.6)}, transparent);
    }
    .section-heading {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: 700;
      color: ${navy};
      margin-bottom: 18px;
      line-height: 1.3;
      text-shadow: 0.5px 0.5px 0 rgba(0,0,0,0.05);
    }

    .section-body {
      overflow-wrap: break-word;
    }
    .section-body p {
      margin-bottom: 14px;
      line-height: 1.8;
    }
    .section-body h1, .section-body h2, .section-body h3, .section-body h4 {
      font-family: Georgia, 'Times New Roman', serif;
      color: ${navy};
      margin: 24px 0 10px;
      font-weight: 700;
    }
    .section-body h2 { font-size: 18px; }
    .section-body h3 { font-size: 16px; }
    .section-body h4 { font-size: 14px; font-style: italic; }
    .section-body strong { font-weight: 700; color: ${navyDark}; }

    .section-body ul, .section-body ol {
      padding-left: 24px;
      margin: 14px 0;
    }
    .section-body ul {
      list-style: none;
    }
    .section-body ul li {
      position: relative;
      padding-left: 18px;
      margin-bottom: 8px;
    }
    .section-body ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 7px;
      height: 7px;
      border: 1.5px solid ${gold};
      border-radius: 50%;
    }
    .section-body ol li { margin-bottom: 8px; }

    .section-body hr {
      border: none;
      height: 1px;
      background: linear-gradient(90deg, ${gold}, ${lighten(gold, 0.6)}, transparent);
      margin: 24px 0;
    }

    /* ── Action Items / Key Decisions (accent bg) ── */
    .section-action {
      background: linear-gradient(135deg, ${lighten(navy, 0.95)} 0%, ${lighten(gold, 0.92)} 100%);
      border: 1px solid ${lighten(gold, 0.7)};
      border-left: 4px solid ${gold};
      border-radius: 0;
      padding: 28px 32px;
    }
    .section-action .section-heading {
      color: ${navyDark};
    }
    .section-action .section-divider-dot {
      background: ${navy};
    }

    /* ── Stat Frames ── */
    .stat-row {
      display: flex;
      flex-wrap: nowrap;
      gap: 20px;
      margin: 24px 0;
    }
    .stat-frame {
      flex: 1;
      min-width: 0;
      border: 1.5px solid ${gold};
      padding: 20px 24px;
      text-align: center;
      background: #ffffff;
    }
    .stat-frame-value {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 700;
      color: ${navy};
      line-height: 1.2;
    }
    .stat-frame-label {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 6px;
      font-family: 'Arial', 'Helvetica', sans-serif;
    }

    /* ── Tables (premium) ── */
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .section-body th {
      background: ${navy};
      color: ${textOnNavy};
      font-weight: 600;
      text-align: left;
      padding: 10px 16px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-family: 'Arial', 'Helvetica', sans-serif;
    }
    .section-body td {
      padding: 10px 16px;
      border-bottom: 1px solid #e8e8e8;
      vertical-align: top;
    }
    .section-body tbody tr:nth-child(even) td {
      background: ${lighten(navy, 0.97)};
    }
    .section-body tbody tr:hover td {
      background: ${goldLight};
    }

    /* ── Margin Notes ── */
    .margin-note {
      float: right;
      width: 160px;
      margin-left: 24px;
      margin-bottom: 12px;
      padding: 12px 16px;
      background: ${lighten(navy, 0.95)};
      border-left: 2px solid ${gold};
      font-size: 11px;
      color: #666;
      line-height: 1.5;
      font-family: 'Arial', 'Helvetica', sans-serif;
    }

    /* ── Footer ── */
    .footer {
      background: ${navy};
      color: ${textOnNavy};
      padding: 20px 56px;
      margin-top: 40px;
    }
    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      opacity: 0.8;
    }
    .footer-confidential {
      text-align: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid rgba(${gr},${gg},${gb},0.3);
      font-size: 8px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: ${gold};
    }
  `;

  const body = `
    <div class="page">
      <!-- Premium Header -->
      <div class="header">
        <div class="header-top">
          <div class="header-logo-wrap">${brandLogoHtml(input, 'height:44px;filter:brightness(0) invert(1);')}</div>
        </div>
        <div class="header-title">${title}</div>
        <div class="header-subtitle">Prepared for ${input.prospect.companyName}</div>
        <div class="header-meta">
          <span>${input.companyName}</span>
          <span>${dateStr}</span>
          <span>${input.prospect.industry || 'Board Package'}</span>
        </div>
      </div>

      <div class="content-area">
        <!-- Executive Summary -->
        <div class="exec-summary">
          <div class="exec-summary-label">Executive Summary</div>
          <div class="exec-summary-text">${formatMarkdown(execSummaryContent)}</div>
        </div>

        <!-- Sections -->
        ${sectionsHtml}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-inner">
          <span>${input.companyName}</span>
          <span>Board Meeting | ${dateStr}</span>
          <span>Page 1</span>
        </div>
        <div class="footer-confidential">Strictly Confidential &mdash; Board of Directors Only</div>
      </div>
    </div>
  `;

  return wrapDocument({ title: `${title} — Board Package — ${input.prospect.companyName}`, css, body, fonts: ['Georgia', ...brandFonts(brand)] });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const navy = '#0c1b33';
  const gold = accentColor;
  const textOnNavy = '#ffffff';
  return `<div style="width:100%;height:100%;background:#fff;font-family:Georgia,serif;padding:0;box-sizing:border-box;position:relative;overflow:hidden;">
    <div style="background:${navy};color:${textOnNavy};padding:12px 14px 10px;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${gold};"></div>
      <div style="text-align:center;margin-bottom:6px;">
        <div style="width:24px;height:6px;background:${gold};border-radius:1px;margin:0 auto 6px;"></div>
      </div>
      <div style="font-size:8px;font-weight:700;text-align:center;text-shadow:0.5px 0.5px 1px rgba(0,0,0,0.3);">Board Package</div>
      <div style="font-size:5px;text-align:center;opacity:0.7;margin-top:2px;letter-spacing:0.1em;text-transform:uppercase;">Prepared for Client</div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:${gold};"></div>
    </div>
    <div style="padding:8px 14px;">
      <div style="border:1.5px solid ${gold};padding:6px 8px;margin-bottom:10px;background:linear-gradient(135deg,${lighten(gold, 0.9)},#fff);">
        <div style="font-size:5px;color:${darken(gold, 0.3)};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;font-family:sans-serif;">Executive Summary</div>
        <div style="width:90%;height:3px;background:#ddd;border-radius:1px;margin-bottom:2px;"></div>
        <div style="width:75%;height:3px;background:#ddd;border-radius:1px;"></div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">
        <div style="width:4px;height:4px;border-radius:50%;background:${gold};"></div>
        <div style="flex:1;height:0.5px;background:${gold};"></div>
        <div style="width:4px;height:4px;border-radius:50%;background:${gold};"></div>
      </div>
      <div style="font-size:7px;font-weight:700;color:${navy};margin-bottom:4px;">Section Title</div>
      <div style="width:85%;height:2px;background:#eee;border-radius:1px;margin-bottom:2px;"></div>
      <div style="width:70%;height:2px;background:#eee;border-radius:1px;"></div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;background:${navy};color:${textOnNavy};padding:4px 14px;">
      <div style="display:flex;justify-content:space-between;font-size:4px;opacity:0.7;">
        <span>Company</span><span>Board Meeting</span><span>Page 1</span>
      </div>
      <div style="text-align:center;font-size:3px;color:${gold};letter-spacing:0.15em;text-transform:uppercase;margin-top:2px;">Strictly Confidential</div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style22Boardroom: DocumentStyle = {
  id: 'style-22',
  name: 'Boardroom',
  category: 'corporate',
  description: 'Goldman Sachs board deck — navy/gold luxury, embossed headings, executive summary, confidential',
  keywords: ['boardroom', 'board', 'executive', 'premium', 'leave-behind', 'goldman', 'luxury', 'confidential'],
  render,
  thumbnail,
};

export default style22Boardroom;
