'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineLightBulb,
  HiOutlineCube,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineGlobeAlt,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLink,
  HiOutlineClipboardDocument,
  HiOutlineFolderOpen,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
} from 'react-icons/hi2';

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface KnowledgeItem {
  id: string;
  fileName: string;
  uploadDate: string;
  contentType: string;
  status: 'processing' | 'complete' | 'failed';
  insightsCount: number;
  summary: string;
}

interface IntelligenceCategory {
  id: string;
  name: string;
  icon: 'cube' | 'chart' | 'users' | 'globe';
  insightCount: number;
  lastUpdated: string;
  insights: Insight[];
}

interface Insight {
  id: string;
  text: string;
  confidence: 'high' | 'medium' | 'low';
  sourceCount: number;
}

interface StatsData {
  filesIndexed: number;
  insightsExtracted: number;
  competitiveMentions: number;
}

type TabKey = 'feed' | 'upload' | 'intelligence';

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const TABS: { key: TabKey; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'upload', label: 'Upload' },
  { key: 'intelligence', label: 'Intelligence' },
];

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt,.csv';
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#16a34a',
  medium: '#d97706',
  low: '#dc2626',
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  processing: { bg: 'color-mix(in srgb, #3b82f6 12%, transparent)', color: '#3b82f6', label: 'Processing' },
  complete: { bg: 'color-mix(in srgb, #16a34a 12%, transparent)', color: '#16a34a', label: 'Complete' },
  failed: { bg: 'color-mix(in srgb, #dc2626 12%, transparent)', color: '#dc2626', label: 'Failed' },
};

