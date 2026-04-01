-- ═══════════════════════════════════════════════
-- ContentForg — Initial Supabase Migration
-- ═══════════════════════════════════════════════

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'My Company',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Knowledge Base (one row per company, all KB data as JSONB)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kb_company ON knowledge_base(company_id);

-- Brand Settings (one row per company)
CREATE TABLE IF NOT EXISTS brand_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_company ON brand_settings(company_id);

-- Theme (one row per company)
CREATE TABLE IF NOT EXISTS theme (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_theme_company ON theme(company_id);

-- Products (one row per product per company)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);

-- History (one row per generation)
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  user_id TEXT,
  prompt TEXT DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  prospect_name TEXT DEFAULT '',
  output TEXT DEFAULT '',
  score INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_history_company ON history(company_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON history(company_id, created_at DESC);

-- Library (one row per saved item)
CREATE TABLE IF NOT EXISTS library (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  user_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  output TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_library_company ON library(company_id);

-- Brain Items (uploaded documents)
CREATE TABLE IF NOT EXISTS brain_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  user_id TEXT,
  filename TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  extracted_text TEXT DEFAULT '',
  insights JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brain_company ON brain_items(company_id);

-- Shares (shared content links)
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares(expires_at);

-- Feature Matrices
CREATE TABLE IF NOT EXISTS feature_matrices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fm_company ON feature_matrices(company_id);

-- App Settings (per-company)
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_company ON app_settings(company_id);

-- Logo storage (binary in Supabase storage, but metadata here)
CREATE TABLE IF NOT EXISTS logos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE DEFAULT 'default',
  logo_type TEXT NOT NULL DEFAULT 'primary', -- 'primary' or 'secondary'
  data_url TEXT DEFAULT '', -- base64 data URL
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_logos_company_type ON logos(company_id, logo_type);

-- Insert default company
INSERT INTO companies (id, name) VALUES ('default', 'My Company')
ON CONFLICT (id) DO NOTHING;
