import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';

interface AppSettingsData {
  unsplashKey?: string;
  shareExpirationDays?: number;
  leaderboardVisibleToAll?: boolean;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings: AppSettingsData = await db.getAppSettings();
  // Mask the unsplash key for non-admin
  const role = (session.user as Record<string, unknown>)?.role;
  if (role !== 'admin' && settings.unsplashKey) {
    settings.unsplashKey = '••••' + settings.unsplashKey.slice(-4);
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as Record<string, unknown>)?.role;
  if (role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body: AppSettingsData = await req.json();
  const current: AppSettingsData = await db.getAppSettings();
  // Don't overwrite key if masked value is sent back
  if (body.unsplashKey?.startsWith('••••')) {
    body.unsplashKey = current.unsplashKey;
  }
  await db.saveAppSettings('default', { ...current, ...body });
  return NextResponse.json({ ok: true });
}
