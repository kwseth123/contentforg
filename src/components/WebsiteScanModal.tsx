'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeBase } from '@/lib/types';
import { HiOutlineGlobeAlt, HiOutlineXMark, HiOutlineCheckCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface ExtractedProduct {
  name: string;
  description: string;
  keyFeatures: string[];
  pricing: string;
}

interface ExtractedCaseStudy {
  title: string;
  content: string;
}

interface ExtractedCompetitor {
  name: string;
  howWeBeatThem: string;
}

interface ExtractedBrandVoice {
  tone: string;
  wordsToUse: string[];
  wordsToAvoid: string[];
}

interface ExtractedData {
  companyName?: string;
  tagline?: string;
  aboutUs?: string;
  products?: ExtractedProduct[];
  differentiators?: string;
  industries?: string[];
  personas?: string[];
  companySize?: string;
  caseStudies?: ExtractedCaseStudy[];
  competitors?: ExtractedCompetitor[];
  brandVoice?: ExtractedBrandVoice;
  missingFields?: string[];
}

type ScanPhase = 'input' | 'scanning' | 'review' | 'done';

interface CheckedItems {
  companyInfo: boolean;
  products: Record<number, boolean>;
  caseStudies: Record<number, boolean>;
  differentiators: boolean;
  brandVoice: boolean;
  icpInfo: boolean;
  competitors: Record<number, boolean>;
}

interface WebsiteScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'full' | 'rescan';
  existingKb: KnowledgeBase;
  onImport: (updatedKb: KnowledgeBase) => void;
  initialUrl?: string;
}

