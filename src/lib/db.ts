// ═══════════════════════════════════════════════════════════════════════════════
// ContentForge — Supabase Database Abstraction Layer
// Replaces all local JSON file I/O with Supabase calls.
// ═══════════════════════════════════════════════════════════════════════════════

import { getSupabaseAdmin } from './supabase';
import { KnowledgeBase, ProductProfile, HistoryItem, LibraryItem, AppUser } from './types';
import { ThemeConfig, DEFAULT_THEME } from './theme';
import bcrypt from 'bcryptjs';

/** Lazy accessor — avoids crashing during Next.js build when env vars are absent */
function sb() { return getSupabaseAdmin(); }

// ── Default knowledge base (returned when no row exists) ─────────────────────

const DEFAULT_KB: KnowledgeBase = {
  companyName: '',
  tagline: '',
  website: '',
  aboutUs: '',
  products: [],
  differentiators: '',
  icp: { industries: [], companySize: '', personas: [] },
  competitors: [],
  brandVoice: { tone: '', wordsToUse: [], wordsToAvoid: [] },
  caseStudies: [],
  uploadedDocuments: [],
  logoPath: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Base
// ═══════════════════════════════════════════════════════════════════════════════

export async function getKnowledgeBase(companyId = 'default'): Promise<KnowledgeBase> {
  try {
    const { data, error } = await sb()
      .from('knowledge_base')
      .select('data')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ...DEFAULT_KB };
    return data.data as KnowledgeBase;
  } catch (err) {
    console.error('[db] getKnowledgeBase failed:', err);
    return { ...DEFAULT_KB };
  }
}

