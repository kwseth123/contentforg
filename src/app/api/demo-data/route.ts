import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveKnowledgeBase } from '@/lib/knowledgeBase';
import { saveProducts } from '@/lib/products';
import {
  DEMO_COMPANY_CARDS,
  loadDemoCompany,
} from '@/lib/demoData';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'app-settings.json');
const KB_BACKUP_FILE = path.join(DATA_DIR, 'knowledge-base.backup.json');
const PRODUCTS_BACKUP_FILE = path.join(DATA_DIR, 'products.backup.json');
const KB_FILE = path.join(DATA_DIR, 'knowledge-base.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface AppSettingsData {
  demoMode?: boolean;
  demoCompanyId?: string;
  [key: string]: unknown;
}

function getSettings(): AppSettingsData {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveSettings(settings: AppSettingsData) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// GET — returns list of demo company cards
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = getSettings();

  return NextResponse.json({
    companies: DEMO_COMPANY_CARDS,
    demoMode: settings.demoMode || false,
    demoCompanyId: settings.demoCompanyId || null,
  });
}

// POST — load a specific demo company
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as Record<string, unknown>)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const { companyId } = body as { companyId: string };

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  const demoCompany = loadDemoCompany(companyId);
  if (!demoCompany) {
    return NextResponse.json({ error: `Demo company "${companyId}" not found` }, { status: 404 });
  }

  ensureDataDir();

  // Back up current KB and products (only if not already in demo mode)
  const currentSettings = getSettings();
  if (!currentSettings.demoMode) {
    if (fs.existsSync(KB_FILE)) {
      fs.copyFileSync(KB_FILE, KB_BACKUP_FILE);
    }
    if (fs.existsSync(PRODUCTS_FILE)) {
      fs.copyFileSync(PRODUCTS_FILE, PRODUCTS_BACKUP_FILE);
    }
  }

  // Write the demo company KB
  saveKnowledgeBase(demoCompany.knowledgeBase);

  // Write the demo company products
  saveProducts(demoCompany.products);

  // Set demo mode flag in app-settings.json
  const settings = getSettings();
  saveSettings({
    ...settings,
    demoMode: true,
    demoCompanyId: companyId,
  });

  return NextResponse.json({
    success: true,
    demoMode: true,
    demoCompanyId: companyId,
    companyName: demoCompany.knowledgeBase.companyName,
  });
}

// DELETE — clear demo mode, restore backup if it exists
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as Record<string, unknown>)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  ensureDataDir();

  // Restore backup KB if one exists
  if (fs.existsSync(KB_BACKUP_FILE)) {
    fs.copyFileSync(KB_BACKUP_FILE, KB_FILE);
    fs.unlinkSync(KB_BACKUP_FILE);
  } else {
    // No backup — reset to empty KB
    saveKnowledgeBase({
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
    });
  }

  // Restore backup products if one exists
  if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
    fs.copyFileSync(PRODUCTS_BACKUP_FILE, PRODUCTS_FILE);
    fs.unlinkSync(PRODUCTS_BACKUP_FILE);
  } else {
    saveProducts([]);
  }

  // Clear demo mode flag from settings
  const settings = getSettings();
  delete settings.demoMode;
  delete settings.demoCompanyId;
  saveSettings(settings);

  return NextResponse.json({
    success: true,
    demoMode: false,
    restored: fs.existsSync(KB_BACKUP_FILE) ? 'backup' : 'empty',
  });
}
