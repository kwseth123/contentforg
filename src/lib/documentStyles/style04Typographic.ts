import type { DocumentStyle, StyleInput } from './types';
import {
  resolveBrand,
  brandCSSVars,
  brandFonts,
  brandLogoHtml,
  formatMarkdown,
  wrapDocument,
  lighten,
  darken,
  contrastText,
  hexToRgb,
  buildOnePagerDocument,
  professionalSymbolCSS,
  stripEmojis,
} from './shared';

// ── Extract key numbers for display ─────────────────────────

function extractKeyNumbers(content: string): { value: string; context: string }[] {
  const numbers: { value: string; context: string }[] = [];
  const patterns = [
    { re: /(\d{1,4}(?:\.\d+)?%)/g, type: 'percentage' },
    { re: /(\$[\d,.]+[KkMmBb]?)/g, type: 'currency' },
    { re: /(\d+(?:\.\d+)?[xX])\b/g, type: 'multiplier' },
  ];
  for (const { re } of patterns) {
    let match;
    while ((match = re.exec(content)) !== null && numbers.length < 3) {
      const idx = match.index;
      const surrounding = content.substring(Math.max(0, idx - 30), idx + match[1].length + 30);
      const words = surrounding.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2).slice(0, 2);
      numbers.push({ value: match[1], context: words.join(' ') });
    }
  }
  return numbers;
}

// ── Pull quote extraction ───────────────────────────────────

function extractPullQuote(content: string): string | null {
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 30 && s.length < 160);
  const ranked = sentences.map(s => {
    let score = 0;
    if (/\d+%/.test(s)) score += 3;
    if (/\$[\d,.]+/.test(s)) score += 3;
    if (/\d+x/i.test(s)) score += 2;
    if (/transform|increase|improve|grow|boost|accelerat|driv|enabl|achiev|unlock|deliver/i.test(s)) score += 2;
    return { text: s, score };
  }).sort((a, b) => b.score - a.score);
  return ranked.length > 0 && ranked[0].score > 0 ? ranked[0].text : null;
}

// ── Render ──────────────────────────────────────────────────