export async function saveKnowledgeBase(companyId = 'default', kb: KnowledgeBase): Promise<void> {
  try {
    const { error } = await sb()
      .from('knowledge_base')
      .upsert(
        { company_id: companyId, data: kb, updated_at: new Date().toISOString() },
        { onConflict: 'company_id' },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[db] saveKnowledgeBase failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTheme(companyId = 'default'): Promise<ThemeConfig> {
  try {
    const { data, error } = await sb()
      .from('theme')
      .select('data')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ...DEFAULT_THEME };
    return data.data as ThemeConfig;
  } catch (err) {
    console.error('[db] getTheme failed:', err);
    return { ...DEFAULT_THEME };
  }
}

export async function saveTheme(companyId = 'default', theme: ThemeConfig): Promise<void> {
  try {
    const { error } = await sb()
      .from('theme')
      .upsert(
        { company_id: companyId, data: theme, updated_at: new Date().toISOString() },
        { onConflict: 'company_id' },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[db] saveTheme failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Products
// ═══════════════════════════════════════════════════════════════════════════════

export async function getProducts(companyId = 'default'): Promise<ProductProfile[]> {
  try {
    const { data, error } = await sb()
      .from('products')
      .select('data')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];
    return data.map((row) => row.data as ProductProfile);
  } catch (err) {
    console.error('[db] getProducts failed:', err);
    return [];
  }
}

export async function saveProducts(companyId = 'default', products: ProductProfile[]): Promise<void> {
  try {
    // Delete all existing products for this company
    const { error: deleteError } = await sb()
      .from('products')
      .delete()
      .eq('company_id', companyId);

    if (deleteError) throw deleteError;

    if (products.length === 0) return;

    // Insert each product as its own row
    const rows = products.map((product) => ({
      id: product.id,
      company_id: companyId,
      data: product,
      created_at: product.createdAt || new Date().toISOString(),
    }));

    const { error: insertError } = await sb()
      .from('products')
      .insert(rows);

    if (insertError) throw insertError;
  } catch (err) {
    console.error('[db] saveProducts failed:', err);
  }
}

export async function upsertProduct(companyId = 'default', product: ProductProfile): Promise<void> {
  try {
    const { error } = await sb()
      .from('products')
      .upsert(
        {
          id: product.id,
          company_id: companyId,
          data: product,
          created_at: product.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[db] upsertProduct failed:', err);
  }
}

export async function deleteProduct(companyId = 'default', productId: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('company_id', companyId);

    if (error) throw error;
  } catch (err) {
    console.error('[db] deleteProduct failed:', err);
  }
}

export async function getProduct(companyId = 'default', productId: string): Promise<ProductProfile | undefined> {
  try {
    const { data, error } = await sb()
      .from('products')
      .select('data')
      .eq('id', productId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return undefined;
    return data.data as ProductProfile;
  } catch (err) {
    console.error('[db] getProduct failed:', err);
    return undefined;
  }
}

export async function incrementProductContentCount(companyId = 'default', productId: string): Promise<void> {
  try {
    const product = await getProduct(companyId, productId);
    if (!product) return;

    product.contentGeneratedCount = (product.contentGeneratedCount || 0) + 1;
    await upsertProduct(companyId, product);
  } catch (err) {
    console.error('[db] incrementProductContentCount failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// History
// ═══════════════════════════════════════════════════════════════════════════════

export async function getHistory(companyId = 'default'): Promise<HistoryItem[]> {
  try {
    const { data, error } = await sb()
      .from('history')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => {
      const metadata = row.metadata as Record<string, unknown> | null;
      if (metadata && typeof metadata === 'object') {
        return metadata as unknown as HistoryItem;
      }
      // Fallback: reconstruct from columns
      return {
        id: row.id,
        contentType: row.content_type,
        prospect: { companyName: row.prospect_name },
        sections: row.output ? JSON.parse(row.output) : [],
        generatedAt: row.created_at,
      } as unknown as HistoryItem;
    });
  } catch (err) {
    console.error('[db] getHistory failed:', err);
    return [];
  }
}

export async function addHistoryItem(companyId = 'default', item: HistoryItem): Promise<void> {
  try {
    const { error } = await sb()
      .from('history')
      .insert({
        id: item.id,
        company_id: companyId,
        content_type: item.contentType,
        prospect_name: item.prospect?.companyName || '',
        output: JSON.stringify(item.sections),
        metadata: item as unknown as Record<string, unknown>,
        created_at: item.generatedAt || new Date().toISOString(),
      });

    if (error) throw error;
  } catch (err) {
    console.error('[db] addHistoryItem failed:', err);
  }
}

export async function getHistoryItem(companyId = 'default', id: string): Promise<HistoryItem | undefined> {
  try {
    const { data, error } = await sb()
      .from('history')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return undefined;

    const metadata = data.metadata as Record<string, unknown> | null;
    if (metadata && typeof metadata === 'object') {
      return metadata as unknown as HistoryItem;
    }
    return undefined;
  } catch (err) {
    console.error('[db] getHistoryItem failed:', err);
    return undefined;
  }
}

export async function updateHistoryItem(companyId = 'default', id: string, update: Partial<HistoryItem>): Promise<void> {
  try {
    // Read the current item
    const existing = await getHistoryItem(companyId, id);
    if (!existing) return;

    const merged = { ...existing, ...update };

    const { error } = await sb()
      .from('history')
      .update({
        metadata: merged as unknown as Record<string, unknown>,
        content_type: merged.contentType,
        prospect_name: merged.prospect?.companyName || '',
        output: JSON.stringify(merged.sections),
      })
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
  } catch (err) {
    console.error('[db] updateHistoryItem failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Library
// ═══════════════════════════════════════════════════════════════════════════════

export async function getLibrary(companyId = 'default'): Promise<LibraryItem[]> {
  try {
    const { data, error } = await sb()
      .from('library')
      .select('*')
      .eq('company_id', companyId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => {
      const metadata = row.metadata as Record<string, unknown> | null;
      if (metadata && typeof metadata === 'object') {
        return metadata as unknown as LibraryItem;
      }
      // Fallback reconstruction
      return {
        id: row.id,
        contentType: row.content_type,
        tags: row.tags || [],
        pinned: row.pinned ?? false,
        sharedAt: row.created_at,
        sections: [],
        prospect: {},
        sharedBy: '',
      } as unknown as LibraryItem;
    });
  } catch (err) {
    console.error('[db] getLibrary failed:', err);
    return [];
  }
}

export async function addLibraryItem(companyId = 'default', item: LibraryItem): Promise<void> {
  try {
    const firstSectionTitle = item.sections?.[0]?.title || '';

    const { error } = await sb()
      .from('library')
      .insert({
        id: item.id,
        company_id: companyId,
        title: firstSectionTitle,
        content_type: item.contentType,
        tags: item.tags || [],
        pinned: item.pinned ?? false,
        metadata: item as unknown as Record<string, unknown>,
        created_at: item.sharedAt || new Date().toISOString(),
      });

    if (error) throw error;
  } catch (err) {
    console.error('[db] addLibraryItem failed:', err);
  }
}

export async function deleteLibraryItem(companyId = 'default', id: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('library')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
  } catch (err) {
    console.error('[db] deleteLibraryItem failed:', err);
  }
}

export async function togglePinLibraryItem(companyId = 'default', id: string): Promise<void> {
  try {
    // Read current row
    const { data, error: readError } = await sb()
      .from('library')
      .select('pinned, metadata')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (readError) throw readError;
    if (!data) return;

    const newPinned = !data.pinned;
    const metadata = (data.metadata || {}) as Record<string, unknown>;
    metadata.pinned = newPinned;

    const { error: updateError } = await sb()
      .from('library')
      .update({ pinned: newPinned, metadata })
      .eq('id', id)
      .eq('company_id', companyId);

    if (updateError) throw updateError;
  } catch (err) {
    console.error('[db] togglePinLibraryItem failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════════

export async function findUser(username: string): Promise<AppUser | undefined> {
  try {
    const { data, error } = await sb()
      .from('users')
      .select('*')
      .eq('email', username)
      .maybeSingle();

    if (error) throw error;
    if (!data) return undefined;

    return {
      id: data.id,
      username: data.email,
      password: data.password_hash,
      role: data.role,
      name: data.name,
    } as AppUser;
  } catch (err) {
    console.error('[db] findUser failed:', err);
    return undefined;
  }
}

export async function ensureDefaultUsers(): Promise<void> {
  try {
    const { count, error: countError } = await sb()
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if ((count ?? 0) > 0) return;

    const defaultUsers = [
      {
        id: '1',
        email: 'admin',
        password_hash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        name: 'Admin User',
      },
      {
        id: '2',
        email: 'rep',
        password_hash: bcrypt.hashSync('rep123', 10),
        role: 'rep',
        name: 'Sales Rep',
      },
    ];

    const { error: insertError } = await sb()
      .from('users')
      .insert(defaultUsers);

    if (insertError) throw insertError;
  } catch (err) {
    console.error('[db] ensureDefaultUsers failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shares
// ═══════════════════════════════════════════════════════════════════════════════

export async function getShares(companyId = 'default'): Promise<any[]> {
  try {
    const { data, error } = await sb()
      .from('shares')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[db] getShares failed:', err);
    return [];
  }
}

export async function getShare(id: string): Promise<any | null> {
  try {
    const { data, error } = await sb()
      .from('shares')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('[db] getShare failed:', err);
    return null;
  }
}

export async function saveShare(companyId = 'default', share: any): Promise<void> {
  try {
    const { error } = await sb()
      .from('shares')
      .insert({ ...share, company_id: companyId });

    if (error) throw error;
  } catch (err) {
    console.error('[db] saveShare failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// App Settings
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAppSettings(companyId = 'default'): Promise<Record<string, any>> {
  try {
    const { data, error } = await sb()
      .from('app_settings')
      .select('data')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return {};
    return (data.data as Record<string, any>) || {};
  } catch (err) {
    console.error('[db] getAppSettings failed:', err);
    return {};
  }
}

export async function saveAppSettings(companyId = 'default', settings: Record<string, any>): Promise<void> {
  try {
    const { error } = await sb()
      .from('app_settings')
      .upsert(
        { company_id: companyId, data: settings, updated_at: new Date().toISOString() },
        { onConflict: 'company_id' },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[db] saveAppSettings failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Feature Matrices
// ═══════════════════════════════════════════════════════════════════════════════

export async function getFeatureMatrices(companyId = 'default'): Promise<any[]> {
  try {
    const { data, error } = await sb()
      .from('feature_matrices')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[db] getFeatureMatrices failed:', err);
    return [];
  }
}

export async function getFeatureMatrix(id: string): Promise<any | null> {
  try {
    const { data, error } = await sb()
      .from('feature_matrices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('[db] getFeatureMatrix failed:', err);
    return null;
  }
}

export async function getFeatureMatrixByShareId(shareId: string): Promise<any | null> {
  try {
    const { data, error } = await sb()
      .from('feature_matrices')
      .select('*')
      .eq('data->>shareId', shareId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error('[db] getFeatureMatrixByShareId failed:', err);
    return null;
  }
}

export async function saveFeatureMatrix(companyId = 'default', matrix: any): Promise<void> {
  try {
    const { error } = await sb()
      .from('feature_matrices')
      .upsert(
        { ...matrix, company_id: companyId },
        { onConflict: 'id' },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[db] saveFeatureMatrix failed:', err);
  }
}

export async function deleteFeatureMatrix(companyId = 'default', id: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('feature_matrices')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
  } catch (err) {
    console.error('[db] deleteFeatureMatrix failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Logos
// ═══════════════════════════════════════════════════════════════════════════════

export async function getLogo(companyId = 'default', logoType = 'primary'): Promise<string> {
  try {
    const { data, error } = await sb()
      .from('logos')
      .select('data_url')
      .eq('company_id', companyId)
      .eq('logo_type', logoType)
      .maybeSingle();

    if (error) throw error;
    if (!data) return '';
    return data.data_url || '';
  } catch (err) {
    console.error('[db] getLogo failed:', err);
    return '';
  }
}

export async function saveLogo(companyId = 'default', logoType: string, dataUrl: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('logos')
      .upsert(
        {
          company_id: companyId,
          logo_type: logoType,
          data_url: dataUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,logo_type' },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[db] saveLogo failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Company
// ═══════════════════════════════════════════════════════════════════════════════

export async function ensureCompany(companyId = 'default'): Promise<void> {
  try {
    const { error } = await sb()
      .from('companies')
      .upsert(
        { id: companyId, name: 'My Company' },
        { onConflict: 'id', ignoreDuplicates: true },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[db] ensureCompany failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Migration Helper — one-time import from local JSON files to Supabase
// ═══════════════════════════════════════════════════════════════════════════════

export async function migrateFromLocalFiles(): Promise<{ migrated: boolean; details: string[] }> {
  const details: string[] = [];
  let migrated = false;

  // Dynamic import of fs/path since this only runs server-side during migration
  let fs: typeof import('fs');
  let path: typeof import('path');
  try {
    fs = await import('fs');
    path = await import('path');
  } catch {
    details.push('Skipped: fs/path not available (client-side context)');
    return { migrated, details };
  }

  const DATA_DIR = path.join(process.cwd(), 'data');

  // Helper to read a local JSON file safely
  function readLocalJson<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  const companyId = 'default';

  try {
    await ensureCompany(companyId);

    // ── Knowledge Base ──
    try {
      const existing = await getKnowledgeBase(companyId);
      const isDefault = !existing.companyName && existing.products.length === 0;
      if (isDefault) {
        const localKb = readLocalJson<KnowledgeBase>(
          path.join(DATA_DIR, 'knowledge-base.json'),
          DEFAULT_KB,
        );
        if (localKb.companyName || localKb.products.length > 0) {
          await saveKnowledgeBase(companyId, localKb);
          details.push('Migrated: knowledge-base.json');
          migrated = true;
        }
      } else {
        details.push('Skipped: knowledge_base (already has data)');
      }
    } catch (err) {
      details.push(`Error migrating knowledge base: ${err}`);
    }

    // ── Theme ──
    try {
      const existing = await getTheme(companyId);
      const isDefault = existing.id === DEFAULT_THEME.id && existing.name === DEFAULT_THEME.name;
      if (isDefault) {
        const localTheme = readLocalJson<ThemeConfig | null>(
          path.join(DATA_DIR, 'theme.json'),
          null,
        );
        if (localTheme && localTheme.id !== DEFAULT_THEME.id) {
          await saveTheme(companyId, localTheme);
          details.push('Migrated: theme.json');
          migrated = true;
        }
      } else {
        details.push('Skipped: theme (already has data)');
      }
    } catch (err) {
      details.push(`Error migrating theme: ${err}`);
    }

    // ── Products ──
    try {
      const existingProducts = await getProducts(companyId);
      if (existingProducts.length === 0) {
        const localProducts = readLocalJson<ProductProfile[]>(
          path.join(DATA_DIR, 'products.json'),
          [],
        );
        if (localProducts.length > 0) {
          await saveProducts(companyId, localProducts);
          details.push(`Migrated: products.json (${localProducts.length} products)`);
          migrated = true;
        }
      } else {
        details.push('Skipped: products (already has data)');
      }
    } catch (err) {
      details.push(`Error migrating products: ${err}`);
    }

    // ── History ──
    try {
      const existingHistory = await getHistory(companyId);
      if (existingHistory.length === 0) {
        const localHistory = readLocalJson<HistoryItem[]>(
          path.join(DATA_DIR, 'history.json'),
          [],
        );
        if (localHistory.length > 0) {
          for (const item of localHistory) {
            await addHistoryItem(companyId, item);
          }
          details.push(`Migrated: history.json (${localHistory.length} items)`);
          migrated = true;
        }
      } else {
        details.push('Skipped: history (already has data)');
      }
    } catch (err) {
      details.push(`Error migrating history: ${err}`);
    }

    // ── Library ──
    try {
      const existingLibrary = await getLibrary(companyId);
      if (existingLibrary.length === 0) {
        const localLibrary = readLocalJson<LibraryItem[]>(
          path.join(DATA_DIR, 'library.json'),
          [],
        );
        if (localLibrary.length > 0) {
          for (const item of localLibrary) {
            await addLibraryItem(companyId, item);
          }
          details.push(`Migrated: library.json (${localLibrary.length} items)`);
          migrated = true;
        }
      } else {
        details.push('Skipped: library (already has data)');
      }
    } catch (err) {
      details.push(`Error migrating library: ${err}`);
    }

    // ── Users ──
    try {
      await ensureDefaultUsers();
      details.push('Ensured default users exist');
    } catch (err) {
      details.push(`Error ensuring default users: ${err}`);
    }

  } catch (err) {
    details.push(`Migration error: ${err}`);
  }

  return { migrated, details };
}
