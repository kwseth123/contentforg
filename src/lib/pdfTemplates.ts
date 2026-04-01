import { ContentType, KnowledgeBase, ProspectInfo, GeneratedSection, BrandGuidelines, BrandColors, CONTENT_TYPE_LABELS, VisualSection } from './types';
import { resolveBrandGuidelines, buildGoogleFontsUrl, getLogoForBackground, ptToPx } from './brandDefaults';
import { visualComponentsCSS, renderVisualSectionHtml } from './visualComponents';
import { LOGO_SVG_MINIMAL, BRAND_NAME } from './brand';

// ════════════════════════════════════════════════════════
// PDF LOGO OPTIONS — base64 overrides for print rendering
// ════════════════════════════════════════════════════════

export interface PDFLogoOptions {
  logoBase64?: string;
  secondaryLogoBase64?: string;
  prospectLogoBase64?: string;
  prospectColor?: string;
}

// ════════════════════════════════════════════════════════
// SECTION ICONS — mapped by keyword matching
// ════════════════════════════════════════════════════════

function sectionIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('overview') || t.includes('executive') || t.includes('summary')) return '📋';
  if (t.includes('challenge') || t.includes('problem') || t.includes('pain')) return '⚡';
  if (t.includes('solution') || t.includes('approach') || t.includes('how it works')) return '🎯';
  if (t.includes('benefit') || t.includes('outcome') || t.includes('result') || t.includes('roi')) return '📈';
  if (t.includes('why') || t.includes('differ') || t.includes('strength') || t.includes('advantage')) return '🏆';
  if (t.includes('competitor') || t.includes('vs') || t.includes('weakness') || t.includes('comparison')) return '⚔️';
  if (t.includes('objection') || t.includes('response') || t.includes('handling')) return '🛡️';
  if (t.includes('proof') || t.includes('case') || t.includes('customer') || t.includes('testimonial')) return '✅';
  if (t.includes('next step') || t.includes('action') || t.includes('getting started') || t.includes('cta')) return '🚀';
  if (t.includes('invest') || t.includes('pricing') || t.includes('cost')) return '💰';
  if (t.includes('strategy') || t.includes('closing') || t.includes('recommend')) return '🧭';
  if (t.includes('landmine') || t.includes('question')) return '💣';
  if (t.includes('quick fact') || t.includes('at a glance')) return '📊';
  if (t.includes('email') || t.includes('cold') || t.includes('open') || t.includes('break')) return '✉️';
  if (t.includes('value') || t.includes('add')) return '💎';
  if (t.includes('social') || t.includes('proof')) return '👥';
  if (t.includes('who we are') || t.includes('about')) return '🏢';
  if (t.includes('verdict')) return '⚖️';
  return '📌';
}

// ════════════════════════════════════════════════════════
// STAT EXTRACTION — pull key metrics from content
// ════════════════════════════════════════════════════════

interface StatCard {
  value: string;
  label: string;
}

function extractStats(sections: GeneratedSection[]): StatCard[] {
  const allText = sections.map(s => s.content).join(' ');
  const stats: StatCard[] = [];

  // Match patterns like "75% reduction", "99.9% accuracy", "$2M savings", "2-4 weeks"
  const patterns = [
    /(\d+[\.\d]*%)\s+([\w\s]+?)(?=[,\.\n])/gi,
    /(\$[\d\.,]+[KMB]?)\s+([\w\s]+?)(?=[,\.\n])/gi,
    /(\d+[-–]\d+\s+(?:week|day|month|hour|minute)s?)\s*([\w\s]*?)(?=[,\.\n])/gi,
    /(\d+[xX])\s+([\w\s]+?)(?=[,\.\n])/gi,
    /(\d+\+?\s+(?:customer|client|user|partner|integration)s?)\b/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(allText)) !== null && stats.length < 4) {
      if (match[2]) {
        stats.push({ value: match[1].trim(), label: match[2].trim().slice(0, 30) });
      } else {
        stats.push({ value: match[1].trim(), label: '' });
      }
    }
  }

  // If we didn't find enough, add generic ones from the section count
  if (stats.length === 0) {
    stats.push(
      { value: String(sections.length), label: 'Key Sections' },
      { value: '✓', label: 'Fully Customized' },
      { value: '★', label: 'AI-Optimized' },
    );
  }

  return stats.slice(0, 4);
}

// ════════════════════════════════════════════════════════
// CONTENT FORMATTING — convert markdown-ish to HTML
// ════════════════════════════════════════════════════════

