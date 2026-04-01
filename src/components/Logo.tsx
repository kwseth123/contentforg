'use client';

interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark' | 'color';
  showText?: boolean;
}

export default function Logo({ size = 36, variant = 'color', showText = true }: LogoProps) {
  const isDark = variant === 'dark';
  const bgFill = isDark ? '#0A0A0A' : '#6366F1';
  const markFill = isDark ? '#6366F1' : 'white';
  const strokeFill = isDark ? '#0A0A0A' : '#6366F1';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size > 40 ? 12 : 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="52" height="52" rx="11" fill={bgFill} />
        <path
          d="M12 22 L14 16 L38 16 L40 22 L30 22 L30 26 L22 26 L22 22 Z"
          fill={markFill}
          opacity="0.95"
        />
        <rect x="20" y="26" width="12" height="4" rx="1" fill={markFill} opacity="0.9" />
        <path d="M17 30 L35 30 L33 36 L19 36 Z" fill={markFill} opacity="0.95" />
        <ellipse
          cx="26"
          cy="19"
          rx="7"
          ry="3"
          fill="none"
          stroke={strokeFill}
          strokeWidth="1.2"
          opacity="0.6"
        />
        <line
          x1="19"
          y1="19"
          x2="33"
          y2="19"
          stroke={strokeFill}
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M22 16 Q26 19 30 16"
          fill="none"
          stroke={strokeFill}
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M22 22 Q26 19 30 22"
          fill="none"
          stroke={strokeFill}
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M36 13 L39 8 L37.5 12 L41 10.5"
          stroke="#FCD34D"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span
          style={{
            fontWeight: 700,
            fontSize: size > 40 ? 22 : 16,
            color: isDark ? '#FFFFFF' : '#0A0A0A',
            letterSpacing: -0.3,
          }}
        >
          Content
          <span style={{ color: '#6366F1' }}>Forg</span>
        </span>
      )}
    </div>
  );
}
