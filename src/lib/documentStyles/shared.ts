// ════════════════════════════════════════════════════════
// Shared utilities for document style renderers
// ════════════════════════════════════════════════════════

import { BrandVars, StyleInput } from './types';

// Default brand when none provided
const DEFAULT_BRAND: BrandVars = {
  primary: '#1e293b',
  secondary: '#4a4ae0',
  accent: '#f59e0b',
  background: '#ffffff',
  text: '#334155',
  fontPrimary: 'Inter',
  fontSecondary: 'Inter',
  h1Size: 37, // 28pt → px
  h2Size: 24, // 18pt → px
  h3Size: 19, // 14pt → px
  bodySize: 15, // 11pt → px
  documentStyle: 'modern',
  logoPlacement: 'top-left',
};

/**
 * Resolve brand from StyleInput — uses brand if provided, falls back to accentColor-derived defaults
 */
export function resolveBrand(input: StyleInput): BrandVars {
  if (input.brand) return input.brand;
  return {
    ...DEFAULT_BRAND,
    primary: input.accentColor,
    secondary: input.accentColor,
    accent: input.accentColor,
  };
}

/**
 * Build CSS custom property block from BrandVars
 */
export function brandCSSVars(brand: BrandVars): string {
  return `
    :root {
      --brand-primary: ${brand.primary};
      --brand-secondary: ${brand.secondary};
      --brand-accent: ${brand.accent};
      --brand-background: ${brand.background};
      --brand-text: ${brand.text};
      --brand-font-primary: '${brand.fontPrimary}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --brand-font-secondary: '${brand.fontSecondary}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --brand-font-h1-size: ${brand.h1Size}px;
      --brand-font-h2-size: ${brand.h2Size}px;
      --brand-font-h3-size: ${brand.h3Size}px;
      --brand-font-body-size: ${brand.bodySize}px;
    }
  `;
}

/**
 * Get the fonts array for Google Fonts loading from a brand
 */
export function brandFonts(brand: BrandVars): string[] {
  const fonts = [brand.fontPrimary];
  if (brand.fontSecondary && brand.fontSecondary !== brand.fontPrimary) {
    fonts.push(brand.fontSecondary);
  }
  return fonts;
}

/**
 * Build the logo HTML based on brand placement
 */
export function brandLogoHtml(input: StyleInput, style?: string): string {
  if (input.logoBase64) {
    const styleStr = style || 'height:40px;';
    return `<img src="${input.logoBase64}" alt="${input.companyName}" style="${styleStr}">`;
  }
  // Wordmark fallback
  return `<span style="font-family:var(--brand-font-primary);font-weight:700;font-size:18px;color:var(--brand-primary);">${input.companyName}</span>`;
}

/**
 * Converts markdown text to HTML.
 * Supports headings, bold, italic, lists, tables, horizontal rules, and paragraphs.
 */
export function formatMarkdown(text: string): string {
  // Escape HTML entities first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // ── Headings: ### → h3, ## → h2, # → h1 (must process longest prefix first) ──
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // ── Horizontal rules: --- or *** or ___ ──
  html = html.replace(/^[-*_]{3,}\s*$/gm, '<hr/>');

  // ── Bold + Italic: ***text*** ──
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // ── Bold: **text** ──
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // ── Italic: *text* (but not inside already-converted tags) ──
  html = html.replace(/(?<!\w)\*(?!\*)(.+?)(?<!\*)\*(?!\w)/g, '<em>$1</em>');

  // ── Unordered bullet points: lines starting with - or * or • ──
  html = html.replace(/^[•]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^[-]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> blocks in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gm, '<ul>$1</ul>');

  // ── Numbered lists: 1. text ──
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>');
  html = html.replace(/((?:<li class="ol-item">.*?<\/li>\s*)+)/gm, '<ol>$1</ol>');

  // ── Markdown tables: | col1 | col2 | ──
  html = html.replace(/((?:^\|.+\|[ \t]*$\n?)+)/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return tableBlock;

    const isSeparator = (row: string) => /^\|[\s\-:| ]+\|$/.test(row.trim());
    const hasSeparator = rows.length >= 2 && isSeparator(rows[1]);

    const parseRow = (row: string): string[] => {
      return row.trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim());
    };

    let tableHtml = '<table>';

    if (hasSeparator) {
      const headerCells = parseRow(rows[0]);
      tableHtml += '<thead><tr>' + headerCells.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
      const bodyRows = rows.slice(2);
      if (bodyRows.length > 0) {
        tableHtml += '<tbody>';
        for (const row of bodyRows) {
          const cells = parseRow(row);
          tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
        tableHtml += '</tbody>';
      }
    } else {
      tableHtml += '<tbody>';
      for (const row of rows) {
        const cells = parseRow(row);
        tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
      tableHtml += '</tbody>';
    }

    tableHtml += '</table>';
    return tableHtml;
  });

  // ── Paragraphs: double newlines become paragraph breaks ──
  html = html.replace(/\n\n+/g, '</p><p>');
  // ── Single newlines become line breaks ──
  html = html.replace(/\n/g, '<br/>');

  // Wrap in paragraph
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs and paragraphs wrapping block elements
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<h[1-4])/g, '$1');
  html = html.replace(/(<\/h[1-4]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<hr[^>]*\/?>)/g, '$1');
  html = html.replace(/(<hr[^>]*\/?>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ul)/g, '$1');
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ol)/g, '$1');
  html = html.replace(/(<\/ol>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<table)/g, '$1');
  html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');

  return html;
}

