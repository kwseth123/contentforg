import { BrandColors, VisualFormat, VisualSection } from './types';

// Re-export for convenience
export type { VisualFormat, VisualSection };

// ════════════════════════════════════════════════════════
// VISUAL COMPONENTS LIBRARY
// Rich visual formats for PDF document sections
// ════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
// HELPER: hex → rgba string
// ════════════════════════════════════════════════════════

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ════════════════════════════════════════════════════════
// CONTENT PARSING HELPERS
// ════════════════════════════════════════════════════════

export function parseVisualContent(content: string | string[] | Record<string, string>): string {
  if (typeof content === 'string') {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  }
  if (Array.isArray(content)) {
    return content
      .map(item =>
        item
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      )
      .join('<br/>');
  }
  // Record<string, string>
  return Object.entries(content)
    .map(([key, val]) => `<strong>${key}:</strong> ${val}`)
    .join('<br/>');
}

export function detectBestFormat(title: string, content: string): VisualFormat {
  const t = (title + ' ' + content).toLowerCase();

  if (/\bvs\b|compar|versus/.test(t)) return 'comparison-table';
  if (/\bstep\b|process\b|\bhow\b/.test(t)) return 'numbered-flow';
  if (/before|after|current\s+(?:state|situation)|future\s+(?:state|situation)/.test(t)) return 'before-after';
  if (/metric|result\b|impact|roi\b|\b\d+%/.test(t)) return 'stat-cards';
  if (/benefit|feature|advantage|capability/.test(t)) return 'icon-grid';
  if (/timeline|phase|roadmap|milestone/.test(t)) return 'timeline';
  if (/quote|testimonial|\bsaid\b/.test(t)) return 'blockquote';
  if (/pricing|cost|investment|tier|plan\b/.test(t)) return 'pricing-cards';
  if (/next\s*step|get\s*started|action|contact/.test(t)) return 'cta-box';
  return 'highlight-box';
}

// ════════════════════════════════════════════════════════
// CSS BUNDLE — all 10 visual component styles
// ════════════════════════════════════════════════════════

