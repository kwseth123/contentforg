'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DemoBanner from './DemoBanner';
import WelcomeModal from './WelcomeModal';

export default function DemoModeWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isKbEmpty, setIsKbEmpty] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;

    async function check() {
      try {
        const [demoRes, kbRes] = await Promise.all([
          fetch('/api/demo'),
          fetch('/api/knowledge-base'),
        ]);

        if (demoRes.ok) {
          const demoData = await demoRes.json();
          setIsDemoMode(demoData.active === true);
        }

        if (kbRes.ok) {
          const kb = await kbRes.json();
          setIsKbEmpty(!kb.companyName || kb.companyName.trim() === '');
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setChecked(true);
      }
    }

    check();
  }, [status]);

  // Don't render anything special until we've checked
  if (!checked || status !== 'authenticated') {
    return <>{children}</>;
  }

  // Don't show welcome modal on login page
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

  return (
    <>
      {isDemoMode && <DemoBanner />}
      {isKbEmpty && !isDemoMode && !isLoginPage && <WelcomeModal />}
      <div style={isDemoMode ? { paddingTop: '40px' } : undefined}>
        {children}
      </div>
    </>
  );
}
