import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHistory } from '@/lib/history';
import { getLibrary } from '@/lib/library';
import { getKnowledgeBase } from '@/lib/knowledgeBase';
import { CONTENT_TYPE_LABELS, getExpirationStatus, DEFAULT_SETTINGS } from '@/lib/types';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const history = await getHistory();
  const library = await getLibrary();
  const kb = await getKnowledgeBase();
  const settings = kb.settings || DEFAULT_SETTINGS;

  // Stats: this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthGens = history.filter(
    (h) => new Date(h.generatedAt) >= monthStart
  );

  // Most used content type
  const typeCounts: Record<string, number> = {};
  history.forEach((h) => {
    typeCounts[h.contentType] = (typeCounts[h.contentType] || 0) + 1;
  });
  const mostUsedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  // Top prospect
  const prospectCounts: Record<string, number> = {};
  history.forEach((h) => {
    if (h.prospect.companyName) {
      prospectCounts[h.prospect.companyName] = (prospectCounts[h.prospect.companyName] || 0) + 1;
    }
  });
  const topProspect = Object.entries(prospectCounts).sort((a, b) => b[1] - a[1])[0];

  // Expiring items
  const expiringHistory = history
    .filter((h) => getExpirationStatus(h.generatedAt, settings.expirationWarningDays, settings.expirationCriticalDays) !== 'fresh')
    .map((h) => ({
      ...h,
      expirationStatus: getExpirationStatus(h.generatedAt, settings.expirationWarningDays, settings.expirationCriticalDays),
    }));

  const expiringLibrary = library
    .filter((l) => getExpirationStatus(l.sharedAt, settings.expirationWarningDays, settings.expirationCriticalDays) !== 'fresh')
    .map((l) => ({
      ...l,
      expirationStatus: getExpirationStatus(l.sharedAt, settings.expirationWarningDays, settings.expirationCriticalDays),
    }));

  return NextResponse.json({
    stats: {
      totalThisMonth: thisMonthGens.length,
      totalAllTime: history.length,
      mostUsedType: mostUsedType
        ? { type: CONTENT_TYPE_LABELS[mostUsedType[0] as keyof typeof CONTENT_TYPE_LABELS] || mostUsedType[0], count: mostUsedType[1] }
        : null,
      topProspect: topProspect ? { name: topProspect[0], count: topProspect[1] } : null,
    },
    recentHistory: history.slice(0, 5),
    expiringHistory: expiringHistory.slice(0, 10),
    expiringLibrary: expiringLibrary.slice(0, 10),
  });
}