function render(input: StyleInput): string {
  const brand = resolveBrand(input);

  // One-pager support
  if (input.contentType === 'solution-one-pager') {
    return buildOnePagerDocument(input, brand);
  }

  const { sections, contentType, prospect, companyName, logoBase64, prospectLogoBase64, date } = input;
  const cleanSections = sections.map(s => ({
    ...s,
    title: stripEmojis(s.title),
    content: stripEmojis(s.content),
  }));
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accent = brand.accent || brand.primary;
  const { r, g, b } = hexToRgb(accent);

  // Extract numbers and pull quotes
  const allContent = cleanSections.map(s => s.content).join('\n');
  const keyNumbers = extractKeyNumbers(allContent);
  const firstPullQuote = extractPullQuote(allContent);

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0;
    }

    ${professionalSymbolCSS(accent)}

    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Georgia', 'Merriweather', 'Times New Roman', serif;
      font-size: 14px;
      color: #333;
      background: #fff;
      line-height: 1.8;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── Page layout ── */
    .typo-page {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 72px 68px 56px;
      position: relative;
    }

    /* ── Header: wordmark + date ── */
    .typo-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 72px;
    }
    .typo-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .typo-header-left img {
      height: 28px;
      width: auto;
    }
    .typo-wordmark {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #111;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .typo-header-date {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 11px;
      color: #bbb;
      letter-spacing: 0.04em;
    }

    /* ── Title block ── */
    .typo-title-block {
      margin-bottom: 56px;
    }
    .typo-meta-label {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 20px;
    }
    .typo-title {
      font-size: 48px;
      font-weight: 700;
      color: #111;
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-bottom: 16px;
    }
    .typo-subtitle {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #999;
    }

    /* ── Key numbers ── */
    .typo-numbers {
      display: flex;
      gap: 72px;
      margin-bottom: 64px;
      padding-bottom: 48px;
    }
    .typo-number-item {
      text-align: left;
    }
    .typo-number-value {
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 52px;
      font-weight: 700;
      color: rgba(${r}, ${g}, ${b}, 0.2);
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .typo-number-label {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #bbb;
      margin-top: 10px;
    }

    /* ── Section separator HR ── */
    .typo-hr {
      border: none;
      height: 2px;
      background: ${accent};
      opacity: 0.25;
      margin: 56px 0;
    }

    /* ── Sections ── */
    .typo-section {
      margin-bottom: 0;
    }
    .typo-section-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 28px;
    }
    .typo-section-body {
      max-width: 600px;
    }
    .typo-section-body p {
      margin-bottom: 20px;
      color: #333;
      line-height: 1.85;
      font-size: 15px;
    }
    .typo-section-body h1 {
      font-size: 36px;
      font-weight: 700;
      color: #111;
      line-height: 1.15;
      margin: 40px 0 16px;
      letter-spacing: -0.02em;
    }
    .typo-section-body h2 {
      font-size: 26px;
      font-weight: 700;
      color: #111;
      line-height: 1.25;
      margin: 36px 0 14px;
      letter-spacing: -0.01em;
    }
    .typo-section-body h3 {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #222;
      margin: 28px 0 12px;
    }
    .typo-section-body h4 {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #555;
      margin: 24px 0 8px;
      letter-spacing: 0.02em;
    }
    .typo-section-body strong {
      font-weight: 700;
      color: #111;
    }
    .typo-section-body em {
      font-style: italic;
    }

    /* Lists */
    .typo-section-body ul, .typo-section-body ol {
      padding-left: 0;
      margin: 18px 0;
      list-style: none;
    }
    .typo-section-body li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 12px;
      line-height: 1.8;
      font-size: 15px;
    }
    .typo-section-body ul li::before {
      content: '\\2014';
      position: absolute;
      left: 0;
      top: 0;
      color: #ccc;
      font-size: 14px;
    }
    .typo-section-body ol {
      counter-reset: item;
    }
    .typo-section-body ol li {
      counter-increment: item;
    }
    .typo-section-body ol li::before {
      content: counter(item);
      position: absolute;
      left: 0;
      top: 0;
      font-family: 'SF Mono', 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      color: #bbb;
    }
    .typo-section-body hr {
      border: none;
      height: 2px;
      background: ${accent};
      opacity: 0.2;
      margin: 40px 0;
    }

    /* Pull quotes */
    .typo-pullquote {
      font-size: 22px;
      font-style: italic;
      color: #444;
      line-height: 1.5;
      padding: 28px 0 28px 28px;
      border-left: 2px solid ${accent};
      margin: 40px 0 40px 0;
      max-width: 560px;
      opacity: 0.85;
    }

    /* Tables */
    .typo-section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 13px;
    }
    .typo-section-body thead th {
      text-align: left;
      padding: 12px 16px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #999;
      border-bottom: 2px solid #222;
    }
    .typo-section-body tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      color: #444;
      line-height: 1.6;
    }
    .typo-section-body tbody tr:nth-child(even) td {
      background: #fafafa;
    }

    /* ── Footer ── */
    .typo-footer {
      margin-top: 80px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .typo-footer-company {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #ccc;
      font-variant: small-caps;
    }
    .typo-footer-date {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      color: #ddd;
      letter-spacing: 0.04em;
      font-variant: small-caps;
    }

    /* ── Print ── */
    @media print {
      .typo-page {
        padding: 60px 68px 48px;
      }
      .typo-footer {
        position: fixed;
        bottom: 40px;
        left: 68px;
        right: 68px;
      }
    }
  `;

  // Logo/wordmark
  let headerLeft = '';
  if (logoBase64) {
    headerLeft = `<div class="typo-header-left"><img src="${logoBase64}" alt="${companyName}"/></div>`;
  } else {
    headerLeft = `<div class="typo-wordmark">${companyName}</div>`;
  }

  // Determine if we should show a pull quote after the first section
  let pullQuoteHtml = '';
  if (firstPullQuote) {
    pullQuoteHtml = `<div class="typo-pullquote">${firstPullQuote}.</div>`;
  }

  const body = `
    <div class="typo-page">
      <!-- Header -->
      <div class="typo-header">
        ${headerLeft}
        <div class="typo-header-date">${dateStr}</div>
      </div>

      <!-- Title -->
      <div class="typo-title-block">
        <div class="typo-meta-label">${stripEmojis(contentType)} &mdash; ${prospect.companyName}</div>
        <h1 class="typo-title">${prospect.companyName}</h1>
        <div class="typo-subtitle">${stripEmojis(contentType)}${prospect.industry ? ' &mdash; ' + prospect.industry : ''}${prospect.companySize ? ' &mdash; ' + prospect.companySize : ''}</div>
      </div>

      <!-- Key Numbers -->
      ${keyNumbers.length > 0 ? `
      <div class="typo-numbers">
        ${keyNumbers.map(n => `
        <div class="typo-number-item">
          <div class="typo-number-value">${n.value}</div>
          <div class="typo-number-label">${n.context}</div>
        </div>`).join('')}
      </div>` : ''}

      <!-- Sections -->
      ${cleanSections.map((s, i) => `
      ${i > 0 ? '<hr class="typo-hr"/>' : ''}
      <div class="typo-section">
        <div class="typo-section-title">${s.title}</div>
        <div class="typo-section-body">${formatMarkdown(s.content)}</div>
      </div>
      ${i === 0 && pullQuoteHtml ? pullQuoteHtml : ''}`).join('')}

      <!-- Footer -->
      <div class="typo-footer">
        <span class="typo-footer-company">${companyName}</span>
        <span class="typo-footer-date">${dateStr}</span>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${contentType} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Inter', 'Merriweather'],
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  const { r, g, b } = hexToRgb(accentColor);
  return `<div style="width:1000px;height:1294px;background:#fff;font-family:Georgia,serif;padding:72px 68px;box-sizing:border-box;display:flex;flex-direction:column;">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:64px;">
    <div style="font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:#111;letter-spacing:0.02em;text-transform:uppercase;">Company</div>
    <div style="font-family:'Inter',sans-serif;font-size:9px;color:#bbb;letter-spacing:0.04em;">April 2026</div>
  </div>

  <!-- Title -->
  <div style="margin-bottom:48px;">
    <div style="font-family:'Inter',sans-serif;font-size:8px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#bbb;margin-bottom:18px;">Case Study &mdash; Acme Corp</div>
    <div style="font-size:44px;font-weight:700;color:#111;line-height:1.1;letter-spacing:-0.02em;margin-bottom:12px;">Company Name</div>
    <div style="font-family:'Inter',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;color:#999;">Proposal &mdash; Technology</div>
  </div>

  <!-- Key Numbers -->
  <div style="display:flex;gap:60px;margin-bottom:52px;padding-bottom:40px;">
    <div>
      <div style="font-family:'SF Mono','Courier New',monospace;font-size:44px;font-weight:700;color:rgba(${r},${g},${b},0.2);line-height:1;letter-spacing:-0.03em;">47%</div>
      <div style="font-family:'Inter',sans-serif;font-size:8px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-top:8px;">Growth</div>
    </div>
    <div>
      <div style="font-family:'SF Mono','Courier New',monospace;font-size:44px;font-weight:700;color:rgba(${r},${g},${b},0.2);line-height:1;letter-spacing:-0.03em;">3x</div>
      <div style="font-family:'Inter',sans-serif;font-size:8px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-top:8px;">ROI</div>
    </div>
  </div>

  <!-- Section separator -->
  <div style="height:2px;background:${accentColor};opacity:0.25;margin-bottom:48px;"></div>

  <!-- Section 1 -->
  <div style="margin-bottom:36px;">
    <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#888;margin-bottom:20px;">Overview</div>
    <div style="max-width:520px;">
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:100%;margin-bottom:9px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:90%;margin-bottom:9px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:95%;margin-bottom:9px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:82%;margin-bottom:9px;"></div>
    </div>
  </div>

  <!-- Pull quote -->
  <div style="font-size:18px;font-style:italic;color:#555;padding:20px 0 20px 24px;border-left:2px solid ${accentColor};margin:0 0 36px 0;max-width:480px;line-height:1.5;opacity:0.85;">A pull quote with important insight here</div>

  <!-- Section separator -->
  <div style="height:2px;background:${accentColor};opacity:0.25;margin-bottom:48px;"></div>

  <!-- Section 2 -->
  <div style="margin-bottom:36px;">
    <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#888;margin-bottom:20px;">Details</div>
    <div style="max-width:520px;">
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:100%;margin-bottom:9px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:88%;margin-bottom:9px;"></div>
      <div style="height:7px;background:#f3f3f3;border-radius:2px;width:93%;margin-bottom:9px;"></div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:baseline;padding-top:20px;border-top:1px solid #eee;">
    <span style="font-family:'Inter',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#ccc;font-variant:small-caps;">Company Name</span>
    <span style="font-family:'Inter',sans-serif;font-size:9px;color:#ddd;font-variant:small-caps;">April 2026</span>
  </div>
</div>`;
}

// ── Export ───────────────────────────────────────────────────

const style04Typographic: DocumentStyle = {
  id: 'style-04',
  name: 'Typographic',
  category: 'clean',
  description: 'Pure typographic hierarchy with bold weights and dramatic scale contrast',
  keywords: ['typography', 'bold', 'minimal', 'type', 'hierarchy', 'black-white', 'dramatic'],
  render,
  thumbnail,
};

export default style04Typographic;