const INITIAL_CATEGORIES: IntelligenceCategory[] = [
  {
    id: 'product',
    name: 'Product Intelligence',
    icon: 'cube',
    insightCount: 0,
    lastUpdated: '',
    insights: [],
  },
  {
    id: 'competitive',
    name: 'Competitive Intelligence',
    icon: 'chart',
    insightCount: 0,
    lastUpdated: '',
    insights: [],
  },
  {
    id: 'customer',
    name: 'Customer Intelligence',
    icon: 'users',
    insightCount: 0,
    lastUpdated: '',
    insights: [],
  },
  {
    id: 'market',
    name: 'Market Intelligence',
    icon: 'globe',
    insightCount: 0,
    lastUpdated: '',
    insights: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function CategoryIcon({ icon, size = 24, color }: { icon: string; size?: number; color?: string }) {
  const style = { color: color || 'var(--accent)', width: size, height: size };
  switch (icon) {
    case 'cube': return <HiOutlineCube style={style} />;
    case 'chart': return <HiOutlineChartBar style={style} />;
    case 'users': return <HiOutlineUsers style={style} />;
    case 'globe': return <HiOutlineGlobeAlt style={style} />;
    default: return <HiOutlineCube style={style} />;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ═══════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════

export default function KnowledgeBrainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ─── Tab state ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('feed');

  // ─── Feed state ────────────────────────────────────────────────────
  const [feedItems, setFeedItems] = useState<KnowledgeItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // ─── Upload state ──────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{ contentType: string; insightsCount: number } | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Intelligence state ────────────────────────────────────────────
  const [categories, setCategories] = useState<IntelligenceCategory[]>(INITIAL_CATEGORIES);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // ─── Stats state ───────────────────────────────────────────────────
  const [stats, setStats] = useState<StatsData>({ filesIndexed: 0, insightsExtracted: 0, competitiveMentions: 0 });

  // ─── Auth redirect ─────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // ─── Fetch stats ───────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-brain/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Use placeholder data
    }
  }, []);

  // ─── Fetch feed ────────────────────────────────────────────────────
  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const res = await fetch('/api/knowledge-brain');
      if (res.ok) {
        const data = await res.json();
        setFeedItems(data);
      }
    } catch {
      // Use empty state
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadStats();
      loadFeed();
    }
  }, [status, loadStats, loadFeed]);

  // ─── File upload handler ───────────────────────────────────────────
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) => ACCEPTED_MIME_TYPES.includes(f.type) || f.name.match(/\.(pdf|docx|txt|csv)$/i));
    if (validFiles.length === 0) {
      toast.error('Please upload PDF, DOCX, TXT, or CSV files.');
      return;
    }

    setUploading(true);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      validFiles.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/knowledge-brain/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setUploadSuccess({
          contentType: result.contentType || 'Document',
          insightsCount: result.insightsCount || 0,
        });
        toast.success('File uploaded and processing started.');
        loadFeed();
        loadStats();
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ─── Text paste handler ────────────────────────────────────────────
  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) {
      toast.error('Please paste some content first.');
      return;
    }

    setUploading(true);
    setUploadSuccess(null);

    try {
      const res = await fetch('/api/knowledge-brain/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });

      if (res.ok) {
        const result = await res.json();
        setUploadSuccess({
          contentType: result.contentType || 'Text',
          insightsCount: result.insightsCount || 0,
        });
        setPasteText('');
        toast.success('Content submitted for processing.');
        loadFeed();
        loadStats();
      } else {
        toast.error('Submission failed. Please try again.');
      }
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ─── URL scan handler ─────────────────────────────────────────────
  const handleUrlScan = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL.');
      return;
    }

    setScanning(true);
    setUploadSuccess(null);

    try {
      const res = await fetch('/api/knowledge-brain/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      if (res.ok) {
        const result = await res.json();
        setUploadSuccess({
          contentType: result.contentType || 'Web Page',
          insightsCount: result.insightsCount || 0,
        });
        setUrlInput('');
        toast.success('URL scanned and processing started.');
        loadFeed();
        loadStats();
      } else {
        toast.error('Scan failed. Please check the URL and try again.');
      }
    } catch {
      toast.error('Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // ─── Drag & drop handlers ─────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1" style={{ backgroundColor: 'var(--content-bg)' }}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="border-b px-8 py-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Knowledge Brain</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Your intelligence hub for content insights and competitive analysis
          </p>
        </div>

        <div className="p-8">
          {/* ── Stats Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Files Indexed', value: stats.filesIndexed, icon: <HiOutlineFolderOpen style={{ color: 'var(--accent)' }} className="text-xl" /> },
              { label: 'Insights Extracted', value: stats.insightsExtracted, icon: <HiOutlineLightBulb style={{ color: 'var(--accent)' }} className="text-xl" /> },
              { label: 'Competitive Mentions Found', value: stats.competitiveMentions, icon: <HiOutlineChartBar style={{ color: 'var(--accent)' }} className="text-xl" /> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border rounded-xl p-5 flex items-center gap-4"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tab Bar ──────────────────────────────────────────── */}
          <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-5 py-2.5 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Feed Tab ─────────────────────────────────────────── */}
          {activeTab === 'feed' && (
            <div>
              {feedLoading ? (
                <div className="flex items-center justify-center py-16">
                  <HiOutlineArrowPath className="text-2xl animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
              ) : feedItems.length === 0 ? (
                <div className="text-center py-16">
                  <HiOutlineFolderOpen className="text-4xl mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No items yet. Upload content to start building your knowledge base.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {feedItems.map((item) => {
                    const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.processing;
                    return (
                      <div
                        key={item.id}
                        className="border rounded-xl p-5 transition-colors"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <HiOutlineDocumentText className="shrink-0" style={{ color: 'var(--accent)' }} />
                              <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {item.fileName}
                              </h3>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(item.uploadDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                              color: 'var(--accent)',
                            }}
                          >
                            {item.contentType}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {item.status === 'processing' && (
                              <HiOutlineArrowPath className="inline-block mr-1 text-xs animate-spin" />
                            )}
                            {item.status === 'complete' && (
                              <HiOutlineCheckCircle className="inline-block mr-1 text-xs" />
                            )}
                            {item.status === 'failed' && (
                              <HiOutlineXCircle className="inline-block mr-1 text-xs" />
                            )}
                            {statusStyle.label}
                          </span>
                          {item.insightsCount > 0 && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {item.insightsCount} insight{item.insightsCount !== 1 ? 's' : ''} extracted
                            </span>
                          )}
                        </div>

                        {item.summary && (
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {item.summary.length > 100 ? item.summary.slice(0, 100) + '...' : item.summary}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Upload Tab ───────────────────────────────────────── */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors"
                style={{
                  backgroundColor: isDragging
                    ? 'color-mix(in srgb, var(--accent) 5%, transparent)'
                    : 'var(--card-bg)',
                  borderColor: isDragging ? 'var(--accent)' : 'var(--card-border)',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
                <HiOutlineCloudArrowUp
                  className="text-4xl mx-auto mb-3"
                  style={{ color: isDragging ? 'var(--accent)' : 'var(--text-muted)' }}
                />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {isDragging ? 'Drop files here' : 'Drag and drop files here, or click to browse'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Accepts PDF, DOCX, TXT, CSV
                </p>
              </div>

              {/* Processing indicator */}
              {uploading && (
                <div
                  className="border rounded-xl p-5 flex items-center gap-3"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <HiOutlineArrowPath className="text-xl animate-spin" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Processing your content...</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This may take a moment</p>
                  </div>
                </div>
              )}

              {/* Upload success card */}
              {uploadSuccess && (
                <div
                  className="border rounded-xl p-5"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #16a34a 5%, var(--card-bg))',
                    borderColor: '#16a34a',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <HiOutlineCheckCircle className="text-2xl shrink-0" style={{ color: '#16a34a' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Upload successful
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Detected content type: <span className="font-medium">{uploadSuccess.contentType}</span>
                        {' -- '}
                        {uploadSuccess.insightsCount} insight{uploadSuccess.insightsCount !== 1 ? 's' : ''} extracted
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Paste text area */}
              <div
                className="border rounded-xl p-5"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineClipboardDocument style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Paste Content</h3>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste content here..."
                  rows={5}
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{
                    backgroundColor: 'var(--content-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--accent)',
                  } as React.CSSProperties}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handlePasteSubmit}
                    disabled={uploading || !pasteText.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Submit Content
                  </button>
                </div>
              </div>

              {/* URL input */}
              <div
                className="border rounded-xl p-5"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineLink style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Scan URL</h3>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter a URL to scrape"
                    className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--content-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--accent)',
                    } as React.CSSProperties}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUrlScan();
                    }}
                  />
                  <button
                    onClick={handleUrlScan}
                    disabled={scanning || !urlInput.trim()}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50 flex items-center gap-2"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {scanning && <HiOutlineArrowPath className="animate-spin" />}
                    Scan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Intelligence Tab ─────────────────────────────────── */}
          {activeTab === 'intelligence' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const isExpanded = expandedCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`border rounded-xl transition-all ${isExpanded ? 'md:col-span-2' : ''}`}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: isExpanded ? 'var(--accent)' : 'var(--card-border)',
                    }}
                  >
                    {/* Card header */}
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                      className="w-full p-5 flex items-center gap-4 text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
                      >
                        <CategoryIcon icon={cat.icon} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {cat.name}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {cat.insightCount} insight{cat.insightCount !== 1 ? 's' : ''}
                          {cat.lastUpdated ? ` -- Last updated ${formatDate(cat.lastUpdated)}` : ' -- No data yet'}
                        </p>
                      </div>
                      {isExpanded ? (
                        <HiOutlineChevronDown className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <HiOutlineChevronRight className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </button>

                    {/* Expanded insights list */}
                    {isExpanded && (
                      <div className="border-t px-5 pb-5" style={{ borderColor: 'var(--card-border)' }}>
                        {cat.insights.length === 0 ? (
                          <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                            No insights available yet. Upload content to generate intelligence.
                          </p>
                        ) : (
                          <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                            {cat.insights.map((insight) => (
                              <div key={insight.id} className="py-3 flex items-start gap-3">
                                <span
                                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                  style={{ backgroundColor: CONFIDENCE_COLORS[insight.confidence] }}
                                  title={`${insight.confidence} confidence`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {insight.text}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs capitalize" style={{ color: CONFIDENCE_COLORS[insight.confidence] }}>
                                      {insight.confidence}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {insight.sourceCount} source{insight.sourceCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast('Source viewer coming soon.');
                                  }}
                                  className="text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors hover:opacity-80"
                                  style={{
                                    color: 'var(--accent)',
                                    borderColor: 'var(--accent)',
                                    backgroundColor: 'color-mix(in srgb, var(--accent) 5%, transparent)',
                                  }}
                                >
                                  View Sources
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