export function visualComponentsCSS(colors: BrandColors): string {
  const primaryRgba8 = hexToRgba(colors.primary, 0.08);
  const primaryRgba15 = hexToRgba(colors.primary, 0.15);
  const primaryRgba30 = hexToRgba(colors.primary, 0.30);
  const secondaryRgba5 = hexToRgba(colors.secondary, 0.05);
  const secondaryRgba10 = hexToRgba(colors.secondary, 0.10);
  const accentRgba15 = hexToRgba(colors.accent, 0.15);
  const accentRgba30 = hexToRgba(colors.accent, 0.30);

  return `
/* ════════════════════════════════════════════════
   VISUAL COMPONENTS — Professional PDF Modules
   ════════════════════════════════════════════════ */

/* ── 1. Highlight Box ── */
.vc-highlight-box {
  border-left: 4px solid ${colors.primary};
  background: ${primaryRgba8};
  border-radius: 0 6px 6px 0;
  padding: 20px 24px;
  margin: 24px 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-highlight-box__title {
  font-size: 15px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 8px;
  line-height: 1.3;
}
.vc-highlight-box__icon {
  margin-right: 8px;
  font-size: 16px;
}
.vc-highlight-box__body {
  font-size: 13px;
  color: ${colors.text};
  line-height: 1.7;
}

/* ── 2. Stat Cards ── */
.vc-stat-cards {
  display: flex;
  gap: 16px;
  margin: 24px 0;
  flex-wrap: wrap;
}
.vc-stat-card {
  flex: 1 1 0;
  min-width: 120px;
  border: 1px solid ${primaryRgba15};
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-stat-card:nth-child(odd) {
  background: ${colors.background};
}
.vc-stat-card:nth-child(even) {
  background: ${primaryRgba8};
}
@media screen {
  .vc-stat-card {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
}
.vc-stat-card__value {
  font-size: 32px;
  font-weight: 800;
  color: ${colors.secondary};
  line-height: 1.1;
  margin-bottom: 6px;
}
.vc-stat-card__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: ${hexToRgba(colors.text, 0.55)};
  margin-bottom: 4px;
}
.vc-stat-card__subtext {
  font-size: 11px;
  color: ${hexToRgba(colors.text, 0.45)};
  line-height: 1.4;
}

/* ── 3. Numbered Flow ── */
.vc-numbered-flow {
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin: 28px 0;
  position: relative;
}
.vc-numbered-flow__step {
  flex: 1;
  text-align: center;
  position: relative;
  padding: 0 12px;
}
.vc-numbered-flow__circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${colors.accent};
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px auto;
  position: relative;
  z-index: 2;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-numbered-flow__connector {
  position: absolute;
  top: 18px;
  left: calc(50% + 18px);
  right: calc(-50% + 18px);
  height: 2px;
  background: ${primaryRgba30};
  z-index: 1;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-numbered-flow__step:last-child .vc-numbered-flow__connector {
  display: none;
}
.vc-numbered-flow__title {
  font-size: 12px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 4px;
  line-height: 1.3;
}
.vc-numbered-flow__desc {
  font-size: 11px;
  color: ${hexToRgba(colors.text, 0.65)};
  line-height: 1.5;
}

/* ── 4. Before / After ── */
.vc-before-after {
  display: flex;
  gap: 20px;
  margin: 24px 0;
}
.vc-before-after__card {
  flex: 1;
  border-radius: 8px;
  padding: 20px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-before-after__card--before {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}
.vc-before-after__card--after {
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
}
.vc-before-after__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}
.vc-before-after__card--before .vc-before-after__label {
  color: #dc2626;
}
.vc-before-after__card--after .vc-before-after__label {
  color: #16a34a;
}
.vc-before-after__title {
  font-size: 14px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 10px;
}
.vc-before-after__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.vc-before-after__list li {
  font-size: 12px;
  color: ${colors.text};
  line-height: 1.6;
  padding: 3px 0 3px 18px;
  position: relative;
}
.vc-before-after__card--before .vc-before-after__list li::before {
  content: '✕';
  position: absolute;
  left: 0;
  color: #ef4444;
  font-weight: 700;
  font-size: 11px;
}
.vc-before-after__card--after .vc-before-after__list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #22c55e;
  font-weight: 700;
  font-size: 12px;
}

/* ── 5. Icon Grid ── */
.vc-icon-grid {
  display: grid;
  gap: 16px;
  margin: 24px 0;
}
.vc-icon-grid--cols-2 {
  grid-template-columns: 1fr 1fr;
}
.vc-icon-grid--cols-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.vc-icon-grid__card {
  border: 1px solid ${primaryRgba15};
  border-radius: 8px;
  padding: 18px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  background: ${colors.background};
}
@media screen {
  .vc-icon-grid__card {
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
}
.vc-icon-grid__icon {
  font-size: 24px;
  margin-bottom: 8px;
  display: block;
}
.vc-icon-grid__title {
  font-size: 13px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 4px;
  line-height: 1.3;
}
.vc-icon-grid__desc {
  font-size: 11px;
  color: ${hexToRgba(colors.text, 0.65)};
  line-height: 1.6;
}

/* ── 6. Comparison Table ── */
.vc-comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  font-size: 12px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-comparison-table th {
  background: ${colors.primary};
  color: #ffffff;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid ${colors.primary};
}
.vc-comparison-table td {
  padding: 10px 14px;
  border: 1px solid ${primaryRgba15};
  color: ${colors.text};
  line-height: 1.5;
}
.vc-comparison-table td:first-child {
  font-weight: 600;
  background: ${primaryRgba8};
  white-space: nowrap;
}
.vc-comparison-table tr:nth-child(even) td {
  background: ${hexToRgba(colors.primary, 0.03)};
}
.vc-comparison-table tr:nth-child(even) td:first-child {
  background: ${primaryRgba8};
}

/* ── 7. Timeline ── */
.vc-timeline {
  display: flex;
  align-items: flex-start;
  margin: 28px 0;
  position: relative;
}
.vc-timeline__phase {
  flex: 1;
  text-align: center;
  position: relative;
  padding: 0 10px;
}
.vc-timeline__node {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${colors.accent};
  margin: 0 auto 10px auto;
  position: relative;
  z-index: 2;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-timeline__node--active {
  width: 26px;
  height: 26px;
  margin-top: -4px;
  border: 3px solid ${colors.accent};
  background: ${colors.background};
  box-shadow: 0 0 0 4px ${accentRgba30};
}
.vc-timeline__line {
  position: absolute;
  top: 9px;
  left: calc(50% + 9px);
  right: calc(-50% + 9px);
  height: 2px;
  background: ${primaryRgba30};
  z-index: 1;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-timeline__phase:last-child .vc-timeline__line {
  display: none;
}
.vc-timeline__label {
  font-size: 12px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 2px;
  line-height: 1.3;
}
.vc-timeline__duration {
  font-size: 11px;
  font-weight: 600;
  color: ${colors.secondary};
  margin-bottom: 4px;
}
.vc-timeline__desc {
  font-size: 10px;
  color: ${hexToRgba(colors.text, 0.6)};
  line-height: 1.5;
}

/* ── 8. Blockquote ── */
.vc-blockquote {
  position: relative;
  border-left: 4px solid ${colors.secondary};
  background: ${secondaryRgba5};
  border-radius: 0 8px 8px 0;
  padding: 28px 28px 20px 32px;
  margin: 24px 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-blockquote__mark {
  position: absolute;
  top: 8px;
  left: 16px;
  font-size: 72px;
  line-height: 1;
  color: ${hexToRgba(colors.accent, 0.2)};
  font-family: Georgia, serif;
  pointer-events: none;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-blockquote__text {
  font-size: 14px;
  font-style: italic;
  color: ${colors.text};
  line-height: 1.7;
  position: relative;
  z-index: 1;
  margin-bottom: 12px;
}
.vc-blockquote__attribution {
  font-size: 12px;
  color: ${hexToRgba(colors.text, 0.65)};
  text-align: right;
  font-style: normal;
  font-weight: 600;
}

/* ── 9. Pricing Cards ── */
.vc-pricing-cards {
  display: flex;
  gap: 16px;
  margin: 24px 0;
  align-items: stretch;
}
.vc-pricing-card {
  flex: 1;
  border: 1px solid ${primaryRgba15};
  border-radius: 10px;
  overflow: hidden;
  background: ${colors.background};
  display: flex;
  flex-direction: column;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
@media screen {
  .vc-pricing-card {
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
}
.vc-pricing-card--highlighted {
  border: 2px solid ${colors.primary};
  position: relative;
}
.vc-pricing-card__badge {
  display: none;
}
.vc-pricing-card--highlighted .vc-pricing-card__badge {
  display: block;
  background: ${colors.primary};
  color: #ffffff;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 5px 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-pricing-card__header {
  padding: 20px 18px 14px 18px;
  text-align: center;
  border-bottom: 1px solid ${primaryRgba15};
}
.vc-pricing-card__name {
  font-size: 14px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 8px;
}
.vc-pricing-card__price {
  font-size: 28px;
  font-weight: 800;
  color: ${colors.primary};
  line-height: 1.1;
}
.vc-pricing-card__features {
  list-style: none;
  padding: 16px 18px;
  margin: 0;
  flex: 1;
}
.vc-pricing-card__features li {
  font-size: 12px;
  color: ${colors.text};
  line-height: 1.5;
  padding: 4px 0 4px 20px;
  position: relative;
}
.vc-pricing-card__features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: ${colors.accent};
  font-weight: 700;
  font-size: 13px;
}

/* ── 10. CTA Box ── */
.vc-cta-box {
  background: ${colors.primary};
  border-radius: 10px;
  padding: 0;
  margin: 28px 0;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-cta-box__accent-bar {
  height: 4px;
  background: ${colors.accent};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.vc-cta-box__body {
  padding: 28px 32px;
}
.vc-cta-box__headline {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
  line-height: 1.3;
}
.vc-cta-box__bullets {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}
.vc-cta-box__bullets li {
  font-size: 13px;
  color: rgba(255,255,255,0.9);
  line-height: 1.6;
  padding: 3px 0 3px 20px;
  position: relative;
}
.vc-cta-box__bullets li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: ${colors.accent};
  font-weight: 700;
}
.vc-cta-box__contact {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  line-height: 1.7;
  border-top: 1px solid rgba(255,255,255,0.15);
  padding-top: 14px;
}
.vc-cta-box__contact strong {
  color: rgba(255,255,255,0.95);
}
`;
}

