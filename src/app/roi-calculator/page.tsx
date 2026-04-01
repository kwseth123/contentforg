'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  ROIInputs,
  ROIOutputs,
  calculateROI,
  ContentType,
  ProspectInfo,
  GeneratedSection,
  IndustryConfig,
  IndustryMetricLabel,
  KnowledgeBase,
  CaseStudy,
  UploadedDocument,
} from '@/lib/types';
import { INDUSTRY_LIST, DEMO_INDUSTRIES, DEMO_INDUSTRY_DATA } from '@/lib/industryData';
import {
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineClipboard,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineBeaker,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineBolt,
} from 'react-icons/hi2';

// ═══════════════════════════════════════════════
// Formatters
// ═══════════════════════════════════════════════

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const pctFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ═══════════════════════════════════════════════
// Default (generic) labels
// ═══════════════════════════════════════════════

const DEFAULT_LABELS: Record<keyof ROIInputs, IndustryMetricLabel> = {
  employeesAffected: {
    label: 'Number of Employees Affected',
    helper: 'How many employees experience the problem your solution addresses',
  },
  hoursLostPerWeek: {
    label: 'Hours Per Week Lost Per Employee',
    helper: 'Average hours each affected employee loses weekly due to the problem',
  },
  hourlyRate: {
    label: 'Fully Loaded Hourly Cost',
    helper: 'Total cost per hour including salary, benefits, and overhead',
  },
  errorsPerWeek: {
    label: 'Number of Errors Per Week',
    helper: 'Average weekly errors, rework incidents, or quality issues caused by the problem',
  },
  costPerError: {
    label: 'Estimated Cost Per Error',
    helper: 'Average cost of each error including remediation, customer impact, and lost revenue',
  },
  currentMonthlySpend: {
    label: 'Current Monthly Spend on Workarounds',
    helper: 'Monthly cost of existing tools, manual processes, or services used to address the problem',
  },
  solutionMonthlyCost: {
    label: "Your Solution's Monthly Cost",
    helper: 'Monthly subscription or license cost of the proposed solution',
  },
};

const DEFAULT_INPUTS: ROIInputs = {
  employeesAffected: 50,
  hoursLostPerWeek: 5,
  hourlyRate: 35,
  errorsPerWeek: 10,
  costPerError: 500,
  currentMonthlySpend: 5000,
  solutionMonthlyCost: 3000,
};

const CURRENCY_FIELDS: (keyof ROIInputs)[] = [
  'hourlyRate',
  'costPerError',
  'currentMonthlySpend',
  'solutionMonthlyCost',
];

const INPUT_FIELD_ORDER: (keyof ROIInputs)[] = [
  'employeesAffected',
  'hoursLostPerWeek',
  'hourlyRate',
  'errorsPerWeek',
  'costPerError',
  'currentMonthlySpend',
  'solutionMonthlyCost',
];

// ═══════════════════════════════════════════════
// Fuzzy match helper
// ═══════════════════════════════════════════════

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  // Direct substring match
  if (t.includes(q)) return true;
  // Token-based fuzzy: every word in query must match some part of target
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((tok) => t.includes(tok));
}

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  // Exact start gets highest score
  if (t.startsWith(q)) return 3;
  // Word boundary match
  const words = t.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return 2;
  // Substring match
  if (t.includes(q)) return 1;
  return 0;
}

// ═══════════════════════════════════════════════
// localStorage helpers
// ═══════════════════════════════════════════════

function configCacheKey(industry: string) {
  return `roi-config-${industry.toLowerCase().replace(/\s+/g, '-')}`;
}

