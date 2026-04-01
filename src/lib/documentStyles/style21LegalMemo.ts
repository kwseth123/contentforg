import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument } from './shared';

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = input.contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const refNumber = `REF-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const sectionsHtml = input.sections.map((s, i) => {
    // Convert content to numbered paragraphs
    const formatted = formatMarkdown(s.content);
    let paraNum = 0;
    const numbered = formatted.replace(/<p>/g, () => {
      paraNum++;
      return `<p><span class="para-num">${i + 1}.${paraNum}</span>`;
    });

    return `<div class="section">
      <h2 class="section-heading">${s.title}</h2>
      <div class="section-body">${numbered}</div>
    </div>`;
  }).join('\n');

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary);
      font-size: var(--brand-font-body-size);
      color: var(--brand-text);
      background: var(--brand-background);
      line-height: 1.75;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 60px 72px;
    }
    /* ── Letterhead ── */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--brand-primary);
    }
    .letterhead-info {
      font-size: 11px;
      color: #888;
      text-align: right;
      line-height: 1.6;
    }
    /* ── Memo header ── */
    .memo-header {
      border: 1px solid #ccc;
      padding: 20px 24px;
      margin-bottom: 36px;
      font-size: 14px;
      line-height: 2;
    }
    .memo-header .field {
      display: flex;
    }
    .memo-header .label {
      font-weight: 700;
      min-width: 80px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.06em;
      padding-top: 2px;
      color: var(--brand-primary);
    }
    .memo-header .value {
      flex: 1;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 2px;
    }
    .memo-header .re .value {
      font-weight: 700;
    }
    /* ── Sections ── */
    .section {
      margin-bottom: 28px;
    }
    .section-heading {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
      color: var(--brand-text);
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .section-body p {
      margin-bottom: 12px;
      text-align: justify;
    }
    .para-num {
      display: inline-block;
      width: 40px;
      font-size: 11px;
      font-weight: 600;
      color: #999;
      margin-right: 8px;
      font-variant-numeric: tabular-nums;
    }
    .section-body h1, .section-body h2, .section-body h3, .section-body h4 {
      color: var(--brand-text);
      margin: 20px 0 8px;
      font-weight: 700;
    }
    .section-body h2 { font-size: var(--brand-font-h3-size); }
    .section-body h3 { font-size: 15px; }
    .section-body h4 { font-size: 14px; }
    .section-body strong {
      font-weight: 700;
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 2px;
    }
    .section-body ul, .section-body ol { padding-left: 56px; margin: 10px 0; }
    .section-body li { margin-bottom: 6px; }
    .section-body hr { border: none; border-top: 1px solid #ccc; margin: 24px 0; }
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }
    .section-body th {
      background: #f5f5f5;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #ccc;
      font-size: 12px;
    }
    .section-body td {
      padding: 8px 12px;
      border: 1px solid #ccc;
    }
    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      padding-top: 12px;
      border-top: 2px solid var(--brand-primary);
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #999;
    }
    .footer .ref {
      font-family: var(--brand-font-secondary), 'Courier New', monospace;
      letter-spacing: 0.05em;
    }
  `;

  const body = `
    <div class="page">
      <div class="letterhead">
        <div>${brandLogoHtml(input, 'height:32px;')}</div>
        <div class="letterhead-info">
          ${input.companyName}<br/>
          ${dateStr}
        </div>
      </div>
      <div class="memo-header">
        <div class="field"><span class="label">To:</span><span class="value">${input.prospect.companyName}</span></div>
        <div class="field"><span class="label">From:</span><span class="value">${input.companyName}</span></div>
        <div class="field"><span class="label">Date:</span><span class="value">${dateStr}</span></div>
        <div class="field re"><span class="label">Re:</span><span class="value">${title}${input.prospect.industry ? ` — ${input.prospect.industry}` : ''}</span></div>
      </div>
      ${sectionsHtml}
      <div class="footer">
        <span>${input.companyName} | ${dateStr} | Generated by ContentForg</span>
        <span class="ref">${refNumber}</span>
      </div>
    </div>
  `;

  return wrapDocument({ title: `${title} — ${input.prospect.companyName}`, css, body, fonts: brandFonts(brand) });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fff;font-family:sans-serif;padding:20px 18px;box-sizing:border-box;position:relative;">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid ${accentColor};padding-bottom:8px;margin-bottom:12px;">
      <div style="width:40px;height:8px;background:${accentColor};border-radius:1px;"></div>
      <div style="width:30px;height:4px;background:#ccc;border-radius:1px;"></div>
    </div>
    <div style="border:1px solid #ccc;padding:8px 10px;margin-bottom:14px;font-size:7px;line-height:2;">
      <div style="display:flex;"><span style="font-weight:700;color:${accentColor};width:30px;font-size:6px;text-transform:uppercase;">TO:</span><span style="flex:1;border-bottom:1px solid #e5e5e5;"></span></div>
      <div style="display:flex;"><span style="font-weight:700;color:${accentColor};width:30px;font-size:6px;text-transform:uppercase;">FROM:</span><span style="flex:1;border-bottom:1px solid #e5e5e5;"></span></div>
      <div style="display:flex;"><span style="font-weight:700;color:${accentColor};width:30px;font-size:6px;text-transform:uppercase;">RE:</span><span style="flex:1;border-bottom:1px solid #e5e5e5;"></span></div>
    </div>
    <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#333;margin-bottom:6px;">Section Title</div>
    <div style="display:flex;gap:4px;margin-bottom:3px;"><span style="font-size:6px;color:#999;width:16px;">1.1</span><div style="flex:1;height:3px;background:#eee;border-radius:1px;margin-top:2px;"></div></div>
    <div style="display:flex;gap:4px;margin-bottom:3px;"><span style="font-size:6px;color:#999;width:16px;">1.2</span><div style="flex:1;height:3px;background:#eee;border-radius:1px;margin-top:2px;"></div></div>
    <div style="display:flex;gap:4px;margin-bottom:3px;"><span style="font-size:6px;color:#999;width:16px;">1.3</span><div style="flex:1;height:3px;background:#eee;border-radius:1px;margin-top:2px;"></div></div>
    <div style="position:absolute;bottom:8px;left:18px;right:18px;border-top:2px solid ${accentColor};padding-top:4px;display:flex;justify-content:space-between;font-size:5px;color:#aaa;">
      <span>Company | Date | ContentForg</span><span style="font-family:monospace;">REF-ABC123</span>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style21LegalMemo: DocumentStyle = {
  id: 'style-21',
  name: 'Legal Memo',
  category: 'corporate',
  description: 'Formal memo format — To/From/Re header, numbered paragraphs',
  keywords: ['legal', 'memo', 'formal', 'numbered', 'paragraphs', 'communication'],
  render,
  thumbnail,
};

export default style21LegalMemo;
