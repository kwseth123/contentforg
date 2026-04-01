import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, lighten, darken, contrastText, hexToRgb } from './shared';

// ── Stat extraction ─────────────────────────────────────────

function extractStats(sections: StyleInput['sections']): { value: string; label: string }[] {
  const allContent = sections.map(s => s.content).join('\n');
  const stats: { value: string; label: string }[] = [];

  // Percentages like "45%" or "300%"
  const pctMatches = allContent.match(/(\d{1,4}(?:\.\d+)?%)/g);
  if (pctMatches) {
    for (const m of pctMatches.slice(0, 2)) {
      const idx = allContent.indexOf(m);
      const surrounding = allContent.substring(Math.max(0, idx - 40), idx + m.length + 40);
      const words = surrounding.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
      stats.push({ value: m, label: words.join(' ') || 'improvement' });
    }
  }

  // Dollar amounts like "$1.2M" or "$500K"
  const dollarMatches = allContent.match(/\$[\d,.]+[KkMmBb]?/g);
  if (dollarMatches) {
    for (const m of dollarMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'value' });
    }
  }

  // Multipliers like "3x" or "10x"
  const multMatches = allContent.match(/(\d+(?:\.\d+)?)[xX]\b/g);
  if (multMatches) {
    for (const m of multMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'multiplier' });
    }
  }

  return stats.slice(0, 3);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, logoBase64, prospectLogoBase64, date } = input;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const css = `
  ${brandCSSVars(brand)}
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { font-size: var(--brand-font-body-size); }
  body { font-family: var(--brand-font-primary); color: #1a1a1a; background: #fff; line-height: 1.8; -webkit-font-smoothing: antialiased; }
  .page { max-width: 820px; margin: 0 auto; padding: 80px 60px 60px; }
  .header { margin-bottom: 60px; }
  .logos { display: flex; align-items: center; gap: 16px; margin-bottom: 48px; }
  .logos img { height: 32px; width: auto; object-fit: contain; }
  .logos .sep { width: 1px; height: 24px; background: #e0e0e0; }
  .meta-label { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 12px; }
  .headline { font-size: var(--brand-font-h1-size); font-weight: 700; color: #111; line-height: 1.2; margin-bottom: 16px; }
  .accent-line { width: 60px; height: 2px; background: var(--brand-primary); margin-bottom: 48px; }
  .stats-row { display: flex; gap: 48px; margin-bottom: 56px; padding-bottom: 40px; border-bottom: 1px solid #f0f0f0; }
  .stat-box .stat-value { font-size: 36px; font-weight: 700; color: var(--brand-primary); line-height: 1; }
  .stat-box .stat-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-top: 6px; }
  .section { margin-bottom: 56px; }
  .section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 16px; }
  .section-content p { margin-bottom: 20px; }
  .section-content h1, .section-content h2, .section-content h3, .section-content h4 { color: #111; margin: 32px 0 12px; }
  .section-content h2 { font-size: var(--brand-font-h2-size); font-weight: 600; }
  .section-content h3 { font-size: var(--brand-font-h3-size); font-weight: 600; }
  .section-content h4 { font-size: 15px; font-weight: 600; }
  .section-content strong { font-weight: 600; }
  .section-content ul, .section-content ol { padding-left: 20px; margin: 16px 0; }
  .section-content li { margin-bottom: 8px; }
  .section-content hr { border: none; border-top: 1px solid #f0f0f0; margin: 32px 0; }
  .section-content table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
  .section-content th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #e0e0e0; font-weight: 600; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: #666; }
  .section-content td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; }
  .footer { margin-top: 80px; padding-top: 24px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #bbb; letter-spacing: 0.02em; }`;

  const body = `<div class="page">
  <div class="header">
    ${(logoBase64 || prospectLogoBase64) ? `<div class="logos">
      ${logoBase64 ? `<img src="${logoBase64}" alt="${companyName}"/>` : ''}
      ${logoBase64 && prospectLogoBase64 ? '<div class="sep"></div>' : ''}
      ${prospectLogoBase64 ? `<img src="${prospectLogoBase64}" alt="${prospect.companyName}"/>` : ''}
    </div>` : ''}
    <div class="meta-label">${contentType}${prospect.industry ? ` — ${prospect.industry}` : ''}</div>
    <h1 class="headline">${contentType} for ${prospect.companyName}</h1>
    <div class="accent-line"></div>
  </div>
  ${stats.length > 0 ? `<div class="stats-row">
    ${stats.map(s => `<div class="stat-box"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join('\n    ')}
  </div>` : ''}
  ${sections.map(s => `<div class="section">
    <div class="section-label">${s.title}</div>
    <div class="section-content">${formatMarkdown(s.content)}</div>
  </div>`).join('\n  ')}
  <div class="footer">${companyName} &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Generated by ContentForg</div>
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
  return `<div style="width:1000px;height:1294px;background:#fff;font-family:'Inter',sans-serif;padding:80px 60px;box-sizing:border-box;">
  <div style="width:40px;height:8px;background:#ddd;border-radius:2px;margin-bottom:40px;"></div>
  <div style="font-size:10px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-bottom:10px;">Case Study</div>
  <div style="font-size:30px;font-weight:700;color:#111;line-height:1.2;margin-bottom:14px;">Document Title Here</div>
  <div style="width:60px;height:2px;background:${accentColor};margin-bottom:44px;"></div>
  <div style="display:flex;gap:40px;margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid #f0f0f0;">
    <div><div style="font-size:32px;font-weight:700;color:${accentColor};">47%</div><div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-top:4px;">Growth</div></div>
    <div><div style="font-size:32px;font-weight:700;color:${accentColor};">$2.4M</div><div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-top:4px;">Revenue</div></div>
    <div><div style="font-size:32px;font-weight:700;color:${accentColor};">3x</div><div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-top:4px;">ROI</div></div>
  </div>
  <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-bottom:12px;">Overview</div>
  <div style="height:8px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:8px;"></div>
  <div style="height:8px;background:#f0f0f0;border-radius:2px;width:92%;margin-bottom:8px;"></div>
  <div style="height:8px;background:#f0f0f0;border-radius:2px;width:85%;margin-bottom:8px;"></div>
  <div style="height:8px;background:#f0f0f0;border-radius:2px;width:96%;margin-bottom:32px;"></div>
  <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-bottom:12px;">Details</div>
  <div style="height:8px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:8px;"></div>
  <div style="height:8px;background:#f0f0f0;border-radius:2px;width:88%;margin-bottom:8px;"></div>
  <div style="height:8px;background:#f0f0f0;border-radius:2px;width:94%;margin-bottom:8px;"></div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style01UltraMinimal: DocumentStyle = {
  id: 'style-01',
  name: 'Ultra Minimal',
  category: 'clean',
  description: 'Pure white canvas with maximum breathing room and typographic precision',
  keywords: ['minimal', 'clean', 'white', 'simple', 'modern', 'elegant', 'whitespace'],
  render,
  thumbnail,
};

export default style01UltraMinimal;
