import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, hexToRgb } from './shared';

// ── Stat extraction ─────────────────────────────────────────

function extractStats(sections: StyleInput['sections']): { value: string; label: string }[] {
  const allContent = sections.map(s => s.content).join('\n');
  const stats: { value: string; label: string }[] = [];
  const pctMatches = allContent.match(/(\d{1,4}(?:\.\d+)?%)/g);
  if (pctMatches) {
    for (const m of pctMatches.slice(0, 2)) {
      const idx = allContent.indexOf(m);
      const surrounding = allContent.substring(Math.max(0, idx - 40), idx + m.length + 40);
      const words = surrounding.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
      stats.push({ value: m, label: words.join(' ') || 'improvement' });
    }
  }
  const dollarMatches = allContent.match(/\$[\d,.]+[KkMmBb]?/g);
  if (dollarMatches) {
    for (const m of dollarMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'value' });
    }
  }
  const multMatches = allContent.match(/(\d+(?:\.\d+)?)[xX]\b/g);
  if (multMatches) {
    for (const m of multMatches.slice(0, 1)) {
      stats.push({ value: m, label: 'multiplier' });
    }
  }
  return stats.slice(0, 4);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const { r, g, b } = hexToRgb(brand.accent);

  const sectionsHtml = sections.map(s => `
    <div class="section">
      <h2 class="section-title">${s.title}</h2>
      <div class="section-content">${formatMarkdown(s.content)}</div>
    </div>
  `).join('');

  const statsHtml = stats.length > 0 ? `<div class="stats-row">
    ${stats.map(s => `<div class="stat-box">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('')}
  </div>` : '';

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary);
      color: #E0E0E0;
      background: #0A0A0A;
      line-height: 1.7;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 880px; margin: 0 auto; padding: 64px 56px; }
    .header { margin-bottom: 48px; border-bottom: 1px solid #1A1A1A; padding-bottom: 40px; }
    .logo-row { margin-bottom: 32px; }
    .meta-label {
      font-size: 11px; font-weight: 500; letter-spacing: 0.15em;
      text-transform: uppercase; color: #555; margin-bottom: 12px;
    }
    .headline {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700; color: var(--brand-primary);
      line-height: 1.15; margin-bottom: 8px;
      letter-spacing: 0.04em;
    }
    .subtitle { font-size: 15px; color: #777; }
    .stats-row {
      display: flex; gap: 40px; flex-wrap: wrap;
      padding: 32px 0; margin-bottom: 32px;
      border-bottom: 1px solid #1A1A1A;
    }
    .stat-box { flex: 1; min-width: 120px; }
    .stat-value {
      font-family: var(--brand-font-primary);
      font-size: 42px; font-weight: 700;
      color: var(--brand-accent);
      line-height: 1;
      text-shadow: 0 0 20px rgba(${r},${g},${b},0.5), 0 0 40px rgba(${r},${g},${b},0.25);
      letter-spacing: 0.02em;
    }
    .stat-label {
      font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: #555; margin-top: 8px;
    }
    .section { margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid #1A1A1A; }
    .section:last-of-type { border-bottom: none; }
    .section-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600; color: var(--brand-primary);
      margin-bottom: 16px; letter-spacing: 0.04em;
    }
    .section-content { color: #CCCCCC; }
    .section-content p { margin-bottom: 16px; }
    .section-content h1, .section-content h2 {
      font-family: var(--brand-font-primary);
      color: var(--brand-primary); margin: 24px 0 10px;
      font-size: var(--brand-font-h2-size); letter-spacing: 0.04em;
    }
    .section-content h3 {
      font-family: var(--brand-font-primary);
      color: #E0E0E0; margin: 20px 0 8px;
      font-size: var(--brand-font-h3-size); letter-spacing: 0.04em;
    }
    .section-content h4 { color: #BBB; margin: 16px 0 6px; font-size: 15px; }
    .section-content strong { font-weight: 600; color: #fff; }
    .section-content em { font-style: italic; color: #AAA; }
    .section-content ul, .section-content ol { padding-left: 24px; margin: 12px 0; }
    .section-content li { margin-bottom: 6px; }
    .section-content li::marker { color: var(--brand-accent); }
    .section-content hr { border: none; border-top: 1px solid #1A1A1A; margin: 24px 0; }
    .section-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .section-content th {
      text-align: left; padding: 10px 12px;
      border-bottom: 1px solid #333; font-weight: 600;
      font-size: 11px; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--brand-accent);
      background: #111;
    }
    .section-content td { padding: 10px 12px; border-bottom: 1px solid #1A1A1A; color: #CCC; }
    .footer {
      margin-top: 48px; padding-top: 24px;
      border-top: 1px solid #1A1A1A;
      font-size: 11px; color: #444;
      text-align: center; letter-spacing: 0.03em;
    }
  `;

  const body = `
    <div class="page">
      <div class="header">
        <div class="logo-row">${brandLogoHtml(input, 'height:36px;filter:brightness(1.5);')}</div>
        <div class="meta-label">${contentType.replace(/-/g, ' ')}${prospect.industry ? ` &mdash; ${prospect.industry}` : ''}</div>
        <h1 class="headline">${contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} for ${prospect.companyName}</h1>
        <div class="subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ` &middot; ${prospect.companySize}` : ''}</div>
      </div>
      ${statsHtml}
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
  return `<div style="width:100%;height:100%;background:#0A0A0A;border-radius:6px;overflow:hidden;font-family:sans-serif;padding:12px;">
    <div style="width:30%;height:6px;background:#222;border-radius:2px;margin-bottom:10px;"></div>
    <div style="font-size:14px;font-weight:700;color:${accentColor};margin-bottom:4px;text-shadow:0 0 8px rgba(${r},${g},${b},0.5);">Title</div>
    <div style="width:60%;height:4px;background:#1A1A1A;border-radius:2px;margin-bottom:12px;"></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #1A1A1A;">
      <div><div style="font-size:12px;font-weight:700;color:${accentColor};text-shadow:0 0 6px rgba(${r},${g},${b},0.4);">47%</div><div style="font-size:6px;color:#555;">Growth</div></div>
      <div><div style="font-size:12px;font-weight:700;color:${accentColor};text-shadow:0 0 6px rgba(${r},${g},${b},0.4);">$2M</div><div style="font-size:6px;color:#555;">Value</div></div>
    </div>
    <div style="width:100%;height:3px;background:#1A1A1A;border-radius:2px;margin-bottom:4px;"></div>
    <div style="width:85%;height:3px;background:#1A1A1A;border-radius:2px;margin-bottom:4px;"></div>
    <div style="width:92%;height:3px;background:#1A1A1A;border-radius:2px;"></div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style09DarkMode: DocumentStyle = {
  id: 'style-09',
  name: 'Dark Mode',
  category: 'bold',
  description: 'Full dark background with glowing accent highlights — premium tech feel',
  keywords: ['dark', 'mode', 'vivid', 'tech', 'high-contrast', 'dramatic'],
  render,
  thumbnail,
};

export default style09DarkMode;
