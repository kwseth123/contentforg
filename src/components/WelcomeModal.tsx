'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineSparkles } from 'react-icons/hi2';

export default function WelcomeModal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSetup = () => {
    router.push('/onboarding');
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await fetch('/api/demo', { method: 'POST' });
      window.location.reload();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full mx-4 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            <HiOutlineSparkles className="text-3xl" style={{ color: 'var(--accent)' }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to ContentForg
        </h1>
        <p className="text-gray-500 mb-8">
          Get started in seconds
        </p>

        <div className="space-y-3">
          <button
            onClick={handleSetup}
            className="btn-accent w-full py-3 px-6 rounded-xl font-semibold text-base transition-colors"
          >
            Set Up My Company
          </button>

          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl text-white font-semibold text-base transition-colors"
            style={{ backgroundColor: '#f59e0b' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d97706')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f59e0b')}
          >
            {loading ? 'Loading Demo...' : 'Show Me A Demo First'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          The demo loads sample data for a fictional company.
          You can clear it anytime and set up your own.
        </p>
      </div>
    </div>
  );
}
