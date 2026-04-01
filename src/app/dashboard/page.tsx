'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  HistoryItem,
  LibraryItem,
  CONTENT_TYPE_LABELS,
  ContentType,
  ExpirationStatus,
  GeneratedSection,
  ProspectInfo,
  CONTENT_CATEGORIES,
  ContentCategory,
  BrandComplianceResult,
  ProductProfile,
} from '@/lib/types';
import { detectContentType } from '@/lib/brandDefaults';
import { useKBCompletion } from '@/hooks/useKBCompletion';
import {
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineDocumentDuplicate,
  HiOutlineClock,
  HiOutlineClipboard,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineCube,
} from 'react-icons/hi2';

interface DashboardData {
  stats: {
    totalThisMonth: number;
    totalAllTime: number;
    mostUsedType: { type: string; count: number } | null;
    topProspect: { name: string; count: number } | null;
  };
  recentHistory: HistoryItem[];
  expiringHistory: (HistoryItem & { expirationStatus: ExpirationStatus })[];
  expiringLibrary: (LibraryItem & { expirationStatus: ExpirationStatus })[];
}

const STARTER_PROMPTS = [
  { label: 'Battle card vs [competitor]', contentType: 'battle-card' as ContentType, text: 'Battle card vs [competitor] for a manufacturer' },
  { label: 'Cold email for logistics', contentType: 'outbound-email-sequence' as ContentType, text: 'Cold email sequence for a new logistics prospect' },
  { label: 'One-pager for exec', contentType: 'solution-one-pager' as ContentType, text: 'One-pager for an executive who hasn\'t heard of us' },
  { label: 'Competitive analysis', contentType: 'competitive-analysis' as ContentType, text: 'Competitive analysis against [competitor]' },
  { label: 'Conference leave-behind', contentType: 'conference-leave-behind' as ContentType, text: 'Conference leave-behind for [event name]' },
  { label: 'Executive summary', contentType: 'executive-summary' as ContentType, text: 'Executive summary for a deal going to committee' },
  { label: 'Discovery call prep', contentType: 'discovery-call-prep' as ContentType, text: 'Discovery call prep for [prospect]' },
  { label: 'ROI business case', contentType: 'roi-business-case' as ContentType, text: 'ROI business case for [prospect]' },
  { label: 'LinkedIn post', contentType: 'linkedin-post' as ContentType, text: 'LinkedIn post about [topic]' },
  { label: 'Post-demo follow up', contentType: 'post-demo-followup' as ContentType, text: 'Post-demo follow up for [prospect]' },
  { label: 'Champion enablement kit', contentType: 'champion-enablement-kit' as ContentType, text: 'Champion enablement kit' },
  { label: 'Objection handling guide', contentType: 'objection-handling-guide' as ContentType, text: 'Objection handling guide' },
];

