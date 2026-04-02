import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrlPrefix: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 20) + '...',
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyPrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').slice(0, 10) + '...',
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL || '(not set)',
    hasBrowserlessKey: !!process.env.BROWSERLESS_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
