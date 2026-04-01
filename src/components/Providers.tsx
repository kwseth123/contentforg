'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './ThemeProvider';
import GlobalSearch from './GlobalSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function ShortcutProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ShortcutProvider>
          {children}
          <GlobalSearch />
        </ShortcutProvider>
      </ThemeProvider>
      <Toaster position="top-right" />
    </SessionProvider>
  );
}
