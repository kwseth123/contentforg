-- ═══════════════════════════════════════════════
-- ContentForg — Brain Items Schema Fix + Refresh History
-- ═══════════════════════════════════════════════

-- Add missing columns to brain_items (columns the app code expects)
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'product';
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS confidence INT DEFAULT 0;
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS source_count INT DEFAULT 1;
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Refresh History
CREATE TABLE IF NOT EXISTS refresh_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
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
);
CREATE INDEX IF NOT EXISTS idx_refresh_company ON refresh_history(company_id);
CREATE INDEX IF NOT EXISTS idx_refresh_created ON refresh_history(company_id, created_at DESC);
