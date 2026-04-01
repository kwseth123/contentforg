import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ContentForg — AI Sales Content for B2B Teams';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo mark */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 52 52"
          fill="none"
        >
          <rect width="52" height="52" rx="11" fill="#6366F1" />
          <path
            d="M12 22 L14 16 L38 16 L40 22 L30 22 L30 26 L22 26 L22 22 Z"
            fill="white"
            opacity="0.95"
          />
          <rect x="20" y="26" width="12" height="4" rx="1" fill="white" opacity="0.9" />
          <path d="M17 30 L35 30 L33 36 L19 36 Z" fill="white" opacity="0.95" />
          <path
            d="M36 13 L39 8 L37.5 12 L41 10.5"
            stroke="#FCD34D"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          <span style={{ color: '#FFFFFF' }}>Content</span>
          <span style={{ color: '#6366F1' }}>Forg</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#888888',
            fontSize: 24,
            marginTop: 12,
          }}
        >
          AI Sales Content Engine
        </div>
      </div>
    ),
    { ...size },
  );
}