/**
 * Convert hex color string to RGB components.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Lighten a hex color by a given amount (0-1).
 */
export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

/**
 * Darken a hex color by a given amount (0-1).
 */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/**
 * Returns '#FFFFFF' or '#111111' depending on which has better contrast
 * against the given background color.
 */
export function contrastText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Relative luminance (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111111' : '#FFFFFF';
}

/**
 * Returns CSS class definitions for professional symbols used in place of emojis.
 * Templates should include this CSS when documentStyleMode is 'professional'.
 */
export function professionalSymbolCSS(accent: string): string {
  return `
    /* Professional Symbol System */
    .pro-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .pro-icon-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${accent};
    }
    .pro-icon-square {
      width: 6px;
      height: 6px;
      background: ${accent};
    }
    .pro-icon-line {
      width: 16px;
      height: 2px;
      background: ${accent};
    }
    .pro-icon-check svg {
      width: 14px;
      height: 14px;
      stroke: ${accent};
      stroke-width: 2.5;
      fill: none;
    }
    .pro-icon-warning svg {
      width: 14px;
      height: 14px;
      stroke: #d97706;
      stroke-width: 2;
      fill: none;
    }
    .pro-icon-arrow svg {
      width: 12px;
      height: 12px;
      stroke: ${accent};
      stroke-width: 2.5;
      fill: none;
    }
    .pro-status-green { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
    .pro-status-yellow { width: 8px; height: 8px; border-radius: 50%; background: #eab308; }
    .pro-status-red { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
    .pro-rating-filled { width: 10px; height: 10px; border-radius: 50%; background: ${accent}; display: inline-block; margin-right: 3px; }
    .pro-rating-empty { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid ${accent}; display: inline-block; margin-right: 3px; }

    /* Section headers with professional accents */
    .pro-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .pro-section-header::before {
      content: '';
      display: block;
      width: 4px;
      height: 24px;
      background: ${accent};
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* Professional bullet lists */
    ul.pro-list {
      list-style: none;
      padding-left: 0;
    }
    ul.pro-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 8px;
    }
    ul.pro-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${accent};
    }

    /* Professional callout boxes */
    .pro-callout {
      border-left: 3px solid ${accent};
      padding: 16px 20px;
      background: rgba(0,0,0,0.02);
      border-radius: 0 8px 8px 0;
      margin: 16px 0;
    }
  `;
}

/**
 * Strip all emoji characters from text, replacing with clean alternatives.
 */
export function stripEmojis(text: string): string {
  // Remove emoji characters (Unicode ranges for common emojis)
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // misc symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transport/map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // variation selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // supplemental symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // chess symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // extended symbols
    .replace(/[\u{200D}]/gu, '')            // zero width joiner
    .replace(/\s{2,}/g, ' ')               // collapse double spaces
    .trim();
}

/**
 * Build a Google Fonts stylesheet link for the given font families.
 */
export function buildGoogleFontsLink(...fonts: string[]): string {
  const families = fonts
    .filter(Boolean)
    .map(f => f.replace(/\s+/g, '+') + ':wght@300;400;500;600;700')
    .join('&family=');
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${families}&display=swap">`;
}

