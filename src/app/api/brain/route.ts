import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const items = await db.getBrainItems('default');
    const stats = {
      totalItems: items.length,
      totalInsights: items.reduce((sum: number, i: any) => sum + (i.insights?.length || 0), 0),
      competitiveMentions: items.filter((i: any) => i.category === 'competitive').length,
      categories: items.reduce((acc: Record<string, number>, i: any) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    return NextResponse.json({ items, stats });
  } catch (err) {
    console.error('Failed to fetch brain items:', err);
    return NextResponse.json({ items: [], stats: { totalItems: 0, totalInsights: 0, competitiveMentions: 0, categories: {} } });
  }
}
