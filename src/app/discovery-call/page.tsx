'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import {
  HiOutlinePhone,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineEnvelope,
  HiOutlineClipboard,
  HiOutlineShieldCheck,
  HiOutlineCalendarDays,
  HiOutlineArrowPath,
  HiOutlineCloudArrowUp,
  HiOutlineMicrophone,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineDocumentArrowUp,
  HiOutlineBolt,
  HiOutlineListBullet,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
} from 'react-icons/hi2';

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface SourcedInsight {
  content: string;
  source?: string;
}

interface Stakeholder {
  name: string;
  role: string;
  source?: string;
}

interface AnalysisResult {
  prospectName: string;
  date: string;
  painPoints: SourcedInsight[];
  currentState: SourcedInsight[];
  desiredState: SourcedInsight[];
  timeline: SourcedInsight[];
  budgetSignals: SourcedInsight[];
  decisionProcess: SourcedInsight[];
  competitorsMentioned: SourcedInsight[];
  objectionsRaised: SourcedInsight[];
  buyingSignals: SourcedInsight[];
  stakeholders: Stakeholder[];
  nextSteps: SourcedInsight[];
}

interface HistoryEntry {
  id: string;
  prospectName: string;
  date: string;
  status: 'completed' | 'processing' | 'failed';
}

// ═══════════════════════════════════════════════════════════════════════
// Section config
// ═══════════════════════════════════════════════════════════════════════