// ════════════════════════════════════════════════════════
// COMPONENT RENDER FUNCTIONS
// ════════════════════════════════════════════════════════

function escHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 1. Highlight Box ──

export function renderHighlightBox(
  title: string,
  content: string,
  colors: BrandColors,
  icon?: string
): string {
  return `
<div class="vc-highlight-box">
  <div class="vc-highlight-box__title">
    ${icon ? `<span class="vc-highlight-box__icon">${icon}</span>` : ''}${escHtml(title)}
  </div>
  <div class="vc-highlight-box__body">${parseVisualContent(content)}</div>
</div>`;
}

// ── 2. Stat Cards ──

export function renderStatCards(
  items: { value: string; label: string; subtext?: string }[],
  colors: BrandColors
): string {
  const cards = items.map(item => `
    <div class="vc-stat-card">
      <div class="vc-stat-card__value">${escHtml(item.value)}</div>
      <div class="vc-stat-card__label">${escHtml(item.label)}</div>
      ${item.subtext ? `<div class="vc-stat-card__subtext">${escHtml(item.subtext)}</div>` : ''}
    </div>`).join('');

  return `<div class="vc-stat-cards">${cards}</div>`;
}

// ── 3. Numbered Flow ──

export function renderNumberedFlow(
  steps: { title: string; description: string }[],
  colors: BrandColors
): string {
  const stepsHtml = steps.map((step, i) => `
    <div class="vc-numbered-flow__step">
      <div class="vc-numbered-flow__connector"></div>
      <div class="vc-numbered-flow__circle">${i + 1}</div>
      <div class="vc-numbered-flow__title">${escHtml(step.title)}</div>
      <div class="vc-numbered-flow__desc">${escHtml(step.description)}</div>
    </div>`).join('');

  return `<div class="vc-numbered-flow">${stepsHtml}</div>`;
}

