import { GeneratedSection } from './types';
import { CONTENT_TYPE_LABELS, ContentType } from './types';

export function generateShareableHtml(
  sections: GeneratedSection[],
  contentType: ContentType,
  prospectName: string,
  industry: string,
  logoBase64?: string
): string {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  const date = new Date().toLocaleDateString();

  const sectionHtml = sections.map(s => `
    <div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:28px 32px;margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:600;color:#111;margin:0 0 12px 0;">${s.title}</h2>
      <div style="font-size:14px;line-height:1.7;color:#444;white-space:pre-wrap;">${s.content}</div>
    </div>
  `).join('');

  const logoHtml = logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="height:32px;margin-bottom:16px;object-fit:contain;" />` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${label} — ${prospectName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, system-ui, sans-serif; background: #fafafa; color: #111; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
</style>
</head>
<body>
<div style="max-width:740px;margin:0 auto;padding:32px 16px;">
  ${logoHtml}
  <h1 style="font-size:28px;font-weight:700;color:#111;margin-bottom:8px;">${label}</h1>
  <p style="font-size:14px;color:#888;margin-bottom:4px;">Prepared for ${prospectName}${industry ? ' · ' + industry : ''}</p>
  <p style="font-size:12px;color:#ccc;margin-bottom:32px;">${date}</p>
  ${sectionHtml}
</div>
</body>
</html>`;
}
