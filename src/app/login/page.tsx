'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid username or password');
    } else {
      router.push('/generate');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#111111' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={48} variant="dark" showText={true} />
          </div>
          <p className="text-gray-400 text-center">B2B Sales Content Engine</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-8 shadow-2xl border border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 btn-accent font-medium py-2.5 rounded-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Default credentials:</p>
            <p className="text-xs text-gray-300"><strong>Admin:</strong> admin / admin123</p>
            <p className="text-xs text-gray-300"><strong>Rep:</strong> rep / rep123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