// ── 4. Before / After ──

export function renderBeforeAfter(
  before: { title: string; items: string[] },
  after: { title: string; items: string[] },
  colors: BrandColors
): string {
  const beforeItems = before.items.map(item => `<li>${escHtml(item)}</li>`).join('');
  const afterItems = after.items.map(item => `<li>${escHtml(item)}</li>`).join('');

  return `
<div class="vc-before-after">
  <div class="vc-before-after__card vc-before-after__card--before">
    <div class="vc-before-after__label">Before</div>
    <div class="vc-before-after__title">${escHtml(before.title)}</div>
    <ul class="vc-before-after__list">${beforeItems}</ul>
  </div>
  <div class="vc-before-after__card vc-before-after__card--after">
    <div class="vc-before-after__label">After</div>
    <div class="vc-before-after__title">${escHtml(after.title)}</div>
    <ul class="vc-before-after__list">${afterItems}</ul>
  </div>
</div>`;
}

// ── 5. Icon Grid ──

export function renderIconGrid(
  items: { icon: string; title: string; description: string }[],
  colors: BrandColors
): string {
  const colClass = items.length <= 4 ? 'vc-icon-grid--cols-2' : 'vc-icon-grid--cols-3';
  const cards = items.map(item => `
    <div class="vc-icon-grid__card">
      <span class="vc-icon-grid__icon">${item.icon}</span>
      <div class="vc-icon-grid__title">${escHtml(item.title)}</div>
      <div class="vc-icon-grid__desc">${escHtml(item.description)}</div>
    </div>`).join('');

  return `<div class="vc-icon-grid ${colClass}">${cards}</div>`;
}

// ── 6. Comparison Table ──

export function renderComparisonTable(
  headers: string[],
  rows: { dimension: string; values: string[] }[],
  colors: BrandColors
): string {
  const thCells = headers.map(h => `<th>${escHtml(h)}</th>`).join('');

  const bodyRows = rows.map(row => {
    const valueCells = row.values.map(v => {
      // Render check/cross/warning emoji natively
      const display = v
        .replace(/^✅$/g, '✅')
        .replace(/^❌$/g, '❌')
        .replace(/^⚠️$/g, '⚠️');
      return `<td>${display === v ? escHtml(v) : display}</td>`;
    }).join('');
    return `<tr><td>${escHtml(row.dimension)}</td>${valueCells}</tr>`;
  }).join('');

  return `
<table class="vc-comparison-table">
  <thead><tr>${thCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>`;
}

// ── 7. Timeline ──

