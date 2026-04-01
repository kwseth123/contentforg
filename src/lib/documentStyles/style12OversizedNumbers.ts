import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, hexToRgb } from './shared';

// ── Number extraction ───────────────────────────────────────

function extractNumbers(text: string): string[] {
  const numbers: string[] = [];
  // Percentages
  const pcts = text.match(/\d{1,4}(?:\.\d+)?%/g);
  if (pcts) numbers.push(...pcts.slice(0, 3));
  // Dollar amounts
  const dollars = text.match(/\$[\d,.]+[KkMmBb]?/g);
  if (dollars) numbers.push(...dollars.slice(0, 2));
  // Multipliers
  const mults = text.match(/\d+(?:\.\d+)?[xX]\b/g);
  if (mults) numbers.push(...mults.slice(0, 2));
  // Plain large numbers (1000+)
  const plains = text.match(/\b\d{4,}\b/g);
  if (plains) numbers.push(...plains.slice(0, 1));
  return [...new Set(numbers)];
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const { r, g, b } = hexToRgb(brand.primary);

  const allNumbers = extractNumbers(sections.map(s => s.content).join('\n'));

  const sectionsHtml = sections.map((s, i) => {
    const watermarkNum = allNumbers[i % allNumbers.length] || '';
    return `
    <div class="section">
      ${watermarkNum ? `<div class="watermark-number">${watermarkNum}</div>` : ''}
      <h2 class="section-title">${s.title}</h2>
      <div class="section-content">${formatMarkdown(s.content)}</div>
    </div>`;
  }).join('');

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #FFFFFF;
      line-height: 1.7;
      font-size: var(--brand-font-body-size);
    }
    .page { max-width: 880px; margin: 0 auto; padding: 64px 56px; }
    .header { margin-bottom: 48px; padding-bottom: 32px; border-bottom: 2px solid #f0f0f0; }
    .logo-row { margin-bottom: 32px; }
    .meta-label {
      font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
      text-transform: uppercase; color: #999; margin-bottom: 10px;
    }
    .headline {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700; color: #111;
      line-height: 1.15; margin-bottom: 8px;
    }
    .subtitle { font-size: 15px; color: #777; }
    .section {
      position: relative; overflow: hidden;
      margin-bottom: 48px; padding: 32px 0;
      border-bottom: 1px solid #f0f0f0;
      min-height: 120px;
    }
    .section:last-of-type { border-bottom: none; }
    .watermark-number {
      position: absolute; top: -10px; right: -10px;
      font-family: var(--brand-font-primary);
      font-size: 96px; font-weight: 800;
      color: rgba(${r},${g},${b},0.08);
      line-height: 1; pointer-events: none;
      z-index: 0; white-space: nowrap;
      user-select: none;
    }
    .section-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600; color: var(--brand-primary);
      margin-bottom: 14px; position: relative; z-index: 1;
    }
    .section-content { position: relative; z-index: 1; }
    .section-content p { margin-bottom: 14px; }
    .section-content h1, .section-content h2 {
      font-family: var(--brand-font-primary);
      color: #111; margin: 24px 0 10px;
      font-size: var(--brand-font-h2-size);
    }
    .section-content h3 {
      font-family: var(--brand-font-primary);
      color: #333; margin: 18px 0 8px;
      font-size: var(--brand-font-h3-size);
    }
    .section-content h4 { color: #555; margin: 14px 0 6px; font-size: 14px; font-weight: 600; }
    .section-content strong { font-weight: 600; color: #111; }
    .section-content ul, .section-content ol { padding-left: 24px; margin: 10px 0; }
    .section-content li { margin-bottom: 6px; }
    .section-content li::marker { color: var(--brand-primary); }
    .section-content hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .section-content table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
    .section-content th {
      text-align: left; padding: 10px 12px;
      border-bottom: 2px solid var(--brand-primary);
      font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--brand-primary);
    }
    .section-content td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .hero-numbers {
      display: flex; gap: 32px; flex-wrap: wrap;
      margin-bottom: 40px; padding: 24px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .hero-num {
      font-family: var(--brand-font-primary);
      font-size: 48px; font-weight: 800;
      color: var(--brand-primary); opacity: 0.85;
      line-height: 1;
    }
    .footer {
      margin-top: 48px; padding-top: 24px;
      border-top: 2px solid #f0f0f0;
      font-size: 11px; color: #bbb;
      text-align: center; letter-spacing: 0.03em;
    }
  `;

  const heroNumbersHtml = allNumbers.length > 0
    ? `<div class="hero-numbers">${allNumbers.slice(0, 4).map(n => `<div class="hero-num">${n}</div>`).join('')}</div>`
    : '';

  const body = `
    <div class="page">
      <div class="header">
        <div class="logo-row">${brandLogoHtml(input, 'height:36px;')}</div>
        <div class="meta-label">${contentType.replace(/-/g, ' ')}${prospect.industry ? ` &mdash; ${prospect.industry}` : ''}</div>
        <h1 class="headline">${contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} for ${prospect.companyName}</h1>
        <div class="subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ` &middot; ${prospect.companySize}` : ''}</div>
      </div>
      ${heroNumbersHtml}
      ${sectionsHtml}
      <div class="footer">${companyName} &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Generated by ContentForg</div>
    </div>
  `;

  return wrapDocument({
    title: `${contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const { r, g, b } = hexToRgb(accentColor);
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;padding:12px;">
    <div style="width:35%;height:6px;background:#eee;border-radius:2px;margin-bottom:6px;"></div>
    <div style="font-size:11px;font-weight:700;color:#111;margin-bottom:8px;">Title Here</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <div style="font-size:20px;font-weight:800;color:${accentColor};opacity:0.8;">47%</div>
      <div style="font-size:20px;font-weight:800;color:${accentColor};opacity:0.8;">$2M</div>
    </div>
    <div style="position:relative;margin-bottom:8px;">
      <div style="position:absolute;top:-4px;right:0;font-size:36px;font-weight:800;color:rgba(${r},${g},${b},0.08);">47%</div>
      <div style="width:100%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:85%;height:3px;background:#eee;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:92%;height:3px;background:#eee;border-radius:1px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style12OversizedNumbers: DocumentStyle = {
  id: 'style-12',
  name: 'Oversized Numbers',
  category: 'bold',
  description: 'Giant statistics as watermark-style visual anchors behind content',
  keywords: ['numbers', 'oversized', 'statistics', 'infographic', 'data'],
  render,
  thumbnail,
};

export default style12OversizedNumbers;
