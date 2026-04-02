'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import {
  HiOutlineLightBulb,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineGlobeAlt,
  HiOutlineChartBar,
} from 'react-icons/hi2';

interface BrainItem {
  id: string;
  company_id: string;
  file_name: string;
  content_type: string;  // 'pdf' | 'docx' | 'txt' | 'url' | 'voice' | 'paste'
  raw_text: string;
  summary: string;
  insights: string[];
  entities: string[];
  tags: string[];
  category: 'product' | 'competitive' | 'customer' | 'market';
  confidence: number;
  source_count: number;
  processed_at: string;
  created_at: string;
}

interface BrainStats {
  totalItems: number;
  totalInsights: number;
  competitiveMentions: number;
  categories: Record<string, number>;
}

const TABS = [
  { id: 'feed' as const, label: 'Feed', icon: HiOutlineDocumentText },
  { id: 'upload' as const, label: 'Upload', icon: HiOutlineCloudArrowUp },
  { id: 'intelligence' as const, label: 'Intelligence', icon: HiOutlineSparkles },
];

const INTELLIGENCE_CATEGORIES = [
  { key: 'product', label: 'Product Intelligence', icon: HiOutlineCube, color: '#3b82f6', desc: 'Features, capabilities, and product insights' },
  { key: 'competitive', label: 'Competitive Intelligence', icon: HiOutlineChartBar, color: '#ef4444', desc: 'Competitor mentions, positioning, and threats' },
  { key: 'customer', label: 'Customer Intelligence', icon: HiOutlineUsers, color: '#22c55e', desc: 'Customer needs, feedback, and success stories' },
  { key: 'market', label: 'Market Intelligence', icon: HiOutlineGlobeAlt, color: '#f59e0b', desc: 'Industry trends, market signals, and opportunities' },
];

export default function BrainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'upload' | 'intelligence'>('feed');
  const [items, setItems] = useState<BrainItem[]>([]);
  const [stats, setStats] = useState<BrainStats>({ totalItems: 0, totalInsights: 0, competitiveMentions: 0, categories: {} });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Fetch brain items
  useEffect(() => {
    fetchBrainItems();
  }, []);

  const fetchBrainItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/brain');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setStats(data.stats || { totalItems: 0, totalInsights: 0, competitiveMentions: 0, categories: {} });
      }
    } catch (err) {
      console.error('Failed to fetch brain items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).slice(0, 20).forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/brain/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Processed ${data.processed} file(s)`);
        fetchBrainItems();
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setUploading(true);
    try {
      const res = await fetch('/api/brain/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText, type: 'paste' }),
      });
      if (res.ok) {
        toast.success('Content processed');
        setPasteText('');
        fetchBrainItems();
      }
    } catch (err) {
      toast.error('Processing failed');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlScrape = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      const res = await fetch('/api/brain/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, type: 'url' }),
      });
      if (res.ok) {
        toast.success('URL content processed');
        setUrlInput('');
        fetchBrainItems();
      }
    } catch (err) {
      toast.error('Scraping failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.file_name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.insights.some(i => i.toLowerCase().includes(q));
    }
    return true;
  });

  const groupedInsights = INTELLIGENCE_CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.key),
    insights: items.filter(i => i.category === cat.key).flatMap(i => i.insights),
  }));

  if (status !== 'authenticated') {
    return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}><div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading...</div></main></div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--content-bg)' }}>
        {/* Topbar */}
        <div className="h-14 border-b px-8 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--content-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-2">
            <HiOutlineLightBulb className="text-lg" style={{ color: 'var(--accent)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Knowledge Brain</h1>
          </div>

          {/* Tab pills */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--card-border)' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
                style={activeTab === tab.id ? {
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                } : {
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                }}
              >
                <tab.icon className="text-sm" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{stats.totalItems}</strong> files</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{stats.totalInsights}</strong> insights</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{stats.competitiveMentions}</strong> competitive</span>
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {/* ── FEED TAB ── */}
          {activeTab === 'feed' && (
            <div>
              {/* Search and filters */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                  <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search knowledge brain..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="flex gap-1">
                  {['all', ...INTELLIGENCE_CATEGORIES.map(c => c.key)].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className="px-2.5 py-1.5 text-[10px] font-semibold rounded-full transition-colors"
                      style={filterCategory === cat ? {
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                      } : {
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--card-border)',
                      }}
                    >
                      {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed items */}
              {loading ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <HiOutlineLightBulb className="mx-auto text-4xl mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No items yet. Upload content to get started.</p>
                  <button onClick={() => setActiveTab('upload')} className="mt-3 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    Go to Upload
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map(item => {
                    const isExpanded = expandedItems.has(item.id);
                    const catInfo = INTELLIGENCE_CATEGORIES.find(c => c.key === item.category);
                    return (
                      <div key={item.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
                        <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => toggleExpanded(item.id)}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo?.color || '#6b7280' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.file_name}</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: catInfo?.color + '20', color: catInfo?.color }}>
                                {item.category}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card-border)', color: 'var(--text-muted)' }}>
                                {item.content_type}
                              </span>
                            </div>
                            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.summary}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                            {isExpanded ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
                            <div className="pt-3 space-y-3">
                              {/* Summary */}
                              <div>
                                <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Summary</p>
                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.summary}</p>
                              </div>

                              {/* Insights */}
                              {item.insights.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Key Insights</p>
                                  <ul className="space-y-1">
                                    {item.insights.map((insight, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                        <HiOutlineSparkles className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                                        {insight}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Tags */}
                              {item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {item.tags.map((tag, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Confidence */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Confidence:</span>
                                <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: 'var(--card-border)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${item.confidence}%`, backgroundColor: item.confidence > 70 ? '#22c55e' : item.confidence > 40 ? '#f59e0b' : '#ef4444' }} />
                                </div>
                                <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{item.confidence}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── UPLOAD TAB ── */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors hover:border-solid"
                style={{ borderColor: 'var(--accent-border)', backgroundColor: 'var(--card-bg)' }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files); }}
              >
                <HiOutlineCloudArrowUp className="mx-auto text-4xl mb-3" style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {uploading ? 'Processing...' : 'Drop files here or click to upload'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  PDF, DOCX, TXT, CSV — up to 20 files at once
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.csv,.doc"
                  className="hidden"
                  onChange={e => e.target.files && handleFileUpload(e.target.files)}
                />
              </div>

              {/* Paste text */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Paste Text</p>
                </div>
                <div className="p-4">
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder="Paste call notes, meeting transcripts, articles, or any text content..."
                    className="w-full h-32 p-3 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--content-bg)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handlePasteSubmit}
                    disabled={uploading || !pasteText.trim()}
                    className="mt-3 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Process Text
                  </button>
                </div>
              </div>

              {/* URL scrape */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Scrape URL</p>
                </div>
                <div className="p-4 flex gap-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://competitor.com/features"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--content-bg)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handleUrlScrape}
                    disabled={uploading || !urlInput.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Scrape
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── INTELLIGENCE TAB ── */}
          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              {groupedInsights.map(cat => (
                <div key={cat.key} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
                  <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                        <cat.icon className="text-lg" style={{ color: cat.color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.label}</h3>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{cat.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span>{cat.items.length} sources</span>
                      <span>{cat.insights.length} insights</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {cat.insights.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                        No intelligence gathered yet. Upload content to generate insights.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cat.insights.slice(0, 8).map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            {insight}
                          </div>
                        ))}
                        {cat.insights.length > 8 && (
                          <button className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                            View all {cat.insights.length} insights
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
