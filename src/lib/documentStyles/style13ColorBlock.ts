import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, contrastText } from './shared';

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
    for (const m of dollarMatches.slice(0, 1)) stats.push({ value: m, label: 'value' });
  }
  return stats.slice(0, 3);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
  const stats = extractStats(sections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const primaryTextColor = contrastText(brand.primary);
  const accentTextColor = contrastText(brand.accent);

  const sectionsHtml = sections.map((s, i) => {
    const isColored = i % 2 === 0;
    return `
    <div class="section ${isColored ? 'section-colored' : 'section-white'}">
      <div class="section-inner">
        <h2 class="section-title">${s.title}</h2>
        <div class="section-content">${formatMarkdown(s.content)}</div>
      </div>
    </div>`;
  }).join('');

  const statsHtml = stats.length > 0
    ? `<div class="stats-bar">
        ${stats.map(s => `<div class="stat-item">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('')}
      </div>`
    : '';

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text); background: #fff;
      line-height: 1.7; font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }
    .header {
      background: var(--brand-primary);
      color: ${primaryTextColor};
      padding: 48px 56px;
    }
    .header-inner { max-width: 880px; margin: 0 auto; }
    .logo-row { margin-bottom: 28px; }
    .meta-label {
      font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
      text-transform: uppercase; opacity: 0.7; margin-bottom: 10px;
    }
    .headline {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700; line-height: 1.15;
      margin-bottom: 8px; color: ${primaryTextColor};
    }
    .subtitle { font-size: 15px; opacity: 0.75; }
    .stats-bar {
      background: var(--brand-accent); color: ${accentTextColor};
      padding: 24px 56px; display: flex; gap: 40px;
      justify-content: center; flex-wrap: wrap;
    }
    .stats-bar .stat-item { text-align: center; }
    .stats-bar .stat-value {
      font-family: var(--brand-font-primary);
      font-size: 32px; font-weight: 700;
    }
    .stats-bar .stat-label {
      font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.1em; opacity: 0.8; margin-top: 4px;
    }
    .section-colored {
      background: var(--brand-primary); color: ${primaryTextColor};
      padding: 40px 56px;
    }
    .section-white {
      background: #ffffff; color: var(--brand-text);
      padding: 40px 56px;
    }
    .section-inner { max-width: 880px; margin: 0 auto; }
    .section-colored .section-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 700; color: ${primaryTextColor};
      margin-bottom: 14px; padding-bottom: 10px;
      border-bottom: 2px solid rgba(255,255,255,0.2);
    }
    .section-white .section-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 700; color: var(--brand-primary);
      margin-bottom: 14px; padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    .section-content p { margin-bottom: 14px; }
    .section-colored .section-content h1,
    .section-colored .section-content h2,
    .section-colored .section-content h3 {
      color: ${primaryTextColor}; margin: 20px 0 8px;
    }
    .section-white .section-content h1,
    .section-white .section-content h2,
    .section-white .section-content h3 {
      color: var(--brand-primary); margin: 20px 0 8px;
    }
    .section-content h1 { font-size: var(--brand-font-h2-size); font-family: var(--brand-font-primary); }
    .section-content h2 { font-size: var(--brand-font-h2-size); font-family: var(--brand-font-primary); }
    .section-content h3 { font-size: var(--brand-font-h3-size); font-family: var(--brand-font-primary); }
    .section-content h4 { font-size: 14px; font-weight: 600; margin: 14px 0 6px; }
    .section-content strong { font-weight: 600; }
    .section-content ul, .section-content ol { padding-left: 24px; margin: 10px 0; }
    .section-content li { margin-bottom: 6px; }
    .section-colored .section-content li::marker { color: rgba(255,255,255,0.5); }
    .section-white .section-content li::marker { color: var(--brand-primary); }
    .section-content hr {
      border: none; margin: 20px 0;
    }
    .section-colored .section-content hr { border-top: 1px solid rgba(255,255,255,0.2); }
    .section-white .section-content hr { border-top: 1px solid #eee; }
    .section-content table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
    .section-colored .section-content th {
      text-align: left; padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.3);
      font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .section-white .section-content th {
      text-align: left; padding: 10px 12px;
      border-bottom: 2px solid var(--brand-primary);
      font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--brand-primary);
    }
    .section-colored .section-content td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .section-white .section-content td { padding: 10px 12px; border-bottom: 1px solid #eee; }
    .footer {
      background: #111; color: #777; text-align: center;
      padding: 24px 56px; font-size: 11px; letter-spacing: 0.03em;
    }
  `;

  const body = `
    <div class="header">
      <div class="header-inner">
        <div class="logo-row">${brandLogoHtml(input, 'height:36px;')}</div>
        <div class="meta-label">${contentType.replace(/-/g, ' ')}${prospect.industry ? ` &mdash; ${prospect.industry}` : ''}</div>
        <h1 class="headline">${contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} for ${prospect.companyName}</h1>
        <div class="subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ` &middot; ${prospect.companySize}` : ''}</div>
      </div>
    </div>
    ${statsHtml}
    ${sectionsHtml}
    <div class="footer">${companyName} &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Generated by ContentForg</div>
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
  const textOnAccent = contrastText(accentColor);
  return `<div style="width:100%;height:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:sans-serif;">
    <div style="background:${accentColor};padding:8px 10px;">
      <div style="width:40%;height:6px;background:${textOnAccent};opacity:0.9;border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:55%;height:4px;background:${textOnAccent};opacity:0.4;border-radius:2px;"></div>
    </div>
    <div style="padding:6px 10px;">
      <div style="width:35%;height:5px;background:${accentColor};border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:90%;height:3px;background:#ddd;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:80%;height:3px;background:#ddd;border-radius:1px;"></div>
    </div>
    <div style="background:${accentColor};padding:6px 10px;">
      <div style="width:30%;height:5px;background:${textOnAccent};opacity:0.9;border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:85%;height:3px;background:${textOnAccent};opacity:0.3;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:70%;height:3px;background:${textOnAccent};opacity:0.3;border-radius:1px;"></div>
    </div>
    <div style="padding:6px 10px;">
      <div style="width:40%;height:5px;background:${accentColor};border-radius:2px;margin-bottom:4px;"></div>
      <div style="width:100%;height:3px;background:#ddd;border-radius:1px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style13ColorBlock: DocumentStyle = {
  id: 'style-13',
  name: 'Color Block',
  category: 'bold',
  description: 'Alternating accent and white sections — bold rhythmic design',
  keywords: ['color', 'block', 'alternating', 'bold', 'energetic', 'modern'],
  render,
  thumbnail,
};

export default style13ColorBlock;
