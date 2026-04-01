import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { sections, contentType, prospect, logoBase64 } = body;

  const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const share = {
    id,
    sections,
    contentType,
    prospect,
    createdAt: new Date().toISOString(),
    expiresAt,
    createdBy: session.user?.name || 'Unknown',
    logoBase64,
  };

  await db.saveShare('default', share);

  return NextResponse.json({ id, url: `/share/${id}`, expiresAt });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const share = await db.getShare(id);
  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Check expiry
  const expiresAt = share.expiresAt || share.expires_at;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }

  return NextResponse.json(share);
}
