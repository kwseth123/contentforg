import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLibrary, addLibraryItem, deleteLibraryItem, togglePinLibraryItem } from '@/lib/library';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getLibrary());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const item = await req.json();
  addLibraryItem(item);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role;
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await req.json();
  deleteLibraryItem(id);
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role;
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, action } = await req.json();
  if (action === 'toggle-pin') {
    togglePinLibraryItem(id);
  }
  return NextResponse.json({ success: true });
}
