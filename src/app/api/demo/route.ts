import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveKnowledgeBase } from '@/lib/knowledgeBase';
import { saveProducts } from '@/lib/products';
import {
  DEMO_KNOWLEDGE_BASE,
  DEMO_HISTORY,
  DEMO_LIBRARY,
  DEMO_PRODUCTS,
} from '@/lib/demoData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DEMO_FLAG_FILE = path.join(DATA_DIR, 'demo-mode.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDemoFlag(): boolean {
  ensureDataDir();
  if (!fs.existsSync(DEMO_FLAG_FILE)) return false;
  try {
    const raw = JSON.parse(fs.readFileSync(DEMO_FLAG_FILE, 'utf-8'));
    return raw.active === true;
  } catch {
    return false;
  }
}

function setDemoFlag(active: boolean) {
  ensureDataDir();
  fs.writeFileSync(DEMO_FLAG_FILE, JSON.stringify({ active }, null, 2));
}

// GET — check if demo mode is active
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json({ active: getDemoFlag() });
}

// POST — load demo mode
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDataDir();

  // Write demo KB
  saveKnowledgeBase(DEMO_KNOWLEDGE_BASE);

  // Write demo history
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(DEMO_HISTORY, null, 2));

  // Write demo library
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(DEMO_LIBRARY, null, 2));

  // Write demo products
  saveProducts(DEMO_PRODUCTS);

  // Set flag
  setDemoFlag(true);

  return NextResponse.json({ success: true, active: true });
}

// DELETE — clear demo mode and reset to defaults
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDataDir();

  // Reset KB to empty defaults
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

  // Reset history
  fs.writeFileSync(HISTORY_FILE, '[]');

  // Reset library
  fs.writeFileSync(LIBRARY_FILE, '[]');

  // Reset products
  saveProducts([]);

  // Clear flag
  setDemoFlag(false);

  return NextResponse.json({ success: true, active: false });
}
