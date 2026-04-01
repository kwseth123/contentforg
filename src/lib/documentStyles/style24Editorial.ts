// ════════════════════════════════════════════════════════
// Style 24 — Editorial
// Premium magazine editorial — italic pull quotes, narrow
// justified columns, decorative section numbers, HBR feel
// ════════════════════════════════════════════════════════

import type { DocumentStyle, StyleInput } from './types';
import {
  resolveBrand,
  brandCSSVars,
  brandFonts,
  brandLogoHtml,
  formatMarkdown,
  wrapDocument,
  lighten,
} from './shared';

// ── Pull-quote extraction ──────────────────────────────────

function extractPullQuote(content: string): string | null {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const candidate = sentences.find(
    s => s.length > 40 && s.length < 180 && /\d/.test(s),
  );
  return candidate || (sentences.length > 2 ? sentences[1] : null);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
  const dateStr =
    date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const sectionsHtml = sections
    .map((s, i) => {
      const pullQuote = extractPullQuote(s.content);
      const pullQuoteHtml = pullQuote
        ? `<blockquote class="pull-quote">${pullQuote}</blockquote>`
        : '';

      return `
      <div class="ed-section">
        <span class="section-number">${String(i + 1).padStart(2, '0')}</span>
        <h2 class="section-heading">${s.title}</h2>
        ${pullQuoteHtml}
        <div class="section-body">${formatMarkdown(s.content)}</div>
      </div>`;
    })
    .join('');

  const css = `
    ${brandCSSVars(brand)}

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #fafafa;
      line-height: 1.75;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }

    /* ── Page shell ── */
    .page {
      max-width: 740px;
      margin: 0 auto;
      padding: 72px 48px 48px;
    }

    /* ── Masthead ── */
    .masthead {
      text-align: center;
      border-bottom: 1px solid #d4d4d4;
      padding-bottom: 40px;
      margin-bottom: 48px;
    }
    .masthead-logo { margin-bottom: 24px; }
    .masthead-rule {
      width: 48px;
      height: 2px;
      background: var(--brand-primary);
      margin: 0 auto 20px;
    }
    .masthead-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      line-height: 1.15;
      color: #111;
      margin-bottom: 8px;
    }
    .masthead-sub {
      font-size: 15px;
      font-style: italic;
      color: #666;
    }

    /* ── Section ── */
    .ed-section {
      position: relative;
      max-width: 560px;
      margin: 0 auto 56px;
      text-align: justify;
    }
    .section-number {
      position: absolute;
      top: -20px;
      left: -24px;
      font-size: 120px;
      font-weight: 700;
      color: #000;
      opacity: 0.06;
      line-height: 1;
      pointer-events: none;
      font-family: var(--brand-font-primary);
    }
    .section-heading {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: #111;
      margin-bottom: 20px;
      text-align: left;
      letter-spacing: -0.01em;
    }

    /* ── Pull quote ── */
    .pull-quote {
      border-left: 2px solid var(--brand-accent);
      padding: 12px 0 12px 24px;
      margin: 32px 0;
      font-size: 18px;
      font-style: italic;
      color: #333;
      line-height: 1.55;
    }

    /* ── Body prose ── */
    .section-body {
      color: #333;
      line-height: 1.8;
    }
    .section-body h1,
    .section-body h2,
    .section-body h3,
    .section-body h4 {
      text-align: left;
      color: #111;
      margin: 24px 0 10px;
    }
    .section-body h1 { font-size: 20px; }
    .section-body h2 { font-size: 17px; }
    .section-body h3 { font-size: 15px; font-style: italic; }
    .section-body ul, .section-body ol {
      text-align: left;
      padding-left: 24px;
      margin: 12px 0;
    }
    .section-body li { margin-bottom: 6px; }
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
      text-align: left;
    }
    .section-body th {
      background: ${lighten(brand.primary, 0.92)};
      font-weight: 600;
      padding: 10px 12px;
      border-bottom: 2px solid var(--brand-primary);
    }
    .section-body td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section-body hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 24px 0;
    }
    .section-body strong { font-weight: 600; }
    .section-body em { font-style: italic; }

    /* ── Caption utility ── */
    .img-caption {
      font-size: 12px;
      font-style: italic;
      color: #888;
      margin-top: 4px;
    }

    /* ── Footer ── */
    .ed-footer {
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #d4d4d4;
      padding-top: 24px;
      margin-top: 48px;
    }
  `;

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div class="page">
      <div class="masthead">
        <div class="masthead-logo">${brandLogoHtml(input)}</div>
        <div class="masthead-rule"></div>
        <h1 class="masthead-title">${title}</h1>
        <div class="masthead-sub">Prepared for ${prospect.companyName}</div>
      </div>

      ${sectionsHtml}

      <div class="ed-footer">
        ${companyName} | ${dateStr} | Generated by ContentForg
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fafafa;border-radius:6px;overflow:hidden;font-family:Georgia,serif;position:relative;">
    <div style="text-align:center;padding:12px 10px 8px;">
      <div style="width:30px;height:2px;background:${accentColor};margin:0 auto 6px;"></div>
      <div style="width:55%;height:7px;background:#111;border-radius:2px;margin:0 auto 3px;"></div>
      <div style="width:35%;height:5px;background:#999;border-radius:2px;margin:0 auto;font-style:italic;"></div>
    </div>
    <div style="max-width:70%;margin:0 auto;padding:4px 0;">
      <div style="position:relative;">
        <span style="position:absolute;top:-4px;left:-8px;font-size:28px;color:#000;opacity:0.06;font-weight:700;">01</span>
        <div style="width:45%;height:5px;background:#222;border-radius:2px;margin-bottom:5px;"></div>
      </div>
      <div style="border-left:2px solid ${accentColor};padding-left:6px;margin:5px 0;">
        <div style="width:80%;height:3px;background:#ccc;border-radius:2px;margin-bottom:2px;"></div>
        <div style="width:65%;height:3px;background:#ccc;border-radius:2px;"></div>
      </div>
      <div style="width:90%;height:3px;background:#ddd;border-radius:2px;margin:3px 0;"></div>
      <div style="width:75%;height:3px;background:#ddd;border-radius:2px;margin:3px 0;"></div>
      <div style="width:85%;height:3px;background:#ddd;border-radius:2px;margin:3px 0;"></div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;">Editorial</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style24Editorial: DocumentStyle = {
  id: 'style-24',
  name: 'Editorial',
  category: 'creative',
  description: 'Premium magazine editorial — italic pull quotes, narrow columns, HBR feel',
  keywords: ['editorial', 'magazine', 'pull-quotes', 'columns', 'hbr', 'premium'],
  render,
  thumbnail,
};

export default style24Editorial;
