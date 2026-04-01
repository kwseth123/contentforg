import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveKnowledgeBase } from '@/lib/knowledgeBase';
import { saveProducts } from '@/lib/products';
import * as db from '@/lib/db';
import {
  DEMO_COMPANY_CARDS,
  loadDemoCompany,
} from '@/lib/demoData';

// GET — returns list of demo company cards
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await db.getAppSettings();

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

  // Write the demo company KB
  await saveKnowledgeBase(demoCompany.knowledgeBase);

  // Write the demo company products
  await saveProducts(demoCompany.products);

  // Set demo mode flag in app settings
  const settings = await db.getAppSettings();
  await db.saveAppSettings('default', {
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

// DELETE — clear demo mode, restore to empty defaults
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as Record<string, unknown>)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // Reset to empty KB
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

  // Clear demo mode flag from settings
  const settings = await db.getAppSettings();
  delete settings.demoMode;
  delete settings.demoCompanyId;
  await db.saveAppSettings('default', settings);

  return NextResponse.json({
    success: true,
    demoMode: false,
    restored: 'empty',
  });
}
