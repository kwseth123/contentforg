'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import {
  HistoryItem,
  CONTENT_TYPE_LABELS,
  ContentType,
  getExpirationStatus,
  DEFAULT_SETTINGS,
} from '@/lib/types';
import {
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineDocumentDuplicate,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineClipboard,
  HiOutlineClock,
} from 'react-icons/hi2';

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/history');
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadHistory();
  }, [status, loadHistory]);

  const filtered = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.prospect.companyName.toLowerCase().includes(q) ||
      CONTENT_TYPE_LABELS[item.contentType].toLowerCase().includes(q) ||
      item.contentType.toLowerCase().includes(q)
    );
  });

  const useAsTemplate = (item: HistoryItem) => {
    const params = new URLSearchParams({
      contentType: item.contentType,
      prospectName: item.prospect.companyName,
      industry: item.prospect.industry,
      companySize: item.prospect.companySize,
      techStack: item.prospect.techStack,
      painPoints: item.prospect.painPoints,
      context: item.additionalContext || '',
      toneLevel: String(item.toneLevel),
    });
    router.push(`/generate?${params.toString()}`);
  };

  const reExport = async (item: HistoryItem, format: 'pdf' | 'pptx') => {
    const endpoint = format === 'pdf' ? '/api/export/pdf' : '/api/export/pptx';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: item.sections, contentType: item.contentType, prospect: item.prospect }),
    });
    if (format === 'pdf') {
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
    } else {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.contentType}-${item.prospect.companyName}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PPTX downloaded!');
    }
  };

  const expirationBadge = (dateStr: string) => {
    const status = getExpirationStatus(dateStr, DEFAULT_SETTINGS.expirationWarningDays, DEFAULT_SETTINGS.expirationCriticalDays);
    if (status === 'warning') return <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">May be outdated</span>;
    if (status === 'expired') return <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Outdated</span>;
    return null;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1" style={{ backgroundColor: 'var(--content-bg)' }}>
        <div className="border-b px-8 py-5" style={{ backgroundColor: 'var(--card-bg)' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Generation History</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>View, re-export, or reuse past generations</p>
        </div>

        <div className="p-8">
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by prospect name or content type..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <HiOutlineClock className="text-4xl text-gray-200 mx-auto mb-3" />
              <p style={{ color: 'var(--text-secondary)' }}>{history.length === 0 ? 'No generations yet.' : 'No matching results.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="border rounded-xl p-5 transition-colors" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.prospect.companyName}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
                          {CONTENT_TYPE_LABELS[item.contentType]}
                        </span>
                        {item.scores && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                            item.scores.overall >= 8 ? 'bg-green-500' : item.scores.overall >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {item.scores.overall}/10
                          </span>
                        )}
                        {expirationBadge(item.generatedAt)}
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(item.generatedAt).toLocaleDateString()} at {new Date(item.generatedAt).toLocaleTimeString()} &bull; by {item.generatedBy}
                      </p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                        {item.sections[0]?.content.slice(0, 120)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => setSelectedItem(item)}
                        className="p-1.5 border rounded-lg transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }} title="View">
                        <HiOutlineEye />
                      </button>
                      <button onClick={() => reExport(item, 'pdf')}
                        className="p-1.5 border rounded-lg transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }} title="PDF">
                        <HiOutlineArrowDownTray />
                      </button>
                      <button onClick={() => useAsTemplate(item)}
                        className="p-1.5 border rounded-lg transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }} title="Use as template">
                        <HiOutlineDocumentDuplicate />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Full View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-xl flex flex-col" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {CONTENT_TYPE_LABELS[selectedItem.contentType]}
                  <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-secondary)' }}>for {selectedItem.prospect.companyName}</span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(selectedItem.generatedAt).toLocaleDateString()} &bull; by {selectedItem.generatedBy}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  const text = selectedItem.sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
                  navigator.clipboard.writeText(text);
                  toast.success('Copied!');
                }} className="p-1.5 border rounded-lg" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                  <HiOutlineClipboard />
                </button>
                <button onClick={() => reExport(selectedItem, 'pdf')} className="p-1.5 border rounded-lg" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                  <HiOutlineArrowDownTray />
                </button>
                <button onClick={() => useAsTemplate(selectedItem)} className="text-sm border rounded-lg px-3 py-1.5" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                  Use as Template
                </button>
                <button onClick={() => setSelectedItem(null)} style={{ color: 'var(--text-secondary)' }}>
                  <HiOutlineXMark className="text-xl" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedItem.sections.map((section) => (
                <div key={section.id}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>{section.title}</h4>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{section.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
