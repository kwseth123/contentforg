import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument } from './shared';

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const sectionsHtml = input.sections.map((s, i) => {
    const num = `${i + 1}`;
    return `<div class="section">
      <h2 class="section-heading"><span class="section-num">${num}.</span> ${s.title}</h2>
      <div class="section-body">${formatMarkdown(s.content)}</div>
    </div>`;
  }).join('\n');

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary);
      font-size: var(--brand-font-body-size);
      color: var(--brand-text);
      background: var(--brand-background);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 48px;
    }
    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--brand-primary);
      color: #fff;
      padding: 20px 28px;
      margin-bottom: 32px;
    }
    .header-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
    }
    .header-meta {
      font-size: 12px;
      text-align: right;
      opacity: 0.85;
    }
    .doc-meta {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
      padding: 16px 20px;
      background: #f5f6f8;
      border: 1px solid #e0e0e0;
      font-size: 13px;
    }
    .doc-meta dt {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-bottom: 2px;
    }
    .doc-meta dd { margin: 0; font-weight: 500; }
    /* ── Sections ── */
    .section {
      margin-bottom: 32px;
    }
    .section-heading {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
      color: var(--brand-primary);
      margin-bottom: 16px;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--brand-primary);
    }
    .section-num {
      font-family: var(--brand-font-secondary), 'Courier New', monospace;
      opacity: 0.6;
      margin-right: 4px;
    }
    .section-body p { margin-bottom: 12px; }
    .section-body h1, .section-body h2, .section-body h3, .section-body h4 {
      color: var(--brand-primary);
      margin: 20px 0 8px;
      font-weight: 600;
    }
    .section-body h2 { font-size: var(--brand-font-h3-size); }
    .section-body h3 { font-size: 15px; }
    .section-body h4 { font-size: 13px; font-weight: 700; }
    .section-body strong { font-weight: 600; }
    .section-body ul, .section-body ol { padding-left: 20px; margin: 10px 0; }
    .section-body li { margin-bottom: 5px; }
    .section-body hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    /* ── Spec grids (3-column) ── */
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      font-family: var(--brand-font-secondary), 'Courier New', monospace;
    }
    .section-body th {
      background: #1e293b;
      color: #e2e8f0;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .section-body td {
      padding: 7px 12px;
      border: 1px solid #e2e8f0;
      font-variant-numeric: tabular-nums;
    }
    .section-body tr:nth-child(even) td {
      background: #f8fafc;
    }
    /* ── Code/mono styling ── */
    .section-body code,
    .section-body pre {
      font-family: var(--brand-font-secondary), 'Courier New', monospace;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 13px;
    }
    /* ── Box diagrams via CSS ── */
    .section-body blockquote {
      border: 2px solid var(--brand-primary);
      padding: 16px 20px;
      margin: 16px 0;
      position: relative;
      background: #f8fafc;
    }
    .section-body blockquote::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      width: 2px;
      height: 16px;
      background: var(--brand-primary);
    }
    /* ── Footer ── */
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 2px solid var(--brand-primary);
      font-size: 11px;
      color: #888;
      display: flex;
      justify-content: space-between;
    }
  `;

  const body = `
    <div class="page">
      <div class="header">
        <div>
          <div class="header-title">${title}</div>
        </div>
        <div class="header-meta">${brandLogoHtml(input, 'height:24px;filter:brightness(10);')}</div>
      </div>
      <div class="doc-meta">
        <div><dt>Prepared For</dt><dd>${input.prospect.companyName}</dd></div>
        <div><dt>Date</dt><dd>${dateStr}</dd></div>
        <div><dt>Version</dt><dd>1.0${input.prospect.industry ? ` | ${input.prospect.industry}` : ''}</dd></div>
      </div>
      ${sectionsHtml}
      <div class="footer">
        <span>${input.companyName} | ${dateStr} | Generated by ContentForg</span>
        <span>CONFIDENTIAL</span>
      </div>
    </div>
  `;

  return wrapDocument({ title: `${title} — ${input.prospect.companyName}`, css, body, fonts: brandFonts(brand) });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fff;font-family:monospace,sans-serif;padding:14px 12px;box-sizing:border-box;position:relative;">
    <div style="background:${accentColor};color:#fff;padding:8px 10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:9px;font-weight:700;">Technical Brief</div>
      <div style="width:20px;height:6px;background:rgba(255,255,255,0.4);border-radius:1px;"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;background:#f5f6f8;border:1px solid #e0e0e0;padding:6px 8px;margin-bottom:12px;">
      <div><div style="width:24px;height:3px;background:#aaa;border-radius:1px;margin-bottom:2px;"></div><div style="width:32px;height:4px;background:#555;border-radius:1px;"></div></div>
      <div><div style="width:16px;height:3px;background:#aaa;border-radius:1px;margin-bottom:2px;"></div><div style="width:28px;height:4px;background:#555;border-radius:1px;"></div></div>
      <div><div style="width:20px;height:3px;background:#aaa;border-radius:1px;margin-bottom:2px;"></div><div style="width:24px;height:4px;background:#555;border-radius:1px;"></div></div>
    </div>
    <div style="font-size:8px;font-weight:700;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:3px;margin-bottom:6px;">1. Section</div>
    <div style="width:100%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:88%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
    <div style="width:94%;height:3px;background:#eee;border-radius:1px;margin-bottom:10px;"></div>
    <div style="border:2px solid ${accentColor};padding:6px 8px;background:#f8fafc;margin-bottom:6px;">
      <div style="width:70%;height:3px;background:#ccc;border-radius:1px;"></div>
    </div>
    <div style="width:2px;height:8px;background:${accentColor};margin:0 auto;"></div>
    <div style="position:absolute;bottom:6px;left:12px;right:12px;border-top:2px solid ${accentColor};padding-top:3px;font-size:5px;color:#888;">Company | Date | ContentForg</div>
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