function formatContent(text: string): string {
  // Escape HTML entities first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // ── Headings: ### → h3, ## → h2, # → h1 (must process longest prefix first) ──
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="pdf-h4">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="pdf-h3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="pdf-h2">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="pdf-h1">$1</h1>');

  // ── Horizontal rules: --- or *** or ___ ──
  html = html.replace(/^[-*_]{3,}\s*$/gm, '<hr class="pdf-hr"/>');

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
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gm, '<ul class="pdf-ul">$1</ul>');

  // ── Numbered lists: 1. text ──
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="pdf-ol-item">$1</li>');
  html = html.replace(/((?:<li class="pdf-ol-item">.*?<\/li>\s*)+)/gm, '<ol class="pdf-ol">$1</ol>');

  // ── Markdown tables: | col1 | col2 | ──
  html = html.replace(/((?:^\|.+\|[ \t]*$\n?)+)/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return tableBlock; // need at least header + separator

    // Check if second row is a separator (|---|---|)
    const isSeparator = (row: string) => /^\|[\s\-:| ]+\|$/.test(row.trim());
    const hasSeparator = rows.length >= 2 && isSeparator(rows[1]);

    const parseRow = (row: string): string[] => {
      return row.trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim());
    };

    let tableHtml = '<table class="pdf-table">';

    if (hasSeparator) {
      // First row is header
      const headerCells = parseRow(rows[0]);
      tableHtml += '<thead><tr>' + headerCells.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
      // Remaining rows (skip separator)
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
      // No separator — all body rows
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

  // Wrap in paragraph, but avoid wrapping block-level elements
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

// ════════════════════════════════════════════════════════
// HELPER: lighten/darken a hex color
// ════════════════════════════════════════════════════════

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// ════════════════════════════════════════════════════════
// CSS GENERATION PER DOCUMENT STYLE
// ════════════════════════════════════════════════════════

function generateCSS(brand: BrandGuidelines): string {
  const style = brand.documentStyle;
  const c = brand.colors;
  const f = brand.fonts;
  const fontsUrl = buildGoogleFontsUrl(f.primary, f.secondary);

  const h1Px = ptToPx(f.sizes.h1);
  const h2Px = ptToPx(f.sizes.h2);
  const h3Px = ptToPx(f.sizes.h3);
  const bodyPx = ptToPx(f.sizes.body);

  const primaryLight = c.primary + '15';
  const primaryMid = c.primary + '30';
  const secondaryLight = c.secondary + '15';
  const secondaryMid = c.secondary + '30';
  const accentLight = c.accent + '15';
  const accentMid = c.accent + '30';

  // Common base styles shared by all variants
  const baseCSS = `
    @import url('${fontsUrl}');

    @page {
      margin: 0;
      size: A4;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: '${f.secondary}', -apple-system, BlinkMacSystemFont, sans-serif;
      color: ${c.text};
      font-size: ${bodyPx}px;
      line-height: 1.6;
      background: ${c.background};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    h1, h2, h3, .hero-title h1, .section-title, .cta-title, .verdict-title {
      font-family: '${f.primary}', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      background: ${c.background};
    }

    @media screen {
      .page { box-shadow: 0 4px 24px rgba(0,0,0,0.12); margin: 20px auto; }
      body { background: #e2e8f0; padding: 20px 0; }
    }

    /* ── Shared table/list/structural resets ── */
    .section-body p { margin-bottom: 10px; }
    .section-body ul { list-style: none; padding: 0; margin: 8px 0; }
    .section-body li { padding: 4px 0 4px 20px; position: relative; }
    .section-body li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: ${c.accent};
      font-weight: 700;
    }
    .section-body strong { color: ${darkenColor(c.text, 0.3)}; }

    /* ── Inline markdown heading/list/hr styles ── */
    .pdf-h1 {
      font-family: '${f.primary}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${h1Px}px;
      font-weight: 700;
      color: ${c.primary};
      margin: 20px 0 10px;
      line-height: 1.3;
    }
    .pdf-h2 {
      font-family: '${f.primary}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${h2Px}px;
      font-weight: 700;
      color: ${c.text};
      margin: 18px 0 8px;
      line-height: 1.3;
    }
    .pdf-h3 {
      font-family: '${f.primary}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${h3Px}px;
      font-weight: 600;
      color: ${c.text};
      margin: 14px 0 6px;
      line-height: 1.3;
    }
    .pdf-h4 {
      font-family: '${f.primary}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${Math.round(bodyPx * 1.1)}px;
      font-weight: 600;
      color: ${c.text};
      margin: 12px 0 4px;
      line-height: 1.4;
    }
    .pdf-hr {
      border: none;
      border-top: 1px solid ${c.primary}30;
      margin: 16px 0;
    }
    .pdf-ul {
      list-style: none;
      padding: 0;
      margin: 8px 0;
    }
    .pdf-ul li {
      padding: 4px 0 4px 20px;
      position: relative;
    }
    .pdf-ul li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: ${c.accent};
      font-weight: 700;
    }
    .pdf-ol {
      list-style: decimal;
      padding-left: 24px;
      margin: 8px 0;
    }
    .pdf-ol li {
      padding: 3px 0;
    }
    .section-body em { font-style: italic; }

    /* ── Markdown table styles ── */
    .pdf-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: ${bodyPx}px;
      table-layout: fixed;
    }
    .pdf-table th {
      background: ${c.primary};
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      font-size: ${Math.round(bodyPx * 0.95)}px;
      letter-spacing: 0.02em;
    }
    .pdf-table th:first-child { border-radius: 6px 0 0 0; }
    .pdf-table th:last-child { border-radius: 0 6px 0 0; }
    .pdf-table td {
      padding: 9px 14px;
      border-bottom: 1px solid ${c.primary}18;
      vertical-align: top;
      line-height: 1.5;
    }
    .pdf-table tbody tr:nth-child(even) {
      background: ${c.primary}08;
    }
    .pdf-table tbody tr:hover {
      background: ${c.primary}12;
    }
    .pdf-table tbody tr:last-child td:first-child { border-radius: 0 0 0 6px; }
    .pdf-table tbody tr:last-child td:last-child { border-radius: 0 0 6px 0; }

    .check { color: #16a34a; font-weight: 700; }
    .cross { color: #dc2626; font-weight: 700; }

    /* ── New Document Header ── */
    .doc-header {
      background: ${c.primary};
      padding: 32px 48px 24px;
      position: relative;
      -webkit-print-color-adjust: exact !important;
    }
    .doc-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .doc-header-logo img {
      max-height: 32px;
    }
    .doc-header-logo-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
    }
    .doc-header-logo-icon {
      width: 24px;
      height: 24px;
      background: ${c.accent};
      border-radius: 4px;
    }
    .doc-header-prospect {
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      text-align: right;
    }
    .doc-header-prospect img {
      max-height: 28px;
    }
    .doc-header-type {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${c.accent};
      font-weight: 600;
      margin-bottom: 6px;
    }
    .doc-header-title {
      color: #ffffff;
      font-size: ${h1Px}px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 6px;
      font-family: '${f.primary}', sans-serif;
    }
    .doc-header-subtitle {
      color: rgba(255,255,255,0.6);
      font-size: 13px;
      font-weight: 400;
    }
    .doc-header-accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: ${c.accent};
    }
    .doc-stat-bar {
      background: #1e293b;
      display: flex;
      justify-content: center;
      padding: 16px 48px;
      gap: 0;
      -webkit-print-color-adjust: exact !important;
    }
    .doc-stat-item {
      flex: 1;
      text-align: center;
      padding: 4px 16px;
      border-right: 1px solid rgba(255,255,255,0.15);
    }
    .doc-stat-item:last-child { border-right: none; }
    .doc-stat-value {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      font-family: '${f.primary}', sans-serif;
    }
    .doc-stat-label {
      color: rgba(255,255,255,0.5);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
  `;

  // ── MODERN VARIANT ──
  if (style === 'modern') {
    return baseCSS + `
    /* ════ MODERN ════ */

    /* Hero */
    .hero {
      background: linear-gradient(135deg, ${c.primary} 0%, ${darkenColor(c.primary, 0.2)} 100%);
      padding: 40px 48px 36px;
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: '';
      position: absolute;
      top: -60px;
      right: -60px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: ${c.accent};
      opacity: 0.08;
    }
    .hero::before {
      content: '';
      position: absolute;
      bottom: -40px;
      left: 30%;
      width: 300px;
      height: 120px;
      border-radius: 50%;
      background: ${c.accent};
      opacity: 0.05;
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }
    .hero-logo img { max-height: 36px; opacity: 0.95; }
    .hero-logo-text { color: #fff; font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
    .hero-prepared {
      text-align: right;
      color: ${lightenColor(c.primary, 0.5)};
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }
    .hero-prepared strong {
      display: block;
      color: #ffffff;
      font-size: 15px;
      letter-spacing: 0;
      text-transform: none;
      margin-top: 4px;
    }
    .hero-title { position: relative; z-index: 1; }
    .hero-title h1 {
      color: #ffffff;
      font-size: ${h1Px}px;
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1.15;
      margin-bottom: 8px;
    }
    .hero-title .subtitle {
      color: ${lightenColor(c.primary, 0.5)};
      font-size: 14px;
      font-weight: 400;
    }
    .hero-accent-bar {
      width: 60px;
      height: 4px;
      background: ${c.accent};
      border-radius: 2px;
      margin-top: 16px;
    }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0;
      background: ${c.background};
      border-bottom: 1px solid ${c.text}15;
    }
    .stat-card {
      padding: 22px 24px;
      text-align: center;
      border-right: 1px solid ${c.text}15;
    }
    .stat-card:last-child { border-right: none; }
    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: ${c.secondary};
      line-height: 1.1;
      margin-bottom: 4px;
      font-family: '${f.primary}', sans-serif;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: ${c.text}99;
      font-weight: 600;
    }

    /* Body */
    .body-content { padding: 36px 48px; }

    /* Sections */
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${c.text}15;
    }
    .section-icon {
      font-size: 18px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${accentLight};
      border-radius: 8px;
      flex-shrink: 0;
    }
    .section-title {
      font-size: ${h2Px}px;
      font-weight: 700;
      color: ${darkenColor(c.text, 0.3)};
      letter-spacing: -0.3px;
    }
    .section-body {
      font-size: ${bodyPx}px;
      line-height: 1.7;
      color: ${c.text};
      border-left: 3px solid ${c.primary}25;
      padding-left: 16px;
    }

    /* Highlight Box */
    .highlight-box {
      background: linear-gradient(135deg, ${secondaryLight}, ${secondaryMid});
      border-left: 4px solid ${c.secondary};
      border-radius: 0 12px 12px 0;
      padding: 20px 24px;
      margin: 24px 0;
      page-break-inside: avoid;
    }
    .highlight-box .section-header { border-bottom-color: ${secondaryMid}; }
    .highlight-box .section-body { color: ${darkenColor(c.text, 0.2)}; border-left: none; padding-left: 0; }

    /* CTA Box */
    .cta-box {
      background: linear-gradient(135deg, ${c.primary} 0%, ${darkenColor(c.primary, 0.2)} 100%);
      border-radius: 12px;
      padding: 28px 32px;
      margin-top: 32px;
      page-break-inside: avoid;
      position: relative;
      overflow: hidden;
    }
    .cta-box::after {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: ${c.accent};
      opacity: 0.1;
    }
    .cta-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }
    .cta-text {
      color: ${lightenColor(c.primary, 0.5)};
      font-size: ${bodyPx}px;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }
    .cta-text strong { color: #ffffff; }
    .cta-text a { color: ${c.accent}; text-decoration: underline; }

    /* Footer */
    .pdf-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 48px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: ${c.text}80;
      border-top: 1px solid ${c.text}15;
      background: ${c.background};
    }

    /* Two Column */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin: 20px 0;
    }
    .col-card {
      border: 1px solid ${c.text}20;
      border-radius: 12px;
      overflow: hidden;
    }
    .col-card-header {
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .col-blue .col-card-header { background: ${c.secondary}; color: #ffffff; }
    .col-gray .col-card-header { background: ${c.text}; color: #ffffff; }
    .col-card-body { padding: 16px; font-size: 12px; line-height: 1.6; }

    /* Comparison Table */
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      border-radius: 8px;
      overflow: hidden;
    }
    .comp-table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .comp-table th:first-child { background: ${c.text}10; color: ${c.text}99; }
    .comp-table th.us { background: ${c.secondary}; color: #ffffff; }
    .comp-table th.them { background: ${c.text}80; color: #ffffff; }
    .comp-table td {
      padding: 10px 16px;
      border-bottom: 1px solid ${c.text}15;
      vertical-align: top;
    }
    .comp-table tr:last-child td { border-bottom: none; }
    .comp-table tr:nth-child(even) td { background: ${c.text}06; }

    /* Email Sequence */
    .email-timeline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      margin-bottom: 20px;
      position: relative;
    }
    .email-timeline::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 30px;
      right: 30px;
      height: 3px;
      background: ${c.text}15;
      z-index: 0;
    }
    .timeline-dot {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${c.accent};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      position: relative;
      z-index: 1;
    }
    .timeline-dot.inactive { background: ${c.text}30; color: ${c.text}60; }
    .email-card {
      border: 1px solid ${c.text}20;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .email-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: ${c.text}06;
      border-bottom: 1px solid ${c.text}15;
    }
    .email-num {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${c.accent};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 15px;
      flex-shrink: 0;
    }
    .email-meta { flex: 1; }
    .email-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: ${c.text}80; font-weight: 600; }
    .email-subject-box {
      background: ${c.background};
      border: 1px solid ${c.accent}40;
      border-radius: 6px;
      padding: 8px 12px;
      margin-top: 4px;
      font-size: 13px;
      font-weight: 600;
      color: ${darkenColor(c.text, 0.2)};
    }
    .email-card-body { padding: 18px; font-size: 12px; line-height: 1.7; }

    /* Verdict Box */
    .verdict-box {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 20px 24px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .verdict-title {
      font-size: 16px;
      font-weight: 800;
      color: #065f46;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .verdict-body { font-size: ${bodyPx}px; color: #064e3b; line-height: 1.6; }

    /* Objection Table */
    .obj-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid ${c.text}20;
    }
    .obj-table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: ${c.primary};
      color: #ffffff;
    }
    .obj-table td {
      padding: 12px 16px;
      border-bottom: 1px solid ${c.text}15;
      vertical-align: top;
    }
    .obj-table tr:nth-child(even) td { background: ${c.text}06; }
    .obj-table td:first-child { font-weight: 600; color: ${darkenColor(c.text, 0.2)}; }
    `;
  }

  // ── CORPORATE VARIANT ──
  if (style === 'corporate') {
    return baseCSS + `
    /* ════ CORPORATE ════ */

    /* Hero */
    .hero {
      background: ${c.primary};
      padding: 32px 48px 28px;
      position: relative;
      border-bottom: 5px solid ${c.accent};
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .hero-logo img { max-height: 32px; }
    .hero-logo-text { color: #fff; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .hero-prepared {
      text-align: right;
      color: ${lightenColor(c.primary, 0.4)};
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .hero-prepared strong {
      display: block;
      color: #ffffff;
      font-size: 14px;
      letter-spacing: 0.3px;
      text-transform: none;
      margin-top: 4px;
    }
    .hero-title {}
    .hero-title h1 {
      color: #ffffff;
      font-size: ${h1Px}px;
      font-weight: 700;
      letter-spacing: 0;
      line-height: 1.2;
      margin-bottom: 6px;
      border-bottom: 1px solid ${lightenColor(c.primary, 0.2)};
      padding-bottom: 10px;
    }
    .hero-title .subtitle {
      color: ${lightenColor(c.primary, 0.45)};
      font-size: 13px;
      font-weight: 400;
      font-style: italic;
    }
    .hero-accent-bar {
      display: none;
    }

    /* Stats — bordered boxes with thick dividers */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0;
      background: ${c.background};
      border-bottom: 3px solid ${c.primary};
    }
    .stat-card {
      padding: 18px 20px;
      text-align: center;
      border-right: 3px solid ${c.primary}30;
    }
    .stat-card:last-child { border-right: none; }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: ${c.secondary};
      line-height: 1.1;
      margin-bottom: 4px;
      font-family: '${f.primary}', Georgia, serif;
    }
    .stat-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${c.text}80;
      font-weight: 700;
    }

    /* Body */
    .body-content { padding: 32px 48px; }

    /* Sections — table-style with full-width structure */
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
      border: 1px solid ${c.text}20;
      border-radius: 2px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 0;
      padding: 10px 16px;
      background: ${c.primary}0A;
      border-bottom: 2px solid ${c.primary}20;
      border-left: 4px solid ${c.primary};
    }
    .section-icon {
      font-size: 16px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border-radius: 0;
      flex-shrink: 0;
    }
    .section-title {
      font-size: ${h2Px}px;
      font-weight: 700;
      color: ${c.primary};
      letter-spacing: 0;
      text-transform: uppercase;
      font-size: ${Math.round(h2Px * 0.85)}px;
      letter-spacing: 0.5px;
    }
    .section-body {
      font-size: ${bodyPx}px;
      line-height: 1.65;
      color: ${c.text};
      padding: 14px 16px;
    }

    /* Highlight Box */
    .highlight-box {
      background: ${c.primary}08;
      border: 1px solid ${c.primary}25;
      border-left: 5px solid ${c.secondary};
      border-radius: 0;
      padding: 20px 24px;
      margin: 24px 0;
      page-break-inside: avoid;
    }
    .highlight-box .section-header {
      background: transparent;
      border-bottom: 1px solid ${c.secondary}30;
      border-left: none;
    }
    .highlight-box .section-body { color: ${c.text}; }

    /* CTA Box */
    .cta-box {
      background: ${c.primary};
      border-radius: 0;
      border-top: 4px solid ${c.accent};
      padding: 24px 28px;
      margin-top: 28px;
      page-break-inside: avoid;
    }
    .cta-title {
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cta-text {
      color: ${lightenColor(c.primary, 0.5)};
      font-size: ${bodyPx}px;
      line-height: 1.6;
    }
    .cta-text strong { color: #ffffff; }
    .cta-text a { color: ${c.accent}; text-decoration: underline; }

    /* Footer */
    .pdf-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px 48px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: ${c.text}70;
      border-top: 2px solid ${c.primary};
      background: ${c.background};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Two Column */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    .col-card {
      border: 1px solid ${c.text}25;
      border-radius: 0;
      overflow: hidden;
    }
    .col-card-header {
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .col-blue .col-card-header { background: ${c.secondary}; color: #ffffff; }
    .col-gray .col-card-header { background: ${c.text}; color: #ffffff; }
    .col-card-body { padding: 14px; font-size: 12px; line-height: 1.6; }

    /* Comparison Table */
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      border: 2px solid ${c.primary};
    }
    .comp-table th {
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .comp-table th:first-child { background: ${c.text}10; color: ${c.text}; }
    .comp-table th.us { background: ${c.secondary}; color: #ffffff; }
    .comp-table th.them { background: ${c.text}80; color: #ffffff; }
    .comp-table td {
      padding: 10px 14px;
      border-bottom: 1px solid ${c.text}20;
      vertical-align: top;
    }
    .comp-table tr:last-child td { border-bottom: none; }
    .comp-table tr:nth-child(even) td { background: ${c.text}05; }

    /* Email Sequence */
    .email-timeline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      margin-bottom: 18px;
      position: relative;
    }
    .email-timeline::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 30px;
      right: 30px;
      height: 2px;
      background: ${c.primary}25;
      z-index: 0;
    }
    .timeline-dot {
      width: 32px;
      height: 32px;
      border-radius: 0;
      background: ${c.primary};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      position: relative;
      z-index: 1;
    }
    .timeline-dot.inactive { background: ${c.text}30; color: ${c.text}60; }
    .email-card {
      border: 1px solid ${c.text}25;
      border-radius: 0;
      margin-bottom: 18px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .email-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: ${c.primary}08;
      border-bottom: 2px solid ${c.primary}20;
    }
    .email-num {
      width: 32px;
      height: 32px;
      border-radius: 0;
      background: ${c.primary};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
    }
    .email-meta { flex: 1; }
    .email-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: ${c.text}70; font-weight: 700; }
    .email-subject-box {
      background: ${c.background};
      border: 1px solid ${c.primary}30;
      border-radius: 0;
      padding: 8px 12px;
      margin-top: 4px;
      font-size: 13px;
      font-weight: 600;
      color: ${c.primary};
    }
    .email-card-body { padding: 16px; font-size: 12px; line-height: 1.65; }

    /* Verdict Box */
    .verdict-box {
      background: ${c.secondary}08;
      border: 2px solid ${c.secondary};
      border-radius: 0;
      padding: 20px 24px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .verdict-title {
      font-size: 15px;
      font-weight: 700;
      color: ${c.secondary};
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .verdict-body { font-size: ${bodyPx}px; color: ${c.text}; line-height: 1.6; }

    /* Objection Table */
    .obj-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      border: 2px solid ${c.primary};
    }
    .obj-table th {
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: ${c.primary};
      color: #ffffff;
    }
    .obj-table td {
      padding: 12px 14px;
      border-bottom: 1px solid ${c.text}20;
      vertical-align: top;
    }
    .obj-table tr:nth-child(even) td { background: ${c.text}05; }
    .obj-table td:first-child { font-weight: 600; color: ${c.primary}; }
    `;
  }

  // ── BOLD VARIANT ──
  if (style === 'bold') {
    const h1Bold = Math.round(h1Px * 1.5);
    return baseCSS + `
    /* ════ BOLD ════ */

    /* Hero — extra tall, big typography */
    .hero {
      background: ${c.primary};
      padding: 56px 48px 48px;
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: '';
      position: absolute;
      top: -80px;
      right: -80px;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: ${c.accent};
      opacity: 0.15;
    }
    .hero::before {
      content: '';
      position: absolute;
      bottom: -60px;
      left: -40px;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: ${c.secondary};
      opacity: 0.12;
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      position: relative;
      z-index: 1;
    }
    .hero-logo img { max-height: 40px; }
    .hero-logo-text { color: #fff; font-size: 22px; font-weight: 900; letter-spacing: -1px; }
    .hero-prepared {
      text-align: right;
      color: ${lightenColor(c.primary, 0.4)};
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .hero-prepared strong {
      display: block;
      color: ${c.accent};
      font-size: 18px;
      letter-spacing: 0;
      text-transform: none;
      margin-top: 4px;
      font-weight: 800;
    }
    .hero-title { position: relative; z-index: 1; }
    .hero-title h1 {
      color: #ffffff;
      font-size: ${h1Bold}px;
      font-weight: 900;
      letter-spacing: -1.5px;
      line-height: 1.05;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .hero-title .subtitle {
      color: ${lightenColor(c.primary, 0.45)};
      font-size: 16px;
      font-weight: 500;
    }
    .hero-accent-bar {
      width: 100px;
      height: 6px;
      background: ${c.accent};
      border-radius: 3px;
      margin-top: 20px;
    }

    /* Stats — large vibrant numbers on colored cards */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0;
      background: ${c.secondary};
    }
    .stat-card {
      padding: 24px 20px;
      text-align: center;
      border-right: 2px solid ${lightenColor(c.secondary, 0.15)};
      background: ${c.secondary};
    }
    .stat-card:last-child { border-right: none; }
    .stat-value {
      font-size: 34px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.1;
      margin-bottom: 4px;
      font-family: '${f.primary}', sans-serif;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: ${lightenColor(c.secondary, 0.5)};
      font-weight: 700;
    }

    /* Body */
    .body-content { padding: 36px 48px; }

    /* Sections — alternating bg */
    .section {
      margin-bottom: 0;
      padding: 28px 32px;
      page-break-inside: avoid;
    }
    .section:nth-child(odd) {
      background: ${c.primary}06;
    }
    .section:nth-child(even) {
      background: ${c.background};
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 3px solid ${c.accent};
    }
    .section-icon {
      font-size: 22px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${c.accent};
      border-radius: 10px;
      flex-shrink: 0;
    }
    .section-title {
      font-size: ${Math.round(h2Px * 1.15)}px;
      font-weight: 800;
      color: ${c.primary};
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .section-body {
      font-size: ${bodyPx}px;
      line-height: 1.7;
      color: ${c.text};
    }

    /* Highlight Box */
    .highlight-box {
      background: ${c.accent};
      border-left: none;
      border-radius: 16px;
      padding: 24px 28px;
      margin: 28px 0;
      page-break-inside: avoid;
    }
    .highlight-box .section-header { border-bottom-color: rgba(255,255,255,0.3); }
    .highlight-box .section-title { color: #ffffff; }
    .highlight-box .section-icon { background: rgba(255,255,255,0.2); }
    .highlight-box .section-body { color: #ffffff; }
    .highlight-box .section-body strong { color: #ffffff; }

    /* CTA Box */
    .cta-box {
      background: ${c.accent};
      border-radius: 16px;
      padding: 32px 36px;
      margin-top: 36px;
      page-break-inside: avoid;
      position: relative;
      overflow: hidden;
    }
    .cta-box::after {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
    }
    .cta-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 900;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    .cta-text {
      color: rgba(255,255,255,0.85);
      font-size: ${bodyPx}px;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }
    .cta-text strong { color: #ffffff; }
    .cta-text a { color: #ffffff; text-decoration: underline; }

    /* Footer */
    .pdf-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 48px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: ${c.text}70;
      border-top: 4px solid ${c.accent};
      background: ${c.background};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Two Column */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 24px 0;
    }
    .col-card {
      border: none;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .col-card-header {
      padding: 14px 18px;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .col-blue .col-card-header { background: ${c.secondary}; color: #ffffff; }
    .col-gray .col-card-header { background: ${c.primary}; color: #ffffff; }
    .col-card-body { padding: 18px; font-size: 12px; line-height: 1.6; }

    /* Comparison Table */
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .comp-table th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .comp-table th:first-child { background: ${c.text}; color: #ffffff; }
    .comp-table th.us { background: ${c.secondary}; color: #ffffff; }
    .comp-table th.them { background: ${darkenColor(c.text, 0.2)}; color: #ffffff; }
    .comp-table td {
      padding: 12px 16px;
      border-bottom: 1px solid ${c.text}15;
      vertical-align: top;
    }
    .comp-table tr:last-child td { border-bottom: none; }
    .comp-table tr:nth-child(even) td { background: ${c.text}06; }

    /* Email Sequence */
    .email-timeline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      margin-bottom: 20px;
      position: relative;
    }
    .email-timeline::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 30px;
      right: 30px;
      height: 4px;
      background: ${c.accent}40;
      z-index: 0;
    }
    .timeline-dot {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: ${c.accent};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      position: relative;
      z-index: 1;
      box-shadow: 0 4px 12px ${c.accent}40;
    }
    .timeline-dot.inactive { background: ${c.text}30; color: ${c.text}60; box-shadow: none; }
    .email-card {
      border: none;
      border-radius: 16px;
      margin-bottom: 22px;
      overflow: hidden;
      page-break-inside: avoid;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .email-card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      background: ${c.primary};
      border-bottom: none;
    }
    .email-num {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${c.accent};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
      flex-shrink: 0;
    }
    .email-meta { flex: 1; }
    .email-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: ${lightenColor(c.primary, 0.4)}; font-weight: 700; }
    .email-subject-box {
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      margin-top: 4px;
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
    }
    .email-card-body { padding: 20px; font-size: 12px; line-height: 1.7; }

    /* Verdict Box */
    .verdict-box {
      background: ${c.secondary};
      border: none;
      border-radius: 16px;
      padding: 24px 28px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .verdict-title {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
    }
    .verdict-body { font-size: ${bodyPx}px; color: rgba(255,255,255,0.9); line-height: 1.6; }

    /* Objection Table */
    .obj-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .obj-table th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: ${c.primary};
      color: #ffffff;
    }
    .obj-table td {
      padding: 14px 16px;
      border-bottom: 1px solid ${c.text}15;
      vertical-align: top;
    }
    .obj-table tr:nth-child(even) td { background: ${c.text}06; }
    .obj-table td:first-child { font-weight: 700; color: ${c.primary}; }
    `;
  }

  // ── MINIMAL VARIANT ──
  // (also serves as fallback)
  return baseCSS + `
  /* ════ MINIMAL ════ */

  /* Hero — ultra-clean, typography-driven */
  .hero {
    background: ${c.background};
    padding: 52px 48px 40px;
    border-bottom: 1px solid ${c.text}15;
  }
  .hero-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 36px;
  }
  .hero-logo img { max-height: 28px; opacity: 0.7; }
  .hero-logo-text { color: ${c.text}; font-size: 15px; font-weight: 600; letter-spacing: 0; }
  .hero-prepared {
    text-align: right;
    color: ${c.text}60;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .hero-prepared strong {
    display: block;
    color: ${c.text};
    font-size: 13px;
    letter-spacing: 0;
    text-transform: none;
    margin-top: 4px;
    font-weight: 500;
  }
  .hero-title {}
  .hero-title h1 {
    color: ${c.text};
    font-size: ${h1Px}px;
    font-weight: 300;
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 8px;
  }
  .hero-title .subtitle {
    color: ${c.text}70;
    font-size: 14px;
    font-weight: 300;
  }
  .hero-accent-bar {
    width: 40px;
    height: 1px;
    background: ${c.text}40;
    margin-top: 24px;
  }

  /* Stats — simple text, no cards */
  .stats-row {
    display: flex;
    gap: 48px;
    padding: 24px 48px;
    border-bottom: 1px solid ${c.text}10;
    background: ${c.background};
  }
  .stat-card {
    padding: 0;
    text-align: left;
    border: none;
  }
  .stat-value {
    font-size: 20px;
    font-weight: 300;
    color: ${c.text};
    line-height: 1.2;
    margin-bottom: 2px;
    font-family: '${f.primary}', sans-serif;
  }
  .stat-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: ${c.text}50;
    font-weight: 500;
  }

  /* Body */
  .body-content { padding: 40px 48px; }

  /* Sections — no backgrounds, no borders on cards */
  .section {
    margin-bottom: 32px;
    page-break-inside: avoid;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 14px;
    padding-bottom: 0;
    border-bottom: none;
  }
  .section-icon {
    display: none;
  }
  .section-title {
    font-size: ${h2Px}px;
    font-weight: 600;
    color: ${c.text};
    letter-spacing: -0.3px;
  }
  .section-body {
    font-size: ${bodyPx}px;
    line-height: 1.8;
    color: ${c.text}CC;
  }
  .section-body li::before {
    content: '—';
    color: ${c.text}40;
    font-weight: 400;
  }

  /* Highlight Box — minimal: just slightly different weight */
  .highlight-box {
    background: transparent;
    border-left: 2px solid ${c.text}25;
    border-radius: 0;
    padding: 16px 24px;
    margin: 28px 0;
    page-break-inside: avoid;
  }
  .highlight-box .section-header { border-bottom: none; }
  .highlight-box .section-title { font-weight: 700; }
  .highlight-box .section-body { color: ${c.text}BB; }

  /* CTA Box — understated */
  .cta-box {
    background: transparent;
    border: 1px solid ${c.text}15;
    border-radius: 0;
    padding: 24px 28px;
    margin-top: 36px;
    page-break-inside: avoid;
  }
  .cta-title {
    color: ${c.text};
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .cta-text {
    color: ${c.text}99;
    font-size: ${bodyPx}px;
    line-height: 1.7;
  }
  .cta-text strong { color: ${c.text}; }
  .cta-text a { color: ${c.accent}; text-decoration: none; border-bottom: 1px solid ${c.accent}50; }

  /* Footer */
  .pdf-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 14px 48px;
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: ${c.text}50;
    border-top: 1px solid ${c.text}10;
    background: ${c.background};
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Two Column */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin: 24px 0;
  }
  .col-card {
    border: none;
    border-radius: 0;
    overflow: hidden;
  }
  .col-card-header {
    padding: 0 0 8px 0;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid ${c.text}15;
  }
  .col-blue .col-card-header { background: transparent; color: ${c.text}; }
  .col-gray .col-card-header { background: transparent; color: ${c.text}80; }
  .col-card-body { padding: 12px 0; font-size: 12px; line-height: 1.7; }

  /* Comparison Table */
  .comp-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
  }
  .comp-table th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 2px solid ${c.text}20;
  }
  .comp-table th:first-child { background: transparent; color: ${c.text}80; }
  .comp-table th.us { background: transparent; color: ${c.text}; }
  .comp-table th.them { background: transparent; color: ${c.text}80; }
  .comp-table td {
    padding: 10px 14px;
    border-bottom: 1px solid ${c.text}08;
    vertical-align: top;
  }
  .comp-table tr:last-child td { border-bottom: none; }

  /* Email Sequence */
  .email-timeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    margin-bottom: 20px;
    position: relative;
  }
  .email-timeline::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 30px;
    right: 30px;
    height: 1px;
    background: ${c.text}15;
    z-index: 0;
  }
  .timeline-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: transparent;
    border: 1px solid ${c.text}40;
    color: ${c.text};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 12px;
    position: relative;
    z-index: 1;
  }
  .timeline-dot.inactive { border-color: ${c.text}15; color: ${c.text}40; }
  .email-card {
    border: none;
    border-bottom: 1px solid ${c.text}10;
    border-radius: 0;
    margin-bottom: 8px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .email-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 0;
    background: transparent;
    border-bottom: none;
  }
  .email-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: transparent;
    border: 1px solid ${c.text}30;
    color: ${c.text};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 13px;
    flex-shrink: 0;
  }
  .email-meta { flex: 1; }
  .email-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: ${c.text}50; font-weight: 500; }
  .email-subject-box {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 4px 0;
    margin-top: 2px;
    font-size: 13px;
    font-weight: 600;
    color: ${c.text};
  }
  .email-card-body { padding: 8px 0 16px 40px; font-size: 12px; line-height: 1.8; }

  /* Verdict Box */
  .verdict-box {
    background: transparent;
    border: none;
    border-top: 1px solid ${c.text}15;
    border-radius: 0;
    padding: 20px 0;
    margin-top: 24px;
    page-break-inside: avoid;
  }
  .verdict-title {
    font-size: 15px;
    font-weight: 600;
    color: ${c.text};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .verdict-body { font-size: ${bodyPx}px; color: ${c.text}99; line-height: 1.7; }

  /* Objection Table */
  .obj-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
    border: none;
  }
  .obj-table th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: transparent;
    color: ${c.text}80;
    border-bottom: 2px solid ${c.text}15;
  }
  .obj-table td {
    padding: 12px 14px;
    border-bottom: 1px solid ${c.text}08;
    vertical-align: top;
  }
  .obj-table td:first-child { font-weight: 500; color: ${c.text}; }
  `;
}

// ════════════════════════════════════════════════════════
// HERO HEADER
// ════════════════════════════════════════════════════════

function heroHeader(
  title: string,
  subtitle: string,
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  // Use base64 data URI if available (for print), otherwise fall back to URL
  // Prefer secondary (white) logo on dark backgrounds, fall back to primary
  let logoSrc: string;
  if (logoOptions.secondaryLogoBase64) {
    logoSrc = logoOptions.secondaryLogoBase64;
  } else if (logoOptions.logoBase64) {
    logoSrc = logoOptions.logoBase64;
  } else {
    logoSrc = getLogoForBackground(brand, true, baseUrl);
  }

  const prospectLogo = logoOptions.prospectLogoBase64 || '';
  const prospectColor = logoOptions.prospectColor || '';
  const companyColor = brand.colors.primary;

  // Build the company logo HTML (left side)
  const companyLogoHtml = logoSrc
    ? `<div class="doc-header-logo"><img src="${logoSrc}" alt="${kb.companyName}" style="max-height:32px;max-width:160px;object-fit:contain"/></div>`
    : `<div class="doc-header-logo-text"><img src="data:image/svg+xml;base64,${Buffer.from(LOGO_SVG_MINIMAL).toString('base64')}" alt="${BRAND_NAME}" style="width:32px;height:32px"/>${kb.companyName || BRAND_NAME}</div>`;

  // Build the prospect logo / name HTML (right side)
  const prospectHtml = prospectLogo
    ? `<div class="doc-header-prospect"><img src="${prospectLogo}" alt="${prospect.companyName}" style="max-height:28px;max-width:140px;object-fit:contain"/></div>`
    : `<div class="doc-header-prospect">${prospect.companyName}</div>`;

  // Document type label from contentType
  const typeLabel = contentType ? (CONTENT_TYPE_LABELS[contentType as ContentType] || '').toUpperCase() : '';

  // Dual color bar for co-branded documents
  const dualColorBar = prospectLogo && prospectColor
    ? `<div style="height:3px;display:flex;position:absolute;bottom:0;left:0;right:0"><div style="flex:1;background:${companyColor}"></div><div style="flex:1;background:${prospectColor}"></div></div>`
    : `<div class="doc-header-accent"></div>`;

  return `
    <div class="doc-header">
      <div class="doc-header-top">
        ${companyLogoHtml}
        ${prospectHtml}
      </div>
      ${typeLabel ? `<div class="doc-header-type">${typeLabel}</div>` : ''}
      <div class="doc-header-title">${title}</div>
      <div class="doc-header-subtitle">Prepared for ${prospect.companyName} by ${kb.companyName || BRAND_NAME}</div>
      ${dualColorBar}
    </div>`;
}

// ════════════════════════════════════════════════════════
// STAT CARDS ROW
// ════════════════════════════════════════════════════════

function statCardsRow(stats: StatCard[]): string {
  if (stats.length === 0) return '';
  // Use up to 3 stats for the dark stat bar
  const displayStats = stats.slice(0, 3);
  return `
    <div class="doc-stat-bar">
      ${displayStats.map(s => `
        <div class="doc-stat-item">
          <div class="doc-stat-value">${s.value}</div>
          <div class="doc-stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>`;
}

// ════════════════════════════════════════════════════════
// STANDARD SECTION
// ════════════════════════════════════════════════════════

function renderSection(section: GeneratedSection, isHighlight: boolean = false): string {
  const icon = sectionIcon(section.title);
  const content = formatContent(section.content);

  if (isHighlight) {
    return `
      <div class="highlight-box">
        <div class="section-header">
          <div class="section-icon">${icon}</div>
          <div class="section-title">${section.title}</div>
        </div>
        <div class="section-body">${content}</div>
      </div>`;
  }

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">${icon}</div>
        <div class="section-title">${section.title}</div>
      </div>
      <div class="section-body">${content}</div>
    </div>`;
}

// ════════════════════════════════════════════════════════
// CTA BOX
// ════════════════════════════════════════════════════════

function ctaBox(kb: KnowledgeBase, prospect: ProspectInfo): string {
  return `
    <div class="cta-box">
      <div class="cta-title">🚀 Ready to Get Started?</div>
      <div class="cta-text">
        We'd love to show <strong>${prospect.companyName}</strong> exactly how ${kb.companyName || 'we'} can help.
        ${kb.website ? `<br/>Visit us at <strong>${kb.website}</strong>` : ''}
        <br/><br/>
        <strong>Next step:</strong> Schedule a personalized demo to see the impact firsthand.
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════
// FOOTER (includes brand tagline if set)
// ════════════════════════════════════════════════════════

function footer(kb: KnowledgeBase, brand: BrandGuidelines): string {
  const tagline = brand.voice.tagline;
  return `
    <div class="pdf-footer">
      <span>${kb.companyName || BRAND_NAME}${kb.website ? ` · ${kb.website}` : ''}${tagline ? ` · ${tagline}` : ''}</span>
      <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      <span>Generated by ${BRAND_NAME}</span>
    </div>`;
}

// ════════════════════════════════════════════════════════
// CONTENT-TYPE SPECIFIC RENDERERS
// ════════════════════════════════════════════════════════

function isHighlightSection(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes('why') || t.includes('differ') || t.includes('strength') || t.includes('advantage') || t.includes('why us');
}

function isCtaSection(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes('next step') || t.includes('getting started') || t.includes('call to action');
}

// ── DEFAULT: works for any content type ──
function renderDefault(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  title: string,
  subtitle: string,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const stats = extractStats(sections);
  const bodySections = sections.filter(s => !isCtaSection(s.title));
  const ctaSections = sections.filter(s => isCtaSection(s.title));

  return `
    ${heroHeader(title, subtitle, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    ${statCardsRow(stats)}
    <div class="body-content">
      ${bodySections.map(s => renderSection(s, isHighlightSection(s.title))).join('')}
      ${ctaSections.length > 0 ? ctaSections.map(s => `
        <div class="cta-box">
          <div class="cta-title">🚀 ${s.title}</div>
          <div class="cta-text">${formatContent(s.content)}</div>
        </div>
      `).join('') : ctaBox(kb, prospect)}
    </div>`;
}

// ── COMPETITIVE ANALYSIS ──
function renderCompetitiveAnalysis(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const stats = extractStats(sections);

  // Find comparison section
  const compSection = sections.find(s => s.title.toLowerCase().includes('vs') || s.title.toLowerCase().includes('comparison'));
  const strategySection = sections.find(s => s.title.toLowerCase().includes('strategy') || s.title.toLowerCase().includes('recommend'));
  const otherSections = sections.filter(s => s !== compSection && s !== strategySection && !isCtaSection(s.title));

  // Parse comparison content into table rows
  const compRows = compSection ? parseComparisonRows(compSection.content) : [];

  return `
    ${heroHeader('Competitive Analysis', `${kb.companyName || 'Us'} vs. the Competition — Prepared for ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    ${statCardsRow(stats)}
    <div class="body-content">
      ${otherSections.map(s => renderSection(s, isHighlightSection(s.title))).join('')}

      ${compSection ? `
        <div class="section">
          <div class="section-header">
            <div class="section-icon">⚔️</div>
            <div class="section-title">${compSection.title}</div>
          </div>
          ${compRows.length > 0 ? `
            <table class="comp-table">
              <thead>
                <tr>
                  <th style="width:30%">Capability</th>
                  <th class="us" style="width:35%">✓ ${kb.companyName || 'Us'}</th>
                  <th class="them" style="width:35%">✗ Competitor</th>
                </tr>
              </thead>
              <tbody>
                ${compRows.map(r => `
                  <tr>
                    <td><strong>${r.capability}</strong></td>
                    <td><span class="check">✓</span> ${r.us}</td>
                    <td><span class="cross">✗</span> ${r.them}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `<div class="section-body">${formatContent(compSection.content)}</div>`}
        </div>
      ` : ''}

      ${strategySection ? `
        <div class="verdict-box">
          <div class="verdict-title">⚖️ ${strategySection.title}</div>
          <div class="verdict-body">${formatContent(strategySection.content)}</div>
        </div>
      ` : ''}

      ${ctaBox(kb, prospect)}
    </div>`;
}

function parseComparisonRows(content: string): { capability: string; us: string; them: string }[] {
  const rows: { capability: string; us: string; them: string }[] = [];
  const lines = content.split('\n').filter(l => l.trim());

  for (const line of lines) {
    // Try to parse "Feature: Our advantage vs Their weakness" patterns
    const vsMatch = line.match(/^[-•*]?\s*\*?\*?(.+?)\*?\*?\s*[:–—-]\s*(.+?)(?:\s+vs\.?\s+|\s+while\s+|\s+compared to\s+)(.+)$/i);
    if (vsMatch) {
      rows.push({ capability: vsMatch[1].trim(), us: vsMatch[2].trim(), them: vsMatch[3].trim() });
    }
  }

  // If parsing failed, create generic rows from bullet points
  if (rows.length === 0) {
    const bullets = content.split('\n').filter(l => l.trim().match(/^[-•*]/));
    for (const bullet of bullets.slice(0, 6)) {
      const text = bullet.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '');
      rows.push({ capability: text.slice(0, 40), us: 'Strong', them: 'Limited' });
    }
  }

  return rows.slice(0, 8);
}

// ── BATTLE CARD ──
function renderBattleCard(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const stats = extractStats(sections);

  const strengthsSection = sections.find(s => s.title.toLowerCase().includes('strength'));
  const weaknessSection = sections.find(s => s.title.toLowerCase().includes('weakness'));
  const objectionSection = sections.find(s => s.title.toLowerCase().includes('objection'));
  const otherSections = sections.filter(s =>
    s !== strengthsSection && s !== weaknessSection && s !== objectionSection && !isCtaSection(s.title)
  );

  // Parse objections into table
  const objections = objectionSection ? parseObjections(objectionSection.content) : [];

  return `
    ${heroHeader('Battle Card', `Internal Sales Guide — ${prospect.companyName} Deal`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    ${statCardsRow(stats)}
    <div class="body-content">
      ${otherSections.map(s => renderSection(s, isHighlightSection(s.title))).join('')}

      ${(strengthsSection || weaknessSection) ? `
        <div class="two-col">
          ${strengthsSection ? `
            <div class="col-card col-blue">
              <div class="col-card-header">🏆 ${strengthsSection.title}</div>
              <div class="col-card-body">${formatContent(strengthsSection.content)}</div>
            </div>
          ` : ''}
          ${weaknessSection ? `
            <div class="col-card col-gray">
              <div class="col-card-header">⚔️ ${weaknessSection.title}</div>
              <div class="col-card-body">${formatContent(weaknessSection.content)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${objections.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <div class="section-icon">🛡️</div>
            <div class="section-title">${objectionSection!.title}</div>
          </div>
          <table class="obj-table">
            <thead>
              <tr>
                <th style="width:40%">Objection</th>
                <th style="width:60%">Response</th>
              </tr>
            </thead>
            <tbody>
              ${objections.map(o => `
                <tr>
                  <td>"${o.objection}"</td>
                  <td>${o.response}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : (objectionSection ? renderSection(objectionSection) : '')}

      ${ctaBox(kb, prospect)}
    </div>`;
}

function parseObjections(content: string): { objection: string; response: string }[] {
  const results: { objection: string; response: string }[] = [];
  const blocks = content.split(/\n(?=\d+[\.\):]|\*\*|[-•])/);

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    if (lines.length >= 2) {
      const objection = lines[0].replace(/^\d+[\.\):]\s*/, '').replace(/\*\*/g, '').replace(/^[""]|[""]$/g, '').trim();
      const response = lines.slice(1).join(' ').replace(/^\s*[-•]\s*/, '').replace(/\*\*/g, '').trim();
      if (objection && response) {
        results.push({ objection: objection.slice(0, 80), response: response.slice(0, 200) });
      }
    }
  }

  return results.slice(0, 6);
}

// ── EMAIL SEQUENCE ──
function renderEmailSequence(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const emailSections = sections.filter(s => s.title.toLowerCase().includes('email'));
  const otherSections = sections.filter(s => !s.title.toLowerCase().includes('email'));

  return `
    ${heroHeader('Outbound Email Sequence', `5-Touch Outreach Campaign — ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}

    <div class="body-content">
      ${otherSections.map(s => renderSection(s)).join('')}

      <!-- Timeline -->
      ${emailSections.length > 1 ? `
        <div class="email-timeline">
          ${emailSections.map((_, i) => `
            <div class="timeline-dot">${i + 1}</div>
          `).join('')}
        </div>
      ` : ''}

      ${emailSections.map((section, i) => {
        const subjectMatch = section.content.match(/[Ss]ubject(?:\s*[Ll]ine)?:\s*(.+?)(?:\n|$)/);
        const subject = subjectMatch ? subjectMatch[1].replace(/\*\*/g, '').trim() : `Email ${i + 1}`;
        const bodyContent = section.content
          .replace(/[Ss]ubject(?:\s*[Ll]ine)?:\s*.+?\n/, '')
          .trim();

        return `
          <div class="email-card">
            <div class="email-card-header">
              <div class="email-num">${i + 1}</div>
              <div class="email-meta">
                <div class="email-label">${section.title}</div>
                <div class="email-subject-box">📧 ${subject}</div>
              </div>
            </div>
            <div class="email-card-body">${formatContent(bodyContent)}</div>
          </div>
        `;
      }).join('')}

      ${ctaBox(kb, prospect)}
    </div>`;
}

// ════════════════════════════════════════════════════════
// SVG CHART HELPERS — inline SVG generators for persona docs
// ════════════════════════════════════════════════════════

function svgBarChart(items: { label: string; value: number; color: string }[], width: number, height: number): string {
  if (items.length === 0) return '';
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const barHeight = Math.floor((height - 40) / items.length) - 10;
  const labelWidth = 160;
  const barAreaWidth = width - labelWidth - 100;

  const bars = items.map((item, i) => {
    const y = 20 + i * (barHeight + 10);
    const barW = Math.max(10, (item.value / maxVal) * barAreaWidth);
    const displayVal = item.value >= 1000 ? `$${(item.value / 1000).toFixed(0)}K` : `$${item.value.toLocaleString()}`;
    return `
      <text x="${labelWidth - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="11" fill="#374151" font-weight="600">${escSvg(item.label)}</text>
      <rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="4" fill="${item.color}" />
      <text x="${labelWidth + barW + 8}" y="${y + barHeight / 2 + 4}" font-size="11" fill="#374151" font-weight="700">${displayVal}</text>
    `;
  }).join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:16px auto">${bars}</svg>`;
}

function svgQuadrantMatrix(company: string, competitors: string[], xLabel: string, yLabel: string, colors: BrandColors): string {
  const w = 400, h = 320;
  const cx = w / 2, cy = h / 2;
  const pad = 50;
  // Competitor positions in different quadrants
  const positions = [
    { x: pad + 40, y: cy + 40 },      // bottom-left
    { x: cx + 60, y: cy + 30 },        // bottom-right
    { x: pad + 50, y: pad + 30 },      // top-left
  ];
  const compDots = competitors.slice(0, 3).map((name, i) => {
    const pos = positions[i] || { x: pad + 30 + i * 40, y: cy + 40 };
    return `
      <circle cx="${pos.x}" cy="${pos.y}" r="6" fill="#9ca3af" />
      <text x="${pos.x + 10}" y="${pos.y + 4}" font-size="9" fill="#6b7280">${escSvg(name.slice(0, 20))}</text>
    `;
  }).join('');

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:16px auto">
    <rect x="${pad}" y="10" width="${w - pad * 2}" height="${h - 50}" fill="#f9fafb" rx="4" />
    <line x1="${cx}" y1="10" x2="${cx}" y2="${h - 40}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,4" />
    <line x1="${pad}" y1="${cy - 10}" x2="${w - pad}" y2="${cy - 10}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,4" />
    <text x="${cx}" y="${h - 10}" text-anchor="middle" font-size="10" fill="#6b7280" font-weight="600">${escSvg(xLabel)}</text>
    <text x="12" y="${cy - 10}" font-size="10" fill="#6b7280" font-weight="600" transform="rotate(-90, 12, ${cy - 10})">${escSvg(yLabel)}</text>
    ${compDots}
    <circle cx="${cx + 70}" cy="${pad + 25}" r="10" fill="${colors.secondary}" />
    <text x="${cx + 84}" y="${pad + 29}" font-size="10" fill="${colors.secondary}" font-weight="700">${escSvg(company.slice(0, 25))}</text>
    <text x="${pad + 5}" y="${h - 44}" font-size="8" fill="#9ca3af">Low</text>
    <text x="${w - pad - 20}" y="${h - 44}" font-size="8" fill="#9ca3af">High</text>
  </svg>`;
}

function svgTimeline(phases: { label: string; duration: string }[], colors: BrandColors): string {
  const w = 520, h = 100;
  const pad = 30;
  const lineY = 35;
  const segW = (w - pad * 2) / Math.max(phases.length, 1);

  const nodes = phases.map((phase, i) => {
    const x = pad + i * segW + segW / 2;
    const isLast = i === phases.length - 1;
    return `
      <circle cx="${x}" cy="${lineY}" r="12" fill="${colors.secondary}" />
      <text x="${x}" y="${lineY + 4}" text-anchor="middle" font-size="10" fill="#ffffff" font-weight="700">${i + 1}</text>
      <text x="${x}" y="${lineY + 30}" text-anchor="middle" font-size="9" fill="#374151" font-weight="600">${escSvg(phase.label.slice(0, 20))}</text>
      <text x="${x}" y="${lineY + 44}" text-anchor="middle" font-size="8" fill="#9ca3af">${escSvg(phase.duration)}</text>
      ${!isLast ? `<line x1="${x + 14}" y1="${lineY}" x2="${x + segW - 14}" y2="${lineY}" stroke="${colors.secondary}40" stroke-width="2" />` : ''}
    `;
  }).join('');

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:16px auto">
    <line x1="${pad}" y1="${lineY}" x2="${w - pad}" y2="${lineY}" stroke="#e5e7eb" stroke-width="2" />
    ${nodes}
  </svg>`;
}

function svgArchitectureDiagram(center: string, connections: { name: string; type: string }[], colors: BrandColors): string {
  const w = 480, h = 300;
  const cx = w / 2, cy = h / 2;
  const radius = 100;
  const typeColors: Record<string, string> = {
    'api': colors.secondary,
    'webhook': colors.accent,
    'native': '#10b981',
  };

  const nodes = connections.slice(0, 6).map((conn, i) => {
    const angle = (i / Math.max(connections.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const nx = cx + Math.cos(angle) * radius;
    const ny = cy + Math.sin(angle) * radius;
    const connType = conn.type.toLowerCase();
    const color = typeColors[connType] || '#6b7280';
    const dashArray = connType === 'webhook' ? 'stroke-dasharray="4,3"' : '';
    return `
      <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${color}" stroke-width="2" ${dashArray} />
      <rect x="${nx - 45}" y="${ny - 14}" width="90" height="28" rx="6" fill="${color}15" stroke="${color}" stroke-width="1" />
      <text x="${nx}" y="${ny + 4}" text-anchor="middle" font-size="9" fill="${color}" font-weight="600">${escSvg(conn.name.slice(0, 14))}</text>
      <text x="${nx}" y="${ny + 22}" text-anchor="middle" font-size="7" fill="#9ca3af">${escSvg(conn.type)}</text>
    `;
  }).join('');

  // Legend
  const legend = Object.entries(typeColors).map(([type, color], i) => `
    <line x1="${10}" y1="${h - 30 + i * 0}" x2="${25}" y2="${h - 30 + i * 0}" stroke="${color}" stroke-width="2" ${type === 'webhook' ? 'stroke-dasharray="4,3"' : ''} />
    <text x="${30}" y="${h - 26 + i * 0}" font-size="8" fill="#6b7280">${type.charAt(0).toUpperCase() + type.slice(1)}</text>
  `).join('');

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:16px auto">
    ${nodes}
    <rect x="${cx - 55}" y="${cy - 18}" width="110" height="36" rx="8" fill="${colors.primary}" />
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="10" fill="#ffffff" font-weight="700">${escSvg(center.slice(0, 18))}</text>
    ${legend}
  </svg>`;
}

function svgWorkflow(steps: { label: string }[], colors: BrandColors): string {
  const stepW = 110;
  const arrowW = 30;
  const h = 70;
  const totalW = steps.length * stepW + (steps.length - 1) * arrowW;
  const w = Math.max(totalW + 20, 400);

  const elements = steps.map((step, i) => {
    const x = 10 + i * (stepW + arrowW);
    const isLast = i === steps.length - 1;
    return `
      <rect x="${x}" y="10" width="${stepW}" height="40" rx="8" fill="${colors.secondary}15" stroke="${colors.secondary}" stroke-width="1.5" />
      <text x="${x + stepW / 2}" y="34" text-anchor="middle" font-size="9" fill="${colors.secondary}" font-weight="600">${escSvg(step.label.slice(0, 16))}</text>
      ${!isLast ? `
        <line x1="${x + stepW + 4}" y1="30" x2="${x + stepW + arrowW - 6}" y2="30" stroke="${colors.accent}" stroke-width="2" />
        <polygon points="${x + stepW + arrowW - 6},25 ${x + stepW + arrowW},30 ${x + stepW + arrowW - 6},35" fill="${colors.accent}" />
      ` : ''}
    `;
  }).join('');

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:16px auto;overflow:visible">${elements}</svg>`;
}

function svgScorecard(criteria: { label: string; rating: number }[], colors: BrandColors): string {
  const w = 400, rowH = 28;
  const h = criteria.length * rowH + 20;
  const labelW = 180;
  const barMaxW = 160;

  const rows = criteria.map((c, i) => {
    const y = 10 + i * rowH;
    const barW = (c.rating / 5) * barMaxW;
    const barColor = c.rating >= 4 ? '#10b981' : c.rating >= 3 ? colors.accent : '#ef4444';
    return `
      <text x="${labelW - 10}" y="${y + 18}" text-anchor="end" font-size="10" fill="#374151" font-weight="500">${escSvg(c.label)}</text>
      <rect x="${labelW}" y="${y + 6}" width="${barMaxW}" height="14" rx="3" fill="#f3f4f6" />
      <rect x="${labelW}" y="${y + 6}" width="${barW}" height="14" rx="3" fill="${barColor}" />
      <text x="${labelW + barMaxW + 10}" y="${y + 18}" font-size="10" fill="#374151" font-weight="700">${c.rating}/5</text>
    `;
  }).join('');

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:16px auto">${rows}</svg>`;
}

function escSvg(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ════════════════════════════════════════════════════════
// PERSONA-SPECIFIC CSS ADDITIONS
// ════════════════════════════════════════════════════════

function personaCSS(brand: BrandGuidelines): string {
  const c = brand.colors;
  const f = brand.fonts;
  const bodyPx = ptToPx(f.sizes.body);

  return `
    /* ═══ Persona-specific styles ═══ */
    .persona-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }
    .persona-kpi-card {
      background: ${c.secondary}10;
      border: 1px solid ${c.secondary}30;
      border-radius: 10px;
      padding: 16px 12px;
      text-align: center;
    }
    .persona-kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: ${c.secondary};
      font-family: '${f.primary}', sans-serif;
      line-height: 1.1;
    }
    .persona-kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: ${c.text}80;
      margin-top: 4px;
      font-weight: 600;
    }
    .persona-banner {
      background: ${c.secondary};
      color: #ffffff;
      padding: 20px 28px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 16px;
      font-weight: 700;
      font-family: '${f.primary}', sans-serif;
      line-height: 1.4;
    }
    .persona-callout-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin: 16px 0;
    }
    .persona-callout-box {
      padding: 16px;
      border-radius: 10px;
      border-left: 4px solid ${c.accent};
      background: ${c.accent}08;
    }
    .persona-callout-box h4 {
      font-size: 13px;
      font-weight: 700;
      color: ${darkenColor(c.text, 0.2)};
      margin-bottom: 6px;
      font-family: '${f.primary}', sans-serif;
    }
    .persona-callout-box p {
      font-size: ${bodyPx}px;
      color: ${c.text};
      line-height: 1.5;
      margin: 0;
    }
    .persona-vision-card {
      background: linear-gradient(135deg, ${c.accent}15, ${c.accent}08);
      border: 1px solid ${c.accent}30;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    }
    .persona-vision-card h3 {
      font-size: 15px;
      font-weight: 700;
      color: ${darkenColor(c.text, 0.2)};
      margin-bottom: 10px;
      font-family: '${f.primary}', sans-serif;
    }
    .persona-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;
    }
    .persona-col-today {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 16px;
    }
    .persona-col-future {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 16px;
    }
    .persona-col-today h4, .persona-col-future h4 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-family: '${f.primary}', sans-serif;
    }
    .persona-col-today h4 { color: #dc2626; }
    .persona-col-future h4 { color: #059669; }
    .persona-step-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .persona-step-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
      padding: 12px;
      background: ${c.secondary}06;
      border-radius: 10px;
    }
    .persona-step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${c.secondary};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    .persona-step-content {
      flex: 1;
      font-size: ${bodyPx}px;
      line-height: 1.5;
      color: ${c.text};
    }
    .persona-time-hero {
      text-align: center;
      padding: 28px;
      background: linear-gradient(135deg, ${c.secondary}10, ${c.secondary}05);
      border-radius: 14px;
      margin: 20px 0;
    }
    .persona-time-hero .big-number {
      font-size: 48px;
      font-weight: 900;
      color: ${c.secondary};
      font-family: '${f.primary}', sans-serif;
      line-height: 1;
    }
    .persona-time-hero .big-label {
      font-size: 14px;
      color: ${c.text}80;
      margin-top: 6px;
    }
    .persona-quote {
      border-left: 4px solid ${c.accent};
      padding: 16px 20px;
      margin: 20px 0;
      background: ${c.accent}06;
      border-radius: 0 10px 10px 0;
      font-style: italic;
      font-size: 13px;
      color: ${c.text};
      line-height: 1.6;
    }
    .persona-quote .attribution {
      font-style: normal;
      font-weight: 600;
      font-size: 11px;
      color: ${c.text}80;
      margin-top: 8px;
    }
    .persona-checklist {
      list-style: none;
      padding: 0;
    }
    .persona-checklist li {
      padding: 6px 0 6px 28px;
      position: relative;
      font-size: ${bodyPx}px;
      line-height: 1.5;
    }
    .persona-checklist li::before {
      content: '\\2713';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
      font-size: 14px;
    }
    .persona-risk-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12px;
    }
    .persona-risk-table th {
      padding: 10px 14px;
      background: ${c.primary};
      color: #fff;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .persona-risk-table td {
      padding: 10px 14px;
      border-bottom: 1px solid ${c.text}15;
      vertical-align: top;
    }
    .persona-risk-table tr:nth-child(even) td { background: ${c.text}05; }
    .risk-green { color: #059669; font-weight: 700; }
    .risk-yellow { color: #d97706; font-weight: 700; }
    .risk-red { color: #dc2626; font-weight: 700; }
    .persona-ref-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 16px 0;
    }
    .persona-ref-card {
      border: 1px solid ${c.text}20;
      border-radius: 10px;
      padding: 14px;
    }
    .persona-ref-card h5 {
      font-size: 12px;
      font-weight: 700;
      color: ${darkenColor(c.text, 0.2)};
      margin-bottom: 6px;
    }
    .persona-ref-card p {
      font-size: 10px;
      color: ${c.text}80;
      line-height: 1.4;
      margin: 2px 0;
    }
    .persona-financial-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12px;
      border-radius: 8px;
      overflow: hidden;
    }
    .persona-financial-table th {
      padding: 10px 16px;
      background: ${c.secondary};
      color: #fff;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .persona-financial-table td {
      padding: 10px 16px;
      border-bottom: 1px solid ${c.text}15;
    }
    .persona-financial-table tr:nth-child(even) td { background: ${c.text}05; }
    .persona-financial-table .total-row td {
      font-weight: 700;
      background: ${c.secondary}10;
      border-top: 2px solid ${c.secondary};
    }
    .persona-complexity-row {
      display: flex;
      gap: 16px;
      margin: 12px 0;
    }
    .persona-complexity-item {
      flex: 1;
      text-align: center;
    }
    .persona-complexity-item .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${c.text}80;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .persona-complexity-bar {
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #ffffff;
    }
    .complexity-low { background: #10b981; }
    .complexity-med { background: #f59e0b; }
    .complexity-high { background: #ef4444; }
  `;
}

// ════════════════════════════════════════════════════════
// PERSONA-SPECIFIC DOCUMENT RENDERERS
// ════════════════════════════════════════════════════════

function findSectionByKeyword(sections: GeneratedSection[], ...keywords: string[]): GeneratedSection | undefined {
  return sections.find(s => {
    const t = s.title.toLowerCase();
    return keywords.some(kw => t.includes(kw.toLowerCase()));
  });
}

function renderPersonaSection(section: GeneratedSection): string {
  return `
    <div class="section" style="margin-bottom:20px;page-break-inside:avoid">
      <div class="section-header">
        <div class="section-icon">${sectionIcon(section.title)}</div>
        <div class="section-title">${section.title}</div>
      </div>
      <div class="section-body">${formatContent(section.content)}</div>
    </div>`;
}

// ── CFO DOCUMENT ──
function renderCFODocument(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const roiSection = findSectionByKeyword(sections, 'roi', 'executive roi', 'summary');
  const financialSection = findSectionByKeyword(sections, 'financial impact', 'impact analysis');
  const costSection = findSectionByKeyword(sections, 'cost comparison', 'cost');
  const riskSection = findSectionByKeyword(sections, 'risk');
  const recSection = findSectionByKeyword(sections, 'recommendation');

  // Extract numbers from ROI section for KPI cards
  const roiText = roiSection?.content || '';
  const numbers = roiText.match(/\$[\d,\.]+[KMB]?|\d+[\.\d]*%|\d+[\.\d]*\s*months?/gi) || [];
  const kpiLabels = ['Annual Savings', 'ROI %', 'Payback Period', '3-Year Value'];
  const kpiCards = numbers.slice(0, 4).map((num, i) => `
    <div class="persona-kpi-card">
      <div class="persona-kpi-value">${num.trim()}</div>
      <div class="persona-kpi-label">${kpiLabels[i] || 'Metric'}</div>
    </div>
  `).join('');

  // Bar chart data from cost section
  const costText = costSection?.content || '';
  const costNumbers = costText.match(/\$[\d,\.]+[KMB]?/g) || [];
  const cn0 = costNumbers[0] ?? '';
  const cn1 = costNumbers[1] ?? '';
  const barChartHtml = costNumbers.length >= 2
    ? svgBarChart([
        { label: 'Current Annual Cost', value: parseFloat(cn0.replace(/[$,KMB]/g, '')) * (cn0.includes('K') ? 1000 : cn0.includes('M') ? 1000000 : 1), color: '#ef4444' },
        { label: 'With Solution', value: parseFloat(cn1.replace(/[$,KMB]/g, '')) * (cn1.includes('K') ? 1000 : cn1.includes('M') ? 1000000 : 1), color: brand.colors.secondary },
      ], 460, 100)
    : '';

  const allSections = [roiSection, financialSection, costSection, riskSection, recSection].filter(Boolean);
  const remainingSections = sections.filter(s => !allSections.includes(s));

  return `
    ${heroHeader('Financial Business Case', `ROI Analysis for ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    <div class="body-content" style="padding-top:20px">
      ${kpiCards ? `<div class="persona-kpi-grid">${kpiCards}</div>` : ''}
      ${roiSection ? renderPersonaSection(roiSection) : ''}
      ${financialSection ? renderPersonaSection(financialSection) : ''}
      ${barChartHtml ? `<div style="margin:16px 0">${barChartHtml}</div>` : ''}
      ${costSection ? renderPersonaSection(costSection) : ''}
      ${riskSection ? renderPersonaSection(riskSection) : ''}
      ${remainingSections.map(s => renderPersonaSection(s)).join('')}
      ${recSection ? `
        <div class="cta-box">
          <div class="cta-title">Recommendation</div>
          <div class="cta-text">${formatContent(recSection.content)}</div>
        </div>
      ` : ctaBox(kb, prospect)}
    </div>`;
}

// ── CEO DOCUMENT ──
function renderCEODocument(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const strategySection = findSectionByKeyword(sections, 'strategic impact', 'impact statement');
  const competitiveSection = findSectionByKeyword(sections, 'competitive', 'positioning');
  const outcomesSection = findSectionByKeyword(sections, 'outcomes', 'three big', 'big outcomes');
  const visionSection = findSectionByKeyword(sections, 'vision', '12-month', '12 month');
  const nextSection = findSectionByKeyword(sections, 'next step');

  // Quadrant matrix
  const compText = competitiveSection?.content || '';
  const companyName = kb.companyName || 'Our Solution';
  const compNames = kb.competitors.slice(0, 3).map(c => c.name);
  const quadrantHtml = svgQuadrantMatrix(
    companyName,
    compNames.length > 0 ? compNames : ['Competitor A', 'Competitor B'],
    'Market Coverage',
    'Innovation Speed',
    brand.colors
  );

  // Parse three outcomes
  const outcomesText = outcomesSection?.content || '';
  const outcomeBullets = outcomesText.split(/\n/).filter(l => l.trim().length > 10).slice(0, 3);
  const outcomeLabels = ['Growth Impact', 'Efficiency Gain', 'Competitive Advantage'];
  const outcomeCards = outcomeBullets.length > 0
    ? `<div class="persona-callout-row">${outcomeBullets.map((text, i) => `
        <div class="persona-callout-box">
          <h4>${outcomeLabels[i] || 'Outcome'}</h4>
          <p>${text.replace(/^[-•*\d.)\s]+/, '').replace(/\*\*/g, '').trim()}</p>
        </div>
      `).join('')}</div>`
    : '';

  const allSections = [strategySection, competitiveSection, outcomesSection, visionSection, nextSection].filter(Boolean);
  const remainingSections = sections.filter(s => !allSections.includes(s));

  return `
    ${heroHeader('Strategic Briefing', `Executive Overview for ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    <div class="body-content" style="padding-top:20px">
      ${strategySection ? `<div class="persona-banner">${strategySection.content.split('\n')[0].replace(/\*\*/g, '')}</div>` : ''}
      ${strategySection && strategySection.content.split('\n').length > 1 ? `<div style="margin-bottom:20px;font-size:13px;line-height:1.6;color:${brand.colors.text}">${formatContent(strategySection.content.split('\n').slice(1).join('\n'))}</div>` : ''}
      ${competitiveSection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(competitiveSection.title)}</div>
            <div class="section-title">${competitiveSection.title}</div>
          </div>
          ${quadrantHtml}
          <div class="section-body">${formatContent(competitiveSection.content)}</div>
        </div>
      ` : ''}
      ${outcomeCards || (outcomesSection ? renderPersonaSection(outcomesSection) : '')}
      ${visionSection ? `
        <div class="persona-vision-card">
          <h3>${visionSection.title}</h3>
          <div style="font-size:12px;line-height:1.6;color:${brand.colors.text}">${formatContent(visionSection.content)}</div>
        </div>
      ` : ''}
      ${remainingSections.map(s => renderPersonaSection(s)).join('')}
      ${nextSection ? `
        <div class="cta-box">
          <div class="cta-title">${nextSection.title}</div>
          <div class="cta-text">${formatContent(nextSection.content)}</div>
        </div>
      ` : ctaBox(kb, prospect)}
    </div>`;
}

// ── VP OPS DOCUMENT ──
function renderVPOpsDocument(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const stateSection = findSectionByKeyword(sections, 'current state', 'future state', 'before', 'vs');
  const timelineSection = findSectionByKeyword(sections, 'timeline', 'implementation');
  const metricsSection = findSectionByKeyword(sections, 'efficiency', 'metrics');
  const workflowSection = findSectionByKeyword(sections, 'workflow', 'process');
  const changeSection = findSectionByKeyword(sections, 'change management', 'change');

  // Before/After columns
  const stateText = stateSection?.content || '';
  const todayContent = stateText.split(/(?:with|after|future|after\s+solution)/i)[0] || stateText;
  const futureContent = stateText.split(/(?:with|after|future|after\s+solution)/i)[1] || '';

  // Timeline SVG
  const timelineHtml = svgTimeline([
    { label: 'Discovery', duration: 'Weeks 1-2' },
    { label: 'Configuration', duration: 'Weeks 3-4' },
    { label: 'Training', duration: 'Weeks 5-6' },
    { label: 'Go-Live', duration: 'Weeks 7-8' },
  ], brand.colors);

  // Workflow SVG
  const workflowText = workflowSection?.content || '';
  const stepMatches = workflowText.match(/(?:step\s*\d+|^\d+[\.\)])[:\s]+(.+?)(?:\n|$)/gim) || [];
  const workflowSteps = stepMatches.slice(0, 4).map(s => ({ label: s.replace(/(?:step\s*\d+|^\d+[\.\)])[:\s]+/i, '').trim().slice(0, 16) }));
  const workflowHtml = workflowSteps.length >= 2
    ? svgWorkflow(workflowSteps, brand.colors)
    : svgWorkflow([{ label: 'Input' }, { label: 'Process' }, { label: 'Review' }, { label: 'Output' }], brand.colors);

  // Stat boxes from metrics section
  const metricsText = metricsSection?.content || '';
  const metricNums = metricsText.match(/\d+[\.\d]*%|\d+[\.\d]*\s*hours?/gi) || [];
  const metricLabels = ['Hours Saved/Week', 'Error Reduction', 'Throughput Gain', 'Adoption Time'];
  const statBoxes = metricNums.slice(0, 4).map((num, i) => `
    <div class="persona-kpi-card">
      <div class="persona-kpi-value">${num.trim()}</div>
      <div class="persona-kpi-label">${metricLabels[i] || 'Metric'}</div>
    </div>
  `).join('');

  const allSections = [stateSection, timelineSection, metricsSection, workflowSection, changeSection].filter(Boolean);
  const remainingSections = sections.filter(s => !allSections.includes(s));

  return `
    ${heroHeader('Operational Impact Assessment', `Process Improvement Plan for ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    <div class="body-content" style="padding-top:20px">
      ${stateSection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(stateSection.title)}</div>
            <div class="section-title">${stateSection.title}</div>
          </div>
          <div class="persona-two-col">
            <div class="persona-col-today">
              <h4>Today</h4>
              <div style="font-size:12px;line-height:1.5">${formatContent(todayContent)}</div>
            </div>
            <div class="persona-col-future">
              <h4>With Solution</h4>
              <div style="font-size:12px;line-height:1.5">${formatContent(futureContent || 'Streamlined processes, reduced errors, improved throughput.')}</div>
            </div>
          </div>
        </div>
      ` : ''}
      ${timelineSection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(timelineSection.title)}</div>
            <div class="section-title">${timelineSection.title}</div>
          </div>
          ${timelineHtml}
          <div class="section-body">${formatContent(timelineSection.content)}</div>
        </div>
      ` : ''}
      ${statBoxes ? `<div class="persona-kpi-grid">${statBoxes}</div>` : ''}
      ${metricsSection && !statBoxes ? renderPersonaSection(metricsSection) : ''}
      ${workflowSection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(workflowSection.title)}</div>
            <div class="section-title">${workflowSection.title}</div>
          </div>
          ${workflowHtml}
          <div class="section-body">${formatContent(workflowSection.content)}</div>
        </div>
      ` : ''}
      ${changeSection ? renderPersonaSection(changeSection) : ''}
      ${remainingSections.map(s => renderPersonaSection(s)).join('')}
      ${ctaBox(kb, prospect)}
    </div>`;
}

// ── IT DIRECTOR DOCUMENT ──
function renderITDocument(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const archSection = findSectionByKeyword(sections, 'architecture', 'technical arch');
  const securitySection = findSectionByKeyword(sections, 'security', 'compliance');
  const specsSection = findSectionByKeyword(sections, 'specification', 'technical spec');
  const complexitySection = findSectionByKeyword(sections, 'complexity', 'implementation complex');
  const slaSection = findSectionByKeyword(sections, 'support', 'sla');

  // Architecture diagram
  const archText = archSection?.content || '';
  const connMatches = archText.match(/(?:connects? to|integrat\w+ with|via)\s+([A-Z][\w\s]+?)(?:\s+via\s+(\w+)|\s+through\s+(\w+)|\s*[,.\n])/gi) || [];
  const connections = connMatches.slice(0, 5).map(m => {
    const parts = m.match(/(?:connects? to|integrat\w+ with|via)\s+(.+?)(?:\s+via\s+(\w+)|\s+through\s+(\w+)|\s*[,.\n])/i);
    return {
      name: parts?.[1]?.trim().slice(0, 14) || 'System',
      type: parts?.[2] || parts?.[3] || 'API',
    };
  });
  const archDiagram = connections.length >= 2
    ? svgArchitectureDiagram(kb.companyName || 'Solution', connections, brand.colors)
    : svgArchitectureDiagram(
        kb.companyName || 'Solution',
        [{ name: 'CRM', type: 'API' }, { name: 'ERP', type: 'Native' }, { name: 'SSO', type: 'API' }, { name: 'Webhooks', type: 'Webhook' }],
        brand.colors
      );

  // Complexity scorecard
  const complexText = complexitySection?.content || '';
  const complexLevels = ['low', 'med', 'medium', 'high'];
  const complexItems = ['Integration', 'Data Migration', 'Training', 'Timeline'].map(label => {
    const pattern = new RegExp(`${label}[:\\s]*(low|medium|med|high)`, 'i');
    const match = complexText.match(pattern);
    const level = match?.[1]?.toLowerCase() || 'med';
    return { label, level: level.startsWith('l') ? 'low' : level.startsWith('h') ? 'high' : 'med' };
  });

  const complexityHtml = `<div class="persona-complexity-row">${complexItems.map(item => `
    <div class="persona-complexity-item">
      <div class="label">${item.label}</div>
      <div class="persona-complexity-bar complexity-${item.level}">${item.level === 'low' ? 'Low' : item.level === 'high' ? 'High' : 'Medium'}</div>
    </div>
  `).join('')}</div>`;

  // Security checklist
  const secText = securitySection?.content || '';
  const secBullets = secText.split('\n').filter(l => l.trim().match(/^[-•*]/)).slice(0, 8);
  const secChecklist = secBullets.length > 0
    ? `<ul class="persona-checklist">${secBullets.map(b => `<li>${b.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim()}</li>`).join('')}</ul>`
    : '';

  const allSections = [archSection, securitySection, specsSection, complexitySection, slaSection].filter(Boolean);
  const remainingSections = sections.filter(s => !allSections.includes(s));

  return `
    ${heroHeader('Technical Assessment', `Architecture & Integration Guide for ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    <div class="body-content" style="padding-top:20px">
      ${archSection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(archSection.title)}</div>
            <div class="section-title">${archSection.title}</div>
          </div>
          ${archDiagram}
          <div class="section-body">${formatContent(archSection.content)}</div>
        </div>
      ` : ''}
      ${securitySection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(securitySection.title)}</div>
            <div class="section-title">${securitySection.title}</div>
          </div>
          ${secChecklist || `<div class="section-body">${formatContent(securitySection.content)}</div>`}
          ${secChecklist ? `<div class="section-body" style="margin-top:8px">${formatContent(securitySection.content)}</div>` : ''}
        </div>
      ` : ''}
      ${specsSection ? `
        <div class="section" style="margin-bottom:20px;font-family:monospace">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(specsSection.title)}</div>
            <div class="section-title">${specsSection.title}</div>
          </div>
          <div class="section-body" style="font-size:11px">${formatContent(specsSection.content)}</div>
        </div>
      ` : ''}
      ${complexitySection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(complexitySection.title)}</div>
            <div class="section-title">${complexitySection.title}</div>
          </div>
          ${complexityHtml}
          <div class="section-body">${formatContent(complexitySection.content)}</div>
        </div>
      ` : ''}
      ${slaSection ? `
        <div class="highlight-box">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(slaSection.title)}</div>
            <div class="section-title">${slaSection.title}</div>
          </div>
          <div class="section-body">${formatContent(slaSection.content)}</div>
        </div>
      ` : ''}
      ${remainingSections.map(s => renderPersonaSection(s)).join('')}
      ${ctaBox(kb, prospect)}
    </div>`;
}

// ── END USER DOCUMENT ──
function renderEndUserDocument(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const whatSection = findSectionByKeyword(sections, 'what this means', 'means for you');
  const howSection = findSectionByKeyword(sections, 'how it works', 'step by step');
  const daySection = findSectionByKeyword(sections, 'before vs after', 'day before', 'your day');
  const timeSection = findSectionByKeyword(sections, 'time you get', 'time saved', 'time back');
  const quoteSection = findSectionByKeyword(sections, 'what others say', 'others say', 'testimonial');

  // Steps parsing
  const howText = howSection?.content || '';
  const stepLines = howText.split('\n').filter(l => l.trim().match(/^(?:step\s*\d+|^\d+[\.\)])/i)).slice(0, 4);
  const stepsHtml = stepLines.length > 0
    ? `<ul class="persona-step-list">${stepLines.map((line, i) => `
        <li class="persona-step-item">
          <div class="persona-step-num">${i + 1}</div>
          <div class="persona-step-content">${line.replace(/^(?:step\s*\d+|^\d+[\.\)])[:\s]*/i, '').replace(/\*\*/g, '').trim()}</div>
        </li>
      `).join('')}</ul>`
    : '';

  // Time savings hero number
  const timeText = timeSection?.content || '';
  const timeMatch = timeText.match(/(\d+[\.\d]*)\s*hours?\s*(?:per\s*week|weekly|\/week)/i);
  const timeNumber = timeMatch ? timeMatch[1] : '';

  // Before/After
  const dayText = daySection?.content || '';
  const beforeText = dayText.split(/(?:after|with solution|improved)/i)[0] || dayText;
  const afterText = dayText.split(/(?:after|with solution|improved)/i)[1] || '';

  const allSections = [whatSection, howSection, daySection, timeSection, quoteSection].filter(Boolean);
  const remainingSections = sections.filter(s => !allSections.includes(s));

  return `
    ${heroHeader('Your Quick Start Guide', `What Changes for You at ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    <div class="body-content" style="padding-top:20px;font-size:14px">
      ${whatSection ? `
        <div class="section" style="margin-bottom:24px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(whatSection.title)}</div>
            <div class="section-title" style="font-size:18px">${whatSection.title}</div>
          </div>
          <div class="section-body" style="font-size:14px;line-height:1.8">${formatContent(whatSection.content)}</div>
        </div>
      ` : ''}
      ${howSection ? `
        <div class="section" style="margin-bottom:24px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(howSection.title)}</div>
            <div class="section-title" style="font-size:18px">${howSection.title}</div>
          </div>
          ${stepsHtml || `<div class="section-body" style="font-size:14px">${formatContent(howSection.content)}</div>`}
        </div>
      ` : ''}
      ${daySection ? `
        <div class="section" style="margin-bottom:24px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(daySection.title)}</div>
            <div class="section-title" style="font-size:18px">${daySection.title}</div>
          </div>
          <div class="persona-two-col">
            <div class="persona-col-today">
              <h4>Before</h4>
              <div style="font-size:13px;line-height:1.6">${formatContent(beforeText)}</div>
            </div>
            <div class="persona-col-future">
              <h4>After</h4>
              <div style="font-size:13px;line-height:1.6">${formatContent(afterText || 'A simpler, faster workflow.')}</div>
            </div>
          </div>
        </div>
      ` : ''}
      ${timeNumber ? `
        <div class="persona-time-hero">
          <div class="big-number">${timeNumber}h</div>
          <div class="big-label">Hours saved per week</div>
        </div>
      ` : ''}
      ${timeSection && !timeNumber ? renderPersonaSection(timeSection) : ''}
      ${quoteSection ? `
        <div class="persona-quote">
          ${quoteSection.content.replace(/\*\*/g, '')}
          <div class="attribution">-- Verified user</div>
        </div>
      ` : ''}
      ${remainingSections.map(s => renderPersonaSection(s)).join('')}
      ${ctaBox(kb, prospect)}
    </div>`;
}

// ── PROCUREMENT DOCUMENT ──
function renderProcurementDocument(
  sections: GeneratedSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  contentType?: string
): string {
  const scorecardSection = findSectionByKeyword(sections, 'scorecard', 'vendor scorecard');
  const tcoSection = findSectionByKeyword(sections, 'total cost', 'tco', 'cost of ownership');
  const contractSection = findSectionByKeyword(sections, 'contract', 'highlights');
  const refSection = findSectionByKeyword(sections, 'reference', 'customer');
  const riskSection = findSectionByKeyword(sections, 'risk');

  // Scorecard SVG
  const scorecardText = scorecardSection?.content || '';
  const criteriaNames = ['Company Stability', 'Product Maturity', 'Support Quality', 'Implementation Track Record', 'Financial Health'];
  const scorecardItems = criteriaNames.map(name => {
    const pattern = new RegExp(`${name}[:\\s]*(?:[^\\d]*)?(\\d)`, 'i');
    const match = scorecardText.match(pattern);
    return { label: name, rating: match ? parseInt(match[1]) : 4 };
  });
  const scorecardHtml = svgScorecard(scorecardItems, brand.colors);

  // Contract checklist
  const contractText = contractSection?.content || '';
  const contractBullets = contractText.split('\n').filter(l => l.trim().match(/^[-•*]/)).slice(0, 8);
  const contractChecklist = contractBullets.length > 0
    ? `<ul class="persona-checklist">${contractBullets.map(b => `<li>${b.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim()}</li>`).join('')}</ul>`
    : '';

  // Risk table
  const riskText = riskSection?.content || '';
  const riskBullets = riskText.split('\n').filter(l => l.trim().match(/^[-•*]/)).slice(0, 5);
  const riskRows = riskBullets.map(b => {
    const text = b.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim();
    const isGreen = /low|mitigat|strong|secure/i.test(text);
    const isRed = /high|critical|concern/i.test(text);
    const level = isRed ? 'red' : isGreen ? 'green' : 'yellow';
    const levelLabel = isRed ? 'High' : isGreen ? 'Low' : 'Medium';
    return `<tr><td>${text}</td><td><span class="risk-${level}">${levelLabel}</span></td></tr>`;
  });

  // Reference cards
  const refText = refSection?.content || '';
  const refBlocks = refText.split(/\n(?=\d+[\.\)]|\*\*|\w+\s+(?:Inc|Corp|LLC|Ltd))/).filter(b => b.trim().length > 20).slice(0, 3);
  const refCards = refBlocks.map(block => {
    const lines = block.trim().split('\n').map(l => l.replace(/\*\*/g, '').replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);
    return `<div class="persona-ref-card">
      <h5>${lines[0] || 'Reference Customer'}</h5>
      ${lines.slice(1, 4).map(l => `<p>${l}</p>`).join('')}
    </div>`;
  });

  const allSections = [scorecardSection, tcoSection, contractSection, refSection, riskSection].filter(Boolean);
  const remainingSections = sections.filter(s => !allSections.includes(s));

  return `
    ${heroHeader('Vendor Assessment', `Procurement Analysis for ${prospect.companyName}`, kb, prospect, brand, baseUrl, logoOptions, contentType)}
    <div class="body-content" style="padding-top:20px">
      ${scorecardSection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(scorecardSection.title)}</div>
            <div class="section-title">${scorecardSection.title}</div>
          </div>
          ${scorecardHtml}
          <div class="section-body">${formatContent(scorecardSection.content)}</div>
        </div>
      ` : ''}
      ${tcoSection ? renderPersonaSection(tcoSection) : ''}
      ${contractSection ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(contractSection.title)}</div>
            <div class="section-title">${contractSection.title}</div>
          </div>
          ${contractChecklist || `<div class="section-body">${formatContent(contractSection.content)}</div>`}
        </div>
      ` : ''}
      ${refCards.length > 0 ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(refSection?.title || 'References')}</div>
            <div class="section-title">${refSection?.title || 'Reference Customers'}</div>
          </div>
          <div class="persona-ref-cards">${refCards.join('')}</div>
        </div>
      ` : (refSection ? renderPersonaSection(refSection) : '')}
      ${riskRows.length > 0 ? `
        <div class="section" style="margin-bottom:20px">
          <div class="section-header">
            <div class="section-icon">${sectionIcon(riskSection?.title || 'Risk')}</div>
            <div class="section-title">${riskSection?.title || 'Risk Assessment'}</div>
          </div>
          <table class="persona-risk-table">
            <thead><tr><th>Risk Factor</th><th>Level</th></tr></thead>
            <tbody>${riskRows.join('')}</tbody>
          </table>
        </div>
      ` : (riskSection ? renderPersonaSection(riskSection) : '')}
      ${remainingSections.map(s => renderPersonaSection(s)).join('')}
      ${ctaBox(kb, prospect)}
    </div>`;
}

// ════════════════════════════════════════════════════════
// TITLE/SUBTITLE RESOLUTION
// ════════════════════════════════════════════════════════

function resolveTitle(contentType: ContentType, kb: KnowledgeBase, prospect: ProspectInfo): { title: string; subtitle: string } {
  const label = CONTENT_TYPE_LABELS[contentType] || 'Document';

  const TITLES: Partial<Record<ContentType, { title: string; subtitle: string }>> = {
    'competitive-analysis': { title: 'Competitive Analysis', subtitle: `Strategic competitive positioning for ${prospect.companyName}` },
    'solution-one-pager': { title: 'Solution Overview', subtitle: `How ${kb.companyName || 'we'} solve${kb.companyName ? 's' : ''} what matters most to ${prospect.companyName}` },
    'battle-card': { title: 'Battle Card', subtitle: `Internal sales guide for the ${prospect.companyName} opportunity` },
    'outbound-email-sequence': { title: 'Email Sequence', subtitle: `5-touch outreach campaign for ${prospect.companyName}` },
    'executive-summary': { title: 'Executive Summary', subtitle: `Strategic partnership proposal for ${prospect.companyName} leadership` },
    'conference-leave-behind': { title: 'Conference Leave-Behind', subtitle: `Key takeaways for ${prospect.companyName}` },
    'case-study': { title: 'Case Study', subtitle: `Success story prepared for ${prospect.companyName}` },
    'roi-business-case': { title: 'ROI / Business Case', subtitle: `Financial justification for ${prospect.companyName}` },
    'proposal-framework': { title: 'Proposal Framework', subtitle: `Partnership proposal for ${prospect.companyName}` },
    'implementation-timeline': { title: 'Implementation Timeline', subtitle: `Deployment roadmap for ${prospect.companyName}` },
    'renewal-upsell': { title: 'Renewal / Upsell', subtitle: `Expansion opportunity for ${prospect.companyName}` },
    'product-feature-sheet': { title: 'Product Feature Sheet', subtitle: `Capabilities overview for ${prospect.companyName}` },
    'comparison-guide': { title: 'Comparison Guide', subtitle: `Side-by-side analysis for ${prospect.companyName}` },
    'discovery-call-prep': { title: 'Discovery Call Prep', subtitle: `Call preparation for ${prospect.companyName}` },
    'objection-handling-guide': { title: 'Objection Handling Guide', subtitle: `Response strategies for ${prospect.companyName}` },
    'cold-call-script': { title: 'Cold Call Script', subtitle: `Outreach script for ${prospect.companyName}` },
    'champion-enablement-kit': { title: 'Champion Enablement Kit', subtitle: `Internal champion resources for ${prospect.companyName}` },
    'linkedin-message-sequence': { title: 'LinkedIn Message Sequence', subtitle: `Social outreach for ${prospect.companyName}` },
    'post-demo-followup': { title: 'Post-Demo Follow Up', subtitle: `Follow-up communication for ${prospect.companyName}` },
    'post-meeting-summary': { title: 'Post-Meeting Summary', subtitle: `Meeting recap for ${prospect.companyName}` },
    'executive-sponsor-email': { title: 'Executive Sponsor Email', subtitle: `Executive outreach for ${prospect.companyName}` },
  };

  return TITLES[contentType] || { title: label, subtitle: `Prepared for ${prospect.companyName}` };
}

// ════════════════════════════════════════════════════════
// VISUAL SECTIONS RENDERER
// ════════════════════════════════════════════════════════

function renderVisualSections(
  visualSections: VisualSection[],
  kb: KnowledgeBase,
  prospect: ProspectInfo,
  brand: BrandGuidelines,
  baseUrl: string,
  logoOptions: PDFLogoOptions,
  contentType?: string
): string {
  const { title, subtitle } = resolveTitle(
    (contentType as ContentType) || 'solution-one-pager',
    kb,
    prospect
  );

  const header = heroHeader(title, subtitle, kb, prospect, brand, baseUrl, logoOptions, contentType);

  const sectionsHtml = visualSections
    .map((vs) => renderVisualSectionHtml(vs, brand.colors))
    .join('\n');

  return `${header}
    <div class="content" style="padding:32px 40px;">
      ${sectionsHtml}
    </div>`;
}

// ════════════════════════════════════════════════════════
// MAIN EXPORT: Generate full PDF HTML
// ════════════════════════════════════════════════════════

export function generatePDFHtml(
  sections: GeneratedSection[],
  contentType: ContentType,
  prospect: ProspectInfo,
  kb: KnowledgeBase,
  baseUrl: string = '',
  logoOptions: PDFLogoOptions = {},
  persona?: string,
  visualSectionsInput?: VisualSection[]
): string {
  // Resolve brand guidelines from KB (with fallbacks)
  const brand = resolveBrandGuidelines(kb);

  const { title, subtitle } = resolveTitle(contentType, kb, prospect);

  let bodyHtml: string = '';
  let usePersonaCSS = false;
  let useVisualCSS = false;

  // If visual sections are provided, use the visual renderer
  if (visualSectionsInput && visualSectionsInput.length > 0) {
    useVisualCSS = true;
    bodyHtml = renderVisualSections(visualSectionsInput, kb, prospect, brand, baseUrl, logoOptions, contentType);
  }

  // If no visual output, try persona-specific renderer
  if (!bodyHtml && persona) {
    usePersonaCSS = true;
    switch (persona) {
      case 'cfo':
        bodyHtml = renderCFODocument(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      case 'ceo':
        bodyHtml = renderCEODocument(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      case 'vp-ops':
        bodyHtml = renderVPOpsDocument(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      case 'it-director':
        bodyHtml = renderITDocument(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      case 'end-user':
        bodyHtml = renderEndUserDocument(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      case 'procurement':
        bodyHtml = renderProcurementDocument(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      default:
        // Fall through to content-type rendering
        usePersonaCSS = false;
        bodyHtml = '';
        break;
    }
  }

  // If no persona matched, use content-type rendering
  if (!bodyHtml) {
    usePersonaCSS = false;
    switch (contentType) {
      case 'competitive-analysis':
        bodyHtml = renderCompetitiveAnalysis(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      case 'battle-card':
        bodyHtml = renderBattleCard(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      case 'outbound-email-sequence':
        bodyHtml = renderEmailSequence(sections, kb, prospect, brand, baseUrl, logoOptions, contentType);
        break;
      default:
        bodyHtml = renderDefault(sections, kb, prospect, brand, title, subtitle, baseUrl, logoOptions, contentType);
        break;
    }
  }

  let css = generateCSS(brand);
  if (usePersonaCSS) css += personaCSS(brand);
  if (useVisualCSS) css += visualComponentsCSS(brand.colors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — ${prospect.companyName}</title>
  <style>${css}</style>
</head>
<body>
  <div class="page">
    ${bodyHtml}
    ${footer(kb, brand)}
  </div>
</body>
</html>`;
}