function getCachedConfig(industry: string): IndustryConfig | null {
  try {
    const raw = localStorage.getItem(configCacheKey(industry));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedConfig(industry: string, config: IndustryConfig) {
  try {
    localStorage.setItem(configCacheKey(industry), JSON.stringify(config));
  } catch { /* quota exceeded */ }
}

function getLastUsedIndustry(): string {
  try {
    return localStorage.getItem('roi-last-industry') || '';
  } catch {
    return '';
  }
}

function setLastUsedIndustry(industry: string) {
  try {
    localStorage.setItem('roi-last-industry', industry);
  } catch { /* skip */ }
}

// ═══════════════════════════════════════════════
// InputField component
// ═══════════════════════════════════════════════

interface InputFieldProps {
  label: string;
  helper: string;
  value: number;
  onChange: (v: number) => void;
  isCurrency?: boolean;
  isBenchmark?: boolean;
}

function InputField({ label, helper, value, onChange, isCurrency, isBenchmark }: InputFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</label>
        {isBenchmark && (
          <span className="inline-flex items-center rounded-full text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
            Industry Benchmark
          </span>
        )}
      </div>
      <div className="relative">
        {isCurrency && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none" style={{ color: 'var(--text-secondary)' }}>$</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={`w-full border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
            isCurrency ? 'pl-7 pr-3' : 'px-3'
          }`}
          style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{helper}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════

function ConfigSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-9 bg-gray-100 rounded-lg" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════

export default function ROICalculatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ── Industry state ──
  const [industrySearch, setIndustrySearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [industryConfig, setIndustryConfig] = useState<IndustryConfig | null>(null);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Pain points ──
  const [checkedPainPoints, setCheckedPainPoints] = useState<Set<number>>(new Set());
  const [painPointsExpanded, setPainPointsExpanded] = useState(true);

  // ── Proof point prompts (from config) ──
  const [enabledProofPoints, setEnabledProofPoints] = useState<Set<number>>(new Set());

  // ── Modified fields tracking (for benchmark badge) ──
  const [modifiedFields, setModifiedFields] = useState<Set<keyof ROIInputs>>(new Set());

  // ── Prospect name ──
  const [prospectName, setProspectName] = useState('');

  // ── ROI Inputs ──
  const [inputs, setInputs] = useState<ROIInputs>({ ...DEFAULT_INPUTS });

  // ── Generation state ──
  const [generating, setGenerating] = useState(false);
  const [rawStream, setRawStream] = useState('');
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [showResult, setShowResult] = useState(false);
  const streamRef = useRef('');
  const resultRef = useRef<HTMLDivElement>(null);

  // ── Knowledge base ──
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // ── Fetch KB once ──
  useEffect(() => {
    fetch('/api/knowledge-base')
      .then((r) => (r.ok ? r.json() : null))
      .then((kb) => { if (kb) setKnowledgeBase(kb); })
      .catch(() => {});
  }, []);

  // ── Load last used industry on mount ──
  useEffect(() => {
    const last = getLastUsedIndustry();
    if (last) {
      loadIndustryConfig(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Fuzzy filtered industries ──
  const filteredIndustries = useMemo(() => {
    if (!industrySearch.trim()) return [];
    return INDUSTRY_LIST
      .filter((ind) => fuzzyMatch(industrySearch, ind))
      .sort((a, b) => fuzzyScore(industrySearch, b) - fuzzyScore(industrySearch, a))
      .slice(0, 15);
  }, [industrySearch]);

  // ── Metric labels (dynamic or default) ──
  const getLabel = useCallback(
    (field: keyof ROIInputs): IndustryMetricLabel => {
      if (industryConfig?.metricLabels?.[field]) {
        return industryConfig.metricLabels[field];
      }
      return DEFAULT_LABELS[field];
    },
    [industryConfig],
  );

  // ── Load industry config ──
  const loadIndustryConfig = useCallback(
    async (industry: string) => {
      if (!industry.trim()) return;

      setSelectedIndustry(industry);
      setIndustrySearch('');
      setShowDropdown(false);
      setCheckedPainPoints(new Set());
      setModifiedFields(new Set());
      setEnabledProofPoints(new Set());
      setLastUsedIndustry(industry);

      // Check cache first
      const cached = getCachedConfig(industry);
      if (cached) {
        setIndustryConfig(cached);
        setInputs(cached.benchmarkValues);
        return;
      }

      // Fetch from API
      setIndustryLoading(true);
      try {
        const res = await fetch('/api/industry-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry }),
        });
        if (!res.ok) throw new Error('API error');
        const config: IndustryConfig = await res.json();
        setIndustryConfig(config);
        setInputs(config.benchmarkValues);
        setCachedConfig(industry, config);
      } catch {
        setIndustryConfig(null);
        setInputs({ ...DEFAULT_INPUTS });
      }
      setIndustryLoading(false);
    },
    [],
  );

  // ── Input update with modified tracking ──
  const updateField = useCallback((field: keyof ROIInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setModifiedFields((prev) => new Set(prev).add(field));
  }, []);

  // ── Reset to benchmarks ──
  const resetToBenchmarks = useCallback(() => {
    if (industryConfig) {
      setInputs(industryConfig.benchmarkValues);
      setModifiedFields(new Set());
    } else {
      setInputs({ ...DEFAULT_INPUTS });
      setModifiedFields(new Set());
    }
  }, [industryConfig]);

  // ── Live ROI calculation ──
  const outputs: ROIOutputs = useMemo(() => calculateROI(inputs), [inputs]);

  // ── Bar chart data ──
  const barData = useMemo(() => {
    const currentCost = outputs.annualCostOfProblem;
    const solutionCost = inputs.solutionMonthlyCost * 12;
    const netSavings = outputs.netAnnualBenefit;
    const maxVal = Math.max(currentCost, solutionCost, Math.abs(netSavings), 1);

    const t = industryConfig?.terminology;
    return [
      {
        label: t?.['currentCost'] || 'Current Annual Cost',
        value: currentCost,
        color: 'bg-red-500',
        pct: (currentCost / maxVal) * 100,
      },
      {
        label: t?.['solutionCost'] || 'Solution Annual Cost',
        value: solutionCost,
        color: 'bg-accent',
        pct: (solutionCost / maxVal) * 100,
      },
      {
        label: t?.['netSavings'] || 'Net Annual Savings',
        value: netSavings,
        color: netSavings >= 0 ? 'bg-emerald-500' : 'bg-red-500',
        pct: (Math.abs(netSavings) / maxVal) * 100,
      },
    ];
  }, [outputs, inputs.solutionMonthlyCost, industryConfig]);

  // ── Section parser ──
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

  // ── Build context strings ──
  const buildPainPointContext = (): string => {
    if (!industryConfig || checkedPainPoints.size === 0) return '';
    const checked = industryConfig.painPoints
      .filter((_, idx) => checkedPainPoints.has(idx))
      .map((p) => `  - ${p}`);
    return `\nIdentified Pain Points for ${industryConfig.industry}:\n${checked.join('\n')}`;
  };

  const buildProofPointContext = (): string => {
    if (!industryConfig || enabledProofPoints.size === 0) return '';
    const enabled = industryConfig.proofPointPrompts
      .filter((_, idx) => enabledProofPoints.has(idx))
      .map((p) => `  - ${p}`);
    return `\nProof Points to Include:\n${enabled.join('\n')}`;
  };

  // ── Generate Business Case ──
  const generateBusinessCase = async () => {
    const pName = prospectName || 'Prospect';
    const industryName = selectedIndustry || '';

    const prospect: ProspectInfo = {
      companyName: pName,
      industry: industryName,
      companySize: '',
      techStack: '',
      painPoints: '',
    };

    const docTitle = industryName
      ? `Operational ROI Analysis for ${pName} \u2014 ${industryName}`
      : `Operational ROI Analysis for ${pName}`;

    const labelFor = (field: keyof ROIInputs) => getLabel(field).label;

    const additionalContext = [
      `Document Title: ${docTitle}`,
      industryName ? `Target Industry: ${industryName}` : '',
      '',
      'ROI Calculator Inputs:',
      `- ${labelFor('employeesAffected')}: ${inputs.employeesAffected}`,
      `- ${labelFor('hoursLostPerWeek')}: ${inputs.hoursLostPerWeek}`,
      `- ${labelFor('hourlyRate')}: ${fmt.format(inputs.hourlyRate)}`,
      `- ${labelFor('errorsPerWeek')}: ${inputs.errorsPerWeek}`,
      `- ${labelFor('costPerError')}: ${fmt.format(inputs.costPerError)}`,
      `- ${labelFor('currentMonthlySpend')}: ${fmt.format(inputs.currentMonthlySpend)}`,
      `- ${labelFor('solutionMonthlyCost')}: ${fmt.format(inputs.solutionMonthlyCost)}`,
      '',
      'Calculated ROI Outputs:',
      `- Annual cost of the problem: ${fmt.format(outputs.annualCostOfProblem)}`,
      `- Annual savings with solution: ${fmt.format(outputs.annualSavings)}`,
      `- Net annual benefit: ${fmt.format(outputs.netAnnualBenefit)}`,
      `- ROI percentage: ${outputs.roiPercentage}%`,
      `- Payback period: ${outputs.paybackMonths} months`,
      `- 3-year cumulative value: ${fmt.format(outputs.threeYearValue)}`,
      `- 5-year cumulative value: ${fmt.format(outputs.fiveYearValue)}`,
      buildPainPointContext(),
      buildProofPointContext(),
    ]
      .filter(Boolean)
      .join('\n');

    const contentType: ContentType = 'roi-business-case';

    setGenerating(true);
    setSections([]);
    setRawStream('');
    setShowResult(true);
    streamRef.current = '';

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          prospect,
          additionalContext,
          toneLevel: 50,
          sessionDocuments: [],
        }),
      });

      if (!res.ok) {
        let errorMsg = 'Could not generate business case. Check your inputs and try again.';
        try {
          const errBody = await res.json();
          if (errBody?.error) errorMsg = errBody.error;
        } catch {
          // Response wasn't JSON — use default message
        }
        console.error('[ROI] Generation request failed:', res.status, errorMsg);
        toast.error(errorMsg);
        setGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        console.error('[ROI] Response body reader is null');
        toast.error('Could not generate business case. Check your inputs and try again.');
        setGenerating(false);
        return;
      }

      let streamError = '';
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
              if (parsed.error) {
                streamError = parsed.error;
                console.error('[ROI] Stream error from server:', parsed.error);
              } else if (parsed.text) {
                streamRef.current += parsed.text;
                setRawStream(streamRef.current);
              }
            } catch { /* skip malformed SSE chunk */ }
          }
        }
      }

      if (streamError && !streamRef.current.trim()) {
        toast.error(`Generation failed: ${streamError}`);
        setGenerating(false);
        return;
      }

      const parsed = parseSections(streamRef.current);
      setSections(parsed);

      // Save to history
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uuidv4(),
            contentType,
            prospect,
            additionalContext,
            toneLevel: 50,
            sections: parsed,
            generatedAt: new Date().toISOString(),
            generatedBy: session?.user?.name || 'Unknown',
          }),
        });
      } catch (e) {
        console.error('[ROI] Failed to save to history:', e);
      }

      // Auto-export as PDF
      try {
        const pdfRes = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: parsed, contentType, prospect, styleOverride: 'bold' }),
        });
        if (!pdfRes.ok) {
          console.error('[ROI] PDF export returned status:', pdfRes.status);
          toast.error('PDF export failed, but content was generated successfully');
        } else {
          const html = await pdfRes.text();
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 500);
          }
        }
      } catch (e) {
        console.error('[ROI] PDF export error:', e);
        toast.error('PDF export failed, but content was generated successfully');
      }
    } catch (e) {
      console.error('[ROI] Generation error:', e);
      toast.error('Could not generate business case. Check your inputs and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = () => {
    const text = sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const exportPDF = async () => {
    const prospect: ProspectInfo = {
      companyName: prospectName || 'Prospect',
      industry: selectedIndustry,
      companySize: '',
      techStack: '',
      painPoints: '',
    };
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, contentType: 'roi-business-case' as ContentType, prospect, styleOverride: 'bold' }),
      });
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } catch {
      toast.error('PDF export failed');
    }
  };

  // ── Demo mode ──
  const loadDemoData = async () => {
    const randomIdx = Math.floor(Math.random() * DEMO_INDUSTRY_DATA.length);
    const demoData = DEMO_INDUSTRY_DATA[randomIdx];
    if (!demoData) return;

    setProspectName(demoData.prospectName);
    await loadIndustryConfig(demoData.industry);

    setTimeout(() => {
      setCheckedPainPoints(new Set(demoData.painPointIndices));
    }, 150);
  };

  // ── Clear all state ──
  const clearAll = () => {
    setProspectName('');
    setSelectedIndustry('');
    setIndustrySearch('');
    setIndustryConfig(null);
    setInputs({ ...DEFAULT_INPUTS });
    setCheckedPainPoints(new Set());
    setModifiedFields(new Set());
    setEnabledProofPoints(new Set());
    setSections([]);
    setShowResult(false);
    setRawStream('');
    try { localStorage.removeItem('roi-last-industry'); } catch { /* skip */ }
  };

  // ── Search keydown ──
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && industrySearch.trim()) {
      e.preventDefault();
      if (filteredIndustries.length > 0) {
        loadIndustryConfig(filteredIndustries[0]);
      } else {
        loadIndustryConfig(industrySearch.trim());
      }
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // ── Clear industry ──
  const clearIndustry = () => {
    setSelectedIndustry('');
    setIndustrySearch('');
    setIndustryConfig(null);
    setInputs({ ...DEFAULT_INPUTS });
    setModifiedFields(new Set());
    setCheckedPainPoints(new Set());
    setEnabledProofPoints(new Set());
    try { localStorage.removeItem('roi-last-industry'); } catch { /* skip */ }
  };

  // ── Has any modified fields ──
  const hasModifications = modifiedFields.size > 0;

  // ── Auth loading ──
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--content-bg)' }}>
        {/* ═══════════════════════════════════════════════ */}
        {/* Header */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="border-b px-8 py-5" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="flex items-center justify-between max-w-7xl">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <HiOutlineChartBar style={{ color: 'var(--accent)' }} />
                ROI Calculator
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Quantify the value of your solution with industry-specific benchmarks and generate a business case
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadDemoData}
                className="text-sm font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-1.5"
                style={{ color: 'var(--accent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
              >
                <HiOutlineBeaker className="text-base" />
                Try Demo
              </button>
              {(selectedIndustry || prospectName) && (
                <button
                  onClick={clearAll}
                  className="text-sm font-medium hover:text-red-600 border hover:border-red-200 rounded-lg px-4 py-2 transition-colors"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {/* ═══════════════════════════════════════════════ */}
          {/* Industry Search (full width) */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineMagnifyingGlass className="text-lg" style={{ color: 'var(--accent)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                What industry is your prospect in?
              </h2>
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={industrySearch}
                  onChange={(e) => {
                    setIndustrySearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search 150+ industries -- e.g. pest control, legal, dental, SaaS, logistics..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                />
                {industryLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', borderTopColor: 'var(--accent)' }} />
                  </div>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && industrySearch.trim() && (
                <div className="absolute z-50 mt-1 w-full rounded-lg shadow-xl max-h-72 overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  {filteredIndustries.length > 0 ? (
                    <>
                      {filteredIndustries.map((ind) => (
                        <button
                          key={ind}
                          onClick={() => loadIndustryConfig(ind)}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <span className="flex-1">{ind}</span>
                          {DEMO_INDUSTRIES.includes(ind as typeof DEMO_INDUSTRIES[number]) && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
                              demo ready
                            </span>
                          )}
                        </button>
                      ))}
                      {/* Free-form option if not exact match */}
                      {!INDUSTRY_LIST.some(
                        (i) => i.toLowerCase() === industrySearch.trim().toLowerCase(),
                      ) && (
                        <button
                          onClick={() => loadIndustryConfig(industrySearch.trim())}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium border-t border-gray-100 flex items-center gap-2"
                          style={{ color: 'var(--accent)' }}
                        >
                          <HiOutlineSparkles style={{ color: 'var(--accent)' }} />
                          Generate config for &quot;{industrySearch.trim()}&quot;
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => loadIndustryConfig(industrySearch.trim())}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2"
                      style={{ color: 'var(--accent)' }}
                    >
                      <HiOutlineSparkles style={{ color: 'var(--accent)' }} />
                      Generate AI config for &quot;{industrySearch.trim()}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected industry pill */}
            {selectedIndustry && !industryLoading && (
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full text-xs font-semibold px-3 py-1.5" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                  <HiOutlineCheckCircle className="mr-1.5" />
                  {selectedIndustry}
                  <button
                    onClick={clearIndustry}
                    className="ml-2 transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    <HiOutlineXMark className="w-3.5 h-3.5" />
                  </button>
                </span>
                {industryConfig && (
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    AI-generated benchmarks loaded
                  </span>
                )}
              </div>
            )}

            {/* Industry loading skeleton */}
            {industryLoading && (
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--accent)' }}>
                <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', borderTopColor: 'var(--accent)' }} />
                Generating industry-specific configuration with AI...
              </div>
            )}

            {/* Popular Industries quick-select */}
            {!selectedIndustry && (
              <div className="mt-4">
                <p className="text-xs mb-2 font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Popular Industries</p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => loadIndustryConfig(ind)}
                      className="text-xs rounded-full px-3 py-1.5 border transition-colors"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Prospect Name (compact, inside search card on small screens) ── */}
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Prospect / Company Name</label>
            <input
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Used in the generated business case document</p>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* Two-column layout: Inputs | Outputs */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── LEFT COLUMN: Input Form + Pain Points ── */}
            <div className="space-y-6">
              {/* Calculator Inputs */}
              <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <div className="flex items-center justify-between border-b pb-3 mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    Calculator Inputs
                    {selectedIndustry && (
                      <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                        -- {selectedIndustry}
                      </span>
                    )}
                  </h2>
                  {industryConfig && hasModifications && (
                    <button
                      onClick={resetToBenchmarks}
                      className="text-xs font-medium rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                      style={{ color: 'var(--accent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
                    >
                      <HiOutlineArrowPath className="text-sm" />
                      Reset to Benchmarks
                    </button>
                  )}
                </div>

                {industryLoading ? (
                  <ConfigSkeleton />
                ) : (
                  <div className="space-y-5">
                    {INPUT_FIELD_ORDER.map((field) => {
                      const lbl = getLabel(field);
                      return (
                        <InputField
                          key={field}
                          label={lbl.label}
                          helper={lbl.helper}
                          value={inputs[field]}
                          onChange={(v) => updateField(field, v)}
                          isCurrency={CURRENCY_FIELDS.includes(field)}
                          isBenchmark={!!industryConfig && !modifiedFields.has(field)}
                        />
                      );
                    })}
                  </div>
                )}

                {industryConfig && !industryLoading && (
                  <p className="text-xs italic border-t pt-3 mt-5" style={{ color: 'var(--text-secondary)' }}>
                    Benchmarks are AI-generated industry estimates. Adjust to match your prospect&apos;s actual situation.
                  </p>
                )}
              </div>

              {/* ── Pain Points Checklist ── */}
              {industryConfig && industryConfig.painPoints.length > 0 && (
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <button
                    onClick={() => setPainPointsExpanded(!painPointsExpanded)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <HiOutlineBolt className="text-amber-500" />
                      Pain Points for {industryConfig.industry}
                      {checkedPainPoints.size > 0 && (
                        <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
                          {checkedPainPoints.size} selected
                        </span>
                      )}
                    </h2>
                    <HiOutlineChevronDown
                      className={`w-5 h-5 transition-transform duration-200 ${
                        painPointsExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      painPointsExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-5 space-y-1.5 border-t">
                      <p className="text-xs pt-3 mb-3" style={{ color: 'var(--text-secondary)' }}>
                        Check the pain points that apply to this prospect. Selected items will be woven into the business case.
                      </p>
                      {industryConfig.painPoints.map((point, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-3 py-2 px-3 rounded-lg cursor-pointer group transition-colors"
                          style={checkedPainPoints.has(idx) ? { backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)' } : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={checkedPainPoints.has(idx)}
                            onChange={() => {
                              setCheckedPainPoints((prev) => {
                                const next = new Set(prev);
                                if (next.has(idx)) next.delete(idx);
                                else next.add(idx);
                                return next;
                              });
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300"
                            style={{ accentColor: 'var(--accent)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                          />
                          <span className="text-sm"
                            style={checkedPainPoints.has(idx) ? { color: 'var(--accent)', fontWeight: 500 } : { color: 'var(--text-primary)' }}>
                            {point}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Live Outputs + Chart + Proof Points ── */}
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="rounded-xl p-6 shadow-sm space-y-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <HiOutlineChartBar style={{ color: 'var(--accent)' }} />
                  Live ROI Results
                </h2>

                {/* Annual Cost of Problem */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 transition-all duration-300">
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                    Annual Cost of the Problem
                  </p>
                  <p className="text-3xl font-bold text-red-700 transition-all duration-300">
                    {fmt.format(outputs.annualCostOfProblem)}
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    Total yearly cost including labor loss, errors, and workarounds
                  </p>
                </div>

                {/* Annual Savings */}
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 transition-all duration-300">
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                    Annual Savings with Solution
                  </p>
                  <p className="text-3xl font-bold text-green-700 transition-all duration-300">
                    {fmt.format(outputs.annualSavings)}
                  </p>
                </div>

                {/* Net Annual Benefit */}
                <div className="rounded-lg p-4 transition-all duration-300" style={{ backgroundColor: 'var(--content-bg)', border: '1px solid var(--card-border)' }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Net Annual Benefit
                  </p>
                  <p className={`text-2xl font-bold transition-all duration-300 ${
                    outputs.netAnnualBenefit >= 0 ? '' : 'text-red-600'
                  }`} style={outputs.netAnnualBenefit >= 0 ? { color: 'var(--text-primary)' } : undefined}>
                    {fmt.format(outputs.netAnnualBenefit)}
                  </p>
                </div>

                {/* ROI Percentage (big hero number) */}
                <div className={`rounded-lg p-5 border transition-all duration-300 ${
                  outputs.roiPercentage >= 0
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-red-50 border-red-100'
                }`}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>
                    ROI Percentage
                  </p>
                  <p className={`text-5xl font-extrabold transition-all duration-300 ${
                    outputs.roiPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {pctFmt.format(outputs.roiPercentage)}%
                  </p>
                </div>

                {/* Payback Period */}
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Payback Period
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {outputs.paybackMonths > 0 ? `${outputs.paybackMonths} months` : 'N/A'}
                    </p>
                    {outputs.paybackMonths > 0 && (
                      <div className="flex-1">
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              outputs.paybackMonths <= 3 ? 'bg-green-500' :
                              outputs.paybackMonths <= 6 ? 'bg-yellow-500' :
                              outputs.paybackMonths <= 12 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((outputs.paybackMonths / 12) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          <span>0</span>
                          <span>6 mo</span>
                          <span>12 mo</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-year values */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>3-Year Value</p>
                    <p className="text-xl font-bold transition-all duration-300" style={{ color: 'var(--accent)' }}>
                      {fmt.format(outputs.threeYearValue)}
                    </p>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>5-Year Value</p>
                    <p className="text-xl font-bold transition-all duration-300" style={{ color: 'var(--accent)' }}>
                      {fmt.format(outputs.fiveYearValue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── CSS Bar Chart ── */}
              <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                <h2 className="text-lg font-semibold border-b pb-3 mb-4" style={{ color: 'var(--text-primary)' }}>Cost Comparison</h2>
                <div className="space-y-4">
                  {barData.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{bar.label}</span>
                        <span className={`text-sm font-semibold ${
                          bar.label.toLowerCase().includes('saving') && bar.value >= 0
                            ? 'text-emerald-700'
                            : bar.label.toLowerCase().includes('current')
                            ? 'text-red-700'
                            : ''
                        }`} style={
                          !(bar.label.toLowerCase().includes('saving') && bar.value >= 0) && !bar.label.toLowerCase().includes('current')
                            ? { color: 'var(--text-primary)' } : undefined
                        }>
                          {fmt.format(bar.value)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-7">
                        <div
                          className={`h-7 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 ${bar.color === 'bg-accent' ? '' : bar.color}`}
                          style={{ width: `${Math.max(bar.pct, 3)}%`, ...(bar.color === 'bg-accent' ? { backgroundColor: 'var(--accent)' } : {}) }}
                        >
                          {bar.pct > 20 && (
                            <span className="text-[10px] font-semibold text-white/90">
                              {fmt.format(bar.value)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Proof Point Suggestions (from config) ── */}
              {industryConfig && industryConfig.proofPointPrompts && industryConfig.proofPointPrompts.length > 0 && (
                <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <h2 className="text-lg font-semibold border-b pb-3 mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <HiOutlineLightBulb className="text-amber-500" />
                    Proof Point Suggestions
                  </h2>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Toggle on the proof points you want included in the business case.
                  </p>
                  <div className="space-y-2">
                    {industryConfig.proofPointPrompts.map((prompt, idx) => {
                      const isEnabled = enabledProofPoints.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setEnabledProofPoints((prev) => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              return next;
                            });
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200"
                          style={isEnabled
                            ? { backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', color: 'var(--accent)', fontWeight: 500 }
                            : { backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }
                          }
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                              style={isEnabled ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent)' } : { borderColor: '#d1d5db' }}>
                              {isEnabled && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span>{prompt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {enabledProofPoints.size > 0 && (
                    <p className="text-xs mt-3 font-medium" style={{ color: 'var(--accent)' }}>
                      {enabledProofPoints.size} proof point{enabledProofPoints.size !== 1 ? 's' : ''} will be included in the business case
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* Generate Business Case Button */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="flex justify-center pt-2">
            <button
              onClick={generateBusinessCase}
              disabled={generating}
              className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Business Case...
                </>
              ) : (
                <>
                  <HiOutlineDocumentText className="text-xl" />
                  Generate Business Case
                </>
              )}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* Streamed Generation Output */}
          {/* ═══════════════════════════════════════════════ */}
          {showResult && (
            <div ref={resultRef} className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              {/* Header bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--content-bg)' }}>
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ROI / Business Case
                    {prospectName && (
                      <span className="font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>for {prospectName}</span>
                    )}
                    {selectedIndustry && (
                      <span className="font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>-- {selectedIndustry}</span>
                    )}
                  </h3>
                  {generating && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
                      <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', borderTopColor: 'var(--accent)' }} />
                      Generating...
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sections.length > 0 && (
                    <>
                      <button
                        onClick={exportPDF}
                        className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <HiOutlineArrowDownTray /> Export PDF
                      </button>
                      <button
                        onClick={copyResult}
                        className="text-xs border rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}
                      >
                        <HiOutlineClipboard /> Copy
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setShowResult(false); setSections([]); setRawStream(''); }}
                    className="transition-colors" style={{ color: 'var(--text-secondary)' }}
                  >
                    <HiOutlineXMark />
                  </button>
                </div>
              </div>

              {/* Content area */}
              <div className="p-6 max-h-[600px] overflow-y-auto">
                {/* Streaming text */}
                {generating && sections.length === 0 && rawStream && (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap animate-pulse">
                    {rawStream}
                    <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                  </div>
                )}
                {generating && !rawStream && (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)', borderTopColor: 'var(--accent)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Generating business case...</p>
                  </div>
                )}

                {/* Final parsed sections */}
                {sections.length > 0 && (
                  <div className="space-y-5">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <h4 className="text-sm font-semibold mb-2 border-l-2 pl-3" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                          {section.title}
                        </h4>
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap pl-3">
                          {section.content}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t flex items-center gap-4">
                      <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-5 py-2.5 transition-colors shadow-sm"
                      >
                        <HiOutlineArrowDownTray className="text-lg" /> Export PDF
                      </button>
                      <button
                        onClick={copyResult}
                        className="flex items-center gap-2 text-sm font-medium border rounded-lg px-5 py-2.5 transition-colors"
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--card-border)' }}
                      >
                        <HiOutlineClipboard className="text-lg" /> Copy to Clipboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