/**
 * Renders a one-pager layout. This is a specialized layout that forces content
 * to fit on exactly one page with proper visual hierarchy.
 * Used by all style renderers when contentType === 'solution-one-pager'.
 */
export function renderOnePager(input: StyleInput, brand: BrandVars): {
  heroHtml: string;
  statsHtml: string;
  challengeHtml: string;
  solutionHtml: string;
  whyUsHtml: string;
  proofHtml: string;
} {
  const sections = input.sections;

  const findSection = (name: string) =>
    sections.find(s => s.title.toLowerCase().includes(name.toLowerCase()))?.content || '';

  const heroContent = findSection('Hero');
  const metricsContent = findSection('Metrics') || findSection('Key Metrics') || findSection('Stats');
  const challengeContent = findSection('Challenge');
  const solutionContent = findSection('Solution');
  const whyUsContent = findSection('Why Us') || findSection('Why');
  const proofContent = findSection('Proof') || findSection('Quote') || findSection('Testimonial');

  // Parse metrics into structured data
  const metrics = metricsContent.split('\n')
    .filter(line => line.trim())
    .slice(0, 3)
    .map(line => {
      // Try "NUMBER | LABEL" format
      const pipeMatch = line.match(/^[*-]?\s*\**(.+?)\**\s*[|:]\s*(.+)$/);
      if (pipeMatch) return { value: pipeMatch[1].trim().replace(/\*+/g, ''), label: pipeMatch[2].trim().replace(/\*+/g, '') };
      // Try "**NUMBER** descriptive text"
      const boldMatch = line.match(/\*\*(.+?)\*\*\s*(.+)/);
      if (boldMatch) return { value: boldMatch[1].trim(), label: boldMatch[2].trim() };
      return { value: line.trim().replace(/^[*-]\s*/, ''), label: '' };
    });

  const heroHtml = `<div class="onepager-hero">${formatMarkdown(heroContent)}</div>`;

  const statsHtml = `<div class="onepager-stats">${metrics.map(m => `
    <div class="onepager-stat">
      <div class="onepager-stat-value">${m.value}</div>
      <div class="onepager-stat-label">${m.label}</div>
    </div>
  `).join('')}</div>`;

  const challengeHtml = `<div class="onepager-challenge">${formatMarkdown(challengeContent)}</div>`;
  const solutionHtml = `<div class="onepager-solution">${formatMarkdown(solutionContent)}</div>`;

  const whyUsHtml = `<div class="onepager-whyus">${formatMarkdown(whyUsContent)}</div>`;
  const proofHtml = `<div class="onepager-proof">${formatMarkdown(proofContent)}</div>`;

  return { heroHtml, statsHtml, challengeHtml, solutionHtml, whyUsHtml, proofHtml };
}

/**
 * CSS for the one-pager layout components. Styles can override these with their own theme.
 */
