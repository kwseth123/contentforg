import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getKnowledgeBase, saveKnowledgeBase } from '@/lib/knowledgeBase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const kb = await getKnowledgeBase();
  return NextResponse.json(kb);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as Record<string, unknown>).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const kb = await req.json();
  await saveKnowledgeBase(kb);
  return NextResponse.json({ success: true });
}
