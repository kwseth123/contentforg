'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StylePickerModal from '@/components/StylePickerModal';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
  HiOutlineCalendar,
  HiOutlineCube,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlinePlusCircle,
  HiOutlineEye,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';

// ── Types ──

interface AnalysisDate { original: string; context: string }
interface OutdatedProduct { found: string; current: string; context: string }
interface BrandVoiceIssue { term: string; issue: string; context: string }
interface CompetitorMention { name: string; context: string; hasCurrentIntel: boolean }
interface SmartSuggestion { id: string; text: string; type: 'case-study' | 'competitive' | 'product' | 'general' }

interface Analysis {
  documentType: string;
  prospectName: string;
  dates: AnalysisDate[];
  outdatedProducts: OutdatedProduct[];
  brandVoiceIssues: BrandVoiceIssue[];
  competitorMentions: CompetitorMention[];
  summary: string;
  sectionCount: number;
  wordCount: number;
  smartSuggestions: SmartSuggestion[];
}

interface UploadedFile {
  file: File;
  fileName: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  analysis: Analysis | null;
  status: 'pending' | 'extracting' | 'analyzed' | 'generating' | 'done' | 'error';
  error?: string;
  refreshedHtml?: string;
  refreshedSections?: { id: string; title: string; content: string }[];
}

// ── Helpers ──

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ── Main Component ──

