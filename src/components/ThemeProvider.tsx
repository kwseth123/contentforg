'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Mirror ThemeConfig shape from theme.ts (client-safe)
interface ThemeConfig {
  id: string;
  name: string;
  logoBase64?: string;
  colors: {
    accent: string;
    accentHover: string;
    accentLight: string;
    accentBorder: string;
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
    textInverse: string;
  };
}

interface ThemeContextValue {
  theme: ThemeConfig | null;
  setTheme: (theme: ThemeConfig) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  setTheme: async () => {},
  loading: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function injectThemeCSS(theme: ThemeConfig) {
  let styleEl = document.getElementById('cf-theme-vars');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'cf-theme-vars';
    document.head.appendChild(styleEl);
  }
  const c = theme.colors;
  styleEl.textContent = `:root {
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

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/theme')
      .then(res => res.json())
      .then((t: ThemeConfig) => {
        setThemeState(t);
        injectThemeCSS(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setTheme = useCallback(async (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    injectThemeCSS(newTheme);
    try {
      await fetch('/api/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTheme),
      });
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}