const CATEGORY_CHIPS: { key: ContentCategory; label: string }[] = [
  { key: 'prospect-documents', label: 'Prospect Docs' },
  { key: 'internal-sales', label: 'Internal Sales' },
  { key: 'email-outreach', label: 'Email' },
  { key: 'marketing-support', label: 'Marketing' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{name:string;generations:number;avgScore:number|null}[]>([]);
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const kbCompletion = useKBCompletion();

  // ── Inline prompt engine state ──
  const [promptText, setPromptText] = useState('');
  const [contentType, setContentType] = useState<ContentType>('competitive-analysis');
  const [prospectName, setProspectName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [rawStream, setRawStream] = useState('');
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [showResult, setShowResult] = useState(false);
  const streamRef = useRef('');
  const resultRef = useRef<HTMLDivElement>(null);

  // ── Auto-detect state ──
  const [detectedType, setDetectedType] = useState<ContentType | null>(null);

  // ── Category picker state ──
  const [openCategory, setOpenCategory] = useState<ContentCategory | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // ── Brand compliance state ──
  const [brandCompliance, setBrandCompliance] = useState<BrandComplianceResult | null>(null);
  const [showViolations, setShowViolations] = useState(false);
  const [checkingBrand, setCheckingBrand] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadDashboard = useCallback(async () => {
    const res = await fetch('/api/dashboard');
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadDashboard();
      fetch('/api/products')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setProducts(data))
        .catch(() => setProducts([]));
      fetch('/api/leaderboard').then(r => r.ok ? r.json() : []).then(setLeaderboard).catch(() => {});
    }
  }, [status, loadDashboard]);

  // ── Auto-detect content type from prompt text ──
  useEffect(() => {
    if (!promptText.trim()) {
      setDetectedType(null);
      return;
    }
    const detected = detectContentType(promptText);
    if (detected) {
      setDetectedType(detected);
      setContentType(detected);
    } else {
      setDetectedType(null);
    }
  }, [promptText]);

  // ── Close category dropdown on outside click ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Brand compliance check after generation ──
  const runBrandCheck = useCallback(async (generatedSections: GeneratedSection[]) => {
    setCheckingBrand(true);
    setBrandCompliance(null);
    try {
      const kbRes = await fetch('/api/knowledge-base');
      if (!kbRes.ok) {
        setCheckingBrand(false);
        return;
      }
      const kb = await kbRes.json();
      const brandGuidelines = kb.brandGuidelines || null;

      const checkRes = await fetch('/api/brand-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: generatedSections, brandGuidelines }),
      });
      if (checkRes.ok) {
        const result: BrandComplianceResult = await checkRes.json();
        setBrandCompliance(result);
      }
    } catch {
      // Brand check is non-critical; silently fail
    }
    setCheckingBrand(false);
  }, []);

  const parseSections = (text: string): GeneratedSection[] => {
    const sectionRegex = /## SECTION:\s*(.+?)(?=\n)/g;
    const parts = text.split(sectionRegex);
    const result: GeneratedSection[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      result.push({ id: uuidv4(), title: parts[i].trim(), content: (parts[i + 1] || '').trim() });
    }
    if (result.length === 0 && text.trim()) {
      result.push({ id: uuidv4(), title: 'Generated Content', content: text.trim() });
    }
    return result;
  };

  // ── Generate inline ──
  const generateInline = async (overrideType?: ContentType, overrideContext?: string) => {
    const ct = overrideType || contentType;
    const ctx = overrideContext || promptText;
    const pName = prospectName || 'Prospect';

    if (!ctx.trim()) {
      toast.error('Enter a prompt or pick a starter');
      return;
    }

    const prospect: ProspectInfo = {
      companyName: pName,
      industry: '',
      companySize: '',
      techStack: '',
      painPoints: ctx,
    };

    setGenerating(true);
    setSections([]);
    setRawStream('');
    setShowResult(true);
    setBrandCompliance(null);
    setShowViolations(false);
    streamRef.current = '';

    // Scroll to result area
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: ct,
          prospect,
          additionalContext: ctx,
          toneLevel: 50,
          sessionDocuments: [],
        }),
      });

      if (!res.ok) {
        toast.error('Generation failed');
        setGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') break;
            try {
              const parsed = JSON.parse(d);
              if (parsed.text) {
                streamRef.current += parsed.text;
                setRawStream(streamRef.current);
              }
            } catch { /* skip */ }
          }
        }
      }

      const parsed = parseSections(streamRef.current);
      setSections(parsed);

      // Save to history
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          contentType: ct,
          prospect,
          additionalContext: ctx,
          toneLevel: 50,
          sections: parsed,
          generatedAt: new Date().toISOString(),
          generatedBy: session?.user?.name || 'Unknown',
        }),
      });
      loadDashboard(); // refresh stats

      // Run brand compliance check
      if (parsed.length > 0) {
        runBrandCheck(parsed);
      }
    } catch {
      toast.error('Generation failed');
    }
    setGenerating(false);
  };

  const handleStarterClick = (sp: typeof STARTER_PROMPTS[number]) => {
    setContentType(sp.contentType);
    setPromptText(sp.text);
    generateInline(sp.contentType, sp.text);
  };

  const copyResult = () => {
    const text = sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const exportPDF = async () => {
    const prospect: ProspectInfo = {
      companyName: prospectName || 'Prospect',
      industry: '',
      companySize: '',
      techStack: '',
      painPoints: promptText,
    };
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections, contentType, prospect }),
    });
    const html = await res.text();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
  };

  const openInFullEditor = () => {
    const params = new URLSearchParams({
      contentType,
      prospectName: prospectName || 'Prospect',
      context: promptText,
    });
    router.push(`/generate?${params.toString()}`);
  };

  const useAsTemplate = (item: HistoryItem) => {
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

  const needsAttention = data
    ? [...data.expiringHistory.map((h) => ({ ...h, source: 'history' as const })), ...data.expiringLibrary.map((l) => ({ ...l, source: 'library' as const }))]
    : [];

  const complianceDotColor = brandCompliance
    ? brandCompliance.status === 'green' ? 'bg-green-500'
      : brandCompliance.status === 'yellow' ? 'bg-yellow-500'
      : 'bg-red-500'
    : '';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--content-bg)' }}>
        <div className="h-14 border-b px-8 flex items-center justify-between" style={{ backgroundColor: 'var(--content-bg)' }}>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {(() => {
              const h = new Date().getHours();
              const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
              const firstName = session?.user?.name?.split(' ')[0];
              return firstName ? `${greeting}, ${firstName}` : greeting;
            })()}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const types = ['solution-one-pager', 'battle-card', 'executive-summary', 'cold-call-script', 'outbound-email-sequence'] as ContentType[];
                const randomType = types[Math.floor(Math.random() * types.length)];
                const recentProspect = data?.recentHistory?.[0]?.prospect?.companyName || 'Prospect';
                toast.success(`Generating ${CONTENT_TYPE_LABELS[randomType]} for ${recentProspect}`);
                router.push(`/generate?contentType=${randomType}&prospectName=${encodeURIComponent(recentProspect)}&autoGenerate=true`);
              }}
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              Feeling Lucky
            </button>
            <button onClick={() => router.push('/generate')} className="btn-accent text-sm font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5">
              <HiOutlineSparkles /> Generate
            </button>
          </div>
        </div>

        {kbCompletion.percentage < 50 && !bannerDismissed && (
          <div className="mx-8 mt-4 rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Your AI needs more data to generate great content
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Complete your Knowledge Base setup in 5 minutes to unlock better results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/admin')} className="btn-accent px-3 py-1.5 text-sm">
                Quick Setup
              </button>
              <button onClick={() => setBannerDismissed(true)} className="text-sm p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <HiOutlineXMark />
              </button>
            </div>
          </div>
        )}

        <div className="p-8 space-y-6 max-w-6xl">
          {/* ── Prompt Engine ── */}
          <div className="card rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="p-6">
              {/* Accent label */}
              <span className="uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: 'var(--accent)' }}>AI CONTENT ENGINE</span>

              <h2 className="text-xl font-bold mt-2 mb-4" style={{ color: 'var(--text-primary)' }}>What do you need today?</h2>

              {/* Content type pills — horizontal scrollable row */}
              <div ref={categoryRef} className="relative mb-4">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {CATEGORY_CHIPS.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setOpenCategory(openCategory === cat.key ? null : cat.key)}
                      className={`pill text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        CONTENT_CATEGORIES[cat.key].types.includes(contentType)
                          ? 'pill-active font-medium'
                          : ''
                      }`}
                      style={CONTENT_CATEGORIES[cat.key].types.includes(contentType)
                        ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }
                        : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }
                      }
                    >
                      {cat.label}
                      <HiOutlineChevronDown className="text-[10px]" />
                    </button>
                  ))}
                  {/* Selected type pill */}
                  <span className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap shrink-0" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                    {CONTENT_TYPE_LABELS[contentType]}
                  </span>
                </div>

                {/* Category dropdown */}
                {openCategory && (
                  <div className="absolute top-full left-0 mt-1 rounded-lg shadow-xl py-1 z-50 min-w-[240px] max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                      {CONTENT_CATEGORIES[openCategory].label}
                    </div>
                    {CONTENT_CATEGORIES[openCategory].types.map((type) => (
                      <button
                        key={type}
                        onClick={() => { setContentType(type); setOpenCategory(null); }}
                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                          contentType === type
                            ? 'font-medium'
                            : 'hover:bg-gray-50'
                        }`}
                        style={contentType === type ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' } : { color: 'var(--text-primary)' }}
                      >
                        {CONTENT_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Prospect name + prompt input */}
              <div className="flex gap-3 mb-3">
                <input type="text" value={prospectName} onChange={(e) => setProspectName(e.target.value)}
                  placeholder="Prospect name (optional)"
                  className="w-48 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ backgroundColor: 'var(--content-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', focusRingColor: 'var(--accent)' } as React.CSSProperties} />
                <input type="text" value={promptText} onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. 'Battle card for a manufacturing prospect using SAP...'"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !generating) generateInline(); }}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ backgroundColor: 'var(--content-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border)' }} />
              </div>

              {/* Auto-detect indicator */}
              {detectedType && (
                <div className="flex items-center gap-1.5 mb-3">
                  <HiOutlineCheckCircle style={{ color: 'var(--accent)' }} className="text-xs" />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Auto-detected: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{CONTENT_TYPE_LABELS[detectedType]}</span>
                  </span>
                  <button onClick={() => { setDetectedType(null); }}
                    className="text-xs underline ml-1" style={{ color: 'var(--text-secondary)' }}>
                    change
                  </button>
                </div>
              )}
            </div>

            {/* Footer: hint text left, generate button right */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--card-border)' }}>
              <div className="flex gap-1.5 overflow-x-auto flex-1 mr-4 scrollbar-thin">
                {STARTER_PROMPTS.slice(0, 6).map((sp, i) => (
                  <button key={i} onClick={() => handleStarterClick(sp)} disabled={generating}
                    className="pill text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--content-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                    {sp.label}
                  </button>
                ))}
              </div>
              <button onClick={() => generateInline()} disabled={generating}
                className="btn-accent font-medium px-5 py-2.5 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 text-sm shrink-0"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}>
                {generating ? (
                  <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent-light)', borderTopColor: 'var(--text-inverse)' }} /> Generating...</>
                ) : (
                  <><HiOutlineSparkles /> Generate</>
                )}
              </button>
            </div>
          </div>

          {/* ── Inline Generation Result ── */}
          {showResult && (
            <div ref={resultRef} className="card rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--content-bg)' }}>
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-semibold text-gray-700">
                    {CONTENT_TYPE_LABELS[contentType]}
                    {prospectName && <span className="text-gray-400 font-normal ml-1">for {prospectName}</span>}
                  </h3>
                  {generating && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
                      <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', borderTopColor: 'var(--accent)' }} />
                      Generating...
                    </div>
                  )}
                  {/* Brand compliance badge */}
                  {checkingBrand && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 ml-2">
                      <div className="w-3 h-3 border-2 border-gray-300 rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }} />
                      Checking brand...
                    </div>
                  )}
                  {brandCompliance && !checkingBrand && (
                    <button
                      onClick={() => setShowViolations(!showViolations)}
                      className="flex items-center gap-1.5 ml-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                      title={`Brand compliance: ${brandCompliance.score}/100`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${complianceDotColor} inline-block`} />
                      <HiOutlineShieldCheck className="text-sm" />
                      <span className="font-medium">{brandCompliance.score}/100</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sections.length > 0 && (
                    <>
                      <button onClick={exportPDF}
                        className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-sm">
                        <HiOutlineArrowDownTray /> Export PDF
                      </button>
                      <button onClick={copyResult}
                        className="text-xs border rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                        <HiOutlineClipboard /> Copy
                      </button>
                      <button onClick={openInFullEditor}
                        className="text-xs border rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}>
                        <HiOutlineArrowTopRightOnSquare /> Full Editor
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowResult(false); setSections([]); setRawStream(''); setBrandCompliance(null); }}
                    className="text-gray-400 hover:text-gray-600">
                    <HiOutlineXMark />
                  </button>
                </div>
              </div>

              {/* Brand violations expandable panel */}
              {brandCompliance && showViolations && brandCompliance.violations.length > 0 && (
                <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <HiOutlineExclamationTriangle className="text-amber-500 text-sm" />
                    <span className="text-xs font-semibold text-amber-800">
                      {brandCompliance.violations.length} brand violation{brandCompliance.violations.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {brandCompliance.violations.map((v) => (
                      <div key={v.id} className="flex items-start gap-2 text-xs">
                        <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          v.severity === 'violation' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        <div>
                          <span className="font-medium text-gray-700">{v.sectionTitle}:</span>{' '}
                          <span className="text-gray-600">{v.description}</span>
                          {v.suggestedFix && (
                            <span className="ml-1" style={{ color: 'var(--accent)' }}>Fix: {v.suggestedFix}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 max-h-[500px] overflow-y-auto">
                {/* Streaming */}
                {generating && sections.length === 0 && rawStream && (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{rawStream}</div>
                )}
                {generating && !rawStream && (
                  <div className="text-center py-8 text-gray-400 animate-pulse">Generating content...</div>
                )}

                {/* Final sections */}
                {sections.length > 0 && (
                  <div className="space-y-5">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <h4 className="text-sm font-semibold mb-2 pl-3" style={{ color: 'var(--accent)', borderLeft: '2px solid var(--accent)' }}>{section.title}</h4>
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 pl-3">{section.content}</div>
                      </div>
                    ))}
                    <div className="pt-4 border-t flex items-center gap-4">
                      <button onClick={exportPDF}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-5 py-2.5 transition-colors shadow-sm">
                        <HiOutlineArrowDownTray className="text-lg" /> Export PDF
                      </button>
                      <button onClick={openInFullEditor}
                        className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                        <HiOutlineArrowTopRightOnSquare /> Open in full editor to refine, score, and export
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Needs Attention ── */}
          {needsAttention.length > 0 && (
            <div className="card border border-amber-200 rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineExclamationTriangle className="text-amber-500 text-lg" />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Needs Attention</h2>
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{needsAttention.length} items</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {needsAttention.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.expirationStatus === 'expired' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {item.expirationStatus === 'expired' ? 'Outdated' : 'May be outdated'}
                      </span>
                      <span className="text-sm text-gray-700 truncate">{item.prospect.companyName}</span>
                      <span className="text-xs text-gray-400">{CONTENT_TYPE_LABELS[item.contentType]}</span>
                    </div>
                    {'generatedAt' in item && (
                      <button onClick={() => useAsTemplate(item as HistoryItem)}
                        className="text-xs flex items-center gap-1 shrink-0" style={{ color: 'var(--accent)' }}>
                        <HiOutlineArrowPath /> Regenerate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Stats ── */}
          {data && (
            <div className="grid grid-cols-4 gap-4">
              <div className="card-sm rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <span className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>This Month</span>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{data.stats.totalThisMonth}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{data.stats.totalAllTime} all time</p>
              </div>
              <div className="card-sm rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <span className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>Most Used</span>
                <p className="text-lg font-bold truncate mt-1" style={{ color: 'var(--accent)' }}>{data.stats.mostUsedType?.type || '—'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{data.stats.mostUsedType ? `${data.stats.mostUsedType.count} generations` : 'No data yet'}</p>
              </div>
              <div className="card-sm rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <span className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>Top Prospect</span>
                <p className="text-lg font-bold truncate mt-1" style={{ color: 'var(--accent)' }}>{data.stats.topProspect?.name || '—'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{data.stats.topProspect ? `${data.stats.topProspect.count} generations` : 'No data yet'}</p>
              </div>
              <div className="card-sm rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <span className="text-xs uppercase font-medium" style={{ color: 'var(--text-muted)' }}>Needs Attention</span>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{needsAttention.length}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>outdated items</p>
              </div>
            </div>
          )}

          {/* ── Recent History ── */}
          {data && data.recentHistory.length > 0 && (
            <div className="card rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Generations</h2>
                <button onClick={() => router.push('/history')} className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  View all
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                {data.recentHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 px-5 transition-colors hover:bg-gray-50/50">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.prospect.companyName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{CONTENT_TYPE_LABELS[item.contentType]}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>&bull;</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(item.generatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {item.scores && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full text-white ${
                          item.scores.overall >= 8 ? 'bg-green-500' : item.scores.overall >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>{item.scores.overall}/10</span>
                      )}
                      <button onClick={() => router.push('/history')}
                        className="p-1" style={{ color: 'var(--text-muted)' }} title="View">
                        <HiOutlineEye />
                      </button>
                      <button onClick={() => useAsTemplate(item)}
                        className="p-1" style={{ color: 'var(--text-muted)' }} title="Use as template">
                        <HiOutlineDocumentDuplicate />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Leaderboard ── */}
          {role === 'admin' && leaderboard.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>This Week</h2>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rep Activity</span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                {leaderboard.map((rep, i) => (
                  <div key={rep.name} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold w-5 text-center" style={{ color: i === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{rep.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rep.generations} generated</span>
                      {rep.avgScore !== null && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rep.avgScore >= 7 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {rep.avgScore}/10
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Product Activity ── */}
          <div className="card rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HiOutlineCube style={{ color: 'var(--accent)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Product Library</h2>
              </div>
              <button onClick={() => router.push('/products')} className="text-sm" style={{ color: 'var(--accent)' }}>
                View all
              </button>
            </div>
            {products.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">
                  No products yet &mdash;{' '}
                  <button onClick={() => router.push('/products')} className="font-medium" style={{ color: 'var(--accent)' }}>
                    Set up your Product Library
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...products]
                  .sort((a, b) => b.contentGeneratedCount - a.contentGeneratedCount)
                  .slice(0, 3)
                  .map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              product.status === 'active'
                                ? 'bg-green-50 text-green-600'
                                : product.status === 'coming-soon'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {product.status === 'active' ? 'Active' : product.status === 'coming-soon' ? 'Coming Soon' : 'Sunset'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{product.contentGeneratedCount} content generated</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
