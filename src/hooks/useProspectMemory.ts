'use client';

import { useState, useEffect, useCallback } from 'react';
import { CONTENT_TYPE_LABELS, ContentType } from '@/lib/types';

export interface ProspectMemoryItem {
  companyName: string;
  contentType: ContentType;
  contentTypeLabel: string;
  generatedAt: string;
  industry: string;
  companySize: string;
  techStack: string;
  painPoints: string;
}

export interface ProspectMemory {
  companyName: string;
  items: ProspectMemoryItem[];
  latestIndustry: string;
  latestCompanySize: string;
  latestTechStack: string;
  latestPainPoints: string;
}

export function useProspectMemory() {
  const [history, setHistory] = useState<ProspectMemoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.ok ? res.json() : [])
      .then(items => {
        const mapped: ProspectMemoryItem[] = items.map((item: Record<string, unknown>) => ({
          companyName: (item.prospect as Record<string, string>)?.companyName || '',
          contentType: item.contentType as ContentType,
          contentTypeLabel: CONTENT_TYPE_LABELS[item.contentType as ContentType] || String(item.contentType),
          generatedAt: String(item.generatedAt || ''),
          industry: (item.prospect as Record<string, string>)?.industry || '',
          companySize: (item.prospect as Record<string, string>)?.companySize || '',
          techStack: (item.prospect as Record<string, string>)?.techStack || '',
          painPoints: (item.prospect as Record<string, string>)?.painPoints || '',
        }));
        setHistory(mapped);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const findProspect = useCallback((name: string): ProspectMemory | null => {
    if (!name.trim() || !loaded) return null;
    const lower = name.trim().toLowerCase();
    const matches = history.filter(h => h.companyName.toLowerCase().includes(lower));
    if (matches.length === 0) return null;

    // Sort by most recent
    matches.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    const latest = matches[0];

    return {
      companyName: latest.companyName,
      items: matches.slice(0, 5),
      latestIndustry: latest.industry,
      latestCompanySize: latest.companySize,
      latestTechStack: latest.techStack,
      latestPainPoints: latest.painPoints,
    };
  }, [history, loaded]);

  return { findProspect, loaded };
}