export default function RefreshDocPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Options toggles
  const [updateBranding, setUpdateBranding] = useState(true);
  const [refreshDates, setRefreshDates] = useState(true);
  const [updateProducts, setUpdateProducts] = useState(true);

  // Analysis fix toggles
  const [fixToggles, setFixToggles] = useState<Record<string, boolean>>({});

  // Context
  const [additionalContext, setAdditionalContext] = useState('');
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());

  // Style picker
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState('');

  // Generation
  const [generating, setGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const activeFile = files[activeFileIndex] || null;

  // ── File Upload ──

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    const arr = Array.from(fileList).slice(0, 10);

    for (const file of arr) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        toast.error(`${file.name}: Only PDF and DOCX files are accepted`);
        continue;
      }
      newFiles.push({
        file,
        fileName: file.name,
        fileSize: file.size,
        pageCount: 0,
        extractedText: '',
        analysis: null,
        status: 'pending',
      });
    }

    if (newFiles.length === 0) return;

    setFiles(prev => [...prev, ...newFiles]);
    setActiveFileIndex(files.length); // select first new file
    setStep(2);

    // Extract each file
    const startIdx = files.length;
    for (let i = 0; i < newFiles.length; i++) {
      const idx = startIdx + i;
      setFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: 'extracting' } : f));

      try {
        const formData = new FormData();
        formData.append('file', newFiles[i].file);

        const res = await fetch('/api/refresh/extract', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
          throw new Error(err.error || 'Extraction failed');
        }

        const data = await res.json();

        setFiles(prev => prev.map((f, j) => j === idx ? {
          ...f,
          status: 'analyzed',
          extractedText: data.extractedText,
          pageCount: data.pageCount || 0,
          analysis: data.analysis,
        } : f));

        // Initialize fix toggles
        if (data.analysis) {
          const toggles: Record<string, boolean> = {};
          data.analysis.dates?.forEach((_: AnalysisDate, di: number) => { toggles[`date-${di}`] = true; });
          data.analysis.outdatedProducts?.forEach((_: OutdatedProduct, pi: number) => { toggles[`product-${pi}`] = true; });
          data.analysis.brandVoiceIssues?.forEach((_: BrandVoiceIssue, bi: number) => { toggles[`brand-${bi}`] = true; });
          data.analysis.competitorMentions?.forEach((_: CompetitorMention, ci: number) => { toggles[`competitor-${ci}`] = true; });
          setFixToggles(prev => ({ ...prev, ...toggles }));

          // Auto-select style based on detected type
          if (data.analysis.documentType) {
            const { getDefaultStyleForContentType } = await import('@/lib/documentStyles/registry');
            setSelectedStyleId(getDefaultStyleForContentType(data.analysis.documentType));
          }
        }
      } catch (err: any) {
        setFiles(prev => prev.map((f, j) => j === idx ? {
          ...f,
          status: 'error',
          error: err.message,
        } : f));
        toast.error(`Failed to extract ${newFiles[i].fileName}`);
      }
    }
  }, [files.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // ── Smart Suggestion Add ──

  const addSuggestion = (suggestion: SmartSuggestion) => {
    setAddedSuggestions(prev => new Set(prev).add(suggestion.id));
    setAdditionalContext(prev => prev + (prev ? '\n\n' : '') + suggestion.text);
    toast.success('Suggestion added');
  };

  // ── Generate Refresh ──

  const handleRefresh = async () => {
    if (!activeFile || !activeFile.analysis) return;

    setGenerating(true);
    setStep(5);

    try {
      const res = await fetch('/api/refresh/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText: activeFile.extractedText,
          contentType: activeFile.analysis.documentType,
          styleId: selectedStyleId,
          prospectName: activeFile.analysis.prospectName || 'Prospect',
          additionalContext,
          originalFilename: activeFile.fileName,
          analysis: activeFile.analysis,
          fixes: {
            updateBranding,
            refreshDates,
            updateProducts,
            fixBrandVoice: Object.entries(fixToggles).some(([k, v]) => k.startsWith('brand-') && v),
            updateCompetitorIntel: Object.entries(fixToggles).some(([k, v]) => k.startsWith('competitor-') && v),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      setFiles(prev => prev.map((f, i) => i === activeFileIndex ? {
        ...f,
        status: 'done',
        refreshedHtml: data.html,
        refreshedSections: data.sections,
      } : f));
      toast.success('Document refreshed!');
    } catch (err: any) {
      toast.error(err.message);
      setFiles(prev => prev.map((f, i) => i === activeFileIndex ? { ...f, status: 'error', error: err.message } : f));
    } finally {
      setGenerating(false);
    }
  };

  // ── Export PDF ──

  const exportPDF = async () => {
    if (!activeFile?.refreshedHtml && !activeFile?.refreshedSections) return;
    try {
      // If we have pre-rendered HTML, send it directly to avoid re-rendering mismatch
      const payload = activeFile.refreshedHtml
        ? { html: activeFile.refreshedHtml }
        : {
            sections: activeFile.refreshedSections,
            contentType: activeFile.analysis?.documentType || 'document',
            prospect: { companyName: activeFile.analysis?.prospectName || 'Prospect' },
            styleId: selectedStyleId,
          };
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('Content-Type') || '';
      if (ct.includes('application/pdf')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `refreshed-${activeFile.fileName.replace(/\.[^.]+$/, '')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded!');
      } else {
        const html = await res.text();
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
      }
    } catch { toast.error('Export failed'); }
  };

  // ── Save to Library ──

  const saveToLibrary = async () => {
    if (!activeFile?.refreshedHtml || !activeFile.analysis) return;
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Refreshed: ${activeFile.fileName}`,
          contentType: activeFile.analysis.documentType,
          output: activeFile.refreshedHtml,
          tags: ['Refreshed', new Date().toLocaleDateString()],
          metadata: {
            originalFilename: activeFile.fileName,
            refreshDate: new Date().toISOString(),
            styleId: selectedStyleId,
          },
        }),
      });
      if (res.ok) toast.success('Saved to library!');
      else toast.error('Failed to save');
    } catch { toast.error('Failed to save'); }
  };

  // ── Toggle helper ──

  function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
      <label className="flex items-center justify-between cursor-pointer py-2">
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          style={{ backgroundColor: checked ? 'var(--accent)' : 'var(--card-border)' }}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </label>
    );
  }

  // ── Content Type Label ──

  const CONTENT_TYPE_LABELS: Record<string, string> = {
    'solution-one-pager': 'Solution One-Pager',
    'battle-card': 'Battle Card',
    'competitive-analysis': 'Competitive Analysis',
    'executive-summary': 'Executive Summary',
    'discovery-call-prep': 'Discovery Call Prep',
    'roi-business-case': 'ROI Business Case',
    'case-study': 'Case Study',
    'email-sequence': 'Email Sequence',
    'proposal': 'Proposal',
    'implementation-timeline': 'Implementation Timeline',
    'mutual-action-plan': 'Mutual Action Plan',
    'linkedin-post': 'LinkedIn Post',
    'conference-leave-behind': 'Conference Leave-Behind',
    'objection-handling-guide': 'Objection Handling Guide',
    'post-demo-follow-up': 'Post Demo Follow Up',
  };

  if (status === 'loading') return null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b px-8 py-5" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-3">
            <HiOutlineArrowPath className="text-2xl" style={{ color: 'var(--accent)' }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Refresh Document</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Upload an old document, update branding and content, output a polished new version</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2 mt-4">
            {[
              { num: 1, label: 'Upload' },
              { num: 2, label: 'Analysis' },
              { num: 3, label: 'Context' },
              { num: 4, label: 'Style' },
              { num: 5, label: 'Output' },
            ].map(s => (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num === 1 || (s.num <= 3 && activeFile?.analysis) || (s.num === 4 && activeFile?.analysis) || (s.num === 5 && activeFile?.refreshedHtml)) {
                    setStep(s.num as 1 | 2 | 3 | 4 | 5);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: step === s.num ? 'var(--accent)' : step > s.num ? 'var(--accent-light)' : 'var(--card-bg)',
                  color: step === s.num ? 'white' : step > s.num ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${step === s.num ? 'var(--accent)' : 'var(--card-border)'}`,
                }}
              >
                {step > s.num ? <HiOutlineCheck className="text-xs" /> : <span>{s.num}</span>}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 max-w-5xl mx-auto">
          {/* Batch file tabs */}
          {files.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {files.map((f, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveFileIndex(i); if (f.status === 'analyzed') setStep(2); else if (f.status === 'done') setStep(5); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: i === activeFileIndex ? 'var(--accent-light)' : 'var(--card-bg)',
                    border: `1px solid ${i === activeFileIndex ? 'var(--accent)' : 'var(--card-border)'}`,
                    color: i === activeFileIndex ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <HiOutlineDocumentText />
                  {f.fileName}
                  {f.status === 'extracting' && <span className="animate-spin">...</span>}
                  {f.status === 'analyzed' && <HiOutlineCheck className="text-green-500" />}
                  {f.status === 'done' && <HiOutlineCheck className="text-green-600" />}
                  {f.status === 'error' && <HiOutlineXMark className="text-red-500" />}
                </button>
              ))}
            </div>
          )}

          {/* ═══ STEP 1: Upload ═══ */}
          {step === 1 && (
            <div>
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all hover:border-solid"
                style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-light)' }}
              >
                <HiOutlineCloudArrowUp className="text-5xl mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Drop your document here
                </p>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  or click to browse. Accepts PDF and DOCX only. Up to 10 files for batch refresh.
                </p>
                <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  Choose File
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              {/* Quick options */}
              <div className="mt-6 rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Quick Options</p>
                <Toggle checked={updateBranding} onChange={setUpdateBranding} label="Update branding — apply current brand colors, fonts, and logo" />
                <Toggle checked={refreshDates} onChange={setRefreshDates} label="Refresh dates — update all dates to today" />
                <Toggle checked={updateProducts} onChange={setUpdateProducts} label="Update product names — replace old names with current product library" />
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Analysis ═══ */}
          {step === 2 && activeFile && (
            <div>
              {/* File info */}
              <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <div className="flex items-center gap-3">
                  <HiOutlineDocumentText className="text-2xl" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activeFile.fileName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatFileSize(activeFile.fileSize)}
                      {activeFile.pageCount > 0 && ` | ${activeFile.pageCount} pages`}
                      {activeFile.analysis && ` | ${activeFile.analysis.wordCount} words`}
                    </p>
                  </div>
                </div>
              </div>

              {activeFile.status === 'extracting' && (
                <div className="text-center py-16">
                  <div className="animate-spin text-3xl mb-4" style={{ color: 'var(--accent)' }}>
                    <HiOutlineArrowPath />
                  </div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Extracting and analyzing...</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reading content, detecting document type, identifying issues</p>
                </div>
              )}

              {activeFile.status === 'error' && (
                <div className="text-center py-16">
                  <HiOutlineXMark className="text-3xl mx-auto mb-4 text-red-500" />
                  <p className="font-medium text-red-600">{activeFile.error || 'Extraction failed'}</p>
                  <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                    Try Again
                  </button>
                </div>
              )}

              {activeFile.analysis && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <HiOutlineSparkles style={{ color: 'var(--accent)' }} /> Analysis Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Document type detected</p>
                        <p className="font-semibold" style={{ color: 'var(--accent)' }}>
                          {CONTENT_TYPE_LABELS[activeFile.analysis.documentType] || activeFile.analysis.documentType}
                        </p>
                      </div>
                      {activeFile.analysis.prospectName && (
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                          <p style={{ color: 'var(--text-muted)' }}>Prospect name found</p>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activeFile.analysis.prospectName}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>{activeFile.analysis.summary}</p>
                  </div>

                  {/* Dates */}
                  {activeFile.analysis.dates.length > 0 && (
                    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <HiOutlineCalendar style={{ color: '#f59e0b' }} />
                        Dates Found — will be updated to today
                      </h4>
                      {activeFile.analysis.dates.map((d, i) => (
                        <Toggle
                          key={i}
                          checked={fixToggles[`date-${i}`] ?? true}
                          onChange={v => setFixToggles(p => ({ ...p, [`date-${i}`]: v }))}
                          label={`${d.original} — ${d.context}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Outdated Products */}
                  {activeFile.analysis.outdatedProducts.length > 0 && (
                    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <HiOutlineCube style={{ color: '#3b82f6' }} />
                        Outdated Product Names — {activeFile.analysis.outdatedProducts.length} found
                      </h4>
                      {activeFile.analysis.outdatedProducts.map((p, i) => (
                        <Toggle
                          key={i}
                          checked={fixToggles[`product-${i}`] ?? true}
                          onChange={v => setFixToggles(prev => ({ ...prev, [`product-${i}`]: v }))}
                          label={`"${p.found}" → "${p.current}" — ${p.context}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Brand Voice Issues */}
                  {activeFile.analysis.brandVoiceIssues.length > 0 && (
                    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <HiOutlineShieldCheck style={{ color: '#ef4444' }} />
                        Brand Voice Issues — {activeFile.analysis.brandVoiceIssues.length} found
                      </h4>
                      {activeFile.analysis.brandVoiceIssues.map((b, i) => (
                        <Toggle
                          key={i}
                          checked={fixToggles[`brand-${i}`] ?? true}
                          onChange={v => setFixToggles(prev => ({ ...prev, [`brand-${i}`]: v }))}
                          label={`Uses "${b.term}" — ${b.issue}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Competitor Mentions */}
                  {activeFile.analysis.competitorMentions.length > 0 && (
                    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <HiOutlineChatBubbleLeftRight style={{ color: '#8b5cf6' }} />
                        Competitor Mentions
                      </h4>
                      {activeFile.analysis.competitorMentions.map((c, i) => (
                        <Toggle
                          key={i}
                          checked={fixToggles[`competitor-${i}`] ?? true}
                          onChange={v => setFixToggles(prev => ({ ...prev, [`competitor-${i}`]: v }))}
                          label={`${c.name} mentioned — ${c.hasCurrentIntel ? 'current intel available' : 'no recent intel'}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                      Back
                    </button>
                    <button onClick={() => setStep(3)} className="px-6 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                      Next: Add Context
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 3: Context ═══ */}
          {step === 3 && activeFile?.analysis && (
            <div>
              <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Anything you want to add or change?</h3>
                <textarea
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg p-3 text-sm resize-none"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                  placeholder="Add new proof points, update pricing, mention a recent customer win, note any changes since this document was created..."
                />
              </div>

              {/* Smart Suggestions */}
              {activeFile.analysis.smartSuggestions && activeFile.analysis.smartSuggestions.length > 0 && (
                <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <HiOutlineSparkles style={{ color: 'var(--accent)' }} /> Smart Suggestions
                  </h4>
                  <div className="space-y-3">
                    {activeFile.analysis.smartSuggestions.map(s => (
                      <div key={s.id} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <p className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{s.text}</p>
                        <button
                          onClick={() => addSuggestion(s)}
                          disabled={addedSuggestions.has(s.id)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            backgroundColor: addedSuggestions.has(s.id) ? 'var(--card-border)' : 'var(--accent)',
                            color: addedSuggestions.has(s.id) ? 'var(--text-muted)' : 'white',
                          }}
                        >
                          {addedSuggestions.has(s.id) ? 'Added' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                  Back
                </button>
                <button onClick={() => setStep(4)} className="px-6 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  Next: Choose Style
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Style ═══ */}
          {step === 4 && activeFile?.analysis && (
            <div>
              <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Choose Output Style</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  We pre-selected the best template for your {CONTENT_TYPE_LABELS[activeFile.analysis.documentType] || 'document'}.
                  Click below to change it.
                </p>
                <button
                  onClick={() => setStylePickerOpen(true)}
                  className="w-full py-4 rounded-xl text-sm font-medium transition-all hover:shadow-lg"
                  style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)', color: 'var(--accent)' }}
                >
                  {selectedStyleId ? `Selected: ${selectedStyleId.replace(/-/g, ' ').replace('style ', 'Style ')}` : 'Choose Template'}
                  <span className="ml-2">Change Template</span>
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                  Back
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={generating}
                  className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg"
                  style={{ backgroundColor: 'var(--accent)', color: 'white', opacity: generating ? 0.6 : 1 }}
                >
                  {generating ? 'Refreshing...' : 'Refresh This Document'}
                </button>
              </div>

              <StylePickerModal
                isOpen={stylePickerOpen}
                onClose={() => setStylePickerOpen(false)}
                onSelect={id => { setSelectedStyleId(id); setStylePickerOpen(false); }}
                contentType={activeFile.analysis.documentType}
              />
            </div>
          )}

          {/* ═══ STEP 5: Output ═══ */}
          {step === 5 && (
            <div>
              {generating && (
                <div className="text-center py-16">
                  <div className="animate-spin text-3xl mb-4" style={{ color: 'var(--accent)' }}>
                    <HiOutlineArrowPath />
                  </div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Regenerating your document...</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Applying all updates and generating a fresh version</p>
                </div>
              )}

              {activeFile?.refreshedHtml && !generating && (
                <div>
                  {/* Action bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: showComparison ? 'var(--accent)' : 'var(--card-bg)', color: showComparison ? 'white' : 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
                      >
                        <HiOutlineEye /> {showComparison ? 'Hide Original' : 'Compare with Original'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveToLibrary} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                        <HiOutlinePlusCircle /> Save to Library
                      </button>
                      <button onClick={exportPDF} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                        <HiOutlineArrowDownTray /> Export PDF
                      </button>
                    </div>
                  </div>

                  {/* Comparison / Preview */}
                  <div className={`grid gap-4 ${showComparison ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {showComparison && (
                      <div>
                        <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Original Content</p>
                        <div
                          className="rounded-xl p-5 text-xs overflow-auto"
                          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', maxHeight: '70vh', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}
                        >
                          {activeFile.extractedText.slice(0, 5000)}
                          {activeFile.extractedText.length > 5000 && '\n\n... [truncated]'}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                        Refreshed Document
                      </p>
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{ border: '1px solid var(--card-border)', maxHeight: '70vh', overflow: 'auto' }}
                      >
                        <iframe
                          srcDoc={activeFile.refreshedHtml}
                          className="w-full border-0"
                          style={{ minHeight: '600px', height: '70vh' }}
                          title="Refreshed document preview"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Refresh another */}
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => { setFiles([]); setStep(1); setActiveFileIndex(0); setAdditionalContext(''); setAddedSuggestions(new Set()); }}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
                    >
                      Refresh Another Document
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
