import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'app-settings.json');

interface AppSettingsData {
  unsplashKey?: string;
  shareExpirationDays?: number;
  leaderboardVisibleToAll?: boolean;
}

function getSettings(): AppSettingsData {
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
}

function saveSettings(settings: AppSettingsData) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = getSettings();
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
  const current = getSettings();
  // Don't overwrite key if masked value is sent back
  if (body.unsplashKey?.startsWith('••••')) {
    body.unsplashKey = current.unsplashKey;
  }
  saveSettings({ ...current, ...body });
  return NextResponse.json({ ok: true });
}
