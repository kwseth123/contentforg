import type { DocumentStyle, StyleInput } from './types';
import { resolveBrand, brandCSSVars, formatMarkdown, brandLogoHtml, wrapDocument, lighten, darken, contrastText, hexToRgb, brandFonts, buildOnePagerDocument, professionalSymbolCSS, stripEmojis } from './shared';

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

  // One-pager support
  if (input.contentType === 'solution-one-pager') {
    return buildOnePagerDocument(input, brand);
  }

  const { sections, contentType, prospect, companyName, date } = input;
  const cleanSections = sections.map(s => ({
    ...s,
    title: stripEmojis(s.title),
    content: stripEmojis(s.content),
  }));
  const stats = extractStats(cleanSections);
  const dateStr = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const accent = brand.accent || brand.primary;
  const primaryDark = darken(accent, 0.15);
  const totalPages = Math.max(1, Math.ceil(cleanSections.length / 2));

  // Extract first sentence from each section as key takeaway
  const sectionsHtml = cleanSections.map((s, i) => {
    const contentText = s.content.replace(/[#*_\-|]/g, '').trim();
    const firstSentence = contentText.split(/(?<=[.!?])\s+/)[0] || contentText.substring(0, 140);

    return `
      <div class="cd-slide">
        <!-- Insight Box -->
        <div class="cd-insight-box">
          <div class="cd-insight-label">KEY INSIGHT</div>
          <div class="cd-insight-text">${firstSentence}</div>
        </div>

        <h2 class="cd-slide-title">${s.title}</h2>
        <div class="cd-slide-body">${formatMarkdown(s.content)}</div>

        <div class="cd-slide-footer">
          <span>${companyName}</span>
          <span>CONFIDENTIAL AND PROPRIETARY</span>
          <span>${i + 1} / ${cleanSections.length}</span>
        </div>
      </div>`;
  }).join('\n');

  const statsHtml = stats.length > 0 ? `
    <div class="cd-stats-bar">
      ${stats.map(s => `
        <div class="cd-stat">
          <div class="cd-stat-value">${s.value}</div>
          <div class="cd-stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>` : '';

  const css = `
    ${brandCSSVars(brand)}

    @page {
      size: letter;
      margin: 0.5in 0.75in;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cd-page { padding: 0; max-width: none; }
      .cd-slide { page-break-after: always; }
    }

    body {
      font-family: 'Inter', var(--brand-font-secondary), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: var(--brand-font-body-size);
      color: #1a1a1a;
      background: #f0f0f0;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    ${professionalSymbolCSS(accent)}

    .cd-page {
      max-width: 8.5in;
      margin: 0 auto;
    }

    /* ══ Cover Slide ══ */
    .cd-cover {
      background: #ffffff;
      padding: 72px 64px 48px;
      margin-bottom: 24px;
      position: relative;
      min-height: 320px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .cd-cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 48px;
    }
    .cd-cover-rule {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 5px;
      background: ${accent};
    }
    .cd-cover-title {
      font-family: 'Inter', var(--brand-font-primary), sans-serif;
      font-size: 36px;
      font-weight: 800;
      color: #111111;
      line-height: 1.15;
      margin: 0 0 12px 0;
      letter-spacing: -0.02em;
    }
    .cd-cover-subtitle {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .cd-cover-meta {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 24px;
    }

    /* ══ Stats Bar ══ */
    .cd-stats-bar {
      background: #ffffff;
      display: flex;
      margin-bottom: 24px;
      border-top: 4px solid ${accent};
    }
    .cd-stat {
      flex: 1;
      text-align: center;
      padding: 24px 16px;
      border-right: 1px solid #f3f4f6;
    }
    .cd-stat:last-child { border-right: none; }
    .cd-stat-value {
      font-size: 32px;
      font-weight: 800;
      color: #111111;
      line-height: 1.1;
    }
    .cd-stat-label {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }

    /* ══ Slide Sections ══ */
    .cd-slide {
      background: #ffffff;
      padding: 48px 64px 24px;
      margin-bottom: 24px;
      position: relative;
      page-break-inside: avoid;
    }

    /* ── Insight Box ── */
    .cd-insight-box {
      border-left: 4px solid ${accent};
      padding: 16px 24px;
      background: ${lighten(accent, 0.95)};
      margin-bottom: 28px;
    }
    .cd-insight-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${accent};
      margin-bottom: 6px;
    }
    .cd-insight-text {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      line-height: 1.5;
    }

    .cd-slide-title {
      font-family: 'Inter', var(--brand-font-primary), sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #111111;
      margin: 0 0 20px 0;
      line-height: 1.2;
    }

    .cd-slide-body p {
      margin-bottom: 14px;
    }
    .cd-slide-body h1,
    .cd-slide-body h2,
    .cd-slide-body h3,
    .cd-slide-body h4 {
      color: #111111;
      margin: 24px 0 10px;
      font-weight: 700;
    }
    .cd-slide-body h2 { font-size: 20px; }
    .cd-slide-body h3 { font-size: 17px; }
    .cd-slide-body h4 { font-size: 14px; font-weight: 600; }
    .cd-slide-body strong { font-weight: 600; }

    /* ── Em-dash bullets ── */
    .cd-slide-body ul {
      list-style: none;
      padding-left: 0;
      margin: 14px 0;
    }
    .cd-slide-body ul li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 10px;
      line-height: 1.6;
    }
    .cd-slide-body ul li::before {
      content: '\\2014';
      position: absolute;
      left: 0;
      color: ${accent};
      font-weight: 700;
    }
    .cd-slide-body ol {
      padding-left: 24px;
      margin: 14px 0;
    }
    .cd-slide-body ol li {
      margin-bottom: 10px;
      line-height: 1.6;
    }
    .cd-slide-body hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 28px 0;
    }

    /* ══ Tables ══ */
    .cd-slide-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .cd-slide-body th {
      background: ${accent};
      color: ${contrastText(accent)};
      font-weight: 600;
      text-align: left;
      padding: 10px 16px;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .cd-slide-body td {
      padding: 10px 16px;
      border-bottom: 1px solid #f3f4f6;
    }
    .cd-slide-body tr:nth-child(even) td {
      background: #fafafa;
    }

    /* ── Slide Footer ── */
    .cd-slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ══ Page Footer ══ */
    .cd-footer {
      text-align: center;
      padding: 20px 0;
      font-size: 10px;
      color: #9ca3af;
    }
    .cd-footer-confidential {
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 9px;
      margin-bottom: 6px;
    }
  `;

  const body = `
    <div class="cd-page">
      <!-- Cover Slide -->
      <div class="cd-cover">
        <div class="cd-cover-rule"></div>
        <div class="cd-cover-header">
          ${brandLogoHtml(input, 'height:32px;')}
          <div style="font-size:10px;color:#9ca3af;">${dateStr}</div>
        </div>
        <h1 class="cd-cover-title">${title}</h1>
        <div class="cd-cover-subtitle">Prepared for ${prospect.companyName}</div>
        <div class="cd-cover-meta">
          ${prospect.industry ? `${prospect.industry}` : ''}${prospect.companySize ? ` | ${prospect.companySize}` : ''}
          ${prospect.industry || prospect.companySize ? ' | ' : ''}${dateStr}
        </div>
      </div>

      <!-- Stats Bar -->
      ${statsHtml}

      <!-- Content Slides -->
      ${sectionsHtml}

      <!-- Final Footer -->
      <div class="cd-footer">
        <div class="cd-footer-confidential">Confidential and Proprietary</div>
        <div>${companyName} | ${dateStr} | Page 1 of ${totalPages}</div>
      </div>
    </div>
  `;

  return wrapDocument({
    title: `${title} — ${prospect.companyName}`,
    css,
    body,
    fonts: ['Inter', ...brandFonts(brand)],
  });
}

// ── Thumbnail ───────────────────────────────────────────────

function thumbnail(accentColor: string): string {
  return `<div style="width:100%;height:100%;background:#f0f0f0;font-family:sans-serif;padding:12px 10px;box-sizing:border-box;position:relative;">
    <!-- Cover mini -->
    <div style="background:#fff;padding:10px 12px;margin-bottom:8px;position:relative;border-left:4px solid ${accentColor};">
      <div style="width:30px;height:6px;background:${accentColor};border-radius:1px;margin-bottom:10px;"></div>
      <div style="font-size:11px;font-weight:800;color:#111;margin-bottom:3px;">Document Title</div>
      <div style="width:50%;height:3px;background:#ddd;border-radius:1px;margin-bottom:2px;"></div>
      <div style="width:35%;height:3px;background:#eee;border-radius:1px;"></div>
    </div>
    <!-- Stats mini -->
    <div style="background:#fff;display:flex;border-top:3px solid ${accentColor};margin-bottom:8px;">
      <div style="flex:1;text-align:center;padding:6px 4px;border-right:1px solid #f3f4f6;">
        <div style="font-size:10px;font-weight:800;color:#111;">45%</div>
        <div style="width:60%;height:2px;background:#eee;margin:2px auto 0;border-radius:1px;"></div>
      </div>
      <div style="flex:1;text-align:center;padding:6px 4px;">
        <div style="font-size:10px;font-weight:800;color:#111;">3x</div>
        <div style="width:60%;height:2px;background:#eee;margin:2px auto 0;border-radius:1px;"></div>
      </div>
    </div>
    <!-- Slide mini -->
    <div style="background:#fff;padding:8px 10px;">
      <div style="border-left:3px solid ${accentColor};padding:3px 8px;background:${accentColor}10;margin-bottom:6px;">
        <div style="font-size:5px;font-weight:700;color:${accentColor};letter-spacing:0.1em;">KEY INSIGHT</div>
        <div style="width:70%;height:2px;background:#ddd;border-radius:1px;margin-top:2px;"></div>
      </div>
      <div style="font-size:8px;font-weight:700;color:#111;margin-bottom:4px;">Section Title</div>
      <div style="width:90%;height:3px;background:#eee;border-radius:1px;margin-bottom:2px;"></div>
      <div style="width:80%;height:3px;background:#eee;border-radius:1px;"></div>
    </div>
    <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:5px;color:#aaa;font-weight:700;letter-spacing:0.1em;">CONFIDENTIAL AND PROPRIETARY</div>
  </div>`;
}

// ── Export ───────────────────────────────────────────────────

const style19ConsultingDeck: DocumentStyle = {
  id: 'style-19',
  name: 'Consulting Deck',
  category: 'corporate',
  description: 'Slide-like sections — large header, 3 bullets, executive takeaway boxes',
  keywords: ['consulting', 'deck', 'slides', 'mckinsey', 'takeaways', 'strategy'],
  render,
  thumbnail,
};

export default style19ConsultingDeck;