export function renderTimeline(
  phases: { label: string; duration: string; description?: string; active?: boolean }[],
  colors: BrandColors
): string {
  const nodes = phases.map(phase => {
    const activeClass = phase.active ? ' vc-timeline__node--active' : '';
    return `
    <div class="vc-timeline__phase">
      <div class="vc-timeline__line"></div>
      <div class="vc-timeline__node${activeClass}"></div>
      <div class="vc-timeline__label">${escHtml(phase.label)}</div>
      <div class="vc-timeline__duration">${escHtml(phase.duration)}</div>
      ${phase.description ? `<div class="vc-timeline__desc">${escHtml(phase.description)}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="vc-timeline">${nodes}</div>`;
}

// ── 8. Blockquote ──

export function renderBlockquote(
  quote: string,
  attribution: string,
  role: string | undefined,
  colors: BrandColors
): string {
  const attr = role
    ? `&mdash; ${escHtml(attribution)}, ${escHtml(role)}`
    : `&mdash; ${escHtml(attribution)}`;

  return `
<div class="vc-blockquote">
  <div class="vc-blockquote__mark">\u201C</div>
  <div class="vc-blockquote__text">${escHtml(quote)}</div>
  <div class="vc-blockquote__attribution">${attr}</div>
</div>`;
}

// ── 9. Pricing Cards ──

export function renderPricingCards(
  tiers: { name: string; price: string; features: string[]; highlighted?: boolean }[],
  colors: BrandColors
): string {
  const cards = tiers.map(tier => {
    const highlightedClass = tier.highlighted ? ' vc-pricing-card--highlighted' : '';
    const featureItems = tier.features.map(f => `<li>${escHtml(f)}</li>`).join('');
    return `
    <div class="vc-pricing-card${highlightedClass}">
      <div class="vc-pricing-card__badge">Recommended</div>
      <div class="vc-pricing-card__header">
        <div class="vc-pricing-card__name">${escHtml(tier.name)}</div>
        <div class="vc-pricing-card__price">${escHtml(tier.price)}</div>
      </div>
      <ul class="vc-pricing-card__features">${featureItems}</ul>
    </div>`;
  }).join('');

  return `<div class="vc-pricing-cards">${cards}</div>`;
}

// ── 10. CTA Box ──

export function renderCTABox(
  headline: string,
  bullets: string[],
  contactInfo: string,
  colors: BrandColors
): string {
  const bulletItems = bullets.map(b => `<li>${escHtml(b)}</li>`).join('');
  const contactHtml = contactInfo
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  return `
<div class="vc-cta-box">
  <div class="vc-cta-box__accent-bar"></div>
  <div class="vc-cta-box__body">
    <div class="vc-cta-box__headline">${escHtml(headline)}</div>
    <ul class="vc-cta-box__bullets">${bulletItems}</ul>
    <div class="vc-cta-box__contact">${contactHtml}</div>
  </div>
</div>`;
}

// ════════════════════════════════════════════════════════
// MASTER DISPATCHER — render a single VisualSection
// ════════════════════════════════════════════════════════

export function renderVisualSectionHtml(section: VisualSection, colors: BrandColors): string {
  const fmt = section.visualFormat;
  const title = section.title || '';
  const content = typeof section.content === 'string' ? section.content : '';

  switch (fmt) {
    case 'stat-cards': {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderStatCards(items, colors);
    }
    case 'numbered-flow': {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderNumberedFlow(items, colors);
    }
    case 'before-after': {
      const before = section.before || { title: 'Before', items: [] };
      const after = section.after || { title: 'After', items: [] };
      if (!before.items?.length && !after.items?.length) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderBeforeAfter(before, after, colors);
    }
    case 'icon-grid': {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderIconGrid(items, colors);
    }
    case 'comparison-table': {
      const headers = section.headers || [];
      const rows = section.rows || [];
      if (headers.length === 0 || rows.length === 0) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderComparisonTable(headers, rows, colors);
    }
    case 'timeline': {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderTimeline(items, colors);
    }
    case 'blockquote': {
      const quote = section.quote || content;
      const attribution = section.attribution || '';
      const role = section.role;
      if (!quote) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderBlockquote(quote, attribution, role, colors);
    }
    case 'pricing-cards': {
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) return renderHighlightBox(title, content, colors);
      return `<div class="vc-highlight-box__title" style="margin-bottom:12px">${escHtml(title)}</div>` +
        renderPricingCards(items, colors);
    }
    case 'cta-box': {
      const headline = section.headline || title;
      const bullets = section.bullets || [];
      const contactInfo = section.contactInfo || '';
      return renderCTABox(headline, bullets, contactInfo, colors);
    }
    case 'highlight-box':
    default:
      return renderHighlightBox(title, content, colors);
  }
}
