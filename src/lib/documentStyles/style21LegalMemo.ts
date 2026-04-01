import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, formatMarkdown, brandLogoHtml, wrapDocument, lighten, darken, contrastText, hexToRgb, brandFonts, buildOnePagerDocument, professionalSymbolCSS, stripEmojis } from './shared';

// ── Roman numeral helper ──────────────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

function toRoman(n: number): string {
  return ROMAN[n - 1] || `${n}`;
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  if (input.contentType === 'solution-one-pager') return buildOnePagerDocument(input, brand);

  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const refNumber = `REF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const accent = brand.accent || brand.primary;

  const sectionsHtml = input.sections.map((s, i) => {
    const roman = toRoman(i + 1);
    const cleanContent = stripEmojis(s.content);
    const formatted = formatMarkdown(cleanContent);
    const cleanTitle = stripEmojis(s.title);

    // Extract footnote-style references from content (lines starting with [n])
    const footnotes: string[] = [];
    const bodyHtml = formatted.replace(/\[(\d+)\]\s*([^<]+)/g, (_match, num, text) => {
      footnotes.push(`<span class="fn-num">${num}</span> ${text.trim()}`);
      return `<sup class="fn-ref">${num}</sup>`;
    });

    return `<div class="section">
      <div class="section-rule"></div>
      <h2 class="section-heading"><span class="roman-num">${roman}.</span> ${cleanTitle}</h2>
      <div class="section-body">${bodyHtml}</div>
      ${footnotes.length > 0 ? `<div class="section-footnotes">
        <div class="fn-rule"></div>
        ${footnotes.map(f => `<div class="fn-item">${f}</div>`).join('')}
      </div>` : ''}
    </div>`;
  }).join('\n');

  const css = `
    ${brandCSSVars(brand)}
    ${professionalSymbolCSS(accent)}

    @page {
      size: letter;
      margin: 1in 1.25in;
      @bottom-center {
        content: "CONFIDENTIAL";
        font-size: 8px;
        color: #999;
        letter-spacing: 0.15em;
      }
      @bottom-right {
        content: counter(page);
        font-size: 9px;
        color: #666;
      }
    }

    @media print {
      body { margin: 0; }
      .page { padding: 0; max-width: none; }
      .section { page-break-inside: avoid; }
    }

    body {
      font-family: 'Times New Roman', 'Georgia', var(--brand-font-secondary), serif;
      font-size: 14px;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 2;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 60px 80px;
    }

    /* ── Firm Letterhead ── */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 8px;
    }
    .letterhead-logo {
      flex-shrink: 0;
    }
    .letterhead-info {
      text-align: right;
      font-size: 10px;
      color: #666;
      line-height: 1.7;
      letter-spacing: 0.03em;
      font-family: 'Times New Roman', Georgia, serif;
    }
    .letterhead-rule-thin {
      border: none;
      border-top: 0.5px solid #999;
      margin: 0 0 32px 0;
    }

    /* ── MEMORANDUM Header ── */
    .memo-title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: #1a1a1a;
      margin: 28px 0 24px 0;
      font-family: 'Times New Roman', Georgia, serif;
    }

    .memo-header {
      padding: 0;
      margin-bottom: 36px;
      font-size: 13px;
      line-height: 2.2;
      font-family: 'Times New Roman', Georgia, serif;
    }
    .memo-header .field {
      display: flex;
      border-bottom: 0.5px solid #ccc;
      padding: 2px 0;
    }
    .memo-header .field:last-child {
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 4px;
    }
    .memo-header .label {
      font-weight: 700;
      min-width: 90px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.08em;
      color: #1a1a1a;
      padding-top: 3px;
    }
    .memo-header .value {
      flex: 1;
      color: #333;
    }
    .memo-header .field-re .value {
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    /* ── Section Styling ── */
    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .section-rule {
      border: none;
      border-top: 0.5px solid #ccc;
      margin-bottom: 20px;
    }
    .section-heading {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      line-height: 1.4;
    }
    .roman-num {
      margin-right: 12px;
      font-weight: 400;
      letter-spacing: 0;
    }

    .section-body {
      text-indent: 2em;
      text-align: justify;
      hyphens: auto;
    }
    .section-body p {
      margin-bottom: 14px;
      text-indent: 2em;
      text-align: justify;
    }
    .section-body p:first-child {
      text-indent: 2em;
    }

    .section-body h1, .section-body h2, .section-body h3, .section-body h4 {
      font-family: 'Times New Roman', Georgia, serif;
      color: #1a1a1a;
      margin: 24px 0 10px;
      font-weight: 700;
      text-indent: 0;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .section-body h2 { font-size: 15px; }
    .section-body h3 { font-size: 14px; }
    .section-body h4 { font-size: 13px; font-style: italic; text-transform: none; }

    .section-body strong {
      font-weight: 700;
    }
    .section-body em {
      font-style: italic;
    }

    .section-body ul, .section-body ol {
      padding-left: 3em;
      margin: 14px 0;
      text-indent: 0;
    }
    .section-body li {
      margin-bottom: 6px;
      text-indent: 0;
      text-align: left;
    }
    .section-body ul {
      list-style: none;
    }
    .section-body ul li::before {
      content: '\\2014';
      position: absolute;
      margin-left: -1.5em;
      color: #666;
    }
    .section-body ul li {
      position: relative;
    }

    .section-body hr {
      border: none;
      border-top: 0.5px solid #ccc;
      margin: 24px 2em;
    }

    /* ── Tables (formal legal style) ── */
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
      text-indent: 0;
      line-height: 1.6;
    }
    .section-body th {
      background: transparent;
      font-weight: 700;
      text-align: left;
      padding: 8px 14px;
      border-top: 2px solid #1a1a1a;
      border-bottom: 1px solid #1a1a1a;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1a1a1a;
    }
    .section-body td {
      padding: 8px 14px;
      border-bottom: 0.5px solid #ccc;
      vertical-align: top;
    }
    .section-body tbody tr:last-child td {
      border-bottom: 2px solid #1a1a1a;
    }

    /* ── Footnotes ── */
    .section-footnotes {
      margin-top: 16px;
      padding-top: 0;
    }
    .fn-rule {
      width: 120px;
      border-top: 0.5px solid #999;
      margin-bottom: 10px;
    }
    .fn-item {
      font-size: 10px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 4px;
      text-indent: 0;
      padding-left: 16px;
      text-align: left;
    }
    .fn-num {
      font-weight: 700;
      margin-right: 4px;
      font-size: 9px;
      vertical-align: super;
    }
    .fn-ref {
      font-size: 9px;
      color: #666;
      cursor: default;
    }

    /* ── Stat Box (for data-heavy sections) ── */
    .stat-box-row {
      display: flex;
      gap: 20px;
      margin: 20px 0;
      text-indent: 0;
    }
    .stat-box {
      flex: 1;
      border: 1px solid #ccc;
      padding: 16px 20px;
      text-align: center;
    }
    .stat-box-value {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      font-family: 'Times New Roman', Georgia, serif;
      line-height: 1.2;
    }
    .stat-box-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 2px solid #1a1a1a;
    }
    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 9px;
      color: #888;
      line-height: 1.6;
      font-family: 'Times New Roman', Georgia, serif;
      letter-spacing: 0.02em;
    }
    .footer-thin-rule {
      border: none;
      border-top: 0.5px solid #999;
      margin: 4px 0 0 0;
    }
    .footer-confidential {
      text-align: center;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #aaa;
      margin-top: 12px;
    }
    .footer-ref {
      font-family: 'Courier New', monospace;
      letter-spacing: 0.05em;
      font-size: 8px;
    }
    .footer-page {
      text-align: right;
    }
  `;

  const body = `
    <div class="page">
      <!-- Firm Letterhead -->
      <div class="letterhead">
        <div class="letterhead-logo">${brandLogoHtml(input, 'height:36px;')}</div>
        <div class="letterhead-info">
          ${input.companyName}<br/>
          ${input.companyDescription ? input.companyDescription + '<br/>' : ''}
          ${dateStr}
        </div>
      </div>
      <hr class="letterhead-rule-thin"/>

      <!-- MEMORANDUM Title -->
      <div class="memo-title">Memorandum</div>

      <!-- Formal TO/FROM/RE/DATE Block -->
      <div class="memo-header">
        <div class="field">
          <span class="label">To:</span>
          <span class="value">${input.prospect.companyName}${input.prospect.industry ? ' (' + input.prospect.industry + ')' : ''}</span>
        </div>
        <div class="field">
          <span class="label">From:</span>
          <span class="value">${input.companyName}</span>
        </div>
        <div class="field">
          <span class="label">Date:</span>
          <span class="value">${dateStr}</span>
        </div>
        <div class="field field-re">
          <span class="label">Re:</span>
          <span class="value">${title}${input.prospect.companySize ? ' (' + input.prospect.companySize + ')' : ''}</span>
        </div>
      </div>

      <!-- Sections with Roman Numerals -->
      ${sectionsHtml}

      <!-- Footer -->
      <div class="footer">
        <div class="footer-inner">
          <div>
            ${input.companyName}<br/>
            ${dateStr}
          </div>
          <div class="footer-ref">${refNumber}</div>
          <div class="footer-page">
            Page 1
          </div>
        </div>
        <hr class="footer-thin-rule"/>
        <div class="footer-confidential">
          Privileged &amp; Confidential &mdash; Attorney Work Product
        </div>
      </div>
    </div>
  `;

  return wrapDocument({ title: `MEMORANDUM — ${title} — ${input.prospect.companyName}`, css, body, fonts: brandFonts(brand) });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fff;font-family:'Times New Roman',Georgia,serif;padding:20px 18px;box-sizing:border-box;position:relative;">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #1a1a1a;padding-bottom:8px;margin-bottom:4px;">
      <div style="width:40px;height:8px;background:${accentColor};border-radius:1px;"></div>
      <div style="width:30px;height:4px;background:#ccc;border-radius:1px;"></div>
    </div>
    <div style="border-bottom:0.5px solid #ccc;margin-bottom:10px;"></div>
    <div style="text-align:center;font-size:7px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:10px;color:#1a1a1a;">MEMORANDUM</div>
    <div style="margin-bottom:12px;font-size:6px;line-height:2;">
      <div style="display:flex;border-bottom:0.5px solid #ddd;"><span style="font-weight:700;width:25px;font-size:5px;text-transform:uppercase;">TO:</span><span style="flex:1;color:#555;"></span></div>
      <div style="display:flex;border-bottom:0.5px solid #ddd;"><span style="font-weight:700;width:25px;font-size:5px;text-transform:uppercase;">FROM:</span><span style="flex:1;color:#555;"></span></div>
      <div style="display:flex;border-bottom:0.5px solid #ddd;"><span style="font-weight:700;width:25px;font-size:5px;text-transform:uppercase;">DATE:</span><span style="flex:1;color:#555;"></span></div>
      <div style="display:flex;border-bottom:2px solid #1a1a1a;"><span style="font-weight:700;width:25px;font-size:5px;text-transform:uppercase;">RE:</span><span style="flex:1;color:#555;text-decoration:underline;"></span></div>
    </div>
    <div style="border-top:0.5px solid #ccc;padding-top:6px;margin-bottom:3px;">
      <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:#1a1a1a;margin-bottom:4px;"><span style="font-weight:400;margin-right:4px;">I.</span> Section Title</div>
      <div style="width:90%;height:3px;background:#eee;border-radius:1px;margin-bottom:2px;margin-left:12px;"></div>
      <div style="width:85%;height:3px;background:#eee;border-radius:1px;margin-bottom:2px;margin-left:12px;"></div>
      <div style="width:70%;height:3px;background:#eee;border-radius:1px;margin-left:12px;"></div>
    </div>
    <div style="position:absolute;bottom:8px;left:18px;right:18px;border-top:2px solid #1a1a1a;padding-top:4px;">
      <div style="text-align:center;font-size:4px;color:#aaa;letter-spacing:0.15em;text-transform:uppercase;">Privileged & Confidential</div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style21LegalMemo: DocumentStyle = {
  id: 'style-21',
  name: 'Legal Memo',
  category: 'corporate',
  description: 'Am Law 100 firm memorandum — Roman numerals, justified text, formal TO/FROM/RE layout',
  keywords: ['legal', 'memo', 'formal', 'numbered', 'paragraphs', 'law', 'attorney', 'confidential'],
  render,
  thumbnail,
};

export default style21LegalMemo;
