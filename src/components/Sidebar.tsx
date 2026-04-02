'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useKBCompletion } from '@/hooks/useKBCompletion';
import { useTheme } from '@/components/ThemeProvider';
import {
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineArrowRightOnRectangle,
  HiOutlineClock,
  HiOutlineBookOpen,
  HiOutlineHome,
  HiOutlineCalculator,
  HiOutlineCube,
  HiOutlinePaintBrush,
  HiOutlineTableCells,
  HiOutlineLightBulb,
  HiOutlinePhone,
} from 'react-icons/hi2';
import Logo from '@/components/Logo';

// ── Nav Group Definitions ──
const WORKSPACE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { href: '/generate', label: 'Generate', icon: HiOutlineDocumentText },
  { href: '/history', label: 'History', icon: HiOutlineClock },
  { href: '/library', label: 'Library', icon: HiOutlineBookOpen },
];

const SALES_TOOLS_NAV = [
  { href: '/products', label: 'Products', icon: HiOutlineCube },
  { href: '/roi-calculator', label: 'ROI Calculator', icon: HiOutlineCalculator },
  { href: '/feature-matrix', label: 'Feature Matrix', icon: HiOutlineTableCells },
  { href: '/discovery-call', label: 'Discovery Calls', icon: HiOutlinePhone },
];

const KNOWLEDGE_NAV = [
  { href: '/brain', label: 'Knowledge Brain', icon: HiOutlineLightBulb },
];

const SETTINGS_NAV_ADMIN = [
  { href: '/admin', label: 'Knowledge Base', icon: HiOutlineCog6Tooth },
  { href: '/company-pack', label: 'Brand Settings', icon: HiOutlinePaintBrush },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme } = useTheme();
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const kbCompletion = useKBCompletion();

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.name || '?';

  // Get company name from KB (stored in theme or fetched)
  const logoBase64 = theme?.logoBase64;

  function NavGroup({ label, items }: { label: string; items: typeof WORKSPACE_NAV }) {
    return (
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider px-4 mb-1.5" style={{ color: '#888888' }}>
          {label}
        </p>
        <div className="space-y-0.5 px-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                  color: isActive ? 'var(--nav-active-text)' : 'var(--nav-default-text)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {/* Dot indicator */}
                <span
                  className="nav-dot"
                  style={{ backgroundColor: isActive ? 'var(--accent)' : 'transparent' }}
                />
                <item.icon className="text-base flex-shrink-0" style={{ color: isActive ? 'var(--accent)' : 'var(--nav-default-text)' }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside
      className="flex flex-col min-h-screen border-r"
      style={{
        width: '210px',
        minWidth: '210px',
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* ── Logo Slot ── */}
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <Link href="/dashboard" className="block">
          {logoBase64 ? (
            <img src={logoBase64} alt="Company logo" className="h-8 max-w-[140px] object-contain mb-1" />
          ) : (
            <div className="mb-1">
              <Logo size={32} showText={true} />
            </div>
          )}
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            B2B Sales Content Engine
          </p>
        </Link>
        {role === 'admin' && !logoBase64 && (
          <Link
            href="/company-pack"
            className="text-[11px] font-medium mt-1.5 inline-block"
            style={{ color: 'var(--accent)' }}
          >
            Upload your logo
          </Link>
        )}
      </div>

      {/* ── Navigation Groups ── */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <NavGroup label="Workspace" items={WORKSPACE_NAV} />
        <NavGroup label="Sales Tools" items={SALES_TOOLS_NAV} />
        <NavGroup label="Knowledge" items={KNOWLEDGE_NAV} />
        {role === 'admin' && <NavGroup label="Settings" items={SETTINGS_NAV_ADMIN} />}
      </nav>

      {/* ── KB Completion ── */}
      {role === 'admin' && kbCompletion.percentage < 100 && (
        <div className="px-4 pb-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--accent-light)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>KB Setup</span>
              <span className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{kbCompletion.percentage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--card-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${kbCompletion.percentage}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
            {kbCompletion.missing.length > 0 && (
              <p className="text-[10px] mt-1.5 leading-tight" style={{ color: 'var(--text-muted)' }}>
                Missing: {kbCompletion.missing.slice(0, 3).join(', ')}
                {kbCompletion.missing.length > 3 && ` +${kbCompletion.missing.length - 3}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── User Pill ── */}
      <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            {firstName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{session?.user?.name}</p>
            <p className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>{role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-2 py-1.5 text-[12px] rounded-lg w-full transition-colors hover:bg-gray-50"
          style={{ color: 'var(--text-secondary)' }}
        >
          <HiOutlineArrowRightOnRectangle className="text-sm" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
