import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST() {
  const sb = getSupabaseAdmin();
  const results: string[] = [];

  // Test if columns exist by trying to select them
  async function columnExists(table: string, column: string): Promise<boolean> {
    const { error } = await sb.from(table).select(column).limit(1);
    return !error;
  }

  // We can't run DDL through PostgREST, so we'll test what exists
  // and create a workaround: drop and recreate via Supabase's built-in
  // Actually — we'll use the approach of trying to upsert with new columns
  // and reporting what needs to be done manually if DDL is needed.

  const brainCols = ['summary', 'entities', 'tags', 'category', 'confidence', 'source_count', 'processed_at'];
  const missing: string[] = [];

  for (const col of brainCols) {
    const exists = await columnExists('brain_items', col);
    results.push(`brain_items.${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (!exists) missing.push(col);
  }

  // Check if refresh_history table exists
  const { error: refreshErr } = await sb.from('refresh_history').select('id').limit(1);
  const refreshExists = !refreshErr;
  results.push(`refresh_history table: ${refreshExists ? 'EXISTS' : 'MISSING'}`);

  if (missing.length === 0 && refreshExists) {
    return NextResponse.json({ status: 'OK', message: 'All columns and tables exist', results });
  }

  // Generate the SQL that needs to be run
  const sqlStatements: string[] = [];
  if (missing.includes('summary')) sqlStatements.push("ALTER TABLE brain_items ADD COLUMN summary TEXT DEFAULT '';");
  if (missing.includes('entities')) sqlStatements.push("ALTER TABLE brain_items ADD COLUMN entities JSONB DEFAULT '[]'::jsonb;");
  if (missing.includes('tags')) sqlStatements.push("ALTER TABLE brain_items ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;");
  if (missing.includes('category')) sqlStatements.push("ALTER TABLE brain_items ADD COLUMN category TEXT DEFAULT 'product';");
  if (missing.includes('confidence')) sqlStatements.push("ALTER TABLE brain_items ADD COLUMN confidence INT DEFAULT 0;");
  if (missing.includes('source_count')) sqlStatements.push("ALTER TABLE brain_items ADD COLUMN source_count INT DEFAULT 1;");
  if (missing.includes('processed_at')) sqlStatements.push("ALTER TABLE brain_items ADD COLUMN processed_at TIMESTAMPTZ;");
  if (!refreshExists) {
    sqlStatements.push(`CREATE TABLE refresh_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL DEFAULT 'default',
  user_id TEXT,
  original_filename TEXT NOT NULL DEFAULT '',
  original_content TEXT DEFAULT '',
  refreshed_content TEXT DEFAULT '',
  changes_made JSONB DEFAULT '[]'::jsonb,
  analysis JSONB DEFAULT '{}'::jsonb,
  style_id TEXT DEFAULT '',
  content_type TEXT DEFAULT '',
  prospect_name TEXT DEFAULT '',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`);
  }

  return NextResponse.json({
    status: 'MIGRATION_NEEDED',
    missing,
    refreshHistoryExists: refreshExists,
    sql: sqlStatements.join('\n'),
    results,
    instructions: 'Run the SQL above in the Supabase Dashboard SQL Editor',
  });
}
