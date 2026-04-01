// ═══════════════════════════════════════════════
// ContentForg Brand Constants
// ═══════════════════════════════════════════════

export const BRAND_NAME = 'ContentForg';
export const BRAND_TAGLINE = 'AI Sales Content Engine';
export const BRAND_COLOR = '#6366F1';
export const BRAND_SPARK = '#FCD34D';

/** Full Atlas Anvil logo — indigo background, white mark */
export const LOGO_SVG_PRIMARY = `<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="52" height="52" rx="11" fill="#6366F1"/>
  <path d="M12 22 L14 16 L38 16 L40 22 L30 22 L30 26 L22 26 L22 22 Z" fill="white" opacity="0.95"/>
  <rect x="20" y="26" width="12" height="4" rx="1" fill="white" opacity="0.9"/>
  <path d="M17 30 L35 30 L33 36 L19 36 Z" fill="white" opacity="0.95"/>
  <ellipse cx="26" cy="19" rx="7" ry="3" fill="none" stroke="#6366F1" stroke-width="1.2" opacity="0.6"/>
  <line x1="19" y1="19" x2="33" y2="19" stroke="#6366F1" stroke-width="1" opacity="0.5"/>
  <path d="M22 16 Q26 19 30 16" fill="none" stroke="#6366F1" stroke-width="1" opacity="0.5"/>
  <path d="M22 22 Q26 19 30 22" fill="none" stroke="#6366F1" stroke-width="1" opacity="0.5"/>
  <path d="M36 13 L39 8 L37.5 12 L41 10.5" stroke="#FCD34D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Dark background version — black background, indigo mark */
export const LOGO_SVG_DARK = `<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="52" height="52" rx="11" fill="#0A0A0A"/>
  <path d="M12 22 L14 16 L38 16 L40 22 L30 22 L30 26 L22 26 L22 22 Z" fill="#6366F1" opacity="0.95"/>
  <rect x="20" y="26" width="12" height="4" rx="1" fill="#6366F1" opacity="0.9"/>
  <path d="M17 30 L35 30 L33 36 L19 36 Z" fill="#6366F1" opacity="0.95"/>
  <ellipse cx="26" cy="19" rx="7" ry="3" fill="none" stroke="#0A0A0A" stroke-width="1.2" opacity="0.6"/>
  <line x1="19" y1="19" x2="33" y2="19" stroke="#0A0A0A" stroke-width="1" opacity="0.5"/>
  <path d="M22 16 Q26 19 30 16" fill="none" stroke="#0A0A0A" stroke-width="1" opacity="0.5"/>
  <path d="M22 22 Q26 19 30 22" fill="none" stroke="#0A0A0A" stroke-width="1" opacity="0.5"/>
  <path d="M36 13 L39 8 L37.5 12 L41 10.5" stroke="#FCD34D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Simplified version for small sizes — just anvil, no globe or spark */
export const LOGO_SVG_MINIMAL = `<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="52" height="52" rx="11" fill="#6366F1"/>
  <path d="M12 22 L14 16 L38 16 L40 22 L30 22 L30 26 L22 26 L22 22 Z" fill="white" opacity="0.95"/>
  <rect x="20" y="26" width="12" height="4" rx="1" fill="white" opacity="0.9"/>
  <path d="M17 30 L35 30 L33 36 L19 36 Z" fill="white" opacity="0.95"/>
</svg>`;

/** Base64-encoded primary logo for embedding in PDFs and emails */
export const LOGO_BASE64_PRIMARY = `data:image/svg+xml;base64,${typeof Buffer !== 'undefined' ? Buffer.from(LOGO_SVG_PRIMARY).toString('base64') : ''}`;

/** Base64-encoded minimal logo for small document headers */
export const LOGO_BASE64_MINIMAL = `data:image/svg+xml;base64,${typeof Buffer !== 'undefined' ? Buffer.from(LOGO_SVG_MINIMAL).toString('base64') : ''}`;
