'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { INDUSTRY_PACKS, type IndustryPack } from '@/lib/industryPacks';
import { DEMO_COMPANY_CARDS } from '@/lib/demoData';
import Logo from '@/components/Logo';

// ═══════════════════════════════════════════════
// Local storage keys
// ═══════════════════════════════════════════════

const LS_STEP = 'cf-onboarding-step';
const LS_COMPLETE = 'cf-onboarding-complete';
const LS_FORM = 'cf-onboarding-form';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface ScanResult {
  success: boolean;
  companyName: string;
  tagline: string;
  logoBase64: string;
  partial: boolean;
}

interface FormData {
  industryId: string | null;
  companyName: string;
  website: string;
  logoBase64: string;
  tagline: string;
  productDescription: string;
  topCompetitor: string;
}

const EMPTY_FORM: FormData = {
  industryId: null,
  companyName: '',
  website: '',
  logoBase64: '',
  tagline: '',
  productDescription: '',
  topCompetitor: '',
};

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function loadForm(): FormData {
  if (typeof window === 'undefined') return EMPTY_FORM;
  try {
    const raw = localStorage.getItem(LS_FORM);
    if (raw) return { ...EMPTY_FORM, ...JSON.parse(raw) };
  } catch { /* skip */ }
  return EMPTY_FORM;
}

function saveForm(data: FormData) {
  try { localStorage.setItem(LS_FORM, JSON.stringify(data)); } catch { /* skip */ }
}

function loadStep(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LS_STEP);
    if (raw) {
      const n = parseInt(raw, 10);
      if (n >= 0 && n <= 3) return n;
    }
  } catch { /* skip */ }
  return 0;
}

function saveStep(step: number) {
  try { localStorage.setItem(LS_STEP, String(step)); } catch { /* skip */ }
}

function getSelectedPack(id: string | null): IndustryPack | null {
  if (!id) return null;
  return INDUSTRY_PACKS.find((p) => p.id === id) ?? null;
}

async function saveToKB(fields: Record<string, unknown>) {
  try {
    const res = await fetch('/api/knowledge-base');
    const kb = res.ok ? await res.json() : {};
    const merged = { ...kb, ...fields };
    await fetch('/api/knowledge-base', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    });
  } catch { /* never block */ }
}

