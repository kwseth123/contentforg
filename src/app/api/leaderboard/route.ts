import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read history
  let history: { generatedBy: string; generatedAt: string; scores?: { overall: number } }[] = [];
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch { history = []; }

  // Filter to this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = history.filter(h => new Date(h.generatedAt) >= weekAgo);

  // Group by rep
  const repMap: Record<string, { count: number; totalScore: number; scoredCount: number }> = {};
  for (const item of thisWeek) {
    const rep = item.generatedBy || 'Unknown';
    if (!repMap[rep]) repMap[rep] = { count: 0, totalScore: 0, scoredCount: 0 };
    repMap[rep].count++;
    if (item.scores?.overall) {
      repMap[rep].totalScore += item.scores.overall;
      repMap[rep].scoredCount++;
    }
  }

  const leaderboard = Object.entries(repMap)
    .map(([name, data]) => ({
      name,
      generations: data.count,
      avgScore: data.scoredCount > 0 ? Math.round((data.totalScore / data.scoredCount) * 10) / 10 : null,
    }))
    .sort((a, b) => b.generations - a.generations);

  return NextResponse.json(leaderboard);
}
