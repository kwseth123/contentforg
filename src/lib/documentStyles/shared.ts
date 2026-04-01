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