export default function WebsiteScanModal({
  isOpen,
  onClose,
  mode,
  existingKb,
  onImport,
  initialUrl = '',
}: WebsiteScanModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<ScanPhase>('input');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({
    companyInfo: true,
    products: {},
    caseStudies: {},
    differentiators: true,
    brandVoice: true,
    icpInfo: true,
    competitors: {},
  });
  const abortRef = useRef<AbortController | null>(null);

  const startScan = useCallback(async () => {
    if (!url.trim()) return;

    setPhase('scanning');
    setProgress(0);
    setProgressText('Starting scan...');
    setError(null);
    setExtractedData(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/website-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), mode }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Scan failed');
        setPhase('input');
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('Failed to start scan stream');
        setPhase('input');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'progress') {
              setProgressText(event.page);
              setCurrentPage(event.current);
              setTotalPages(event.total);
              setProgress(Math.round((event.current / event.total) * 100));
            } else if (event.type === 'result') {
              setExtractedData(event.data);
              // Pre-check all items
              const products: Record<number, boolean> = {};
              const caseStudies: Record<number, boolean> = {};
              const competitors: Record<number, boolean> = {};
              (event.data.products || []).forEach((_: unknown, i: number) => { products[i] = true; });
              (event.data.caseStudies || []).forEach((_: unknown, i: number) => { caseStudies[i] = true; });
              (event.data.competitors || []).forEach((_: unknown, i: number) => { competitors[i] = true; });
              setCheckedItems({
                companyInfo: true,
                products,
                caseStudies,
                differentiators: true,
                brandVoice: true,
                icpInfo: true,
                competitors,
              });
              setProgress(100);
              setPhase('review');
            } else if (event.type === 'error') {
              setError(event.message);
              setPhase('input');
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Scan failed');
      setPhase('input');
    }
  }, [url, mode]);

  const handleImport = useCallback(() => {
    if (!extractedData) return;

    const updated = { ...existingKb };

    if (checkedItems.companyInfo) {
      if (mode === 'full' || !updated.companyName) {
        updated.companyName = extractedData.companyName || updated.companyName;
      }
      if (mode === 'full' || !updated.tagline) {
        updated.tagline = extractedData.tagline || updated.tagline;
      }
      if (mode === 'full' || !updated.aboutUs) {
        updated.aboutUs = extractedData.aboutUs || updated.aboutUs;
      }
    }

    if (checkedItems.differentiators) {
      if (mode === 'full' || !updated.differentiators) {
        updated.differentiators = extractedData.differentiators || updated.differentiators;
      }
    }

    // Products
    const selectedProducts = (extractedData.products || [])
      .filter((_, i) => checkedItems.products[i])
      .map(p => ({
        id: uuidv4(),
        name: p.name,
        description: p.description,
        keyFeatures: p.keyFeatures || [],
        pricing: p.pricing || '',
      }));

    if (mode === 'rescan') {
      // Append only products that don't already exist by name
      const existingNames = new Set(updated.products.map(p => p.name.toLowerCase()));
      const newProducts = selectedProducts.filter(p => !existingNames.has(p.name.toLowerCase()));
      updated.products = [...updated.products, ...newProducts];
    } else {
      updated.products = selectedProducts;
    }

    // Case Studies
    const selectedCaseStudies = (extractedData.caseStudies || [])
      .filter((_, i) => checkedItems.caseStudies[i])
      .map(cs => ({
        id: uuidv4(),
        title: cs.title,
        content: cs.content,
      }));

    if (mode === 'rescan') {
      const existingTitles = new Set(updated.caseStudies.map(cs => cs.title.toLowerCase()));
      const newCaseStudies = selectedCaseStudies.filter(cs => !existingTitles.has(cs.title.toLowerCase()));
      updated.caseStudies = [...updated.caseStudies, ...newCaseStudies];
    } else {
      updated.caseStudies = selectedCaseStudies;
    }

    // Competitors
    const selectedCompetitors = (extractedData.competitors || [])
      .filter((_, i) => checkedItems.competitors[i])
      .map(c => ({
        id: uuidv4(),
        name: c.name,
        howWeBeatThem: c.howWeBeatThem || '',
      }));

    if (mode === 'rescan') {
      const existingCompNames = new Set(updated.competitors.map(c => c.name.toLowerCase()));
      const newCompetitors = selectedCompetitors.filter(c => !existingCompNames.has(c.name.toLowerCase()));
      updated.competitors = [...updated.competitors, ...newCompetitors];
    } else {
      updated.competitors = selectedCompetitors;
    }

    // Brand Voice
    if (checkedItems.brandVoice && extractedData.brandVoice) {
      if (mode === 'full' || !updated.brandVoice.tone) {
        updated.brandVoice = {
          tone: extractedData.brandVoice.tone || updated.brandVoice.tone,
          wordsToUse: extractedData.brandVoice.wordsToUse?.length
            ? extractedData.brandVoice.wordsToUse
            : updated.brandVoice.wordsToUse,
          wordsToAvoid: extractedData.brandVoice.wordsToAvoid?.length
            ? extractedData.brandVoice.wordsToAvoid
            : updated.brandVoice.wordsToAvoid,
        };
      }
    }

    // ICP Info
    if (checkedItems.icpInfo) {
      if (mode === 'full' || updated.icp.industries.length === 0) {
        updated.icp = {
          industries: extractedData.industries?.length ? extractedData.industries : updated.icp.industries,
          companySize: extractedData.companySize || updated.icp.companySize,
          personas: extractedData.personas?.length ? extractedData.personas : updated.icp.personas,
        };
      } else if (mode === 'rescan') {
        const existingIndustries = new Set(updated.icp.industries.map(i => i.toLowerCase()));
        const newIndustries = (extractedData.industries || []).filter(i => !existingIndustries.has(i.toLowerCase()));
        updated.icp.industries = [...updated.icp.industries, ...newIndustries];

        const existingPersonas = new Set(updated.icp.personas.map(p => p.toLowerCase()));
        const newPersonas = (extractedData.personas || []).filter(p => !existingPersonas.has(p.toLowerCase()));
        updated.icp.personas = [...updated.icp.personas, ...newPersonas];
      }
    }

    // Set website URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    updated.website = normalizedUrl;

    onImport(updated);
    setPhase('done');
  }, [extractedData, checkedItems, existingKb, mode, url, onImport]);

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setPhase('input');
    setProgress(0);
    setError(null);
    onClose();
  };

  // Summary counts for review
  const getSummary = () => {
    if (!extractedData) return '';
    const parts: string[] = [];
    const prodCount = (extractedData.products || []).length;
    const csCount = (extractedData.caseStudies || []).length;
    const compCount = (extractedData.competitors || []).length;
    const indCount = (extractedData.industries || []).length;

    if (prodCount > 0) parts.push(`${prodCount} product${prodCount > 1 ? 's' : ''}`);
    if (csCount > 0) parts.push(`${csCount} case stud${csCount > 1 ? 'ies' : 'y'}`);
    if (extractedData.differentiators) parts.push('differentiators');
    if (compCount > 0) parts.push(`${compCount} competitor${compCount > 1 ? 's' : ''}`);
    if (indCount > 0) parts.push(`${indCount} industr${indCount > 1 ? 'ies' : 'y'}`);

    return parts.length > 0 ? `We found ${parts.join(', ')}.` : 'Limited information was found.';
  };

  // Missing field prompts
  const getMissingPrompts = () => {
    const prompts: { field: string; message: string; tab: string }[] = [];
    if (!extractedData) return prompts;

    const missing = extractedData.missingFields || [];
    if (missing.some(f => f.toLowerCase().includes('competitor')) || (extractedData.competitors || []).length === 0) {
      prompts.push({ field: 'competitors', message: 'We couldn\'t find competitor information -- Add your top 3 competitors', tab: 'competitive' });
    }
    if (missing.some(f => f.toLowerCase().includes('pricing')) || (extractedData.products || []).every(p => !p.pricing)) {
      prompts.push({ field: 'pricing', message: 'We couldn\'t find pricing information -- Add pricing notes', tab: 'products' });
    }
    if (missing.some(f => f.toLowerCase().includes('case')) || (extractedData.caseStudies || []).length === 0) {
      prompts.push({ field: 'caseStudies', message: 'No case studies found -- Add your first customer win', tab: 'brand' });
    }
    return prompts;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
              <HiOutlineGlobeAlt className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'rescan' ? 'Re-scan Website' : 'Website Scanner'}
              </h2>
              <p className="text-xs text-gray-500">Powered by AI website analysis</p>
            </div>
          </div>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <HiOutlineXMark className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Input Phase */}
          {phase === 'input' && (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  onKeyDown={(e) => { if (e.key === 'Enter') startScan(); }}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  We will scan your website and use AI to extract company info, products, case studies, and more.
                </p>
              </div>
              <button
                onClick={startScan}
                disabled={!url.trim()}
                className="btn-accent w-full disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 rounded-lg transition-colors text-sm"
              >
                {mode === 'rescan' ? 'Re-scan My Website' : 'Scan My Website'}
              </button>
            </div>
          )}

          {/* Scanning Phase */}
          {phase === 'scanning' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                  <HiOutlineGlobeAlt className="w-8 h-8 animate-pulse" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Scanning your website</h3>
                <p className="text-sm text-gray-500">{progressText}</p>
                {totalPages > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Page {currentPage} of {totalPages}</p>
                )}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: 'var(--accent)',
                    width: `${progress}%`,
                    transition: 'width 0.5s ease-in-out',
                  }}
                />
              </div>
              <p className="text-center text-xs text-gray-400">This may take a minute...</p>
            </div>
          )}

          {/* Review Phase */}
          {phase === 'review' && extractedData && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <HiOutlineCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Scan complete!</p>
                  <p className="text-sm text-green-700">{getSummary()}</p>
                </div>
              </div>

              {/* Company Info */}
              {(extractedData.companyName || extractedData.tagline || extractedData.aboutUs) && (
                <ReviewCard
                  title="Company Info"
                  checked={checkedItems.companyInfo}
                  onChange={(v) => setCheckedItems({ ...checkedItems, companyInfo: v })}
                >
                  {extractedData.companyName && (
                    <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {extractedData.companyName}</p>
                  )}
                  {extractedData.tagline && (
                    <p className="text-sm text-gray-700"><span className="font-medium">Tagline:</span> {extractedData.tagline}</p>
                  )}
                  {extractedData.aboutUs && (
                    <p className="text-sm text-gray-600 mt-1">{extractedData.aboutUs}</p>
                  )}
                </ReviewCard>
              )}

              {/* Products */}
              {(extractedData.products || []).length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Products</h3>
                  {extractedData.products!.map((product, i) => (
                    <div key={i} className="flex items-start gap-3 pl-1">
                      <input
                        type="checkbox"
                        checked={checkedItems.products[i] ?? true}
                        onChange={(e) => setCheckedItems({
                          ...checkedItems,
                          products: { ...checkedItems.products, [i]: e.target.checked },
                        })}
                        className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-0"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.description}</p>
                        {product.keyFeatures?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.keyFeatures.map((f, fi) => (
                              <span key={fi} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Case Studies */}
              {(extractedData.caseStudies || []).length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Case Studies</h3>
                  {extractedData.caseStudies!.map((cs, i) => (
                    <div key={i} className="flex items-start gap-3 pl-1">
                      <input
                        type="checkbox"
                        checked={checkedItems.caseStudies[i] ?? true}
                        onChange={(e) => setCheckedItems({
                          ...checkedItems,
                          caseStudies: { ...checkedItems.caseStudies, [i]: e.target.checked },
                        })}
                        className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-0"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{cs.title}</p>
                        <p className="text-xs text-gray-500">{cs.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Competitors */}
              {(extractedData.competitors || []).length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Competitors</h3>
                  {extractedData.competitors!.map((comp, i) => (
                    <div key={i} className="flex items-start gap-3 pl-1">
                      <input
                        type="checkbox"
                        checked={checkedItems.competitors[i] ?? true}
                        onChange={(e) => setCheckedItems({
                          ...checkedItems,
                          competitors: { ...checkedItems.competitors, [i]: e.target.checked },
                        })}
                        className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-0"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{comp.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Differentiators */}
              {extractedData.differentiators && (
                <ReviewCard
                  title="Differentiators"
                  checked={checkedItems.differentiators}
                  onChange={(v) => setCheckedItems({ ...checkedItems, differentiators: v })}
                >
                  <p className="text-sm text-gray-600">{extractedData.differentiators}</p>
                </ReviewCard>
              )}

              {/* Brand Voice */}
              {extractedData.brandVoice?.tone && (
                <ReviewCard
                  title="Brand Voice"
                  checked={checkedItems.brandVoice}
                  onChange={(v) => setCheckedItems({ ...checkedItems, brandVoice: v })}
                >
                  <p className="text-sm text-gray-600"><span className="font-medium">Tone:</span> {extractedData.brandVoice.tone}</p>
                  {extractedData.brandVoice.wordsToUse?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedData.brandVoice.wordsToUse.map((w, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>{w}</span>
                      ))}
                    </div>
                  )}
                </ReviewCard>
              )}

              {/* Industries & Personas */}
              {((extractedData.industries || []).length > 0 || (extractedData.personas || []).length > 0) && (
                <ReviewCard
                  title="Industries & Personas"
                  checked={checkedItems.icpInfo}
                  onChange={(v) => setCheckedItems({ ...checkedItems, icpInfo: v })}
                >
                  {(extractedData.industries || []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Industries</p>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.industries!.map((ind, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{ind}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(extractedData.personas || []).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Personas</p>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.personas!.map((p, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </ReviewCard>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImport}
                  className="btn-accent flex-1 font-medium py-3 rounded-lg transition-colors text-sm"
                >
                  Import Selected
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Done Phase */}
          {phase === 'done' && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <HiOutlineCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Knowledge base updated!</h3>
                <p className="text-sm text-gray-500">{getSummary()}</p>
              </div>

              {/* Missing fields prompts */}
              {getMissingPrompts().length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">What&apos;s Missing</h4>
                  {getMissingPrompts().map((prompt, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-start gap-2">
                        <HiOutlineExclamationTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">{prompt.message}</p>
                      </div>
                      <button
                        onClick={() => { onClose(); }}
                        className="text-xs font-medium whitespace-nowrap ml-3"
                        style={{ color: 'var(--accent)' }}
                      >
                        Add Now
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={onClose}
                className="btn-accent w-full font-medium py-3 rounded-lg transition-colors text-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  checked,
  onChange,
  children,
}: {
  title: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-0"
          style={{ accentColor: 'var(--accent)' }}
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
          <div className="space-y-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