// ═══════════════════════════════════════════════
// Progress Dots
// ═══════════════════════════════════════════════

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 12 : i < current ? 8 : 8,
            height: i === current ? 12 : i < current ? 8 : 8,
            backgroundColor: i <= current ? 'var(--accent)' : 'var(--card-border)',
            opacity: i < current ? 0.7 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(-1); // -1 = not loaded yet
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [mounted, setMounted] = useState(false);

  // Step 2 scan state
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanDone, setScanDone] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 4 generation state
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generationDone, setGenerationDone] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const generationTriggered = useRef(false);

  // ── Load persisted state on mount ──
  useEffect(() => {
    setForm(loadForm());
    setStep(loadStep());
    setMounted(true);
  }, []);

  // ── Persist form whenever it changes ──
  useEffect(() => {
    if (mounted) saveForm(form);
  }, [form, mounted]);

  // ── Persist step whenever it changes ──
  useEffect(() => {
    if (mounted && step >= 0) saveStep(step);
  }, [step, mounted]);

  // ── Update form helper ──
  const updateForm = useCallback((patch: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Navigation ──
  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, 3)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const skip = useCallback(() => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      localStorage.setItem(LS_COMPLETE, 'true');
      router.push('/dashboard');
    }
  }, [step, router]);

  // ── Keyboard navigation ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step > 0) goBack();
        return;
      }
      if (e.key === 'Enter') {
        // Don't capture enter inside textareas
        if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (step === 0 && form.industryId) goNext();
        if (step === 1 && form.companyName.trim()) handleStep2Next();
        if (step === 2) handleStep3Next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form]);

  // ═══════════════════════════════════════════════
  // Step 1: Industry selection
  // ═══════════════════════════════════════════════

  const selectIndustry = useCallback((pack: IndustryPack) => {
    updateForm({
      industryId: pack.id,
      productDescription: pack.productPlaceholder,
      topCompetitor: pack.competitors[0] ?? '',
    });
    // Save industry to KB
    saveToKB({
      industry: pack.id,
      industryName: pack.name,
      industryPainPoints: pack.painPoints,
    });
  }, [updateForm]);

  const handleStep1Next = useCallback(() => {
    if (form.industryId) goNext();
  }, [form.industryId, goNext]);

  // ═══════════════════════════════════════════════
  // Step 2: Company info + scan
  // ═══════════════════════════════════════════════

  const runScan = useCallback(async () => {
    const url = form.website.trim();
    if (!url) return;

    setScanning(true);
    setScanProgress(0);
    setScanDone(false);
    setScanFailed(false);
    setScanData(null);

    // Fake progress bar animation
    let progress = 0;
    scanTimerRef.current = setInterval(() => {
      progress = Math.min(progress + Math.random() * 12, 90);
      setScanProgress(progress);
    }, 300);

    // Client-side safety timeout of 10 seconds
    const timeoutPromise = new Promise<null>((resolve) => {
      scanTimeoutRef.current = setTimeout(() => resolve(null), 10000);
    });

    const fetchPromise = fetch('/api/website-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.startsWith('http') ? url : `https://${url}` }),
    }).then((r) => r.json() as Promise<ScanResult>).catch(() => null);

    const result = await Promise.race([fetchPromise, timeoutPromise]);

    // Cleanup timers
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    setScanProgress(100);

    if (result && result.success) {
      setScanData(result);
      setScanDone(true);
      // Auto-fill company name if empty
      if (!form.companyName.trim() && result.companyName) {
        updateForm({ companyName: result.companyName, logoBase64: result.logoBase64 || '', tagline: result.tagline || '' });
      } else {
        updateForm({ logoBase64: result.logoBase64 || '', tagline: result.tagline || '' });
      }
    } else {
      setScanFailed(true);
      // Auto-dismiss failure after 3 seconds
      setTimeout(() => setScanFailed(false), 3000);
    }

    setScanning(false);
  }, [form.website, form.companyName, updateForm]);

  const handleStep2Next = useCallback(async () => {
    await saveToKB({
      companyName: form.companyName,
      website: form.website,
      logoPath: form.logoBase64,
      tagline: form.tagline,
    });
    goNext();
  }, [form, goNext]);

  // ═══════════════════════════════════════════════
  // Step 3: Product description + competitor
  // ═══════════════════════════════════════════════

  const handleStep3Next = useCallback(async () => {
    const pack = getSelectedPack(form.industryId);
    await saveToKB({
      aboutUs: form.productDescription,
      products: form.productDescription.trim()
        ? [{ id: '1', name: 'Main Product', description: form.productDescription.trim(), keyFeatures: [], pricing: '' }]
        : [],
      competitors: form.topCompetitor.trim()
        ? [{ id: '1', name: form.topCompetitor.trim(), howWeBeatThem: '' }]
        : pack?.competitors.map((c, i) => ({ id: String(i + 1), name: c, howWeBeatThem: '' })) ?? [],
    });
    goNext();
  }, [form, goNext]);

  // ═══════════════════════════════════════════════
  // Step 4: Generate document via SSE streaming
  // ═══════════════════════════════════════════════

  const selectedPack = getSelectedPack(form.industryId);
  const hasEnoughData = form.companyName.trim() && form.productDescription.trim();

  const triggerGeneration = useCallback(async () => {
    if (generationTriggered.current) return;
    generationTriggered.current = true;

    if (!hasEnoughData || !selectedPack) {
      setGenerationError(true);
      return;
    }

    setGenerating(true);
    setGeneratedContent('');
    setGenerationDone(false);
    setGenerationError(false);

    // The USER's company is the seller — use their real data from Steps 2-3
    // The sample prospect is a fictional target customer to pitch TO
    const sampleProspect = selectedPack.sampleProspect;
    const prospect = {
      companyName: sampleProspect.name,
      industry: selectedPack.name,
      companySize: sampleProspect.size,
      techStack: '',
      painPoints: '',
    };

    const additionalContext = `IMPORTANT CONTEXT — The company creating this content is "${form.companyName}"${form.tagline ? ` — "${form.tagline}"` : ''}${form.website ? ` (${form.website})` : ''}.
They sell: ${form.productDescription}

Generate an impressive, specific, visually rich one-pager FROM ${form.companyName} TO the prospect "${sampleProspect.name}" (${sampleProspect.description}).
The document should be branded as coming from ${form.companyName}, pitching their solution to ${sampleProspect.name}.
Make it punchy, specific, and genuinely useful. Lead with a striking headline addressing ${sampleProspect.name}'s challenges. Include 3 stat callout boxes with real industry metrics. End with a clear CTA to contact ${form.companyName}.
This document should make the user think: I could send this right now.`;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'solution-one-pager',
          prospect,
          additionalContext,
          toneLevel: 50,
          sessionDocuments: [],
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[onboarding] Generate failed:', res.status, errText);
        setGenerationError(true);
        setGenerating(false);
        return;
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        // SSE streaming
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    fullText += parsed.text;
                    setGeneratedContent(fullText);
                  } else if (parsed.error) {
                    console.error('[onboarding] Stream error:', parsed.error);
                    setGenerationError(true);
                  }
                } catch { /* skip */ }
              }
            }
          }
        }
        if (!fullText) {
          console.error('[onboarding] Stream completed but no content received');
          setGenerationError(true);
        }
      } else {
        // JSON response (visual mode)
        const json = await res.json();
        if (json.visual && json.sections) {
          const text = json.sections.map((s: { title: string; content: string }) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
          setGeneratedContent(text);
        } else if (json.error) {
          setGenerationError(true);
        }
      }
    } catch {
      setGenerationError(true);
    }

    setGenerating(false);
    setGenerationDone(true);
  }, [hasEnoughData, selectedPack, form.productDescription]);

  // Auto-trigger generation when step 4 mounts
  useEffect(() => {
    if (step === 3 && !generationTriggered.current) {
      triggerGeneration();
    }
  }, [step, triggerGeneration]);

  // Reset generation state when navigating back from step 4
  useEffect(() => {
    if (step !== 3) {
      generationTriggered.current = false;
      setGenerating(false);
      setGeneratedContent('');
      setGenerationDone(false);
      setGenerationError(false);
    }
  }, [step]);

  const finishOnboarding = useCallback(() => {
    localStorage.setItem(LS_COMPLETE, 'true');
    router.push('/dashboard');
  }, [router]);

  const exportPdf = useCallback(async () => {
    if (!generatedContent) return;
    try {
      // Parse the flat generated text into sections for the PDF API
      const rawSections = generatedContent.split(/\n---\n/).filter(Boolean);
      const sections = rawSections.map((block, i) => {
        const lines = block.trim().split('\n');
        // Extract heading from first line (## Title or # Title)
        let title = `Section ${i + 1}`;
        let contentLines = lines;
        if (lines[0] && /^#{1,4}\s+/.test(lines[0])) {
          title = lines[0].replace(/^#{1,4}\s+/, '').trim();
          contentLines = lines.slice(1);
        }
        return {
          id: String(i),
          title,
          content: contentLines.join('\n').trim(),
        };
      });

      // If no sections parsed, wrap entire content as one section
      if (sections.length === 0) {
        sections.push({ id: '0', title: 'One-Pager', content: generatedContent });
      }

      const selectedPack = form.industryId
        ? INDUSTRY_PACKS.find(p => p.id === form.industryId)
        : null;

      const prospect = {
        companyName: selectedPack?.sampleProspect?.name || 'Sample Prospect',
        industry: selectedPack?.name || 'General',
        companySize: selectedPack?.sampleProspect?.size || '',
        techStack: '',
        painPoints: '',
      };

      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
          contentType: 'solution-one-pager',
          prospect,
        }),
      });

      if (res.ok) {
        // The PDF API returns HTML — open in a new window for print
        const html = await res.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          // Auto-trigger print dialog after a brief delay for rendering
          setTimeout(() => printWindow.print(), 500);
        }
      }
    } catch { /* skip */ }
  }, [generatedContent, form.industryId]);

  const loadDemoData = useCallback(async () => {
    const cards = DEMO_COMPANY_CARDS;
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    try {
      await fetch('/api/demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: randomCard.id }),
      });
    } catch { /* skip */ }
    localStorage.setItem(LS_COMPLETE, 'true');
    router.push('/dashboard');
  }, [router]);

  // ═══════════════════════════════════════════════
  // Don't render until state is loaded from localStorage
  // ═══════════════════════════════════════════════

  if (!mounted || step < 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--card-border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════

  const isWide = step === 0 || step === 3;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--content-bg)' }}>
      <div className={`w-full ${isWide ? 'max-w-2xl' : 'max-w-lg'}`}>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size={48} showText={true} />
        </div>

        {/* Top bar: back + progress + skip */}
        <div className="flex items-center justify-between mb-2">
          {/* Back button */}
          <div className="w-16">
            {step > 0 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 12L6 8L10 4" />
                </svg>
                Back
              </button>
            )}
          </div>

          {/* Progress dots */}
          <ProgressDots current={step} />

          {/* Skip button */}
          <div className="w-16 flex justify-end">
            <button
              onClick={skip}
              className="text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Skip
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* STEP 1 — Industry Selection            */}
        {/* ═══════════════════════════════════════ */}
        {step === 0 && (
          <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                What industry are you in?
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We&apos;ll customize everything for your vertical
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {INDUSTRY_PACKS.map((pack) => {
                const isSelected = form.industryId === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => selectIndustry(pack)}
                    className="relative text-left rounded-xl p-4 transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: isSelected ? '2px solid var(--accent)' : '2px solid var(--card-border)',
                      boxShadow: isSelected ? '0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--text-muted)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--card-border)';
                    }}
                  >
                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6L5 9L10 3" />
                        </svg>
                      </div>
                    )}
                    <div className="text-3xl mb-2" style={{ fontSize: 32 }}>{pack.icon}</div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {pack.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {pack.promptTemplates.length} templates
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleStep1Next}
              disabled={!form.industryId}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{
                backgroundColor: form.industryId ? 'var(--accent)' : 'var(--card-border)',
                cursor: form.industryId ? 'pointer' : 'not-allowed',
                opacity: form.industryId ? 1 : 0.5,
              }}
            >
              Next
            </button>

            <button
              onClick={skip}
              className="w-full text-center text-sm mt-3 py-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Skip &mdash; I&apos;ll set this up later
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STEP 2 — Company Info                  */}
        {/* ═══════════════════════════════════════ */}
        {step === 1 && (
          <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Tell us about your company
              </h1>
            </div>

            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => updateForm({ companyName: e.target.value })}
                  placeholder="Your Company Inc."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--content-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--card-border)')}
                  autoFocus
                />
              </div>

              {/* Website URL + Scan */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Website URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => updateForm({ website: e.target.value })}
                    placeholder="yourcompany.com"
                    className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--content-bg)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--card-border)')}
                  />
                  <button
                    onClick={runScan}
                    disabled={scanning || !form.website.trim()}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 whitespace-nowrap"
                    style={{
                      backgroundColor: scanning || !form.website.trim() ? 'var(--card-border)' : 'var(--accent)',
                      cursor: scanning || !form.website.trim() ? 'not-allowed' : 'pointer',
                      opacity: scanning || !form.website.trim() ? 0.5 : 1,
                    }}
                  >
                    {scanning ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
              </div>

              {/* Scan progress bar */}
              {scanning && (
                <div className="space-y-2">
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${scanProgress}%`,
                        backgroundColor: 'var(--accent)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Scanning homepage...
                  </p>
                </div>
              )}

              {/* Scan success preview card */}
              {scanDone && scanData && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--content-bg)', border: '1px solid var(--card-border)' }}
                >
                  {scanData.logoBase64 && (
                    <img
                      src={scanData.logoBase64}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-contain"
                      style={{ backgroundColor: 'var(--card-bg)' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {scanData.companyName || form.companyName || 'Your company'}
                    </div>
                    {scanData.tagline && (
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {scanData.tagline}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--accent)' }}>
                    Looks right &#10003;
                  </span>
                </div>
              )}

              {/* Scan failure message */}
              {scanFailed && (
                <p className="text-xs text-center py-1" style={{ color: 'var(--text-muted)' }}>
                  No problem &mdash; we&apos;ll use what you&apos;ve entered
                </p>
              )}
            </div>

            <button
              onClick={handleStep2Next}
              disabled={!form.companyName.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-6 transition-all duration-200"
              style={{
                backgroundColor: form.companyName.trim() ? 'var(--accent)' : 'var(--card-border)',
                cursor: form.companyName.trim() ? 'pointer' : 'not-allowed',
                opacity: form.companyName.trim() ? 1 : 0.5,
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STEP 3 — What do you sell?             */}
        {/* ═══════════════════════════════════════ */}
        {step === 2 && (
          <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                What do you sell?
              </h1>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Describe what you sell in 2-3 sentences. What problem do you solve?
                </label>
                <textarea
                  value={form.productDescription}
                  onChange={(e) => updateForm({ productDescription: e.target.value })}
                  placeholder={selectedPack?.productPlaceholder ?? 'We sell...'}
                  rows={5}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-colors"
                  style={{
                    backgroundColor: 'var(--content-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--card-border)')}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Your top competitor (optional)
                </label>
                <input
                  type="text"
                  value={form.topCompetitor}
                  onChange={(e) => updateForm({ topCompetitor: e.target.value })}
                  placeholder={selectedPack?.competitors[0] ?? 'e.g. Competitor Inc.'}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--content-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--card-border)')}
                />
              </div>
            </div>

            <button
              onClick={handleStep3Next}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-6 transition-all duration-200"
              style={{ backgroundColor: 'var(--accent)', cursor: 'pointer' }}
            >
              Next
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STEP 4 — See it in action              */}
        {/* ═══════════════════════════════════════ */}
        {step === 3 && (
          <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Watch ContentForg create your first document
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Using everything you just told us
              </p>
            </div>

            {/* Document preview area */}
            <div
              className="rounded-xl p-5 mb-6 min-h-[300px] overflow-y-auto"
              style={{
                backgroundColor: 'var(--content-bg)',
                border: '1px solid var(--card-border)',
                maxHeight: 420,
              }}
            >
              {/* Not enough data: show placeholder */}
              {generationError && !hasEnoughData && (
                <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center">
                  <div className="text-3xl mb-3">&#128221;</div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Complete the previous steps to generate a real document
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    We need your company name and product description to create something personalized.
                  </p>
                </div>
              )}

              {/* Generation error with data */}
              {generationError && hasEnoughData && (
                <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center">
                  <div className="text-3xl mb-3">&#9888;&#65039;</div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Generation encountered an issue
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    No worries &mdash; you can generate documents from the dashboard.
                  </p>
                </div>
              )}

              {/* Generating spinner */}
              {generating && !generatedContent && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <span
                    className="inline-block w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Generating your first document...
                  </span>
                </div>
              )}

              {/* Streaming / completed content */}
              {generatedContent && (
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {generatedContent.split('\n').map((line, i) => {
                    if (!line.trim()) return <br key={i} />;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-4 mb-1" style={{ color: 'var(--text-primary)' }}>{line.replace(/^###\s*/, '')}</h3>;
                    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-1" style={{ color: 'var(--text-primary)' }}>{line.replace(/^##\s*/, '')}</h2>;
                    if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{line.replace(/^#\s*/, '')}</h1>;
                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-sm mb-0.5" style={{ color: 'var(--text-secondary)' }}>{line.replace(/^[-*]\s*/, '')}</li>;
                    if (line.startsWith('---')) return <hr key={i} className="my-3" style={{ borderColor: 'var(--card-border)' }} />;
                    if (line.match(/^\*\*.*\*\*$/)) return <p key={i} className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</p>;
                    return <p key={i} className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{line}</p>;
                  })}
                  {generating && (
                    <span className="inline-block w-1 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {generationDone && generatedContent && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={finishOnboarding}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={exportPdf}
                    className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--content-bg)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            )}

            {/* If error or not enough data, still show go to dashboard */}
            {generationError && (
              <button
                onClick={finishOnboarding}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Go to Dashboard
              </button>
            )}

            {/* Demo data link */}
            <button
              onClick={loadDemoData}
              className="w-full text-center text-sm mt-4 py-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Or try with demo data &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
