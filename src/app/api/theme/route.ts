import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTheme, saveTheme } from '@/lib/themeStorage';
import { ThemeConfig } from '@/lib/theme';

export async function GET() {
  const theme = getTheme();
  return NextResponse.json(theme);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as Record<string, unknown>)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const theme: ThemeConfig = await req.json();
  saveTheme(theme);
  return NextResponse.json({ ok: true });
}
