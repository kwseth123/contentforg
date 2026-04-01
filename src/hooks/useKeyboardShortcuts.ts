'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SHORTCUTS: Record<string, string> = {
  'g': '/generate',
  'h': '/history',
  'l': '/library',
  'r': '/roi-calculator',
  'p': '/products',
  'k': '/admin',
};

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // Don't trigger with modifiers (except for Ctrl+K which is handled by GlobalSearch)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const path = SHORTCUTS[e.key.toLowerCase()];
      if (path) {
        e.preventDefault();
        router.push(path);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
