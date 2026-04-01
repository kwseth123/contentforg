import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, brandFonts, brandLogoHtml, formatMarkdown, wrapDocument } from './shared';

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sectionsHtml = sections.map(s => `
    <div class="section">
      <h2 class="section-title">${s.title}</h2>
      <div class="section-content">${formatMarkdown(s.content)}</div>
    </div>
  `).join('');

  const css = `
    ${brandCSSVars(brand)}
    body {
      font-family: var(--brand-font-secondary), -apple-system, sans-serif;
      color: var(--brand-text);
      background: #FEFDFB;
      line-height: 1.75;
      font-size: var(--brand-font-body-size);
      -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 840px; margin: 0 auto; padding: 72px 56px 56px; }
    .header { margin-bottom: 56px; }
    .logo-row { margin-bottom: 40px; }
    .meta-label {
      font-family: var(--brand-font-secondary);
      font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--brand-accent);
      margin-bottom: 12px;
    }
    .headline {
      font-family: var(--brand-font-primary), Georgia, 'Times New Roman', serif;
      font-size: calc(var(--brand-font-h1-size) + 4px);
      font-weight: 700; color: #1a1a1a;
      line-height: 1.12; margin-bottom: 16px;
    }
    .subtitle {
      font-family: var(--brand-font-secondary);
      font-size: 16px; color: #777;
    }
    .accent-rule {
      width: 80px; height: 3px;
      background: var(--brand-accent);
      margin: 24px 0 0;
    }
    .section { margin-bottom: 48px; }
    .section-title {
      font-family: var(--brand-font-secondary);
      font-size: 13px; font-weight: 600;
      letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--brand-accent);
      margin-bottom: 16px; padding-bottom: 10px;
      border-bottom: 1px solid #EDE9E3;
      font-variant: small-caps;
    }
    .section-content p { margin-bottom: 16px; }
    .section-content h1, .section-content h2 {
      font-family: var(--brand-font-primary), Georgia, serif;
      color: #1a1a1a; margin: 28px 0 10px;
      font-size: var(--brand-font-h2-size);
      font-weight: 700;
    }
    .section-content h3 {
      font-family: var(--brand-font-primary), Georgia, serif;
      color: #333; margin: 22px 0 8px;
      font-size: var(--brand-font-h3-size);
      font-weight: 600;
    }
    .section-content h4 {
      font-family: var(--brand-font-secondary);
      color: #555; margin: 16px 0 6px;
      font-size: 14px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .section-content strong { font-weight: 600; color: #111; }
    .section-content em { font-style: italic; }
    .section-content ul, .section-content ol { padding-left: 24px; margin: 12px 0; }
    .section-content li { margin-bottom: 6px; }
    .section-content li::marker { color: var(--brand-accent); }
    .section-content hr { border: none; border-top: 1px solid #EDE9E3; margin: 24px 0; }
    .section-content table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .section-content th {
      text-align: left; padding: 10px 12px;
      border-bottom: 2px solid var(--brand-accent);
      font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--brand-accent);
    }
    .section-content td { padding: 10px 12px; border-bottom: 1px solid #EDE9E3; }
    /* Decorative quotation marks for testimonial-like content */
    .section-content blockquote,
    .section-content p:first-child em:first-child {
      position: relative;
    }
    .section:nth-child(even) .section-content > p:first-child::before {
      content: '\\201C';
      font-family: Georgia, serif;
      font-size: 64px; font-weight: 700;
      color: var(--brand-accent); opacity: 0.2;
      position: absolute; left: -8px; top: -20px;
      line-height: 1;
    }
    .section:nth-child(even) .section-content > p:first-child {
      position: relative; padding-left: 32px;
    }
    .footer {
      margin-top: 64px; padding-top: 24px;
      border-top: 1px solid #EDE9E3;
      font-size: 11px; color: #bbb;
      text-align: center; letter-spacing: 0.03em;
    }
  `;

  const body = `
    <div class="page">
      <div class="header">
        <div class="logo-row">${brandLogoHtml(input, 'height:36px;')}</div>
        <div class="meta-label">${contentType.replace(/-/g, ' ')}${prospect.industry ? ` &mdash; ${prospect.industry}` : ''}</div>
        <h1 class="headline">${contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} for ${prospect.companyName}</h1>
        <div class="subtitle">Prepared for ${prospect.companyName}${prospect.companySize ? ` &middot; ${prospect.companySize}` : ''}</div>
        <div class="accent-rule"></div>
      </div>
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
  return `<div style="width:100%;height:100%;background:#FEFDFB;border-radius:6px;overflow:hidden;font-family:Georgia,serif;padding:12px;">
    <div style="width:30%;height:6px;background:#ddd;border-radius:2px;margin-bottom:8px;"></div>
    <div style="font-size:6px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${accentColor};margin-bottom:4px;">Case Study</div>
    <div style="font-size:14px;font-weight:700;color:#111;line-height:1.1;margin-bottom:6px;font-family:Georgia,serif;">Bold Serif Title</div>
    <div style="width:50px;height:2px;background:${accentColor};margin-bottom:10px;"></div>
    <div style="font-size:6px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${accentColor};margin-bottom:6px;font-variant:small-caps;">Section One</div>
    <div style="position:relative;padding-left:14px;">
      <div style="position:absolute;left:0;top:-8px;font-size:28px;color:${accentColor};opacity:0.2;font-family:Georgia,serif;">&ldquo;</div>
      <div style="width:100%;height:3px;background:#EDE9E3;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:85%;height:3px;background:#EDE9E3;border-radius:1px;margin-bottom:3px;"></div>
      <div style="width:92%;height:3px;background:#EDE9E3;border-radius:1px;"></div>
    </div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style11BoldSerif: DocumentStyle = {
  id: 'style-11',
  name: 'Bold Serif',
  category: 'bold',
  description: 'Large serif headlines with sans body — premium consulting feel',
  keywords: ['serif', 'bold', 'consulting', 'premium', 'sophisticated'],
  render,
  thumbnail,
};

export default style11BoldSerif;
