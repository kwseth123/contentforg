import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SHARES_FILE = path.join(DATA_DIR, 'shares.json');

interface ShareRecord {
  id: string;
  sections: { title: string; content: string }[];
  contentType: string;
  prospect: { companyName: string; industry: string };
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  logoBase64?: string;
}

function getShares(): ShareRecord[] {
  if (!fs.existsSync(SHARES_FILE)) return [];
  return JSON.parse(fs.readFileSync(SHARES_FILE, 'utf-8'));
}

function saveShares(shares: ShareRecord[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { sections, contentType, prospect, logoBase64 } = body;

  const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const share: ShareRecord = {
    id,
    sections,
    contentType,
    prospect,
    createdAt: new Date().toISOString(),
    expiresAt,
    createdBy: session.user?.name || 'Unknown',
    logoBase64,
  };

  const shares = getShares();
  shares.push(share);
  saveShares(shares);

  return NextResponse.json({ id, url: `/share/${id}`, expiresAt });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const shares = getShares();
  const share = shares.find(s => s.id === id);
  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Check expiry
  if (new Date(share.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }

  return NextResponse.json(share);
}
