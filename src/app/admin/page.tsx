'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WebsiteScanModal from '@/components/WebsiteScanModal';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeBase, Product, Competitor, CaseStudy, DEFAULT_SETTINGS, BrandGuidelines, DEFAULT_BRAND_GUIDELINES } from '@/lib/types';
import { GOOGLE_FONTS, DOCUMENT_STYLE_OPTIONS } from '@/lib/brandDefaults';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowUpTray,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineCheck,
} from 'react-icons/hi2';
import VoiceButton from '@/components/VoiceButton';

const EMPTY_PRODUCT: () => Product = () => ({
  id: uuidv4(),
  name: '',
  description: '',
  keyFeatures: [''],
  pricing: '',
});

const EMPTY_COMPETITOR: () => Competitor = () => ({
  id: uuidv4(),
  name: '',
  howWeBeatThem: '',
});

const EMPTY_CASE_STUDY: () => CaseStudy = () => ({
  id: uuidv4(),
  title: '',
  content: '',
});

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'products' | 'competitive' | 'brand' | 'guidelines' | 'documents' | 'settings'>('company');
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'full' | 'rescan'>('full');

  // ── Voice Note State ──
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceExtracting, setVoiceExtracting] = useState(false);
  const [voiceExtraction, setVoiceExtraction] = useState<{
    type: string;
    caseStudy: { title: string; content: string } | null;
    differentiators: string[] | null;
    productUpdate: { productName: string; update: string } | null;
    competitorInfo: { name: string; notes: string } | null;
    summary: string;
  } | null>(null);
  const [voiceAdding, setVoiceAdding] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as Record<string, unknown>)?.role !== 'admin') {
      router.push('/generate');
    }
  }, [status, session, router]);

  const loadKB = useCallback(async () => {
    const res = await fetch('/api/knowledge-base');
    if (res.ok) setKb(await res.json());
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadKB();
  }, [status, loadKB]);

  // Initialize brandGuidelines if missing
  const getBrandGuidelines = useCallback((): BrandGuidelines => {
    return kb?.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES };
  }, [kb]);

  const updateBrandGuidelines = useCallback((update: Partial<BrandGuidelines>) => {
    if (!kb) return;
    const current = kb.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES };
    setKb({ ...kb, brandGuidelines: { ...current, ...update } });
  }, [kb]);

  const save = async () => {
    if (!kb) return;
    setSaving(true);
    const payload = {
      ...kb,
      brandGuidelines: kb.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES },
    };
    const res = await fetch('/api/knowledge-base', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) toast.success('Knowledge base saved!');
    else toast.error('Failed to save');
  };

  // ── Voice Note Functions ──
  const extractVoiceNote = async (transcript: string) => {
    setVoiceExtracting(true);
    setVoiceExtraction(null);
    try {
      const res = await fetch('/api/voice-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (res.ok) {
        const data = await res.json();
        setVoiceExtraction(data);
      } else {
        toast.error('Failed to extract voice note');
      }
    } catch {
      toast.error('Failed to extract voice note');
    }
    setVoiceExtracting(false);
  };

  const addVoiceToKB = async () => {
    if (!kb || !voiceExtraction) return;
    setVoiceAdding(true);
    try {
      const updated = { ...kb };

      if (voiceExtraction.caseStudy) {
        updated.caseStudies = [
          ...updated.caseStudies,
          { id: uuidv4(), title: voiceExtraction.caseStudy.title, content: voiceExtraction.caseStudy.content },
        ];
      }

      if (voiceExtraction.differentiators && voiceExtraction.differentiators.length > 0) {
        const existing = updated.differentiators || '';
        const newDiffs = voiceExtraction.differentiators.map(d => `- ${d}`).join('\n');
        updated.differentiators = existing ? existing + '\n' + newDiffs : newDiffs;
      }

      if (voiceExtraction.competitorInfo) {
        const existingComp = updated.competitors.find(
          c => c.name.toLowerCase() === voiceExtraction.competitorInfo!.name.toLowerCase()
        );
        if (existingComp) {
          updated.competitors = updated.competitors.map(c =>
            c.id === existingComp.id
              ? { ...c, howWeBeatThem: c.howWeBeatThem + '\n' + voiceExtraction.competitorInfo!.notes }
              : c
          );
        } else {
          updated.competitors = [
            ...updated.competitors,
            { id: uuidv4(), name: voiceExtraction.competitorInfo.name, howWeBeatThem: voiceExtraction.competitorInfo.notes },
          ];
        }
      }

      // Save the updated KB
      const payload = {
        ...updated,
        brandGuidelines: updated.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES },
      };
      const res = await fetch('/api/knowledge-base', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setKb(updated);
        toast.success('Added to Knowledge Base!');
        setVoiceTranscript('');
        setVoiceExtraction(null);
      } else {
        toast.error('Failed to save to Knowledge Base');
      }
    } catch {
      toast.error('Failed to save to Knowledge Base');
    }
    setVoiceAdding(false);
  };

  const handleScanImport = async (updatedKb: KnowledgeBase) => {
    // Save to server
    const res = await fetch('/api/knowledge-base', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedKb),
    });
    if (res.ok) {
      setKb(updatedKb);
      const productCount = updatedKb.products.length;
      const csCount = updatedKb.caseStudies.length;
      toast.success(`Knowledge base updated with ${productCount} product${productCount !== 1 ? 's' : ''}, ${csCount} case stud${csCount !== 1 ? 'ies' : 'y'}`);
    } else {
      toast.error('Failed to save scanned data');
    }
  };

  const openScanner = (mode: 'full' | 'rescan') => {
    setScanMode(mode);
    setScanModalOpen(true);
  };

  // ── Smart brand import state ──
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const importBrandDocument = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      // Step 1: Parse the file content
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'brand-voice');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) { toast.error('Failed to parse document'); setImporting(false); return; }
      const uploadData = await uploadRes.json();
      const docContent = uploadData.content;

      // Step 2: Send to AI for brand extraction
      const parseRes = await fetch('/api/brand-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentContent: docContent, fileName: file.name }),
      });
      if (!parseRes.ok) { toast.error('AI parsing failed'); setImporting(false); return; }
      const extracted = await parseRes.json();

      // Step 3: Merge extracted values into brand guidelines (only non-null values)
      setKb((prev) => {
        if (!prev) return prev;
        const current = prev.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES };
        const updated = { ...current };

        if (extracted.colors) {
          updated.colors = {
            primary: extracted.colors.primary || current.colors.primary,
            secondary: extracted.colors.secondary || current.colors.secondary,
            accent: extracted.colors.accent || current.colors.accent,
            background: extracted.colors.background || current.colors.background,
            text: extracted.colors.text || current.colors.text,
          };
        }
        if (extracted.fonts) {
          updated.fonts = {
            primary: extracted.fonts.primary || current.fonts.primary,
            secondary: extracted.fonts.secondary || current.fonts.secondary,
            sizes: {
              h1: extracted.fonts.sizes?.h1 || current.fonts.sizes.h1,
              h2: extracted.fonts.sizes?.h2 || current.fonts.sizes.h2,
              h3: extracted.fonts.sizes?.h3 || current.fonts.sizes.h3,
              body: extracted.fonts.sizes?.body || current.fonts.sizes.body,
            },
          };
        }
        if (extracted.voice) {
          updated.voice = {
            guidelinesText: extracted.voice.guidelinesText || current.voice.guidelinesText,
            documentContent: docContent,
            approvedTerms: (extracted.voice.approvedTerms?.length > 0) ? extracted.voice.approvedTerms : current.voice.approvedTerms,
            bannedTerms: (extracted.voice.bannedTerms?.length > 0) ? extracted.voice.bannedTerms : current.voice.bannedTerms,
            tagline: extracted.voice.tagline || current.voice.tagline,
          };
        }
        if (extracted.documentStyle) {
          updated.documentStyle = extracted.documentStyle;
        }

        // Build summary of what was found
        const found: string[] = [];
        if (extracted.colors?.primary || extracted.colors?.secondary) found.push('colors');
        if (extracted.fonts?.primary) found.push('fonts');
        if (extracted.voice?.guidelinesText) found.push('voice guidelines');
        if (extracted.voice?.approvedTerms?.length > 0) found.push(`${extracted.voice.approvedTerms.length} approved terms`);
        if (extracted.voice?.bannedTerms?.length > 0) found.push(`${extracted.voice.bannedTerms.length} banned terms`);
        if (extracted.voice?.tagline) found.push('tagline');
        if (extracted.documentStyle) found.push('document style');
        setImportResult(found.length > 0 ? `Extracted: ${found.join(', ')}` : 'No brand settings found in document');

        return { ...prev, brandGuidelines: updated };
      });

      toast.success('Brand guidelines imported!');
    } catch {
      toast.error('Import failed');
    }
    setImporting(false);
  };

  const uploadFile = async (file: File, purpose: 'knowledge-base' | 'logo' | 'logo-secondary' | 'brand-voice') => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    setUploading(false);
    if (!res.ok) {
      toast.error('Upload failed');
      return;
    }
    const data = await res.json();
    if (purpose === 'logo') {
      setKb((prev) => prev ? { ...prev, logoPath: data.logoPath } : prev);
      // Also update brandGuidelines
      setKb((prev) => {
        if (!prev) return prev;
        const bg = prev.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES };
        return { ...prev, brandGuidelines: { ...bg, logos: { ...bg.logos, primaryPath: data.logoPath } } };
      });
      toast.success('Logo uploaded!');
    } else if (purpose === 'logo-secondary') {
      setKb((prev) => {
        if (!prev) return prev;
        const bg = prev.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES };
        return { ...prev, brandGuidelines: { ...bg, logos: { ...bg.logos, secondaryPath: data.logoPath } } };
      });
      toast.success('Secondary logo uploaded!');
    } else if (purpose === 'brand-voice') {
      setKb((prev) => {
        if (!prev) return prev;
        const bg = prev.brandGuidelines ?? { ...DEFAULT_BRAND_GUIDELINES };
        return { ...prev, brandGuidelines: { ...bg, voice: { ...bg.voice, documentContent: data.content || '' } } };
      });
      toast.success(`Brand voice document parsed: ${file.name}`);
    } else {
      setKb((prev) => prev ? {
        ...prev,
        uploadedDocuments: [...prev.uploadedDocuments, data],
      } : prev);
      toast.success(`Parsed: ${file.name}`);
    }
  };

  if (!kb) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}>
          <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'company' as const, label: 'Company Info' },
    { id: 'products' as const, label: 'Products & ICP' },
    { id: 'competitive' as const, label: 'Competitive' },
    { id: 'brand' as const, label: 'Brand & Cases' },
    { id: 'guidelines' as const, label: 'Brand Guidelines' },
    { id: 'documents' as const, label: 'Documents' },
    { id: 'settings' as const, label: 'Settings' },
  ];

  const bg = getBrandGuidelines();
  const fontsUrl = `https://fonts.googleapis.com/css2?family=${bg.fonts.primary.replace(/\s+/g, '+')}:wght@400;600;700&family=${bg.fonts.secondary.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1" style={{ backgroundColor: 'var(--content-bg)' }}>
        <div className="border-b px-8 py-5 flex items-center justify-between" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Knowledge Base Setup</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Configure your company information for content generation</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="btn-accent disabled:opacity-50 font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Website Scanner Section */}
        <div className="px-8 py-4">
          {!kb.companyName ? (
            <div className="rounded-xl p-6 text-white" style={{ background: `linear-gradient(to right, var(--accent), color-mix(in srgb, var(--accent) 80%, #7c3aed))` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <HiOutlineGlobeAlt className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">Build your knowledge base automatically</h2>
                  <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Enter your website URL and we will scan it to extract your company info, products, case studies, and more.
                  </p>
                  <button
                    onClick={() => openScanner('full')}
                    className="bg-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
                    style={{ color: 'var(--accent)' }}
                  >
                    Scan My Website
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                  <HiOutlineGlobeAlt className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Website Scanner</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Re-scan your website to find new content and updates</p>
                </div>
              </div>
              <button
                onClick={() => openScanner('rescan')}
                className="text-sm font-medium px-4 py-2 border rounded-lg transition-colors"
                style={{ color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
              >
                Re-scan Website
              </button>
            </div>
          )}
        </div>

        <div className="px-8 py-4 border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? ''
                    : 'hover:bg-gray-50'
                }`}
                style={activeTab === tab.id
                  ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 max-w-4xl">
          {/* ── Quick Add via Voice Note ── */}
          <div className="mb-6 border rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Quick Add via Voice</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Record a voice note about a customer win, differentiator, or product update
            </p>

            {!voiceTranscript && !voiceExtraction && (
              <div className="flex flex-col items-center py-4">
                <VoiceButton
                  size="lg"
                  onTranscript={(text) => {
                    setVoiceTranscript(text);
                    extractVoiceNote(text);
                  }}
                />
                <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Click the microphone to start recording</p>
              </div>
            )}

            {voiceTranscript && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transcript</label>
                  <textarea
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-y" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => extractVoiceNote(voiceTranscript)}
                      disabled={voiceExtracting}
                      className="text-xs font-medium" style={{ color: 'var(--accent)' }}
                    >
                      {voiceExtracting ? 'Re-analyzing...' : 'Re-analyze'}
                    </button>
                    <button
                      onClick={() => { setVoiceTranscript(''); setVoiceExtraction(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {voiceExtracting && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }} />
                    Extracting structured information...
                  </div>
                )}

                {voiceExtraction && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Extraction Preview</p>
                        <p className="text-xs text-gray-500 mt-0.5">{voiceExtraction.summary}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                        {voiceExtraction.type}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      {voiceExtraction.caseStudy && (
                        <p>1 new customer win: &quot;{voiceExtraction.caseStudy.title}&quot;</p>
                      )}
                      {voiceExtraction.differentiators && voiceExtraction.differentiators.length > 0 && (
                        <p>{voiceExtraction.differentiators.length} differentiator{voiceExtraction.differentiators.length > 1 ? 's' : ''}</p>
                      )}
                      {voiceExtraction.productUpdate && (
                        <p>Product update for {voiceExtraction.productUpdate.productName}</p>
                      )}
                      {voiceExtraction.competitorInfo && (
                        <p>Competitor intel on {voiceExtraction.competitorInfo.name}</p>
                      )}
                    </div>

                    <button
                      onClick={addVoiceToKB}
                      disabled={voiceAdding}
                      className="btn-accent inline-flex items-center gap-1.5 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <HiOutlineCheck className="text-base" />
                      {voiceAdding ? 'Adding...' : 'Add to Knowledge Base'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {activeTab === 'company' && (
            <div className="space-y-6">
              <Section title="Company Details" action={
                <button
                  onClick={() => openScanner(kb.companyName ? 'rescan' : 'full')}
                  className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}
                >
                  <HiOutlineGlobeAlt /> Scan Website
                </button>
              }>
                <Field label="Company Name" value={kb.companyName} onChange={(v) => setKb({ ...kb, companyName: v })} />
                <Field label="Tagline" value={kb.tagline} onChange={(v) => setKb({ ...kb, tagline: v })} />
                <Field label="Website" value={kb.website} onChange={(v) => setKb({ ...kb, website: v })} />
                <TextArea label="About Us" value={kb.aboutUs} onChange={(v) => setKb({ ...kb, aboutUs: v })} rows={5} />
                <TextArea label="Key Differentiators" value={kb.differentiators} onChange={(v) => setKb({ ...kb, differentiators: v })} rows={4} />
              </Section>

              <Section title="Company Logo">
                <div className="flex items-center gap-4">
                  {kb.logoPath && (
                    <img src={kb.logoPath} alt="Logo" className="h-12 object-contain" />
                  )}
                  <label className="cursor-pointer border rounded-lg px-4 py-2 text-sm transition-colors flex items-center gap-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                    <HiOutlineArrowUpTray />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(file, 'logo');
                      }}
                    />
                  </label>
                </div>
              </Section>

              <Section title="Brand Color">
                <p className="text-sm text-gray-500 mb-2">Choose your primary brand color. This will be used as the accent color in PDF exports.</p>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={kb.brandColor || '#4a4ae0'}
                    onChange={(v) => setKb({ ...kb, brandColor: v.target.value })}
                    className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={kb.brandColor || '#4a4ae0'}
                    onChange={(v) => setKb({ ...kb, brandColor: v.target.value })}
                    placeholder="#4a4ae0"
                    className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 font-mono" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  />
                  {kb.brandColor && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: kb.brandColor }} />
                      <button
                        onClick={() => setKb({ ...kb, brandColor: '' })}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        Reset to default
                      </button>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <Section title="Products & Services" action={
                <button onClick={() => setKb({ ...kb, products: [...kb.products, EMPTY_PRODUCT()] })}
                  className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <HiOutlinePlus /> Add Product
                </button>
              }>
                {kb.products.map((product, idx) => (
                  <div key={product.id} className="border rounded-xl p-5 space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-400 uppercase">Product {idx + 1}</span>
                      <button onClick={() => setKb({ ...kb, products: kb.products.filter((p) => p.id !== product.id) })}
                        className="text-red-400 hover:text-red-600"><HiOutlineTrash /></button>
                    </div>
                    <Field label="Name" value={product.name} onChange={(v) => {
                      const products = [...kb.products]; products[idx] = { ...product, name: v }; setKb({ ...kb, products });
                    }} />
                    <TextArea label="Description" value={product.description} rows={3} onChange={(v) => {
                      const products = [...kb.products]; products[idx] = { ...product, description: v }; setKb({ ...kb, products });
                    }} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label>
                      {product.keyFeatures.map((feat, fi) => (
                        <div key={fi} className="flex gap-2 mb-2">
                          <input value={feat} onChange={(e) => {
                            const products = [...kb.products];
                            const features = [...product.keyFeatures]; features[fi] = e.target.value;
                            products[idx] = { ...product, keyFeatures: features }; setKb({ ...kb, products });
                          }} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
                          <button onClick={() => {
                            const products = [...kb.products];
                            products[idx] = { ...product, keyFeatures: product.keyFeatures.filter((_, i) => i !== fi) };
                            setKb({ ...kb, products });
                          }} className="text-red-400 hover:text-red-600"><HiOutlineTrash /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const products = [...kb.products];
                        products[idx] = { ...product, keyFeatures: [...product.keyFeatures, ''] };
                        setKb({ ...kb, products });
                      }} className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--accent)' }}>
                        <HiOutlinePlus /> Add Feature
                      </button>
                    </div>
                    <Field label="Pricing" value={product.pricing} onChange={(v) => {
                      const products = [...kb.products]; products[idx] = { ...product, pricing: v }; setKb({ ...kb, products });
                    }} />
                  </div>
                ))}
              </Section>

              <Section title="Ideal Customer Profile">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Industries</label>
                  <TagInput values={kb.icp.industries} onChange={(v) => setKb({ ...kb, icp: { ...kb.icp, industries: v } })} />
                </div>
                <Field label="Company Size" value={kb.icp.companySize} onChange={(v) => setKb({ ...kb, icp: { ...kb.icp, companySize: v } })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personas</label>
                  <TagInput values={kb.icp.personas} onChange={(v) => setKb({ ...kb, icp: { ...kb.icp, personas: v } })} />
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'competitive' && (
            <Section title="Competitors" action={
              <button onClick={() => setKb({ ...kb, competitors: [...kb.competitors, EMPTY_COMPETITOR()] })}
                className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                <HiOutlinePlus /> Add Competitor
              </button>
            }>
              {kb.competitors.map((comp, idx) => (
                <div key={comp.id} className="border rounded-xl p-5 space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-gray-400 uppercase">Competitor {idx + 1}</span>
                    <button onClick={() => setKb({ ...kb, competitors: kb.competitors.filter((c) => c.id !== comp.id) })}
                      className="text-red-400 hover:text-red-600"><HiOutlineTrash /></button>
                  </div>
                  <Field label="Competitor Name" value={comp.name} onChange={(v) => {
                    const competitors = [...kb.competitors]; competitors[idx] = { ...comp, name: v }; setKb({ ...kb, competitors });
                  }} />
                  <TextArea label="How We Beat Them" value={comp.howWeBeatThem} rows={4} onChange={(v) => {
                    const competitors = [...kb.competitors]; competitors[idx] = { ...comp, howWeBeatThem: v }; setKb({ ...kb, competitors });
                  }} />
                </div>
              ))}
            </Section>
          )}

          {activeTab === 'brand' && (
            <div className="space-y-6">
              <Section title="Brand Voice">
                <TextArea label="Tone Description" value={kb.brandVoice.tone} rows={3} onChange={(v) => setKb({ ...kb, brandVoice: { ...kb.brandVoice, tone: v } })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Words to Use</label>
                  <TagInput values={kb.brandVoice.wordsToUse} onChange={(v) => setKb({ ...kb, brandVoice: { ...kb.brandVoice, wordsToUse: v } })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Words to Avoid</label>
                  <TagInput values={kb.brandVoice.wordsToAvoid} onChange={(v) => setKb({ ...kb, brandVoice: { ...kb.brandVoice, wordsToAvoid: v } })} />
                </div>
              </Section>

              <Section title="Case Studies" action={
                <button onClick={() => setKb({ ...kb, caseStudies: [...kb.caseStudies, EMPTY_CASE_STUDY()] })}
                  className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <HiOutlinePlus /> Add Case Study
                </button>
              }>
                {kb.caseStudies.map((cs, idx) => (
                  <div key={cs.id} className="border rounded-xl p-5 space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-400 uppercase">Case Study {idx + 1}</span>
                      <button onClick={() => setKb({ ...kb, caseStudies: kb.caseStudies.filter((c) => c.id !== cs.id) })}
                        className="text-red-400 hover:text-red-600"><HiOutlineTrash /></button>
                    </div>
                    <Field label="Title" value={cs.title} onChange={(v) => {
                      const caseStudies = [...kb.caseStudies]; caseStudies[idx] = { ...cs, title: v }; setKb({ ...kb, caseStudies });
                    }} />
                    <TextArea label="Content" value={cs.content} rows={6} onChange={(v) => {
                      const caseStudies = [...kb.caseStudies]; caseStudies[idx] = { ...cs, content: v }; setKb({ ...kb, caseStudies });
                    }} />
                  </div>
                ))}
              </Section>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-6">
              {/* Load Google Fonts */}
              {/* eslint-disable-next-line @next/next/no-page-custom-font */}
              <link rel="stylesheet" href={fontsUrl} />

              {/* ── Smart Brand Import ── */}
              <div className="rounded-xl p-6 text-white" style={{ background: `linear-gradient(to right, var(--accent), color-mix(in srgb, var(--accent) 85%, #1e1b4b))` }}>
                <h2 className="text-lg font-semibold mb-1">Import Brand Guidelines</h2>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Upload your existing brand guidelines document (PDF, DOCX, or TXT) and AI will automatically extract colors, fonts, voice, terminology, and style preferences.
                </p>
                <div className="flex items-center gap-4">
                  <label className={`cursor-pointer inline-flex items-center gap-2 bg-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm ${importing ? 'opacity-50 pointer-events-none' : ''}`} style={{ color: 'var(--accent)' }}>
                    <HiOutlineArrowUpTray />
                    {importing ? 'Analyzing document...' : 'Upload Brand Guidelines Document'}
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="hidden"
                      disabled={importing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) importBrandDocument(file);
                      }}
                    />
                  </label>
                  {importing && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI is reading your brand guidelines...
                    </div>
                  )}
                </div>
                {importResult && (
                  <div className="mt-3 bg-white/10 rounded-lg px-4 py-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {importResult}
                  </div>
                )}
                <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Extracted settings will be filled in below. Review and adjust anything the AI missed, then hit Save Changes.
                </p>
              </div>

              {/* ── Colors Section ── */}
              <Section title="Colors">
                <p className="text-sm text-gray-500 mb-4">Define your brand color palette. These colors are applied across all generated documents.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([
                    { key: 'primary' as const, label: 'Primary', hint: 'Headers and section titles' },
                    { key: 'secondary' as const, label: 'Secondary', hint: 'Stat cards and highlights' },
                    { key: 'accent' as const, label: 'Accent', hint: 'CTAs and links' },
                    { key: 'background' as const, label: 'Background', hint: 'Page background' },
                    { key: 'text' as const, label: 'Text', hint: 'Body copy' },
                  ]).map(({ key, label, hint }) => (
                    <div key={key} className="flex items-start gap-3">
                      <input
                        type="color"
                        value={bg.colors[key]}
                        onChange={(e) => {
                          updateBrandGuidelines({ colors: { ...bg.colors, [key]: e.target.value } });
                        }}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        <p className="text-xs text-gray-400 mb-1">{hint}</p>
                        <input
                          type="text"
                          value={bg.colors[key]}
                          onChange={(e) => {
                            updateBrandGuidelines({ colors: { ...bg.colors, [key]: e.target.value } });
                          }}
                          placeholder="#000000"
                          className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Live color preview strip */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Live Preview</label>
                  <div className="flex rounded-lg overflow-hidden h-10 border border-gray-200">
                    <div className="flex-1" style={{ backgroundColor: bg.colors.primary }} title="Primary" />
                    <div className="flex-1" style={{ backgroundColor: bg.colors.secondary }} title="Secondary" />
                    <div className="flex-1" style={{ backgroundColor: bg.colors.accent }} title="Accent" />
                    <div className="flex-1" style={{ backgroundColor: bg.colors.background, borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }} title="Background" />
                    <div className="flex-1" style={{ backgroundColor: bg.colors.text }} title="Text" />
                  </div>
                  <div className="flex text-[10px] text-gray-400 mt-1">
                    <span className="flex-1 text-center">Primary</span>
                    <span className="flex-1 text-center">Secondary</span>
                    <span className="flex-1 text-center">Accent</span>
                    <span className="flex-1 text-center">Background</span>
                    <span className="flex-1 text-center">Text</span>
                  </div>
                </div>
              </Section>

              {/* ── Typography Section ── */}
              <Section title="Typography">
                <p className="text-sm text-gray-500 mb-4">Select fonts and sizes used across generated content.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Font</label>
                    <select
                      value={bg.fonts.primary}
                      onChange={(e) => {
                        updateBrandGuidelines({ fonts: { ...bg.fonts, primary: e.target.value } });
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                    >
                      {GOOGLE_FONTS.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Font</label>
                    <select
                      value={bg.fonts.secondary}
                      onChange={(e) => {
                        updateBrandGuidelines({ fonts: { ...bg.fonts, secondary: e.target.value } });
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                    >
                      {GOOGLE_FONTS.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {([
                    { key: 'h1' as const, label: 'H1 Size (pt)' },
                    { key: 'h2' as const, label: 'H2 Size (pt)' },
                    { key: 'h3' as const, label: 'H3 Size (pt)' },
                    { key: 'body' as const, label: 'Body Size (pt)' },
                  ]).map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="number"
                        min={6}
                        max={72}
                        value={bg.fonts.sizes[key]}
                        onChange={(e) => {
                          updateBrandGuidelines({
                            fonts: { ...bg.fonts, sizes: { ...bg.fonts.sizes, [key]: Number(e.target.value) || bg.fonts.sizes[key] } },
                          });
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>

                {/* Live text preview */}
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-3">Live Text Preview</label>
                  <div style={{ fontFamily: `'${bg.fonts.primary}', sans-serif`, fontSize: `${Math.round(bg.fonts.sizes.h1 * 1.333)}px`, fontWeight: 700, color: bg.colors.primary, lineHeight: 1.2 }}>
                    Heading One
                  </div>
                  <div style={{ fontFamily: `'${bg.fonts.primary}', sans-serif`, fontSize: `${Math.round(bg.fonts.sizes.h2 * 1.333)}px`, fontWeight: 600, color: bg.colors.primary, lineHeight: 1.3, marginTop: 8 }}>
                    Heading Two
                  </div>
                  <div style={{ fontFamily: `'${bg.fonts.secondary}', sans-serif`, fontSize: `${Math.round(bg.fonts.sizes.h3 * 1.333)}px`, fontWeight: 600, color: bg.colors.text, lineHeight: 1.4, marginTop: 6 }}>
                    Heading Three
                  </div>
                  <p style={{ fontFamily: `'${bg.fonts.secondary}', sans-serif`, fontSize: `${Math.round(bg.fonts.sizes.body * 1.333)}px`, color: bg.colors.text, lineHeight: 1.6, marginTop: 6 }}>
                    This is body copy rendered in your secondary font. It gives you a sense of how your generated documents will look with the selected typography.
                  </p>
                </div>
              </Section>

              {/* ── Logo Section ── */}
              <Section title="Logos">
                <p className="text-sm text-gray-500 mb-4">Upload your primary and secondary (white/dark-background) logos for document branding.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Primary Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Logo</label>
                    <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[80px] flex items-center justify-center">
                      {bg.logos.primaryPath ? (
                        <img src={bg.logos.primaryPath} alt="Primary logo" className="max-h-16 object-contain" />
                      ) : (
                        <span className="text-xs text-gray-400">No logo uploaded</span>
                      )}
                    </div>
                    <label className="cursor-pointer mt-2 inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                      <HiOutlineArrowUpTray />
                      {uploading ? 'Uploading...' : 'Upload Primary Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadFile(file, 'logo');
                        }}
                      />
                    </label>
                  </div>

                  {/* Secondary Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary / White Logo</label>
                    <div className="border border-gray-200 rounded-lg p-4 min-h-[80px] flex items-center justify-center" style={{ backgroundColor: '#1e293b' }}>
                      {bg.logos.secondaryPath ? (
                        <img src={bg.logos.secondaryPath} alt="Secondary logo" className="max-h-16 object-contain" />
                      ) : (
                        <span className="text-xs text-gray-400">No logo uploaded</span>
                      )}
                    </div>
                    <label className="cursor-pointer mt-2 inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                      <HiOutlineArrowUpTray />
                      {uploading ? 'Uploading...' : 'Upload Secondary Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadFile(file, 'logo-secondary');
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Logo Placement */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Placement</label>
                  <select
                    value={bg.logos.placement}
                    onChange={(e) => {
                      updateBrandGuidelines({ logos: { ...bg.logos, placement: e.target.value as 'top-left' | 'top-center' | 'top-right' } });
                    }}
                    className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
              </Section>

              {/* ── Voice & Terminology Section ── */}
              <Section title="Voice & Terminology">
                <TextArea
                  label="Brand Voice Guidelines"
                  value={bg.voice.guidelinesText}
                  rows={6}
                  onChange={(v) => {
                    updateBrandGuidelines({ voice: { ...bg.voice, guidelinesText: v } });
                  }}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Voice Document</label>
                  <p className="text-xs text-gray-400 mb-2">Upload a document containing your brand voice guidelines. It will be parsed and stored for reference during content generation.</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                    <HiOutlineArrowUpTray />
                    {uploading ? 'Uploading...' : 'Upload Brand Voice Document'}
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(file, 'brand-voice');
                      }}
                    />
                  </label>
                  {bg.voice.documentContent && (
                    <p className="text-xs text-green-600 mt-2">Brand voice document loaded ({bg.voice.documentContent.length} characters)</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved Terms</label>
                  <TagInput
                    values={bg.voice.approvedTerms}
                    onChange={(v) => {
                      updateBrandGuidelines({ voice: { ...bg.voice, approvedTerms: v } });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banned Terms</label>
                  <TagInput
                    values={bg.voice.bannedTerms}
                    onChange={(v) => {
                      updateBrandGuidelines({ voice: { ...bg.voice, bannedTerms: v } });
                    }}
                  />
                </div>

                <Field
                  label="Tagline"
                  value={bg.voice.tagline}
                  onChange={(v) => {
                    updateBrandGuidelines({ voice: { ...bg.voice, tagline: v } });
                  }}
                />
              </Section>

              {/* ── Document Style Section ── */}
              <Section title="Document Style">
                <p className="text-sm text-gray-500 mb-4">Choose the overall visual style for generated documents.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DOCUMENT_STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateBrandGuidelines({ documentStyle: option.value });
                      }}
                      className={`text-left border rounded-xl p-4 transition-all ${
                        bg.documentStyle === option.value
                          ? 'ring-2'
                          : 'hover:border-gray-300'
                      }`}
                      style={bg.documentStyle === option.value
                        ? { borderColor: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', '--tw-ring-color': 'color-mix(in srgb, var(--accent) 30%, transparent)' } as React.CSSProperties
                        : { borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }
                      }
                    >
                      <div className="text-sm font-semibold" style={{ color: bg.documentStyle === option.value ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {option.label}
                      </div>
                      <p className="text-xs mt-1" style={{ color: bg.documentStyle === option.value ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'settings' && (
            <Section title="Content Expiration Settings">
              <p className="text-sm text-gray-500 mb-2">Configure when content items get flagged as outdated.</p>
              <Field
                label={`Warning threshold (days) — currently ${kb.settings?.expirationWarningDays ?? DEFAULT_SETTINGS.expirationWarningDays}`}
                value={String(kb.settings?.expirationWarningDays ?? DEFAULT_SETTINGS.expirationWarningDays)}
                onChange={(v) => setKb({ ...kb, settings: { ...(kb.settings || DEFAULT_SETTINGS), expirationWarningDays: Number(v) || 90 } })}
              />
              <Field
                label={`Critical threshold (days) — currently ${kb.settings?.expirationCriticalDays ?? DEFAULT_SETTINGS.expirationCriticalDays}`}
                value={String(kb.settings?.expirationCriticalDays ?? DEFAULT_SETTINGS.expirationCriticalDays)}
                onChange={(v) => setKb({ ...kb, settings: { ...(kb.settings || DEFAULT_SETTINGS), expirationCriticalDays: Number(v) || 180 } })}
              />
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  Items older than <strong>{kb.settings?.expirationWarningDays ?? 90} days</strong> show an orange &quot;May be outdated&quot; badge.
                  Items older than <strong>{kb.settings?.expirationCriticalDays ?? 180} days</strong> show a red &quot;Outdated — regenerate&quot; badge.
                </p>
              </div>
            </Section>
          )}

          {activeTab === 'documents' && (
            <Section title="Uploaded Documents">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <HiOutlineDocumentText className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">Upload PDF, DOCX, or TXT files to add to your knowledge base</p>
                <label className="btn-accent cursor-pointer inline-flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-colors text-sm">
                  <HiOutlineArrowUpTray />
                  {uploading ? 'Uploading...' : 'Upload File'}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file, 'knowledge-base');
                    }}
                  />
                </label>
              </div>

              {kb.uploadedDocuments.length > 0 && (
                <div className="space-y-2 mt-4">
                  {kb.uploadedDocuments.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{doc.fileName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{doc.content.length} characters parsed &bull; {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => setKb({ ...kb, uploadedDocuments: kb.uploadedDocuments.filter((d) => d.id !== doc.id) })}
                        className="text-red-400 hover:text-red-600"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>
      </main>

      <WebsiteScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        mode={scanMode}
        existingKb={kb}
        onImport={handleScanImport}
        initialUrl={kb.website || ''}
      />
    </div>
  );
}

// Reusable form components
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-y"
        style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
      />
    </div>
  );
}

function TagInput({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, i) => (
          <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
            {v}
            <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="hover:text-red-600">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Type and press Enter"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
        />
        <button onClick={addTag} className="text-sm px-3" style={{ color: 'var(--accent)' }}>Add</button>
      </div>
    </div>
  );
}
