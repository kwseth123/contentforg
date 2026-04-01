import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, hexToRgb, lighten } from './shared';

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
  const { r: pr, g: pg, b: pb } = hexToRgb(brand.primary);
  const glowA = `rgba(${r},${g},${b}`;
  const glowP = `rgba(${pr},${pg},${pb}`;
  const accentLight = lighten(brand.accent, 30);

  const sectionsHtml = sections.map((s, i) => `
    <div class="section-card">
      <div class="section-number">${String(i + 1).padStart(2, '0')}</div>
      <h2 class="section-title">${s.title}</h2>
      <div class="section-content">${formatMarkdown(s.content)}</div>
    </div>
  `).join('');

  const statsHtml = stats.length > 0 ? `<div class="stats-row">
    ${stats.map(s => `<div class="stat-pill">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('')}
  </div>` : '';

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary);
      color: #c8c8d0;
      background: #0a0a0f;
      line-height: 1.7;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 880px; margin: 0 auto; padding: 64px 56px; }

    /* Header */
    .header {
      margin-bottom: 48px;
      padding-bottom: 40px;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, var(--brand-accent), ${glowA},0.2), transparent) 1;
    }
    .logo-row { margin-bottom: 28px; }
    .content-type-badge {
      display: inline-block;
      font-family: 'Courier New', monospace;
      font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--brand-accent);
      border: 1px solid ${glowA},0.35);
      border-radius: 3px; padding: 4px 12px;
      margin-bottom: 16px;
      box-shadow: 0 0 8px ${glowA},0.15);
    }
    .headline {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      color: var(--brand-primary);
      line-height: 1.15;
      margin-bottom: 10px;
      text-shadow: 0 0 30px ${glowP},0.4);
    }
    .subtitle { font-size: 15px; color: #6a6a78; }

    /* Stats */
    .stats-row {
      display: flex; gap: 16px; flex-wrap: wrap;
      margin-bottom: 40px;
    }
    .stat-pill {
      flex: 1; min-width: 130px;
      background: #111118;
      border: 1px solid ${glowA},0.3);
      border-radius: 8px;
      padding: 20px 18px;
      text-align: center;
      box-shadow: 0 0 20px ${glowA},0.1), inset 0 0 20px ${glowA},0.03);
    }
    .stat-value {
      font-family: var(--brand-font-primary);
      font-size: 36px; font-weight: 700;
      color: var(--brand-accent);
      line-height: 1;
      text-shadow: 0 0 20px ${glowA},0.6), 0 0 40px ${glowA},0.3);
    }
    .stat-label {
      font-family: 'Courier New', monospace;
      font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; color: #555560; margin-top: 8px;
    }

    /* Section cards */
    .section-card {
      background: #111118;
      border: 1px solid #1c1c28;
      border-left: 3px solid var(--brand-accent);
      border-radius: 6px;
      padding: 36px 40px;
      margin-bottom: 28px;
      box-shadow: 0 0 24px ${glowA},0.04);
      position: relative;
    }
    .section-card:hover {
      border-left-color: ${accentLight};
      box-shadow: 0 0 30px ${glowA},0.1);
    }
    .section-number {
      position: absolute; top: 16px; right: 20px;
      font-family: 'Courier New', monospace;
      font-size: 11px; color: #2a2a38; font-weight: 700;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: var(--brand-accent);
      margin-bottom: 16px;
      text-shadow: 0 0 16px ${glowA},0.3);
    }
    .section-content { color: #b0b0bc; }
    .section-content p { margin-bottom: 14px; }
    .section-content h1, .section-content h2 {
      font-family: var(--brand-font-primary);
      color: var(--brand-primary);
      margin: 24px 0 10px;
      font-size: var(--brand-font-h2-size);
      text-shadow: 0 0 14px ${glowP},0.3);
    }
    .section-content h3 {
      font-family: var(--brand-font-primary);
      color: #d0d0da; margin: 20px 0 8px;
      font-size: var(--brand-font-h3-size);
    }
    .section-content h4 { color: #9090a0; margin: 16px 0 6px; font-size: 15px; }
    .section-content strong { font-weight: 600; color: #e8e8f0; }
    .section-content em { font-style: italic; color: #8888a0; }
    .section-content ul, .section-content ol { padding-left: 24px; margin: 12px 0; }
    .section-content li { margin-bottom: 6px; }
    .section-content li::marker { color: var(--brand-accent); }
    .section-content hr { border: none; border-top: 1px solid #1c1c28; margin: 24px 0; }
    .section-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .section-content th {
      text-align: left; padding: 10px 12px;
      border-bottom: 1px solid ${glowA},0.25);
      font-family: 'Courier New', monospace;
      font-weight: 600; font-size: 10px; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--brand-accent);
      background: #0d0d14;
    }
    .section-content td {
      padding: 10px 12px;
      border-bottom: 1px solid #1a1a24;
      color: #a0a0b0;
    }

    /* Footer */
    .footer {
      margin-top: 48px; padding-top: 24px;
      border-top: 2px solid transparent;
      border-image: linear-gradient(90deg, transparent, ${glowA},0.3), transparent) 1;
      font-family: 'Courier New', monospace;
      font-size: 10px; color: #3a3a48;
      text-align: center; letter-spacing: 0.06em;
    }
  `;

  const body = `
    <div class="page">
      <div class="header">
        <div class="logo-row">${brandLogoHtml(input, 'height:34px;filter:brightness(1.6);')}</div>
        <div class="content-type-badge">${contentType.replace(/-/g, ' ')}</div>
        <h1 class="headline">${contentType.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} for ${prospect.companyName}</h1>
        <div class="subtitle">Prepared for ${prospect.companyName}${prospect.industry ? ` &mdash; ${prospect.industry}` : ''}${prospect.companySize ? ` &middot; ${prospect.companySize}` : ''}</div>
      </div>
      ${statsHtml}
      ${sectionsHtml}
      <div class="footer">${companyName} &nbsp;&bull;&nbsp; ${dateStr} &nbsp;&bull;&nbsp; Generated by ContentForge</div>
    </div>
  `;

  return wrapDocument({
    title: `${contentType.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} \u2014 ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const { r, g, b } = hexToRgb(accentColor);
  const glow = `rgba(${r},${g},${b}`;
  return `<div style="width:100%;height:100%;background:#0a0a0f;border-radius:6px;overflow:hidden;font-family:sans-serif;padding:12px;">
    <div style="width:28%;height:5px;background:#1c1c28;border-radius:2px;margin-bottom:8px;"></div>
    <div style="display:inline-block;font-family:monospace;font-size:6px;color:${accentColor};border:1px solid ${glow},0.35);border-radius:2px;padding:1px 5px;margin-bottom:6px;box-shadow:0 0 4px ${glow},0.2);">TYPE</div>
    <div style="font-size:13px;font-weight:700;color:${accentColor};margin-bottom:8px;text-shadow:0 0 10px ${glow},0.5);">Title</div>
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <div style="flex:1;background:#111118;border:1px solid ${glow},0.25);border-radius:4px;padding:6px;text-align:center;box-shadow:0 0 10px ${glow},0.08);">
        <div style="font-size:11px;font-weight:700;color:${accentColor};text-shadow:0 0 6px ${glow},0.5);">47%</div>
        <div style="font-family:monospace;font-size:5px;color:#555560;">GROWTH</div>
      </div>
      <div style="flex:1;background:#111118;border:1px solid ${glow},0.25);border-radius:4px;padding:6px;text-align:center;box-shadow:0 0 10px ${glow},0.08);">
        <div style="font-size:11px;font-weight:700;color:${accentColor};text-shadow:0 0 6px ${glow},0.5);">$2M</div>
        <div style="font-family:monospace;font-size:5px;color:#555560;">VALUE</div>
      </div>
    </div>
    <div style="background:#111118;border-left:2px solid ${accentColor};border-radius:3px;padding:6px 8px;margin-bottom:6px;box-shadow:0 0 8px ${glow},0.05);">
      <div style="width:70%;height:3px;background:#1c1c28;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:90%;height:3px;background:#1c1c28;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:50%;height:3px;background:#1c1c28;border-radius:2px;"></div>
    </div>
    <div style="background:#111118;border-left:2px solid ${accentColor};border-radius:3px;padding:6px 8px;box-shadow:0 0 8px ${glow},0.05);">
      <div style="width:60%;height:3px;background:#1c1c28;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:80%;height:3px;background:#1c1c28;border-radius:2px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style16NeonAccent: DocumentStyle = {
  id: 'style-16',
  name: 'Neon Accent',
  category: 'bold',
  description: 'Deep dark background with vivid neon glows and cyberpunk-inspired accents \u2014 ideal for SaaS launches',
  keywords: ['neon', 'glow', 'dark', 'cyberpunk', 'vivid', 'accent', 'saas', 'tech'],
  render,
  thumbnail,
};

export default style16NeonAccent;
