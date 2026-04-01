// ════════════════════════════════════════════════════════
// Style 27 — Timeline
// Vertical timeline with milestone markers, phase colors,
// checkbox milestones — built for implementation plans
// ════════════════════════════════════════════════════════

import type { DocumentStyle, StyleInput } from './types';
import {
  resolveBrand,
  brandCSSVars,
  brandFonts,
  brandLogoHtml,
  formatMarkdown,
  wrapDocument,
  lighten,
  contrastText,
} from './shared';

// ── Phase color rotation ────────────────────────────────

function phaseColor(brand: { primary: string; secondary: string; accent: string }, idx: number): string {
  const colors = [brand.primary, brand.secondary, brand.accent];
  return colors[idx % colors.length];
}

// ── Extract milestones from content ─────────────────────

function extractMilestones(content: string): string[] {
  const milestones: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      milestones.push(trimmed.replace(/^[-*•]\s+/, ''));
    }
  }
  return milestones.slice(0, 8);
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);
  const { sections, contentType, prospect, companyName, date } = input;
  const dateStr =
    date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const sectionsHtml = sections
    .map((s, i) => {
      const color = phaseColor(brand, i);
      const milestones = extractMilestones(s.content);

      const milestonesHtml =
        milestones.length > 0
          ? `<div class="milestones">
              ${milestones
                .map(
                  m => `<div class="milestone-item">
                  <span class="milestone-check" style="border-color:${color};">&#10003;</span>
                  <span class="milestone-text">${m}</span>
                </div>`,
                )
                .join('')}
            </div>`
          : '';

      return `
      <div class="tl-entry">
        <div class="tl-marker-col">
          <div class="tl-dot" style="background:${color};"></div>
          ${i < sections.length - 1 ? '<div class="tl-line"></div>' : ''}
        </div>
        <div class="tl-content">
          <div class="tl-phase-label" style="color:${color};">Phase ${i + 1}</div>
          <h2 class="tl-title">${s.title}</h2>
          <div class="tl-body">${formatMarkdown(s.content)}</div>
          ${milestonesHtml}
        </div>
      </div>`;
    })
    .join('');

  const css = `
    ${brandCSSVars(brand)}

    body {
      font-family: var(--brand-font-secondary);
      color: var(--brand-text);
      background: #fafbfc;
      line-height: 1.7;
      font-size: var(--brand-font-body-size);
    }
    .page { max-width: 820px; margin: 0 auto; padding: 56px 48px; }

    /* ── Header ── */
    .tl-header {
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid #e0e0e0;
    }
    .tl-header-logo { margin-bottom: 24px; }
    .tl-header h1 {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h1-size);
      font-weight: 700;
      color: #111;
      margin-bottom: 8px;
    }
    .tl-header-sub { font-size: 15px; color: #777; }

    /* ── Timeline structure ── */
    .tl-entry {
      display: flex;
      gap: 28px;
      min-height: 100px;
    }
    .tl-marker-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 24px;
    }
    .tl-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
      z-index: 1;
    }
    .tl-line {
      width: 2px;
      flex: 1;
      background: var(--brand-primary);
      opacity: 0.2;
    }

    /* ── Content block ── */
    .tl-content {
      flex: 1;
      padding-bottom: 40px;
    }
    .tl-phase-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .tl-title {
      font-family: var(--brand-font-primary);
      font-size: var(--brand-font-h2-size);
      font-weight: 600;
      color: #111;
      margin-bottom: 14px;
    }
    .tl-body { color: #444; }
    .tl-body h1, .tl-body h2, .tl-body h3, .tl-body h4 {
      color: #111;
      margin: 16px 0 8px;
    }
    .tl-body h1 { font-size: 20px; }
    .tl-body h2 { font-size: 17px; }
    .tl-body h3 { font-size: 15px; }
    .tl-body ul, .tl-body ol { padding-left: 22px; margin: 10px 0; }
    .tl-body li { margin-bottom: 5px; }
    .tl-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 13px;
    }
    .tl-body th {
      background: ${lighten(brand.primary, 0.92)};
      font-weight: 600;
      padding: 10px 12px;
      border-bottom: 2px solid var(--brand-primary);
      text-align: left;
    }
    .tl-body td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .tl-body hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
    .tl-body strong { font-weight: 600; }
    .tl-body em { font-style: italic; }

    /* ── Milestones ── */
    .milestones {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px dashed #ddd;
    }
    .milestone-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .milestone-check {
      width: 20px;
      height: 20px;
      border: 2px solid #ccc;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #aaa;
      flex-shrink: 0;
    }
    .milestone-text {
      font-size: 13px;
      color: #555;
    }

    /* ── Footer ── */
    .tl-footer {
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #e0e0e0;
      padding-top: 24px;
      margin-top: 24px;
    }
  `;

  const title = contentType
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const body = `
    <div class="page">
      <div class="tl-header">
        <div class="tl-header-logo">${brandLogoHtml(input)}</div>
        <h1>${title}</h1>
        <div class="tl-header-sub">Implementation plan for ${prospect.companyName} &middot; ${dateStr}</div>
      </div>

      ${sectionsHtml}

      <div class="tl-footer">
        ${companyName} | ${dateStr} | Generated by ContentForg
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: brandFonts(brand),
  });
}

// ── Thumbnail ──────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#fafbfc;border-radius:6px;overflow:hidden;font-family:sans-serif;position:relative;">
    <div style="padding:8px 12px 6px;">
      <div style="width:50%;height:6px;background:#111;border-radius:2px;margin-bottom:3px;"></div>
      <div style="width:35%;height:4px;background:#999;border-radius:2px;"></div>
    </div>
    <div style="padding:4px 12px;">
      <div style="display:flex;gap:8px;">
        <div style="display:flex;flex-direction:column;align-items:center;width:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${accentColor};"></div>
          <div style="width:2px;flex:1;background:${accentColor};opacity:0.2;"></div>
        </div>
        <div style="flex:1;">
          <div style="font-size:6px;color:${accentColor};font-weight:700;margin-bottom:2px;">PHASE 1</div>
          <div style="width:60%;height:4px;background:#222;border-radius:2px;margin-bottom:2px;"></div>
          <div style="width:80%;height:3px;background:#ddd;border-radius:2px;margin-bottom:6px;"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <div style="display:flex;flex-direction:column;align-items:center;width:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${accentColor};opacity:0.7;"></div>
          <div style="width:2px;flex:1;background:${accentColor};opacity:0.2;"></div>
        </div>
        <div style="flex:1;">
          <div style="font-size:6px;color:${accentColor};font-weight:700;margin-bottom:2px;">PHASE 2</div>
          <div style="width:55%;height:4px;background:#222;border-radius:2px;margin-bottom:2px;"></div>
          <div style="width:70%;height:3px;background:#ddd;border-radius:2px;margin-bottom:6px;"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <div style="display:flex;flex-direction:column;align-items:center;width:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${accentColor};opacity:0.5;"></div>
        </div>
        <div style="flex:1;">
          <div style="font-size:6px;color:${accentColor};font-weight:700;margin-bottom:2px;">PHASE 3</div>
          <div style="width:50%;height:4px;background:#222;border-radius:2px;"></div>
        </div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;padding:4px;color:#999;">Timeline</div>
  </div>`;
}

// ── Export ──────────────────────────────────────────────────

const style27Timeline: DocumentStyle = {
  id: 'style-27',
  name: 'Timeline',
  category: 'creative',
  description: 'Vertical timeline with milestone markers and phase-coded colors',
  keywords: ['timeline', 'milestones', 'chronological', 'implementation', 'phases'],
  render,
  thumbnail,
};

export default style27Timeline;
