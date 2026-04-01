import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument, lighten, darken, contrastText, hexToRgb } from './shared';

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, logoBase64, prospectLogoBase64, date } = input;
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accentDark = darken(brand.primary, 0.15);
  const accentLight = lighten(brand.primary, 0.85);

  const sectionNav = sections.map((s, i) => {
    const isLast = i === sections.length - 1;
    return `<div class="nav-dot-row">
      <div class="nav-dot"></div>
      ${!isLast ? '<div class="nav-line"></div>' : ''}
      <span class="nav-label">${s.title}</span>
    </div>`;
  }).join('\n        ');

  const css = `
  ${brandCSSVars(brand)}
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--brand-font-primary); color: #1a1a1a; background: #f8f8f8; line-height: 1.7; -webkit-font-smoothing: antialiased; }
  .wrapper { display: flex; min-height: 100vh; }

  /* Left panel */
  .left-panel { width: 33.333%; background: var(--brand-primary); color: #fff; padding: 60px 40px; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto; }
  .left-panel .logo-area { margin-bottom: 48px; }
  .left-panel .logo-area img { max-height: 36px; width: auto; filter: brightness(0) invert(1); }
  .left-panel .doc-type { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; margin-bottom: 8px; }
  .left-panel .doc-title { font-family: var(--brand-font-secondary); font-size: var(--brand-font-h2-size); font-weight: 400; line-height: 1.3; margin-bottom: 12px; }
  .left-panel .doc-prospect { font-size: 13px; opacity: 0.8; margin-bottom: 48px; }
  .left-panel .prospect-logo { margin-bottom: 40px; }
  .left-panel .prospect-logo img { max-height: 28px; width: auto; opacity: 0.9; }

  /* Section navigation dots */
  .nav-dots { flex: 1; }
  .nav-dot-row { display: flex; align-items: flex-start; gap: 14px; }
  .nav-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.5); background: transparent; flex-shrink: 0; margin-top: 3px; }
  .nav-line { width: 2px; height: 28px; background: rgba(255,255,255,0.2); margin-left: 4px; }
  .nav-label { font-size: 12px; opacity: 0.7; line-height: 1.3; }

  .left-footer { font-size: 10px; opacity: 0.5; margin-top: auto; padding-top: 40px; }

  /* Right panel */
  .right-panel { width: 66.667%; margin-left: 33.333%; background: #fff; min-height: 100vh; }
  .right-content { padding: 72px 64px 60px; max-width: 680px; }

  .section { margin-bottom: 56px; }
  .section-title { font-family: var(--brand-font-secondary); font-size: var(--brand-font-h2-size); font-weight: 400; color: var(--brand-primary); margin-bottom: 20px; line-height: 1.3; }
  .section-body { font-size: var(--brand-font-body-size); color: #333; }
  .section-body p { margin-bottom: 16px; }
  .section-body h2 { font-family: var(--brand-font-secondary); font-size: var(--brand-font-h3-size); font-weight: 400; color: var(--brand-primary); margin: 28px 0 12px; }
  .section-body h3 { font-size: 15px; font-weight: 600; color: #222; margin: 24px 0 10px; }
  .section-body h4 { font-size: 14px; font-weight: 600; color: #444; margin: 20px 0 8px; }
  .section-body strong { font-weight: 600; }
  .section-body ul, .section-body ol { padding-left: 20px; margin: 14px 0; }
  .section-body li { margin-bottom: 8px; font-size: 14px; }
  .section-body hr { border: none; border-top: 1px solid #eee; margin: 28px 0; }
  .section-body table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  .section-body th { text-align: left; padding: 10px 14px; background: ${accentLight}; font-weight: 600; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: ${accentDark}; border-bottom: 2px solid var(--brand-primary); }
  .section-body td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
  .section-body tr:hover td { background: #fafafa; }

  .section-divider { height: 1px; background: #f0f0f0; margin-bottom: 56px; }

  /* Footer */
  .footer { display: flex; margin-top: 40px; border-top: 1px solid #f0f0f0; }
  .footer-left { background: var(--brand-primary); color: rgba(255,255,255,0.7); padding: 20px 24px; font-size: 11px; width: 33.333%; position: fixed; bottom: 0; left: 0; }
  .footer-right { padding: 20px 0; font-size: 11px; color: #bbb; margin-left: auto; }`;

  const body = `<div class="wrapper">
  <div class="left-panel">
    ${logoBase64 ? `<div class="logo-area"><img src="${logoBase64}" alt="${companyName}"/></div>` : ''}
    <div class="doc-type">${contentType}</div>
    <div class="doc-title">${contentType} for ${prospect.companyName}</div>
    <div class="doc-prospect">${prospect.industry ? prospect.industry : ''}${prospect.companySize ? ` &middot; ${prospect.companySize}` : ''}</div>
    ${prospectLogoBase64 ? `<div class="prospect-logo"><img src="${prospectLogoBase64}" alt="${prospect.companyName}"/></div>` : ''}
    <div class="nav-dots">
      ${sectionNav}
    </div>
    <div class="left-footer">${dateStr}</div>
  </div>
  <div class="right-panel">
    <div class="right-content">
      ${sections.map((s, i) => `${i > 0 ? '<div class="section-divider"></div>' : ''}
      <div class="section">
        <h2 class="section-title">${s.title}</h2>
        <div class="section-body">${formatMarkdown(s.content)}</div>
      </div>`).join('\n      ')}
      <div class="footer-right">${companyName} &nbsp;|&nbsp; ${dateStr} &nbsp;|&nbsp; Generated by ContentForg</div>
    </div>
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
  return `<div style="width:1000px;height:1294px;display:flex;font-family:'Inter',sans-serif;box-sizing:border-box;">
  <div style="width:33.333%;background:${accentColor};padding:50px 30px;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="width:50px;height:10px;background:rgba(255,255,255,0.5);border-radius:2px;margin-bottom:40px;"></div>
    <div style="font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:8px;">Case Study</div>
    <div style="font-family:Georgia,serif;font-size:18px;color:#fff;line-height:1.3;margin-bottom:50px;">Document Title</div>
    <div style="display:flex;flex-direction:column;gap:20px;margin-top:20px;">
      ${[1,2,3,4].map(() => `<div style="display:flex;align-items:center;gap:10px;"><div style="width:8px;height:8px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);flex-shrink:0;"></div><div style="font-size:9px;color:rgba(255,255,255,0.5);">Section</div></div>`).join('\n      ')}
    </div>
  </div>
  <div style="width:66.667%;background:#fff;padding:50px 44px;box-sizing:border-box;">
    <div style="font-family:Georgia,serif;font-size:17px;color:${accentColor};margin-bottom:16px;">Section Title</div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:90%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:95%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:80%;margin-bottom:36px;"></div>
    <div style="height:1px;background:#f0f0f0;margin-bottom:36px;"></div>
    <div style="font-family:Georgia,serif;font-size:17px;color:${accentColor};margin-bottom:16px;">Next Section</div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:100%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:88%;margin-bottom:7px;"></div>
    <div style="height:8px;background:#f0f0f0;border-radius:2px;width:93%;margin-bottom:7px;"></div>
  </div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style02SplitPanel: DocumentStyle = {
  id: 'style-02',
  name: 'Split Panel',
  category: 'clean',
  description: 'Two-panel layout with accent sidebar navigation and clean content area',
  keywords: ['split', 'sidebar', 'panel', 'navigation', 'two-column', 'modern', 'professional'],
  render,
  thumbnail,
};

export default style02SplitPanel;