export function onePagerCSS(brand: BrandVars): string {
  const accent = brand.accent || brand.primary;
  const lightAccent = lighten(accent, 0.92);
  const textOnAccent = contrastText(accent);

  return `
    @page { margin: 0; size: letter; }

    .onepager-wrapper {
      width: 100%;
      max-width: 8.5in;
      min-height: 11in;
      max-height: 11in;
      overflow: hidden;
      margin: 0 auto;
      font-family: var(--brand-font-primary);
      color: ${brand.text};
      background: ${brand.background};
      display: flex;
      flex-direction: column;
    }

    /* Header band */
    .onepager-header {
      background: ${brand.primary};
      color: ${textOnAccent};
      padding: 24px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .onepager-header-logo img { height: 28px; }
    .onepager-header-right {
      text-align: right;
      font-size: 12px;
      opacity: 0.9;
    }
    .onepager-header-right .prospect-name {
      font-weight: 700;
      font-size: 14px;
      opacity: 1;
    }

    /* Hero section */
    .onepager-hero {
      padding: 28px 40px 16px;
    }
    .onepager-hero h1, .onepager-hero p:first-child {
      font-size: 22px;
      font-weight: 800;
      line-height: 1.2;
      color: ${brand.primary};
      margin: 0 0 8px;
    }
    .onepager-hero p {
      font-size: 13px;
      line-height: 1.5;
      color: ${brand.text};
      margin: 0;
    }

    /* Stat bar */
    .onepager-stats {
      display: flex;
      gap: 16px;
      padding: 0 40px 20px;
    }
    .onepager-stat {
      flex: 1;
      background: ${lightAccent};
      border-radius: 8px;
      padding: 16px 20px;
      text-align: center;
    }
    .onepager-stat-value {
      font-size: 28px;
      font-weight: 800;
      color: ${accent};
      line-height: 1.1;
    }
    .onepager-stat-label {
      font-size: 11px;
      color: ${brand.text};
      opacity: 0.7;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Two-column body */
    .onepager-body {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
      padding: 0 40px 20px;
      flex: 1;
    }

    .onepager-left {}

    .onepager-challenge, .onepager-solution {
      margin-bottom: 16px;
    }
    .onepager-challenge ul, .onepager-solution ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .onepager-challenge li, .onepager-solution li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 6px;
      font-size: 12px;
      line-height: 1.5;
    }
    .onepager-challenge li::before, .onepager-solution li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 7px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${accent};
    }
    .onepager-challenge strong, .onepager-solution strong {
      color: ${brand.primary};
    }

    /* Why Us sidebar */
    .onepager-whyus {
      background: #ffffff;
      border-left: 3px solid ${accent};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 16px;
    }
    .onepager-whyus p, .onepager-whyus li {
      font-size: 12px;
      line-height: 1.5;
      margin-bottom: 6px;
    }
    .onepager-whyus strong { color: ${brand.primary}; }
    .onepager-whyus ul { list-style: none; padding: 0; margin: 0; }
    .onepager-whyus li { padding-left: 0; margin-bottom: 6px; }

    /* Proof quote */
    .onepager-proof {
      background: #f8f9fa;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
      font-style: italic;
      color: #555;
    }
    .onepager-proof p { margin: 0; }

    /* Footer band */
    .onepager-footer {
      background: ${brand.primary};
      color: ${textOnAccent};
      padding: 14px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      opacity: 0.9;
      margin-top: auto;
    }
  `;
}

/**
 * Build a complete one-pager HTML document. Can be used by any style that wants
 * the standard one-pager layout with its own color overrides.
 */
export function buildOnePagerDocument(input: StyleInput, brand: BrandVars, extraCss?: string): string {
  const parts = renderOnePager(input, brand);
  const dateStr = input.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const headerLogo = input.logoBase64
    ? `<div class="onepager-header-logo"><img src="${input.logoBase64}" alt="${input.companyName}"></div>`
    : `<div class="onepager-header-logo" style="font-weight:700;font-size:16px;">${input.companyName}</div>`;

  const body = `
    <div class="onepager-wrapper">
      <div class="onepager-header">
        ${headerLogo}
        <div class="onepager-header-right">
          <div class="prospect-name">${input.prospect.companyName}</div>
          <div>Solution Overview | ${dateStr}</div>
        </div>
      </div>

      ${parts.heroHtml}
      ${parts.statsHtml}

      <div class="onepager-body">
        <div class="onepager-left">
          ${parts.challengeHtml}
          ${parts.solutionHtml}
        </div>
        <div class="onepager-right">
          ${parts.whyUsHtml}
          ${parts.proofHtml}
        </div>
      </div>

      <div class="onepager-footer">
        <div>${input.companyName} | ${input.companyDescription || ''}</div>
        <div>${input.prospect.companyName ? 'Prepared for ' + input.prospect.companyName : ''}</div>
        <div>${dateStr}</div>
      </div>
    </div>
  `;

  const css = onePagerCSS(brand) + (extraCss || '');
  const fonts = [brand.fontPrimary];
  if (brand.fontSecondary !== brand.fontPrimary) fonts.push(brand.fontSecondary);

  return wrapDocument({
    title: `${input.companyName} - Solution Overview - ${input.prospect.companyName}`,
    css,
    body,
    fonts,
  });
}

/**
 * Wrap content in a complete HTML document.
 */
export function wrapDocument(opts: {
  title: string;
  css: string;
  body: string;
  fonts?: string[];
}): string {
  const fontsLink = opts.fonts && opts.fonts.length > 0
    ? buildGoogleFontsLink(...opts.fonts)
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  ${fontsLink}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ${opts.css}
  </style>
</head>
<body>
  ${opts.body}
</body>
</html>`;
}
