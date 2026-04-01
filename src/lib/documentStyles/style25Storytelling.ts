// ════════════════════════════════════════════════════════
// Style 25 — Storytelling
// Narrative arc structure — chapters, customer scenario,
// serif headings, journalist-written case study feel
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

// ── Chapter mapping ──────────────────────────────────────

const CHAPTER_TITLES = ['The Challenge', 'The Solution', 'The Results'];

function extractCustomerQuote(content: string): string | null {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const candidate = sentences.find(s => s.length > 30 && s.length < 200);
  return candidate || null;
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

  // Find a good pull quote from mid-document
  const midIdx = Math.floor(sections.length / 2);
  const customerQuote = extractCustomerQuote(
    sections[midIdx]?.content || sections[0]?.content || '',
  );

  const sectionsHtml = sections
    .map((s, i) => {
      const chapterLabel =
        CHAPTER_TITLES[i] || `Chapter ${String(i + 1).padStart(2, '0')}`;
      const chapterNum = String(i + 1).padStart(2, '0');

      const showQuote = i === midIdx && customerQuote;

      return `
      <div class="chapter">
        <div class="chapter-header">
          <span class="chapter-num">Chapter ${chapterNum}</span>
          <span class="chapter-dash">&mdash;</span>
          <span class="chapter-name">${s.title || chapterLabel}</span>
        </div>
        <div class="chapter-body">${formatMarkdown(s.content)}</div>
        ${
          showQuote
            ? `<div class="customer-callout">
                <div class="callout-mark">&ldquo;</div>
                <p class="callout-text">${customerQuote}</p>
                <p class="callout-attr">&mdash; ${prospect.companyName} stakeholder</p>
              </div>`
            : ''
        }
      </div>`;
    })
    .join('');

  const css = `
    ${brandCSSVars(brand)}

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #fff;
      line-height: 1.75;
      font-size: var(--brand-font-body-size);
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      padding: 64px 56px 48px;
    }

    /* ── Opening scene ── */
    .opening {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 48px;
      margin-bottom: 48px;
    }
    .opening-logo { margin-bottom: 32px; }
    .opening-scene {
      font-size: 20px;
      font-style: italic;
      color: #555;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .opening-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      color: #111;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .opening-byline {
      font-size: 14px;
      color: #888;
    }

    /* ── Chapter ── */
    .chapter {
      margin-bottom: 56px;
    }
    .chapter-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 20px;
    }
    .chapter-num {
      font-family: var(--brand-font-primary);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--brand-primary);
    }
    .chapter-dash { color: #ccc; }
    .chapter-name {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: #111;
    }

    /* ── Chapter body ── */
    .chapter-body {
      color: #333;
      line-height: 1.8;
    }
    .chapter-body h1, .chapter-body h2,
    .chapter-body h3, .chapter-body h4 {
      color: #111;
      margin: 20px 0 10px;
    }
    .chapter-body h1 { font-size: 20px; }
    .chapter-body h2 { font-size: 17px; }
    .chapter-body h3 { font-size: 15px; }
    .chapter-body ul, .chapter-body ol {
      padding-left: 24px;
      margin: 12px 0;
    }
    .chapter-body li { margin-bottom: 6px; }
    .chapter-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }
    .chapter-body th {
      background: ${lighten(brand.primary, 0.92)};
      font-weight: 600;
      padding: 10px 12px;
      border-bottom: 2px solid var(--brand-primary);
      text-align: left;
    }
    .chapter-body td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .chapter-body hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 20px 0;
    }
    .chapter-body strong { font-weight: 600; }
    .chapter-body em { font-style: italic; }

    /* ── Customer callout ── */
    .customer-callout {
      background: ${lighten(brand.primary, 0.94)};
      border-radius: 8px;
      padding: 32px 36px 28px;
      margin: 36px 0;
      position: relative;
    }
    .callout-mark {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 56px;
      color: var(--brand-primary);
      line-height: 1;
      opacity: 0.25;
      position: absolute;
      top: 12px;
      left: 20px;
    }
    .callout-text {
      font-size: 17px;
      font-style: italic;
      color: #333;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .callout-attr {
      font-size: 13px;
      font-weight: 600;
      color: var(--brand-primary);
    }

    /* ── Footer ── */
    .story-footer {
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #e0e0e0;
      padding-top: 24px;
      margin-top: 48px;
    }
  `;

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div class="page">
      <div class="opening">
        <div class="opening-logo">${brandLogoHtml(input)}</div>
        <p class="opening-scene">Imagine a ${prospect.industry || 'growing'} company facing a critical inflection point&hellip;</p>
        <h1 class="opening-title">${title}</h1>
        <p class="opening-byline">A story of transformation at ${prospect.companyName} &middot; ${dateStr}</p>
      </div>

      ${sectionsHtml}

      <div class="story-footer">
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
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="padding:10px 12px 8px;border-bottom:1px solid #eee;">
      <div style="width:30%;height:5px;background:#111;border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:55%;height:7px;background:#111;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:40%;height:4px;background:#999;border-radius:2px;"></div>
    </div>
    <div style="padding:6px 12px;">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
        <div style="font-size:7px;color:${accentColor};font-weight:700;">Ch 01</div>
        <div style="color:#ccc;">—</div>
        <div style="width:40%;height:5px;background:#222;border-radius:2px;"></div>
      </div>
      <div style="width:90%;height:3px;background:#ddd;border-radius:2px;margin-bottom:2px;"></div>
      <div style="width:75%;height:3px;background:#ddd;border-radius:2px;margin-bottom:5px;"></div>
      <div style="background:${accentColor}11;border-radius:4px;padding:5px 6px;margin-bottom:5px;">
        <div style="width:70%;height:3px;background:#bbb;border-radius:2px;margin-bottom:2px;"></div>
        <div style="width:50%;height:3px;background:${accentColor};border-radius:2px;opacity:0.5;"></div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <div style="font-size:7px;color:${accentColor};font-weight:700;">Ch 02</div>
        <div style="color:#ccc;">—</div>
        <div style="width:35%;height:5px;background:#222;border-radius:2px;"></div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;">Storytelling</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style25Storytelling: DocumentStyle = {
  id: 'style-25',
  name: 'Storytelling',
  category: 'creative',
  description: 'Narrative arc — customer scenario, solution, transformation chapters',
  keywords: ['story', 'narrative', 'chapters', 'case-study', 'journalism'],
  render,
  thumbnail,
};

export default style25Storytelling;
