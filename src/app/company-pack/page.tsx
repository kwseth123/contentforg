'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useTheme } from '@/components/ThemeProvider';
import { THEME_PRESETS, getContrastTextColor, buildThemeFromAccent, ThemeConfig } from '@/lib/theme';
import { HiOutlineSparkles, HiOutlineCheck, HiOutlinePaintBrush, HiOutlineArrowPath, HiOutlinePhoto } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function CompanyPackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const { theme, setTheme, loading } = useTheme();

  const [customAccent, setCustomAccent] = useState('#6366F1');
  const [isCustom, setIsCustom] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && role !== 'admin') router.push('/dashboard');
  }, [status, role, router]);

  useEffect(() => {
    if (theme) {
      setCustomAccent(theme.colors.accent);
      const matchesPreset = THEME_PRESETS.some(p => p.id === theme.id);
      setIsCustom(!matchesPreset);
    }
  }, [theme]);

  const applyPreset = async (preset: ThemeConfig) => {
    // Preserve logo when switching presets
    const logoBase64 = theme?.logoBase64;
    const presetWithLogo = { ...preset, logoBase64 };
    setIsCustom(false);
    setCustomAccent(preset.colors.accent);
    await setTheme(presetWithLogo);
    toast.success(`Applied "${preset.name}" theme`);
  };

  const applyCustomAccent = async (hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const customTheme = buildThemeFromAccent(hex, 'custom', 'Custom');
    customTheme.logoBase64 = theme?.logoBase64;
    setIsCustom(true);
    await setTheme(customTheme);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      if (theme) {
        await setTheme({ ...theme, logoBase64: base64 });
        toast.success('Logo uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async () => {
    if (theme) {
      const updated = { ...theme };
      delete updated.logoBase64;
      await setTheme(updated);
      toast.success('Logo removed');
    }
  };

  if (status !== 'authenticated' || role !== 'admin' || loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}>
          <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--content-bg)' }}>
        {/* Topbar */}
        <div className="h-14 border-b px-8 flex items-center justify-between" style={{ backgroundColor: 'var(--content-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-2">
            <HiOutlinePaintBrush className="text-lg" style={{ color: 'var(--accent)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Brand Settings</h1>
          </div>
        </div>

        <div className="p-8 max-w-4xl space-y-8">
          {/* ── Logo Upload ── */}
          <div className="card">
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Company Logo</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Upload your logo to white-label the entire workspace. Reps will see your brand, not ContentForg.
            </p>
            <div className="flex items-center gap-6">
              {theme?.logoBase64 ? (
                <div className="flex items-center gap-4">
                  <img src={theme.logoBase64} alt="Company logo" className="h-12 max-w-[200px] object-contain rounded-lg border p-2" style={{ borderColor: 'var(--card-border)' }} />
                  <div className="flex gap-2">
                    <button onClick={() => logoInputRef.current?.click()} className="btn-secondary px-3 py-1.5 text-sm">Change</button>
                    <button onClick={removeLogo} className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">Remove</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed text-sm font-medium transition-colors hover:border-solid"
                  style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
                >
                  <HiOutlinePhoto className="text-lg" />
                  Upload Logo
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          {/* ── Company Pack Presets ── */}
          <div className="card">
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Company Pack</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Choose a color preset for your workspace
            </p>

            <div className="grid grid-cols-5 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = theme?.id === preset.id && !isCustom;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="relative rounded-xl border-2 p-3.5 text-left transition-all hover:shadow-sm"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: isActive ? preset.colors.accent : 'var(--card-border)',
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: preset.colors.accent, color: getContrastTextColor(preset.colors.accent) }}
                      >
                        <HiOutlineCheck className="text-xs" />
                      </div>
                    )}
                    <div
                      className="w-full h-10 rounded-lg mb-2.5"
                      style={{ backgroundColor: preset.colors.accent }}
                    />
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {preset.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Custom Accent ── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Custom Accent Color</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Pick any color — the entire app adapts instantly
                </p>
              </div>
              {isCustom && (
                <button onClick={() => applyPreset(THEME_PRESETS[0])} className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5">
                  <HiOutlineArrowPath className="text-sm" /> Reset to Default
                </button>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => { setCustomAccent(e.target.value); applyCustomAccent(e.target.value); }}
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                  style={{ borderColor: 'var(--card-border)' }}
                />
                <input
                  type="text"
                  value={customAccent}
                  onChange={(e) => { setCustomAccent(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) applyCustomAccent(e.target.value); }}
                  className="w-28 border rounded-lg px-3 py-1.5 text-sm font-mono"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                  placeholder="#6366F1"
                />
              </div>

              {/* Live preview */}
              <div className="flex items-center gap-4">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: customAccent, color: getContrastTextColor(customAccent) }}
                >
                  <span className="flex items-center gap-1.5"><HiOutlineSparkles /> Generate</span>
                </button>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  Badge Preview
                </span>
              </div>
            </div>
          </div>

          {/* ── Info Note ── */}
          <div className="rounded-xl border p-4 text-sm" style={{
            backgroundColor: 'var(--accent-light)',
            borderColor: 'var(--accent-border)',
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> Brand Settings affect the workspace UI. Document export colors (PDFs, PowerPoints) are controlled in{' '}
            <button onClick={() => router.push('/admin')} className="underline font-medium" style={{ color: 'var(--accent)' }}>Knowledge Base</button> brand guidelines.
          </div>
        </div>
      </main>
    </div>
  );
}
