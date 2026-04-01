// ═══════════════════════════════════════════════
// ContentForg Design System — Theme Configuration
// ═══════════════════════════════════════════════

export interface ThemeConfig {
  id: string;
  name: string;
  logoBase64?: string; // Company logo stored as base64
  colors: {
    accent: string;
    accentHover: string;
    accentLight: string;   // Very light accent tint for backgrounds
    accentBorder: string;  // Light accent for borders
    sidebarBg: string;
    sidebarBorder: string;
    contentBg: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    navActiveBg: string;
    navActiveText: string;
    navDefaultText: string;
    textInverse: string;   // Calculated via WCAG luminance
  };
}

// Derive accent-light and accent-border from a hex accent color
function deriveAccentShades(accent: string): { accentLight: string; accentBorder: string; accentHover: string } {
  const hex = accent.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Light: mix with white at 8%
  const lr = Math.round(r + (255 - r) * 0.92);
  const lg = Math.round(g + (255 - g) * 0.92);
  const lb = Math.round(b + (255 - b) * 0.92);
  // Border: mix with white at 15%
  const br = Math.round(r + (255 - r) * 0.85);
  const bg2 = Math.round(g + (255 - g) * 0.85);
  const bb = Math.round(b + (255 - b) * 0.85);
  // Hover: darken by 10%
  const hr = Math.max(0, Math.round(r * 0.88));
  const hg = Math.max(0, Math.round(g * 0.88));
  const hb = Math.max(0, Math.round(b * 0.88));
  const toHex = (v: number) => Math.min(255, v).toString(16).padStart(2, '0');
  return {
    accentLight: `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`,
    accentBorder: `#${toHex(br)}${toHex(bg2)}${toHex(bb)}`,
    accentHover: `#${toHex(hr)}${toHex(hg)}${toHex(hb)}`,
  };
}

export function buildThemeFromAccent(accent: string, id: string, name: string): ThemeConfig {
  const shades = deriveAccentShades(accent);
  return {
    id,
    name,
    colors: {
      accent,
      accentHover: shades.accentHover,
      accentLight: shades.accentLight,
      accentBorder: shades.accentBorder,
      sidebarBg: '#FFFFFF',
      sidebarBorder: '#DDDDDD',
      contentBg: '#FAFAFA',
      cardBg: '#FFFFFF',
      cardBorder: '#DDDDDD',
      textPrimary: '#111111',
      textSecondary: '#555555',
      textMuted: '#999999',
      navActiveBg: shades.accentLight,
      navActiveText: '#111111',
      navDefaultText: '#666666',
      textInverse: getContrastTextColor(accent),
    },
  };
}

export const THEME_PRESETS: ThemeConfig[] = [
  buildThemeFromAccent('#6366F1', 'default', 'Default Indigo'),
  buildThemeFromAccent('#2563EB', 'corporate', 'Corporate Blue'),
  buildThemeFromAccent('#EF4444', 'bold', 'Bold Red'),
  buildThemeFromAccent('#7C3AED', 'purple', 'Modern Purple'),
  buildThemeFromAccent('#475569', 'slate', 'Executive Slate'),
];

export function getContrastTextColor(hexColor: string): '#000000' | '#FFFFFF' {
  const hex = hexColor.replace('#', '');
  if (hex.length < 6) return '#FFFFFF';
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.5 ? '#000000' : '#FFFFFF';
}

export const DEFAULT_THEME = THEME_PRESETS[0];

export function themeToCSS(theme: ThemeConfig): string {
  const c = theme.colors;
  return `:root {
  --accent: ${c.accent};
  --accent-hover: ${c.accentHover};
  --accent-light: ${c.accentLight};
  --accent-border: ${c.accentBorder};
  --sidebar-bg: ${c.sidebarBg};
  --sidebar-border: ${c.sidebarBorder};
  --content-bg: ${c.contentBg};
  --card-bg: ${c.cardBg};
  --card-border: ${c.cardBorder};
  --text-primary: ${c.textPrimary};
  --text-secondary: ${c.textSecondary};
  --text-muted: ${c.textMuted};
  --nav-active-bg: ${c.navActiveBg};
  --nav-active-text: ${c.navActiveText};
  --nav-default-text: ${c.navDefaultText};
  --text-inverse: ${c.textInverse};
}`;
}
