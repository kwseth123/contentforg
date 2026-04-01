import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveKnowledgeBase } from '@/lib/knowledgeBase';
import { saveProducts } from '@/lib/products';
import { addHistoryItem } from '@/lib/history';
import { addLibraryItem } from '@/lib/library';
import * as db from '@/lib/db';
import {
  DEMO_KNOWLEDGE_BASE,
  DEMO_HISTORY,
  DEMO_LIBRARY,
  DEMO_PRODUCTS,
} from '@/lib/demoData';

// GET — check if demo mode is active
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ active: false });
  }
  const settings = await db.getAppSettings();
  return NextResponse.json({ active: settings.demoMode === true });
}

// POST — load demo mode
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Write demo KB
  await saveKnowledgeBase(DEMO_KNOWLEDGE_BASE);

  // Write demo history
  for (const item of DEMO_HISTORY) {
    await addHistoryItem(item);
  }

  // Write demo library
  for (const item of DEMO_LIBRARY) {
    await addLibraryItem(item);
  }

  // Write demo products
  await saveProducts(DEMO_PRODUCTS);

  // Set flag
  const settings = await db.getAppSettings();
  await db.saveAppSettings('default', { ...settings, demoMode: true });

  return NextResponse.json({ success: true, active: true });
}

// DELETE — clear demo mode and reset to defaults
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reset KB to empty defaults
  await saveKnowledgeBase({
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

  // Reset products
  await saveProducts([]);

  // Clear flag
  const settings = await db.getAppSettings();
  delete settings.demoMode;
  await db.saveAppSettings('default', settings);

  return NextResponse.json({ success: true, active: false });
}
