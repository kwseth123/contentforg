import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, lighten, darken, contrastText, hexToRgb } from './shared';

// ── Extract key numbers for display ─────────────────────────

function extractKeyNumbers(content: string): { value: string; context: string }[] {
  const numbers: { value: string; context: string }[] = [];
  const patterns = [
    { re: /(\d{1,4}(?:\.\d+)?%)/g, type: 'percentage' },
    { re: /(\$[\d,.]+[KkMmBb]?)/g, type: 'currency' },
    { re: /(\d+(?:\.\d+)?[xX])\b/g, type: 'multiplier' },
  ];
  for (const { re } of patterns) {
    let match;
    while ((match = re.exec(content)) !== null && numbers.length < 2) {
      const idx = match.index;
      const surrounding = content.substring(Math.max(0, idx - 30), idx + match[1].length + 30);
      const words = surrounding.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).slice(0, 2);
      numbers.push({ value: match[1], context: words.join(' ') });
    }
  }
  return numbers;
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, logoBase64, prospectLogoBase64, date } = input;
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const { r, g, b } = hexToRgb(brand.primary);

  // Extract numbers from all content for display
  const allContent = sections.map(s => s.content).join('\n');
  const keyNumbers = extractKeyNumbers(allContent);

  const css = `
  ${brandCSSVars(brand)}
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--brand-font-primary); color: #111; background: #fff; line-height: 1.5; -webkit-font-smoothing: antialiased; font-size: var(--brand-font-body-size); }
  .page { max-width: 860px; margin: 0 auto; padding: 80px 56px 60px; }

  /* Header */
  .header { margin-bottom: 100px; }
  .header-meta { display: flex; align-items: center; gap: 20px; margin-bottom: 60px; }
  .header-meta img { height: 28px; width: auto; object-fit: contain; }
  .header-meta .sep { width: 1px; height: 20px; background: #ddd; }
  .meta-label { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #999; }
  .hero-title { font-size: var(--brand-font-h1-size); font-weight: 900; color: #000; line-height: 1.05; letter-spacing: -0.02em; margin-bottom: 20px; max-width: 90%; }
  .hero-sub { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #999; }

  /* Key numbers */
  .key-numbers { display: flex; gap: 64px; margin-bottom: 120px; }
  .key-number .number { font-size: 64px; font-weight: 800; color: rgba(${r}, ${g}, ${b}, 0.25); line-height: 1; letter-spacing: -0.03em; }
  .key-number .number-label { font-size: 10px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #999; margin-top: 8px; }

  /* Sections */
  .section { margin-bottom: 100px; }
  .section-title { font-size: var(--brand-font-h1-size); font-weight: 900; color: #000; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 32px; }
  .section-body { max-width: 640px; }
  .section-body p { margin-bottom: 16px; color: #333; }
  .section-body h2 { font-size: var(--brand-font-h2-size); font-weight: 800; color: #000; margin: 40px 0 16px; letter-spacing: -0.01em; }
  .section-body h3 { font-size: var(--brand-font-h3-size); font-weight: 700; color: #111; margin: 32px 0 12px; }
  .section-body h4 { font-size: 14px; font-weight: 700; color: #222; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  .section-body strong { font-weight: 600; color: #000; }
  .section-body em { font-style: italic; }
  .section-body ul, .section-body ol { padding-left: 20px; margin: 14px 0; }
  .section-body li { margin-bottom: 8px; color: #333; }
  .section-body hr { border: none; margin: 48px 0; }
  .section-body table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .section-body th { text-align: left; padding: 10px 0; font-weight: 700; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; border-bottom: 2px solid #111; }
  .section-body td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; }

  /* Footer */
  .footer { margin-top: 120px; padding-top: 24px; }
  .footer-label { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #ccc; }`;

  const body = `<div class="page">
  <div class="header">
    <div class="header-meta">
      ${logoBase64 ? `<img src="${logoBase64}" alt="${companyName}"/>` : `<span class="meta-label">${companyName}</span>`}
      ${(logoBase64 || true) && prospectLogoBase64 ? '<div class="sep"></div>' : ''}
      ${prospectLogoBase64 ? `<img src="${prospectLogoBase64}" alt="${prospect.companyName}"/>` : ''}
      <div class="sep"></div>
      <span class="meta-label">${contentType}</span>
      <div class="sep"></div>
      <span class="meta-label">${dateStr}</span>
    </div>
    <h1 class="hero-title">${prospect.companyName}</h1>
    <div class="hero-sub">${contentType}${prospect.industry ? ` &mdash; ${prospect.industry}` : ''}${prospect.companySize ? ` &mdash; ${prospect.companySize}` : ''}</div>
  </div>

  ${keyNumbers.length > 0 ? `<div class="key-numbers">
    ${keyNumbers.map(n => `<div class="key-number">
      <div class="number">${n.value}</div>
      <div class="number-label">${n.context}</div>
    </div>`).join('\n    ')}
  </div>` : ''}

  ${sections.map(s => `<div class="section">
    <h2 class="section-title">${s.title}</h2>
    <div class="section-body">${formatMarkdown(s.content)}</div>
  </div>`).join('\n  ')}

  <div class="footer">
    <div class="footer-label">${companyName} &nbsp;&bull;&nbsp; ${dateStr} &nbsp;&bull;&nbsp; Generated by ContentForg</div>
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
  const { r, g, b } = hexToRgb(accentColor);
  return `<div style="width:1000px;height:1294px;background:#fff;font-family:'DM Sans',sans-serif;padding:80px 56px;box-sizing:border-box;">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:56px;">
    <div style="width:36px;height:8px;background:#ddd;border-radius:2px;"></div>
    <div style="width:1px;height:16px;background:#ddd;"></div>
    <div style="font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Case Study</div>
    <div style="width:1px;height:16px;background:#ddd;"></div>
    <div style="font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#999;">2026</div>
  </div>
  <div style="font-size:48px;font-weight:900;color:#000;line-height:1.05;letter-spacing:-0.02em;margin-bottom:16px;">Company Name</div>
  <div style="font-size:9px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin-bottom:80px;">Proposal &mdash; Technology</div>
  <div style="display:flex;gap:52px;margin-bottom:100px;">
    <div>
      <div style="font-size:52px;font-weight:800;color:rgba(${r},${g},${b},0.25);line-height:1;letter-spacing:-0.03em;">47%</div>
      <div style="font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-top:6px;">Growth</div>
    </div>
    <div>
      <div style="font-size:52px;font-weight:800;color:rgba(${r},${g},${b},0.25);line-height:1;letter-spacing:-0.03em;">3x</div>
      <div style="font-size:9px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-top:6px;">ROI</div>
    </div>
  </div>
  <div style="font-size:40px;font-weight:900;color:#000;line-height:1.1;letter-spacing:-0.02em;margin-bottom:24px;">Section Title</div>
  <div style="max-width:560px;">
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:8px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:90%;margin-bottom:8px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:95%;margin-bottom:8px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:82%;margin-bottom:8px;"></div>
  </div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style04Typographic: DocumentStyle = {
  id: 'style-04',
  name: 'Typographic',
  category: 'clean',
  description: 'Pure typographic hierarchy with bold weights and dramatic scale contrast',
  keywords: ['typography', 'bold', 'minimal', 'type', 'hierarchy', 'black-white', 'dramatic'],
  render,
  thumbnail,
};

export default style04Typographic;
