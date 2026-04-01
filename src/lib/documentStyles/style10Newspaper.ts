import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument } from './shared';

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

  const pullStatHtml = stats.length > 0
    ? `<div class="pull-stat">${stats[0].value}<span class="pull-stat-label">${stats[0].label}</span></div>`
    : '';

  const sectionsHtml = sections.map((s, i) => {
    const insertPull = (i === 1 && stats.length > 1)
      ? `<div class="pull-stat">${stats[1].value}<span class="pull-stat-label">${stats[1].label}</span></div>`
      : '';
    return `
    <div class="article-section">
      <h2 class="section-header">${s.title}</h2>
      <div class="section-body columned">${insertPull}${formatMarkdown(s.content)}</div>
    </div>`;
  }).join('');

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary), Georgia, 'Times New Roman', serif;
      color: #1a1a1a; background: #FAFAF5;
      line-height: 1.65; font-size: var(--brand-font-body-size);
    }
    .page { max-width: 960px; margin: 0 auto; padding: 40px 48px; }
    .masthead {
      text-align: center; padding-bottom: 16px; margin-bottom: 8px;
      border-bottom: 4px double #111;
    }
    .masthead-logo { margin-bottom: 8px; }
    .masthead-title {
      font-family: var(--brand-font-primary), Georgia, serif;
      font-size: 48px; font-weight: 700; color: #111;
      line-height: 1; letter-spacing: -0.02em; margin-bottom: 4px;
    }
    .dateline {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 11px; color: #666; text-transform: uppercase;
      letter-spacing: 0.08em; padding: 8px 0;
      border-bottom: 1px solid #ccc; margin-bottom: 24px;
    }
    .headline-row {
      text-align: center; margin-bottom: 24px;
      padding-bottom: 20px; border-bottom: 1px solid #ddd;
    }
    .headline {
      font-family: var(--brand-font-primary), Georgia, serif;
      font-size: var(--brand-font-h1-size);
      font-weight: 700; color: #111; line-height: 1.15;
      margin-bottom: 8px;
    }
    .subheadline { font-size: 16px; color: #555; font-style: italic; }
    .lead-stat-row {
      display: flex; gap: 24px; justify-content: center;
      margin-bottom: 28px; padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .lead-stat {
      text-align: center; padding: 0 16px;
      border-right: 1px solid #ddd;
    }
    .lead-stat:last-child { border-right: none; }
    .lead-stat-value {
      font-family: var(--brand-font-primary), Georgia, serif;
      font-size: 32px; font-weight: 700; color: var(--brand-primary);
    }
    .lead-stat-label {
      font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.1em; color: #888; margin-top: 2px;
    }
    .article-section { margin-bottom: 28px; }
    .section-header {
      font-family: var(--brand-font-primary), Georgia, serif;
      font-size: var(--brand-font-h2-size);
      font-weight: 800; text-transform: uppercase;
      color: #111; margin-bottom: 10px;
      letter-spacing: 0.04em;
      border-bottom: 2px solid #111; padding-bottom: 6px;
    }
    .columned {
      column-count: 3; column-gap: 28px;
      column-rule: 1px solid #ddd;
    }
    .section-body p { margin-bottom: 12px; text-align: justify; }
    .section-body h1, .section-body h2 {
      font-family: var(--brand-font-primary), Georgia, serif;
      color: #111; margin: 16px 0 8px; font-size: 18px;
      column-span: all;
    }
    .section-body h3, .section-body h4 { color: #333; margin: 12px 0 6px; font-size: 15px; }
    .section-body strong { font-weight: 700; }
    .section-body ul, .section-body ol { padding-left: 20px; margin: 8px 0; }
    .section-body li { margin-bottom: 4px; }
    .section-body hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; column-span: all; }
    .section-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; column-span: all; }
    .section-body th {
      text-align: left; padding: 8px 10px; border-bottom: 2px solid #333;
      font-weight: 700; font-size: 11px; text-transform: uppercase;
    }
    .section-body td { padding: 6px 10px; border-bottom: 1px solid #ddd; }
    .pull-stat {
      font-family: var(--brand-font-primary), Georgia, serif;
      font-size: 28px; font-weight: 800; color: var(--brand-primary);
      text-align: center; padding: 12px 8px; margin: 8px 0;
      column-span: all;
      border-top: 2px solid #111; border-bottom: 2px solid #111;
    }
    .pull-stat-label {
      display: block; font-size: 11px; font-weight: 400;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: #666; margin-top: 2px;
    }
    .footer {
      margin-top: 40px; padding-top: 16px;
      border-top: 2px solid #111;
      font-size: 11px; color: #888;
      text-align: center; letter-spacing: 0.03em;
    }
  `;

  const body = `
    <div class="page">
      <div class="masthead">
        <div class="masthead-logo">${brandLogoHtml(input, 'height:28px;')}</div>
        <div class="masthead-title">${companyName}</div>
      </div>
      <div class="dateline">
        <span>${contentType.replace(/-/g, ' ').toUpperCase()}</span>
        <span>${dateStr}</span>
        <span>${prospect.industry || 'Industry Report'}</span>
      </div>
      <div class="headline-row">
        <h1 class="headline">${contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} for ${prospect.companyName}</h1>
        <div class="subheadline">Prepared for ${prospect.companyName}${prospect.companySize ? ` &mdash; ${prospect.companySize}` : ''}</div>
      </div>
      ${stats.length > 0 ? `<div class="lead-stat-row">
        ${stats.map(s => `<div class="lead-stat"><div class="lead-stat-value">${s.value}</div><div class="lead-stat-label">${s.label}</div></div>`).join('')}
      </div>` : ''}
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
  return `<div style="width:100%;height:100%;background:#FAFAF5;border-radius:6px;overflow:hidden;font-family:Georgia,serif;padding:10px 12px;">
    <div style="text-align:center;border-bottom:3px double #111;padding-bottom:6px;margin-bottom:6px;">
      <div style="font-size:16px;font-weight:700;color:#111;">THE DAILY</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:5px;color:#888;text-transform:uppercase;margin-bottom:6px;">
      <span>Report</span><span>Today</span>
    </div>
    <div style="font-size:9px;font-weight:700;color:#111;text-align:center;margin-bottom:6px;">Headline Goes Here</div>
    <div style="column-count:3;column-gap:6px;column-rule:1px solid #ddd;">
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="text-align:center;font-size:10px;font-weight:800;color:${accentColor};padding:3px 0;border-top:1px solid #111;border-bottom:1px solid #111;column-span:all;margin:4px 0;">47%</div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
      <div style="width:100%;height:3px;background:#ddd;margin-bottom:3px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style10Newspaper: DocumentStyle = {
  id: 'style-10',
  name: 'Newspaper',
  category: 'bold',
  description: 'Multi-column newspaper layout with masthead and pull statistics',
  keywords: ['newspaper', 'columns', 'masthead', 'serif', 'authoritative'],
  render,
  thumbnail,
};

export default style10Newspaper;
