import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, lighten, darken, contrastText, hexToRgb } from './shared';

// ── Pull quote extraction ───────────────────────────────────

function extractPullQuote(content: string): string | null {
  // Look for sentences with strong/impactful language
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 30 && s.length < 150);
  // Prefer sentences with numbers or strong words
  const ranked = sentences.map(s => {
    let score = 0;
    if (/\d+%/.test(s)) score += 3;
    if (/\$[\d,.]+/.test(s)) score += 3;
    if (/\d+x/i.test(s)) score += 2;
    if (/transform|increase|improve|grow|boost|accelerat|driv|enabl|achiev/i.test(s)) score += 2;
    return { text: s, score };
  }).sort((a, b) => b.score - a.score);
  return ranked.length > 0 && ranked[0].score > 0 ? ranked[0].text : null;
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, logoBase64, prospectLogoBase64, date } = input;
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accentLight = lighten(brand.primary, 0.92);

  // Build section HTML with alternating layouts
  const sectionsHtml = sections.map((s, i) => {
    const pullQuote = i > 0 ? extractPullQuote(s.content) : null;

    if (i === 0) {
      // First section: full width intro
      return `<div class="section section-full">
        <div class="section-body">${formatMarkdown(s.content)}</div>
      </div>
      <hr class="divider"/>`;
    }

    const isEven = i % 2 === 0;
    // Alternating asymmetric columns
    return `<hr class="divider"/>
    <div class="section section-grid ${isEven ? 'grid-narrow-left' : 'grid-wide-left'}">
      <div class="col-narrow">
        <h3 class="section-heading">${s.title}</h3>
        ${pullQuote ? `<blockquote class="pull-quote">${pullQuote}</blockquote>` : ''}
      </div>
      <div class="col-wide">
        <div class="section-body">${formatMarkdown(s.content)}</div>
      </div>
    </div>`;
  }).join('\n  ');

  const css = `
  ${brandCSSVars(brand)}
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--brand-font-primary); color: #222; background: #fff; line-height: 1.7; -webkit-font-smoothing: antialiased; font-size: var(--brand-font-body-size); }
  .page { max-width: 960px; margin: 0 auto; padding: 60px 48px 48px; }

  /* Header */
  .header { margin-bottom: 48px; }
  .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; }
  .logos { display: flex; align-items: center; gap: 14px; }
  .logos img { height: 30px; width: auto; object-fit: contain; }
  .logos .sep { width: 1px; height: 22px; background: #ddd; }
  .header-meta { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; }
  .headline { font-family: var(--brand-font-secondary); font-size: var(--brand-font-h1-size); font-weight: 900; color: #111; line-height: 1.15; margin-bottom: 16px; }
  .subline { font-size: 18px; color: #666; font-weight: 300; line-height: 1.5; max-width: 70%; }

  /* Dividers */
  .divider { border: none; border-top: 1px solid #e0e0e0; margin: 40px 0; }

  /* Full-width section */
  .section-full .section-body { columns: 2; column-gap: 40px; }
  .section-full .section-body p { break-inside: avoid; }

  /* Grid sections */
  .section-grid { display: grid; gap: 40px; }
  .grid-narrow-left { grid-template-columns: 280px 1fr; }
  .grid-wide-left { grid-template-columns: 1fr 320px; }
  .grid-wide-left .col-narrow { order: 2; }
  .grid-wide-left .col-wide { order: 1; }

  .section-heading { font-family: var(--brand-font-secondary); font-size: var(--brand-font-h2-size); font-weight: 700; color: #111; margin-bottom: 16px; line-height: 1.3; }

  /* Pull quotes */
  .pull-quote { font-family: var(--brand-font-secondary); font-size: 20px; font-style: italic; color: #444; line-height: 1.45; padding: 20px 0 20px 20px; border-left: 3px solid var(--brand-primary); margin-top: 24px; }

  /* Section body typography */
  .section-body p { margin-bottom: 14px; }
  .section-body h1, .section-body h2 { font-family: var(--brand-font-secondary); font-weight: 700; color: #111; margin: 24px 0 10px; }
  .section-body h2 { font-size: var(--brand-font-h2-size); }
  .section-body h3 { font-size: var(--brand-font-h3-size); font-weight: 600; color: #222; margin: 20px 0 8px; }
  .section-body h4 { font-size: 14px; font-weight: 600; color: #444; margin: 16px 0 6px; }
  .section-body strong { font-weight: 600; }
  .section-body ul, .section-body ol { padding-left: 20px; margin: 12px 0; }
  .section-body li { margin-bottom: 6px; font-size: 14px; }
  .section-body hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .section-body table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; }
  .section-body th { text-align: left; padding: 10px 12px; background: ${accentLight}; font-weight: 600; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: ${darken(brand.primary, 0.2)}; }
  .section-body td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }

  /* Footer */
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; font-size: 11px; color: #bbb; }`;

  const body = `<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="logos">
        ${logoBase64 ? `<img src="${logoBase64}" alt="${companyName}"/>` : ''}
        ${logoBase64 && prospectLogoBase64 ? '<div class="sep"></div>' : ''}
        ${prospectLogoBase64 ? `<img src="${prospectLogoBase64}" alt="${prospect.companyName}"/>` : ''}
      </div>
      <div class="header-meta">${dateStr}</div>
    </div>
    <h1 class="headline">${contentType} for<br/>${prospect.companyName}</h1>
    ${prospect.industry ? `<p class="subline">${prospect.industry}${prospect.companySize ? ` &middot; ${prospect.companySize}` : ''}</p>` : ''}
  </div>
  <hr class="divider"/>
  ${sectionsHtml}
  <div class="footer">
    <span>${companyName} &nbsp;|&nbsp; Generated by ContentForg</span>
    <span>${dateStr}</span>
  </div>
</div>`;

  return wrapDocument({
    title: `${contentType} — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:1000px;height:1294px;background:#fff;font-family:Georgia,serif;padding:60px 48px;box-sizing:border-box;">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;">
    <div style="display:flex;gap:12px;align-items:center;">
      <div style="width:40px;height:10px;background:#ddd;border-radius:2px;"></div>
      <div style="width:1px;height:18px;background:#ddd;"></div>
      <div style="width:36px;height:10px;background:#ddd;border-radius:2px;"></div>
    </div>
    <div style="font-size:9px;color:#bbb;text-transform:uppercase;letter-spacing:0.06em;">March 2026</div>
  </div>
  <div style="font-size:36px;font-weight:900;color:#111;line-height:1.15;margin-bottom:12px;">Magazine-Style<br/>Document Title</div>
  <div style="font-size:14px;color:#888;margin-bottom:32px;">Technology &middot; Enterprise</div>
  <div style="height:1px;background:#e0e0e0;margin-bottom:28px;"></div>
  <div style="columns:2;column-gap:32px;margin-bottom:28px;">
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:92%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:88%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:95%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:90%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:85%;margin-bottom:7px;"></div>
  </div>
  <div style="height:1px;background:#e0e0e0;margin-bottom:28px;"></div>
  <div style="display:grid;grid-template-columns:240px 1fr;gap:32px;">
    <div>
      <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:12px;">Section</div>
      <div style="font-size:16px;font-style:italic;color:#444;padding-left:16px;border-left:3px solid ${accentColor};line-height:1.4;">A pull quote excerpt here</div>
    </div>
    <div>
      <div style="height:8px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:7px;"></div>
      <div style="height:8px;background:#f0f0f0;border-radius:2px;width:93%;margin-bottom:7px;"></div>
      <div style="height:8px;background:#f0f0f0;border-radius:2px;width:88%;margin-bottom:7px;"></div>
      <div style="height:8px;background:#f0f0f0;border-radius:2px;width:96%;margin-bottom:7px;"></div>
    </div>
  </div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style03MagazineGrid: DocumentStyle = {
  id: 'style-03',
  name: 'Magazine Grid',
  category: 'clean',
  description: 'Editorial magazine layout with asymmetric columns and pull quotes',
  keywords: ['magazine', 'editorial', 'grid', 'columns', 'pull-quote', 'asymmetric', 'elegant'],
  render,
  thumbnail,
};

export default style03MagazineGrid;