interface SectionConfig {
  key: keyof AnalysisResult;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionConfig[] = [
  { key: 'painPoints', label: 'Pain Points', icon: <HiOutlineExclamationTriangle className="text-base" /> },
  { key: 'currentState', label: 'Current State', icon: <HiOutlineClipboard className="text-base" /> },
  { key: 'desiredState', label: 'Desired State', icon: <HiOutlineSparkles className="text-base" /> },
  { key: 'timeline', label: 'Timeline', icon: <HiOutlineClock className="text-base" /> },
  { key: 'budgetSignals', label: 'Budget Signals', icon: <HiOutlineDocumentText className="text-base" /> },
  { key: 'decisionProcess', label: 'Decision Process', icon: <HiOutlineShieldCheck className="text-base" /> },
  { key: 'competitorsMentioned', label: 'Competitors Mentioned', icon: <HiOutlineArrowPath className="text-base" /> },
  { key: 'objectionsRaised', label: 'Objections Raised', icon: <HiOutlineXMark className="text-base" /> },
  { key: 'buyingSignals', label: 'Buying Signals', icon: <HiOutlineCheckCircle className="text-base" /> },
  { key: 'stakeholders', label: 'Stakeholders Identified', icon: <HiOutlineUserGroup className="text-base" /> },
  { key: 'nextSteps', label: 'Next Steps', icon: <HiOutlineListBullet className="text-base" /> },
];

// ═══════════════════════════════════════════════════════════════════════
// Mock analysis result (used when API is unavailable)
// ═══════════════════════════════════════════════════════════════════════

function buildMockAnalysis(prospectName: string): AnalysisResult {
  return {
    prospectName,
    date: new Date().toISOString(),
    painPoints: [
      {
        content: 'Sales reps spend over 4 hours per week manually creating proposals and leave-behinds, reducing selling time.',
        source: '"We lose almost half a day every week just putting together decks for prospects."',
      },
      {
        content: 'No standardized messaging across the team, leading to inconsistent prospect experiences.',
        source: '"Every rep kind of does their own thing with the pitch materials."',
      },
    ],
    currentState: [
      {
        content: 'Using a mix of Google Slides templates and Word docs. Marketing provides base templates quarterly but reps customize heavily.',
        source: '"Marketing gives us templates but they are always outdated by the time we use them."',
      },
    ],
    desiredState: [
      {
        content: 'Wants a centralized system where reps can generate on-brand, personalized content in minutes instead of hours.',
        source: '"If we could just plug in the prospect details and get a polished one-pager, that would be a game changer."',
      },
    ],
    timeline: [
      {
        content: 'Looking to have a solution in place before Q3 pipeline push. Evaluation window is 4-6 weeks.',
        source: '"We need this sorted before our big Q3 campaign kicks off in July."',
      },
    ],
    budgetSignals: [
      {
        content: 'Has discretionary budget for sales tools. Current spend on content-adjacent tools is around $2,000/month.',
        source: '"We already pay for a couple tools in this space so the budget conversation should not be hard."',
      },
    ],
    decisionProcess: [
      {
        content: 'VP of Sales is the final decision maker. Needs buy-in from Marketing lead for brand compliance. Procurement not involved under $50K ARR.',
        source: '"My VP signs off on tools, but she will want marketing to confirm it keeps us on brand."',
      },
    ],
    competitorsMentioned: [
      {
        content: 'Evaluated Seismic last year but found it too complex for their team size. Also looked at Highspot briefly.',
        source: '"We tried Seismic and it was way overkill for a 30-person sales team."',
      },
    ],
    objectionsRaised: [
      {
        content: 'Concerned about AI-generated content quality and whether it will truly match their brand voice.',
        source: '"My worry is it will sound robotic or generic. Our brand is pretty specific."',
      },
    ],
    buyingSignals: [
      {
        content: 'Asked about implementation timeline and onboarding process, indicating readiness to move forward.',
        source: '"How quickly could we get the team up and running if we decided to go with you?"',
      },
      {
        content: 'Mentioned sharing the tool with their CEO during the next leadership meeting.',
        source: '"I want to show this to our CEO at the all-hands next Thursday."',
      },
    ],
    stakeholders: [
      { name: 'Sarah Chen', role: 'Director of Sales Enablement (Primary Contact)', source: '"I own the sales tools budget and the enablement roadmap."' },
      { name: 'Marcus Johnson', role: 'VP of Sales (Decision Maker)' },
      { name: 'Lisa Park', role: 'Head of Brand Marketing (Influencer)' },
    ],
    nextSteps: [
      {
        content: 'Send a personalized one-pager and ROI summary by end of week.',
        source: '"If you can send me something I can forward to Marcus, that would really help."',
      },
      {
        content: 'Schedule a 30-minute demo with Sarah and Marcus for the following Tuesday.',
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Content generation action cards
// ═══════════════════════════════════════════════════════════════════════

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiresCompetitor?: boolean;
  contextBuilder: (analysis: AnalysisResult) => string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    id: 'follow-up-email',
    title: 'Generate Follow-Up Email',
    description: 'Personalized follow-up referencing their pain points and agreed next steps.',
    icon: <HiOutlineEnvelope className="text-xl" />,
    contextBuilder: (a) =>
      `Write a follow-up email to ${a.prospectName} after a discovery call. Pain points: ${a.painPoints.map((p) => p.content).join('; ')}. Next steps: ${a.nextSteps.map((n) => n.content).join('; ')}. Buying signals: ${a.buyingSignals.map((b) => b.content).join('; ')}.`,
  },
  {
    id: 'one-pager',
    title: 'Generate One-Pager',
    description: 'Tailored solution overview addressing their specific needs and current state.',
    icon: <HiOutlineDocumentText className="text-xl" />,
    contextBuilder: (a) =>
      `Create a solution one-pager for ${a.prospectName}. Their current state: ${a.currentState.map((c) => c.content).join('; ')}. Desired state: ${a.desiredState.map((d) => d.content).join('; ')}. Key pain points: ${a.painPoints.map((p) => p.content).join('; ')}.`,
  },
  {
    id: 'battle-card',
    title: 'Generate Battle Card',
    description: 'Competitive positioning against the vendors they mentioned during the call.',
    icon: <HiOutlineShieldCheck className="text-xl" />,
    requiresCompetitor: true,
    contextBuilder: (a) =>
      `Create a battle card for selling against ${a.competitorsMentioned.map((c) => c.content).join(', ')}. Prospect: ${a.prospectName}. Their objections: ${a.objectionsRaised.map((o) => o.content).join('; ')}. What they did not like about competitors: ${a.competitorsMentioned.map((c) => c.source || '').filter(Boolean).join('; ')}.`,
  },
  {
    id: 'discovery-prep',
    title: 'Generate Discovery Prep',
    description: 'Preparation guide for the next call with suggested questions and talk tracks.',
    icon: <HiOutlineMicrophone className="text-xl" />,
    contextBuilder: (a) =>
      `Prepare a discovery prep guide for the next call with ${a.prospectName}. Open items: ${a.objectionsRaised.map((o) => o.content).join('; ')}. Stakeholders: ${a.stakeholders.map((s) => `${s.name} (${s.role})`).join(', ')}. Decision process: ${a.decisionProcess.map((d) => d.content).join('; ')}.`,
  },
  {
    id: 'mutual-action-plan',
    title: 'Generate Mutual Action Plan',
    description: 'Shared timeline with milestones based on their buying process and deadlines.',
    icon: <HiOutlineCalendarDays className="text-xl" />,
    contextBuilder: (a) =>
      `Create a mutual action plan for ${a.prospectName}. Timeline: ${a.timeline.map((t) => t.content).join('; ')}. Next steps: ${a.nextSteps.map((n) => n.content).join('; ')}. Decision process: ${a.decisionProcess.map((d) => d.content).join('; ')}. Stakeholders: ${a.stakeholders.map((s) => `${s.name} (${s.role})`).join(', ')}.`,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Accepted file types
// ═══════════════════════════════════════════════════════════════════════

const ACCEPTED_EXTENSIONS = '.mp3,.mp4,.wav,.m4a,.txt,.pdf,.docx';
const ACCEPTED_TYPES = [
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/x-wav',
  'video/mp4',
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ['mp3', 'mp4', 'wav', 'm4a', 'txt', 'pdf', 'docx'].includes(ext);
}

// ═══════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════

export default function DiscoveryCallPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // ─── Upload state ──────────────────────────────────────────────────
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedNotes, setPastedNotes] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Processing state ──────────────────────────────────────────────
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // ─── Result state ──────────────────────────────────────────────────
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(SECTIONS.map((s) => s.key)));

  // ─── History state ─────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════════
  // Auth guard
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  // ═══════════════════════════════════════════════════════════════════
  // Fetch history on mount
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    fetchHistory();
  }, [sessionStatus]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/discovery-call/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : data.entries || []);
      }
    } catch {
      // API may not exist yet -- silent
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // File handling
  // ═══════════════════════════════════════════════════════════════════

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!isAcceptedFile(file)) {
      toast.error('Unsupported file type. Please upload MP3, MP4, WAV, M4A, TXT, PDF, or DOCX.');
      return;
    }
    setUploadedFile(file);
    toast.success(`File ready: ${file.name}`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Analyze call
  // ═══════════════════════════════════════════════════════════════════

  const canAnalyze = prospectName.trim() && (uploadedFile || pastedNotes.trim());

  const analyzeCall = useCallback(async () => {
    if (!canAnalyze) return;

    setAnalyzing(true);
    setProgress(0);
    setAnalysis(null);

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('prospectName', prospectName.trim());
      if (uploadedFile) formData.append('file', uploadedFile);
      if (pastedNotes.trim()) formData.append('notes', pastedNotes.trim());

      const res = await fetch('/api/discovery-call/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setProgress(100);
        setTimeout(() => {
          setAnalysis(data.analysis);
          setAnalyzing(false);
          setExpandedSections(new Set(SECTIONS.map((s) => s.key)));
          toast.success('Analysis complete');
        }, 300);
      } else {
        throw new Error('Analysis failed');
      }
    } catch {
      clearInterval(interval);
      // Fallback to mock data so the UI is demonstrable
      setProgress(100);
      setTimeout(() => {
        setAnalysis(buildMockAnalysis(prospectName.trim()));
        setAnalyzing(false);
        setExpandedSections(new Set(SECTIONS.map((s) => s.key)));
        toast.success('Analysis complete (demo mode)');
      }, 300);
    }
  }, [canAnalyze, prospectName, uploadedFile, pastedNotes]);

  // ═══════════════════════════════════════════════════════════════════
  // Section toggle
  // ═══════════════════════════════════════════════════════════════════

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Navigate to generate
  // ═══════════════════════════════════════════════════════════════════

  const navigateToGenerate = useCallback((context: string) => {
    const params = new URLSearchParams({ context });
    router.push(`/generate?${params.toString()}`);
  }, [router]);

  // ═══════════════════════════════════════════════════════════════════
  // Reset
  // ═══════════════════════════════════════════════════════════════════

  const resetForm = useCallback(() => {
    setUploadedFile(null);
    setPastedNotes('');
    setProspectName('');
    setAnalysis(null);
    setProgress(0);
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Render helpers
  // ═══════════════════════════════════════════════════════════════════

  const hasCompetitors = analysis ? analysis.competitorsMentioned.length > 0 : false;

  function renderSourcedInsights(items: SourcedInsight[]) {
    if (!items || items.length === 0) {
      return <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No data extracted for this section.</p>;
    }
    return (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{item.content}</p>
            {item.source && (
              <div
                className="mt-1.5 px-3 py-2 rounded text-xs italic leading-relaxed"
                style={{ backgroundColor: 'color-mix(in srgb, var(--card-border) 40%, transparent)', color: 'var(--text-muted)' }}
              >
                Source: {item.source}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  function renderStakeholders(items: Stakeholder[]) {
    if (!items || items.length === 0) {
      return <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No stakeholders identified.</p>;
    }
    return (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.role}</p>
            {item.source && (
              <div
                className="mt-1.5 px-3 py-2 rounded text-xs italic leading-relaxed"
                style={{ backgroundColor: 'color-mix(in srgb, var(--card-border) 40%, transparent)', color: 'var(--text-muted)' }}
              >
                Source: {item.source}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // Auth loading
  // ═══════════════════════════════════════════════════════════════════

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}>
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // Main render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--content-bg)' }}>

        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="border-b px-8 py-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between max-w-5xl">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <HiOutlinePhone style={{ color: 'var(--accent)' }} />
                Discovery Call Intelligence
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Upload a call recording or paste your notes to extract structured intelligence and generate follow-up content in one click.
              </p>
            </div>
            {analysis && (
              <button
                onClick={resetForm}
                className="text-sm font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-1.5"
                style={{ color: 'var(--accent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
              >
                <HiOutlineArrowPath className="text-base" />
                New Analysis
              </button>
            )}
          </div>
        </div>

        <div className="px-8 py-6 max-w-5xl mx-auto space-y-8">

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Upload / Input Section */}
          {/* ═══════════════════════════════════════════════════════ */}
          {!analysis && !analyzing && (
            <div className="space-y-6">

              {/* Prospect name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Prospect Name <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  placeholder="e.g. Acme Corp - Sarah Chen"
                  className="w-full px-4 py-2.5 rounded-lg text-sm border outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--card-border)')}
                />
              </div>

              {/* Drop zone */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Upload Recording or Document
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className="relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: isDragging ? 'var(--accent)' : 'var(--card-border)',
                    backgroundColor: isDragging ? 'color-mix(in srgb, var(--accent) 5%, var(--card-bg))' : 'var(--card-bg)',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <HiOutlineDocumentArrowUp className="text-2xl" style={{ color: 'var(--accent)' }} />
                      <div className="text-left">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{uploadedFile.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                        className="ml-4 p-1 rounded hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <HiOutlineXMark className="text-lg" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <HiOutlineCloudArrowUp className="text-4xl mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Drop your file here or click to browse
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        MP3, MP4, WAV, M4A, TXT, PDF, DOCX
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--card-border)' }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--card-border)' }} />
              </div>

              {/* Paste notes textarea */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Paste Your Call Notes or Transcript
                </label>
                <textarea
                  value={pastedNotes}
                  onChange={(e) => setPastedNotes(e.target.value)}
                  placeholder="Paste the full transcript, bullet-point notes, or any text from your discovery call..."
                  rows={10}
                  className="w-full px-4 py-3 rounded-lg text-sm border outline-none transition-colors resize-y"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--card-border)')}
                />
              </div>

              {/* Analyze button */}
              <button
                onClick={analyzeCall}
                disabled={!canAnalyze}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: canAnalyze ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 30%, var(--card-bg))',
                  color: canAnalyze ? '#fff' : 'var(--text-muted)',
                  cursor: canAnalyze ? 'pointer' : 'not-allowed',
                }}
              >
                <HiOutlineBolt className="text-base" />
                Analyze Call
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Processing State */}
          {/* ═══════════════════════════════════════════════════════ */}
          {analyzing && (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <HiOutlineSparkles className="text-3xl mx-auto mb-4 animate-pulse" style={{ color: 'var(--accent)' }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Analyzing your discovery call...
              </p>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                Extracting pain points, buying signals, stakeholders, and more.
              </p>
              <div className="w-full max-w-md mx-auto h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--card-border) 60%, transparent)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: 'var(--accent)' }}
                />
              </div>
              <p className="text-xs mt-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {Math.round(Math.min(progress, 100))}%
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Analysis Results */}
          {/* ═══════════════════════════════════════════════════════ */}
          {analysis && (
            <div className="space-y-8">

              {/* Summary header card */}
              <div
                className="rounded-xl border p-6"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Discovery Call Summary
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                    Complete
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {analysis.prospectName} &mdash; {new Date(analysis.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Collapsible sections */}
              <div className="space-y-3">
                {SECTIONS.map((section) => {
                  const isExpanded = expandedSections.has(section.key);
                  const sectionData = analysis[section.key];
                  const isEmpty =
                    !sectionData ||
                    (Array.isArray(sectionData) && sectionData.length === 0);
                  const itemCount = Array.isArray(sectionData) ? sectionData.length : 0;

                  return (
                    <div
                      key={section.key}
                      className="rounded-xl border overflow-hidden transition-colors"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                    >
                      {/* Section header */}
                      <button
                        onClick={() => toggleSection(section.key)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:opacity-90"
                      >
                        <span style={{ color: 'var(--accent)' }}>{section.icon}</span>
                        <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {section.label}
                        </span>
                        {itemCount > 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--card-border) 60%, transparent)', color: 'var(--text-secondary)' }}
                          >
                            {itemCount}
                          </span>
                        )}
                        {isExpanded ? (
                          <HiOutlineChevronDown className="text-sm" style={{ color: 'var(--text-muted)' }} />
                        ) : (
                          <HiOutlineChevronRight className="text-sm" style={{ color: 'var(--text-muted)' }} />
                        )}
                      </button>

                      {/* Section content */}
                      {isExpanded && (
                        <div className="px-5 pb-4 pt-0 border-t" style={{ borderColor: 'var(--card-border)' }}>
                          <div className="pt-3">
                            {section.key === 'stakeholders'
                              ? renderStakeholders(sectionData as Stakeholder[])
                              : renderSourcedInsights(sectionData as SourcedInsight[])}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ═══════════════════════════════════════════════════ */}
              {/* One-Click Content Generation */}
              {/* ═══════════════════════════════════════════════════ */}
              <div>
                <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Generate Content from This Call
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACTION_CARDS.filter((card) => !card.requiresCompetitor || hasCompetitors).map((card) => (
                    <button
                      key={card.id}
                      onClick={() => navigateToGenerate(card.contextBuilder(analysis))}
                      className="rounded-xl border p-4 text-left transition-all hover:shadow-md group"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--card-border)';
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg shrink-0"
                          style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                        >
                          {card.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{card.title}</p>
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{card.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Previous Analyses */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div>
            <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Previous Analyses
            </h3>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              {historyLoading ? (
                <div className="p-6 text-center">
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
                    style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', borderTopColor: 'var(--accent)' }}
                  />
                </div>
              ) : history.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No previous analyses yet. Upload a call recording or paste your notes above to get started.
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:opacity-90 cursor-pointer"
                    >
                      <HiOutlinePhone className="text-base shrink-0" style={{ color: 'var(--accent)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {entry.prospectName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{
                          backgroundColor:
                            entry.status === 'completed'
                              ? 'color-mix(in srgb, #16a34a 15%, transparent)'
                              : entry.status === 'processing'
                              ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                              : 'color-mix(in srgb, #dc2626 15%, transparent)',
                          color:
                            entry.status === 'completed'
                              ? '#16a34a'
                              : entry.status === 'processing'
                              ? 'var(--accent)'
                              : '#dc2626',
                        }}
                      >
                        {entry.status === 'completed' ? 'Completed' : entry.status === 'processing' ? 'Processing' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
