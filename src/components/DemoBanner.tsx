'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DemoBanner() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const handleClearDemo = async () => {
    setClearing(true);
    try {
      await fetch('/api/demo', { method: 'DELETE' });
      router.push('/admin');
      router.refresh();
    } catch {
      setClearing(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
      style={{
        backgroundColor: '#fef3c7',
        color: '#92400e',
        height: '40px',
        fontSize: '14px',
      }}
    >
      <span className="font-medium">
        Demo Mode — You&apos;re exploring Apex Distribution Solutions. This is sample data.
      </span>
      <button
        onClick={handleClearDemo}
        disabled={clearing}
        className="px-3 py-1 text-sm font-medium rounded border transition-colors"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#d97706',
          color: '#92400e',
        }}
      >
        {clearing ? 'Clearing...' : 'Load My Real Data'}
      </button>
    </div>
  );
}
