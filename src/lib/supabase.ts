import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized clients — avoids crashing during build when env vars are missing
let _admin: SupabaseClient | null = null;
let _client: SupabaseClient | null = null;

function getUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function getAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

/** Server-side client (service role key — full access, bypasses RLS) */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = getUrl();
    const key = getServiceKey();
    if (!url || !key) {
      throw new Error(
        'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
      );
    }
    _admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _admin;
}

/** Client-side / anon client (anon key — respects RLS) */
export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const url = getUrl();
    const key = getAnonKey();
    if (!url || !key) {
      throw new Error(
        'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      );
    }
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

/** Check if Supabase environment variables are set */
export function isSupabaseConfigured(): boolean {
  return !!(getUrl() && (getServiceKey() || getAnonKey()));
}
