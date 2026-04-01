'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import {
  LibraryItem,
  CONTENT_TYPE_LABELS,
  ContentType,
  getExpirationStatus,
  DEFAULT_SETTINGS,
} from '@/lib/types';
import {
  HiOutlineEye,
  HiOutlineDocumentDuplicate,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineClipboard,
  HiOutlineBookOpen,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';

// Pin icon inline since it may not exist in hi2
function PinIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7z" />
    </svg>
  );
}

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadLibrary = useCallback(async () => {
    const res = await fetch('/api/library');
    if (res.ok) setLibrary(await res.json());
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadLibrary();
  }, [status, loadLibrary]);

  const togglePin = async (id: string) => {
    await fetch('/api/library', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle-pin' }),
    });
    loadLibrary();
    toast.success('Pin updated');
  };

  const deleteItem = async (id: string) => {
    await fetch('/api/library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadLibrary();
    toast.success('Removed from library');
  };

  const useAsTemplate = (item: LibraryItem) => {
    const params = new URLSearchParams({
      contentType: item.contentType,
      prospectName: item.prospect.companyName,
      industry: item.prospect.industry,
      companySize: item.prospect.companySize,
      techStack: item.prospect.techStack,
      painPoints: item.prospect.painPoints,
    });
    router.push(`/generate?${params.toString()}`);
  };

  const reExport = async (item: LibraryItem, format: 'pdf' | 'pptx') => {
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

  // Collect all tags
  const allTags = [...new Set(library.flatMap((l) => l.tags))];

  const filtered = library.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.prospect.companyName.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      CONTENT_TYPE_LABELS[item.contentType].toLowerCase().includes(q);
    const matchesType = filterType === 'all' || item.contentType === filterType;
    return matchesSearch && matchesType;
  });

  const expirationBadge = (dateStr: string) => {
    const s = getExpirationStatus(dateStr, DEFAULT_SETTINGS.expirationWarningDays, DEFAULT_SETTINGS.expirationCriticalDays);
    if (s === 'warning') return <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">May be outdated</span>;
    if (s === 'expired') return <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Outdated</span>;
    return null;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1" style={{ backgroundColor: 'var(--content-bg)' }}>
        <div className="border-b px-8 py-5" style={{ backgroundColor: 'var(--card-bg)' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Library</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Shared content from across the team</p>
        </div>

        <div className="p-8">
          {/* Search + Filter */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, tag, or content type..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as ContentType | 'all')}
              className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}>
              <option value="all">All Types</option>
              {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Tag filter chips */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {allTags.map((tag) => (
                <button key={tag} onClick={() => setSearch(tag)}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors border"
                  style={search === tag
                    ? { backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { backgroundColor: 'var(--content-bg)', color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }
                  }>
                  {tag}
                </button>
              ))}
              {search && allTags.includes(search) && (
                <button onClick={() => setSearch('')} className="text-xs px-2" style={{ color: 'var(--text-secondary)' }}>Clear</button>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <HiOutlineBookOpen className="text-4xl text-gray-200 mx-auto mb-3" />
              <p style={{ color: 'var(--text-secondary)' }}>{library.length === 0 ? 'No shared content yet.' : 'No matching results.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((item) => (
                <div key={item.id} className={`border rounded-xl p-5 transition-colors ${item.pinned ? 'ring-1' : ''}`}
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: item.pinned ? 'var(--accent)' : 'var(--card-border)', ...(item.pinned ? { '--tw-ring-color': 'color-mix(in srgb, var(--accent) 20%, transparent)' } as React.CSSProperties : {}) }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {item.pinned && <PinIcon className="shrink-0" style={{ color: 'var(--accent)' }} />}
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.prospect.companyName}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
                          {CONTENT_TYPE_LABELS[item.contentType]}
                        </span>
                        {item.scores && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                            item.scores.overall >= 8 ? 'bg-green-500' : item.scores.overall >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>{item.scores.overall}/10</span>
                        )}
                        {expirationBadge(item.sharedAt)}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Shared by {item.sharedBy} &bull; {new Date(item.sharedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--content-bg)', color: 'var(--text-secondary)' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm truncate mb-3" style={{ color: 'var(--text-secondary)' }}>{item.sections[0]?.content.slice(0, 100)}...</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedItem(item)} className="text-xs border rounded-lg px-2.5 py-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                      <HiOutlineEye /> View
                    </button>
                    <button onClick={() => useAsTemplate(item)} className="text-xs border rounded-lg px-2.5 py-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                      <HiOutlineDocumentDuplicate /> Template
                    </button>
                    <button onClick={() => reExport(item, 'pdf')} className="text-xs border rounded-lg px-2.5 py-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                      <HiOutlineArrowDownTray /> PDF
                    </button>
                    {role === 'admin' && (
                      <>
                        <button onClick={() => togglePin(item.id)} className="text-xs border rounded-lg px-2.5 py-1 ml-auto" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                          {item.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600 border rounded-lg px-2.5 py-1" style={{ borderColor: 'var(--card-border)' }}>
                          <HiOutlineTrash />
                        </button>
                      </>
                    )}
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
                  Shared by {selectedItem.sharedBy} &bull; {new Date(selectedItem.sharedAt).toLocaleDateString()}
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
