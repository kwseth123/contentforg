'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  ContentType,
  ContentCategory,
  CONTENT_TYPE_LABELS,
  CONTENT_CATEGORIES,
  ProspectInfo,
  GeneratedSection,
  ContentScores,
  ContentGrades,
  ContentGrade,
  BrandComplianceResult,
  BrandViolation,
  BrandGuidelines,
  ProductProfile,
  ProductCompetitorMapping,
  ProductPromptTemplate,
  DocumentStyle,
  ProspectBranding,
  PersonaType,
  PERSONA_CONFIGS,
  ProspectIntel,
  VisualSection,
} from '@/lib/types';
import { detectContentType, DOCUMENT_STYLE_OPTIONS, STYLE_WRITING_INSTRUCTIONS } from '@/lib/brandDefaults';
import { generateVariationSeed, getFixedSeed, VariationSeed, getHookLabel, getVoiceLabel } from '@/lib/variation';
import { buildPersonaContext } from '@/lib/prompts';
import {
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineClipboard,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineEnvelope,
  HiOutlineBookOpen,
  HiOutlineXMark,
  HiOutlineBolt,
  HiOutlineEye,
  HiOutlineExclamationTriangle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineMagnifyingGlass,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';
import VoiceButton from '@/components/VoiceButton';
import { calculateReadingTime } from '@/lib/readingTime';
import { useProspectMemory } from '@/hooks/useProspectMemory';
import { generateShareableHtml } from '@/lib/shareableHtml';

// ── Competitor Research Types ──
interface CompetitorResearchData {
  companyDescription: string;
  keyFeatures: string[];
  positioning: string;
  taglines: string[];
  customerClaims: string[];
  pricingInfo: string | null;
  g2Rating: string | null;
  g2Pros: string[];
  g2Cons: string[];
}

// ── Starter Prompt Chips ──
const STARTER_PROMPTS = [
  { label: 'Battle card vs [competitor] for a manufacturer', contentType: 'battle-card' as ContentType, text: 'Battle card vs [competitor] for a manufacturer' },
  { label: 'Cold email for a logistics prospect', contentType: 'outbound-email-sequence' as ContentType, text: 'Cold email sequence for a new logistics prospect' },
  { label: 'One-pager for a new executive', contentType: 'solution-one-pager' as ContentType, text: 'One-pager for an executive who hasn\'t heard of us' },
  { label: 'Competitive analysis against [competitor]', contentType: 'competitive-analysis' as ContentType, text: 'Competitive analysis against [competitor]' },
  { label: 'Conference leave-behind for [event]', contentType: 'conference-leave-behind' as ContentType, text: 'Conference leave-behind for [event name]' },
  { label: 'Executive summary for committee', contentType: 'executive-summary' as ContentType, text: 'Executive summary for a deal going to committee' },
];

// Helper: find which category a content type belongs to
function findCategoryForType(ct: ContentType): ContentCategory {
  for (const [catKey, catVal] of Object.entries(CONTENT_CATEGORIES)) {
    if (catVal.types.includes(ct)) return catKey as ContentCategory;
  }
  return 'prospect-documents';
}

// Helper: find product-specific competitor mapping
function findProductCompetitorMapping(
  product: ProductProfile | null,
  compName: string,
  additionalCtx: string,
  allProds: ProductProfile[]
): { product: ProductProfile; mapping: ProductCompetitorMapping } | null {
  if (!compName && !additionalCtx) return null;

  const checkProduct = (p: ProductProfile): ProductCompetitorMapping | undefined => {
    const mappings = p.competitorMappings || [];
    const nameToCheck = compName.trim().toLowerCase();
    if (nameToCheck) {
      const match = mappings.find(m => m.competitorName.trim().toLowerCase() === nameToCheck);
      if (match) return match;
    }
    const ctxLower = additionalCtx.toLowerCase();
    for (const m of mappings) {
      if (m.competitorName.trim() && ctxLower.includes(m.competitorName.trim().toLowerCase())) {
        return m;
      }
    }
    return undefined;
  };

  if (product) {
    const mapping = checkProduct(product);
    if (mapping) return { product, mapping };
  }

  for (const p of allProds) {
    if (product && p.id === product.id) continue;
    const mapping = checkProduct(p);
    if (mapping) return { product: p, mapping };
  }

  return null;
}

// Helper: build product-specific competitive data block
function buildProductCompetitorBlock(product: ProductProfile, mapping: ProductCompetitorMapping): string {
  const lines: string[] = [];
  lines.push(`## PRODUCT-SPECIFIC COMPETITIVE DATA`);
  lines.push(`Product: ${product.name} vs ${mapping.competitorName}`);
  lines.push(`Their Equivalent: ${mapping.theirEquivalentProduct}`);
  lines.push(`How We Win: ${mapping.howWeWin.map(b => `- ${b}`).join('\n')}`);
  lines.push(`How They Win (internal): ${mapping.howTheyWin.map(b => `- ${b}`).join('\n')}`);
  lines.push(`Recommended Talk Track: ${mapping.talkTrack}`);
  lines.push(`Historical Win Rate: ${mapping.winRate}%`);
  lines.push('');
  lines.push('Use this specific product-level competitive data to make the analysis precise and actionable.');
  return lines.join('\n');
}

// Helper: build product context block for injection into generation
function buildProductContextBlock(product: ProductProfile): string {
  const lines: string[] = [];
  lines.push(`## PRODUCT FOCUS: ${product.name}`);
  lines.push(product.shortDescription);
  lines.push('');
  lines.push('### Full Description');
  lines.push(product.fullDescription);
  lines.push('');
  lines.push('### Key Features');
  lines.push(product.features.map(f => `- ${f.name}: ${f.description}`).join('\n'));
  lines.push('');
  lines.push('### Key Benefits');
  lines.push(product.benefits.map(b => `- ${b}`).join('\n'));
  lines.push('');
  lines.push('### Differentiators');
  lines.push(product.differentiators.map(d => `- ${d}`).join('\n'));
  lines.push('');
  lines.push('### Proof Points');
  lines.push(product.proofPoints.map(p => `- ${p}`).join('\n'));
  lines.push('');
  lines.push('### Objection Responses');
  lines.push(product.objections.map(o => `Objection: "${o.objection}" → Response: "${o.response}"`).join('\n'));
  lines.push('');
  lines.push('### Ideal Use Case');
  lines.push(product.idealUseCase);
  lines.push('');
  lines.push('IMPORTANT: Build this document specifically around this product. Use the features, benefits, and proof points above. Never contradict the product profile. If the knowledge base conflicts with the product profile, the product profile wins.');
  return lines.join('\n');
}

// Helper: auto-detect products from text
function detectProductsFromText(text: string, products: ProductProfile[]): ProductProfile[] {
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  return products.filter(p => {
    if (p.status === 'sunset') return false;
    const nameMatch = lower.includes(p.name.toLowerCase());
    const descMatch = p.shortDescription && lower.includes(p.shortDescription.toLowerCase());
    return nameMatch || descMatch;
  });
}

export default function GeneratePageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <GeneratePage />
    </Suspense>
  );
}

function GeneratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contentType, setContentType] = useState<ContentType>('competitive-analysis');
  const [activeCategory, setActiveCategory] = useState<ContentCategory>('internal-sales');
  const [prospect, setProspect] = useState<ProspectInfo>({
    companyName: '',
    industry: '',
    companySize: '',
    techStack: '',
    painPoints: '',
    website: '',
  });
  const [additionalContext, setAdditionalContext] = useState('');
  const [prospectBranding, setProspectBranding] = useState<ProspectBranding | null>(null);
  const [fetchingBranding, setFetchingBranding] = useState(false);
  const [toneLevel, setToneLevel] = useState(50);
  const [sessionDocuments, setSessionDocuments] = useState<string[]>([]);
  const [sessionFileNames, setSessionFileNames] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [rawStream, setRawStream] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const streamRef = useRef('');
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Scoring
  const [scores, setScores] = useState<ContentScores | null>(null);
  const [scoring, setScoring] = useState(false);

  // AI Grading
  const [grades, setGrades] = useState<ContentGrades | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeExpanded, setGradeExpanded] = useState(true);
  const [fixingDimension, setFixingDimension] = useState<string | null>(null);
  const [optimizingAll, setOptimizingAll] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState('');
  const [previousGrades, setPreviousGrades] = useState<ContentGrades | null>(null);

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Library share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTags, setShareTags] = useState<string[]>([]);
  const [shareTagInput, setShareTagInput] = useState('');

  // Natural language detection
  const [detectedType, setDetectedType] = useState<ContentType | null>(null);

  // Brand compliance
  const [compliance, setCompliance] = useState<BrandComplianceResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceExpanded, setComplianceExpanded] = useState(true);
  const [fixingViolations, setFixingViolations] = useState<Set<string>>(new Set());
  const [fixingAll, setFixingAll] = useState(false);

  // Brand preview mode
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Export warning dismissed
  const [exportWarningDismissed, setExportWarningDismissed] = useState(false);

  // Document style override (null = use brand default)
  const [selectedStyle, setSelectedStyle] = useState<DocumentStyle | null>(null);
  const [brandDefaultStyle, setBrandDefaultStyle] = useState<DocumentStyle>('modern');

  // ── Voice Dictation State ──
  const [voiceDictated, setVoiceDictated] = useState(false);

  // ── Persona-Aware Generation State ──
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaType[]>([]);
  const [personaMode, setPersonaMode] = useState<'combined' | 'separate'>('combined');
  const [personaVersions, setPersonaVersions] = useState<Record<PersonaType, GeneratedSection[]>>({} as Record<PersonaType, GeneratedSection[]>);
  const [activePersonaTab, setActivePersonaTab] = useState<PersonaType | null>(null);
  const [generatingAllPersonas, setGeneratingAllPersonas] = useState(false);
  const [personaProgress, setPersonaProgress] = useState('');

  // ── Prospect Intelligence State ──
  const [prospectIntel, setProspectIntel] = useState<ProspectIntel | null>(null);
  const [prospectIntelLoading, setProspectIntelLoading] = useState(false);
  const [prospectIntelExpanded, setProspectIntelExpanded] = useState(true);
  const prospectIntelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIntelCompanyRef = useRef<string>('');

  // ── Competitor Research State ──
  const [competitorResearch, setCompetitorResearch] = useState<CompetitorResearchData | null>(null);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState(false);
  const [researchPanelOpen, setResearchPanelOpen] = useState(true);

  // ── Visual Generation Pipeline State ──
  const [visualSections, setVisualSections] = useState<VisualSection[] | null>(null);
  const [planningPhase, setPlanningPhase] = useState<'idle' | 'planning' | 'rendering' | 'done'>('idle');

  // ── Content Variation Engine State ──
  const [variationOn, setVariationOn] = useState(false);
  const [currentSeed, setCurrentSeed] = useState<VariationSeed | null>(null);

  // ── Image Generation State ──
  const [imagesOn, setImagesOn] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{id:string;url:string;thumbUrl:string;alt:string;credit?:string;placement:string;sectionIndex:number;isSvg:boolean}[]>([]);

  // ── Product-Competitor Mapping State ──
  const [matchedCompetitorMapping, setMatchedCompetitorMapping] = useState<{ product: ProductProfile; mapping: ProductCompetitorMapping } | null>(null);

  // ── Product Library State ──
  const [allProducts, setAllProducts] = useState<ProductProfile[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showMoreProducts, setShowMoreProducts] = useState(false);
  const [industryMismatchDismissed, setIndustryMismatchDismissed] = useState(false);

  // Inline product picker (ambiguous detection)
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerCandidates, setPickerCandidates] = useState<ProductProfile[]>([]);
  const [pickerCountdown, setPickerCountdown] = useState(5);
  const [pickerBestMatch, setPickerBestMatch] = useState<ProductProfile | null>(null);
  const pickerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingGenerateRef = useRef(false);
  const autoGenerateTriggeredRef = useRef(false);

  // ── Prospect Memory ──
  const { findProspect } = useProspectMemory();
  const [prospectSuggestion, setProspectSuggestion] = useState<{companyName:string;items:{contentTypeLabel:string}[]}|null>(null);

  // Derived: active (non-sunset) products
  const activeProducts = allProducts.filter(p => p.status !== 'sunset');
  const selectedProduct = allProducts.find(p => p.id === selectedProductId) || null;

  // Max chips visible before "More"
  const MAX_VISIBLE_CHIPS = 6;
  const visibleProducts = activeProducts.slice(0, MAX_VISIBLE_CHIPS);
  const overflowProducts = activeProducts.slice(MAX_VISIBLE_CHIPS);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data: ProductProfile[] = await res.json();
          setAllProducts(data);
        }
      } catch { /* skip */ }
    };
    fetchProducts();
  }, []);

  // Fetch brand default style on mount
  useEffect(() => {
    const fetchBrandStyle = async () => {
      try {
        const res = await fetch('/api/knowledge-base');
        if (res.ok) {
          const kb = await res.json();
          if (kb.brandGuidelines?.documentStyle) {
            setBrandDefaultStyle(kb.brandGuidelines.documentStyle);
          }
        }
      } catch { /* skip */ }
    };
    fetchBrandStyle();
  }, []);

  // Hydrate from search params (template use)
  useEffect(() => {
    const ct = searchParams.get('contentType') as ContentType | null;
    const pName = searchParams.get('prospectName');
    const pInd = searchParams.get('industry');
    const pSize = searchParams.get('companySize');
    const pStack = searchParams.get('techStack');
    const pPain = searchParams.get('painPoints');
    const ctx = searchParams.get('context');
    const tone = searchParams.get('toneLevel');

    if (ct) {
      setContentType(ct);
      setActiveCategory(findCategoryForType(ct));
    }
    if (pName || pInd || pSize || pStack || pPain) {
      setProspect({
        companyName: pName || '',
        industry: pInd || '',
        companySize: pSize || '',
        techStack: pStack || '',
        painPoints: pPain || '',
      });
    }
    if (ctx) setAdditionalContext(ctx);
    if (tone) setToneLevel(Number(tone));
  }, [searchParams]);

  // ── Auto-Generate ("Feeling Lucky") from ?autoGenerate=true ──
  useEffect(() => {
    if (autoGenerateTriggeredRef.current) return;
    if (searchParams.get('autoGenerate') !== 'true') return;
    if (status !== 'authenticated') return;

    autoGenerateTriggeredRef.current = true;

    // Remove the query param from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete('autoGenerate');
    router.replace(url.pathname + url.search, { scroll: false });

    // Check KB data and auto-trigger generation
    const autoGen = async () => {
      try {
        const res = await fetch('/api/knowledge-base');
        if (!res.ok) return;
        const kb = await res.json();

        // Need at least a company name in KB to have enough context
        const hasEnoughData = !!(kb.companyName || kb.companyDescription);
        if (!hasEnoughData) return;

        // Pick a random content type for "Feeling Lucky"
        const allTypes = Object.keys(CONTENT_TYPE_LABELS) as ContentType[];
        const luckyType = allTypes[Math.floor(Math.random() * allTypes.length)];
        setContentType(luckyType);
        setActiveCategory(findCategoryForType(luckyType));

        // Set a generic prospect so validation passes
        setProspect(prev => ({
          ...prev,
          companyName: prev.companyName || 'Sample Prospect',
        }));
        setAdditionalContext(prev =>
          prev || `Auto-generated ${CONTENT_TYPE_LABELS[luckyType]} using knowledge base context`
        );

        // Trigger generation on next tick so state settles
        setTimeout(() => {
          generate();
        }, 0);
      } catch { /* skip */ }
    };

    autoGen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, status]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Auto-scroll right panel during streaming
  useEffect(() => {
    if (generating && rawStream && rightPanelRef.current) {
      rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight;
    }
  }, [rawStream, generating]);

  // Prospect memory effect
  useEffect(() => {
    if (prospect.companyName.trim().length >= 3) {
      const memory = findProspect(prospect.companyName);
      setProspectSuggestion(memory);
    } else {
      setProspectSuggestion(null);
    }
  }, [prospect.companyName, findProspect]);

  // Sticky bar scroll shadow state
  const [stickyScrolled, setStickyScrolled] = useState(false);

  // Natural language detection on additional context changes
  useEffect(() => {
    if (!additionalContext.trim()) {
      setDetectedType(null);
      return;
    }
    const detected = detectContentType(additionalContext);
    if (detected && detected !== contentType) {
      setDetectedType(detected);
    } else {
      setDetectedType(null);
    }
  }, [additionalContext, contentType]);

  // ── Prospect Intelligence: fetch function ──
  const fetchProspectIntel = useCallback(async (companyName: string, url?: string) => {
    const cacheKey = `prospect-intel-${companyName.toLowerCase().trim()}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed: ProspectIntel = JSON.parse(cached);
        const ageMinutes = (Date.now() - new Date(parsed.fetchedAt).getTime()) / 60000;
        if (ageMinutes < 30) {
          setProspectIntel(parsed);
          return;
        }
      }
    } catch { /* skip cache errors */ }

    setProspectIntelLoading(true);
    try {
      const res = await fetch('/api/prospect-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, url }),
      });
      if (res.ok) {
        const data: ProspectIntel = await res.json();
        setProspectIntel(data);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* skip */ }
      }
    } catch { /* skip */ }
    setProspectIntelLoading(false);
  }, []);

  // ── Prospect Intelligence: debounced auto-trigger ──
  useEffect(() => {
    const name = prospect.companyName.trim();
    if (name.length < 3) {
      setProspectIntel(null);
      lastIntelCompanyRef.current = '';
      return;
    }
    if (name === lastIntelCompanyRef.current) return;

    if (prospectIntelDebounceRef.current) clearTimeout(prospectIntelDebounceRef.current);
    prospectIntelDebounceRef.current = setTimeout(() => {
      lastIntelCompanyRef.current = name;
      fetchProspectIntel(name, prospect.website || undefined);
    }, 2000);

    return () => {
      if (prospectIntelDebounceRef.current) clearTimeout(prospectIntelDebounceRef.current);
    };
  }, [prospect.companyName, prospect.website, fetchProspectIntel]);

  // Industry mismatch check
  const industryMismatchWarning = (() => {
    if (!selectedProduct || industryMismatchDismissed) return null;
    if (!prospect.industry.trim()) return null;
    if (selectedProduct.targetIndustries.length === 0) return null;
    const prospectIndustryLower = prospect.industry.toLowerCase().trim();
    const isMatch = selectedProduct.targetIndustries.some(ti =>
      ti.toLowerCase().includes(prospectIndustryLower) || prospectIndustryLower.includes(ti.toLowerCase())
    );
    if (isMatch) return null;
    return {
      productName: selectedProduct.name,
      targetIndustries: selectedProduct.targetIndustries.join(', '),
      prospectIndustry: prospect.industry,
    };
  })();

  // Reset industry mismatch dismissal when product or prospect industry changes
  useEffect(() => {
    setIndustryMismatchDismissed(false);
  }, [selectedProductId, prospect.industry]);

  // Picker countdown timer
  useEffect(() => {
    if (!showProductPicker || !pickerBestMatch) return;

    setPickerCountdown(5);
    pickerTimerRef.current = setInterval(() => {
      setPickerCountdown(prev => {
        if (prev <= 1) {
          // Time's up — auto-select best match and proceed
          if (pickerTimerRef.current) clearInterval(pickerTimerRef.current);
          setSelectedProductId(pickerBestMatch.id);
          setShowProductPicker(false);
          setPickerCandidates([]);
          pendingGenerateRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pickerTimerRef.current) clearInterval(pickerTimerRef.current);
    };
  }, [showProductPicker, pickerBestMatch]);

  // Execute pending generation after picker resolves
  useEffect(() => {
    if (pendingGenerateRef.current && !showProductPicker) {
      pendingGenerateRef.current = false;
      executeGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProductPicker]);

  const parseSections = (text: string): GeneratedSection[] => {
    const sectionRegex = /## SECTION:\s*(.+?)(?=\n)/g;
    const parts = text.split(sectionRegex);
    const result: GeneratedSection[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      result.push({
        id: uuidv4(),
        title: parts[i].trim(),
        content: (parts[i + 1] || '').trim(),
      });
    }
    if (result.length === 0 && text.trim()) {
      result.push({ id: uuidv4(), title: 'Generated Content', content: text.trim() });
    }
    return result;
  };

  // Score content
  const scoreContent = async (secs: GeneratedSection[]) => {
    setScoring(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: secs, contentType }),
      });
      if (res.ok) {
        const s = await res.json();
        setScores(s);
        return s;
      }
    } catch { /* skip */ }
    setScoring(false);
    return null;
  };

  // Grade content (enhanced AI grading)
  const gradeContent = async (secs: GeneratedSection[]) => {
    setGrading(true);
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: secs, contentType, prospect }),
      });
      if (res.ok) {
        const g: ContentGrades = await res.json();
        setGrades(g);
        setGradeExpanded(true);
        setGrading(false);
        return g;
      }
    } catch { /* skip */ }
    setGrading(false);
    return null;
  };

  // Apply a single grade fix
  const applyGradeFix = async (dimensionKey: string, suggestion: string) => {
    if (!grades || !sections.length) return;

    setFixingDimension(dimensionKey);
    try {
      const sectionIndex = findBestSectionForDimension(dimensionKey, sections);

      const res = await fetch('/api/grade-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
          sectionIndex,
          suggestion,
          contentType,
          prospect,
        }),
      });

      if (res.ok) {
        const { updatedContent } = await res.json();
        setSections((prev) =>
          prev.map((s, i) => (i === sectionIndex ? { ...s, content: updatedContent } : s))
        );
        toast.success(`Fixed: ${dimensionKey}`);

        setPreviousGrades(grades);
        const updatedSections = sections.map((s, i) =>
          i === sectionIndex ? { ...s, content: updatedContent } : s
        );
        await gradeContent(updatedSections);
      }
    } catch {
      toast.error('Failed to apply fix');
    }
    setFixingDimension(null);
  };

  // Optimize all suggestions
  const optimizeAll = async () => {
    if (!grades || !sections.length) return;

    const dimensions = ['relevance', 'clarity', 'differentiation', 'proof', 'callToAction', 'personaFit'] as const;
    const toFix = dimensions.filter(
      (d) => grades[d].suggestion !== null && grades[d].score < 7
    );

    if (toFix.length < 2) return;

    setOptimizingAll(true);
    setPreviousGrades(grades);
    let currentSections = [...sections];

    for (const dim of toFix) {
      const suggestion = grades[dim].suggestion;
      if (!suggestion) continue;

      const dimLabels: Record<string, string> = {
        relevance: 'relevance', clarity: 'clarity', differentiation: 'differentiation',
        proof: 'proof', callToAction: 'CTA', personaFit: 'persona fit',
      };
      setOptimizeProgress(`Fixing ${dimLabels[dim]}...`);

      try {
        const sectionIndex = findBestSectionForDimension(dim, currentSections);
        const res = await fetch('/api/grade-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sections: currentSections, sectionIndex, suggestion, contentType, prospect,
          }),
        });

        if (res.ok) {
          const { updatedContent } = await res.json();
          currentSections = currentSections.map((s, i) =>
            i === sectionIndex ? { ...s, content: updatedContent } : s
          );
        }
      } catch { /* continue with next */ }
    }

    setSections(currentSections);
    setOptimizeProgress('Re-grading...');
    await gradeContent(currentSections);
    setOptimizingAll(false);
    setOptimizeProgress('');
    toast.success('All suggestions applied');
  };

  // Find the best section index for a given dimension
  const findBestSectionForDimension = (dimension: string, secs: GeneratedSection[]): number => {
    if (secs.length <= 1) return 0;

    const dimensionKeywords: Record<string, string[]> = {
      relevance: ['overview', 'introduction', 'summary', 'about', 'solution'],
      clarity: ['overview', 'introduction', 'summary', 'about'],
      differentiation: ['differ', 'why', 'strength', 'advantage', 'compare', 'vs'],
      proof: ['proof', 'case', 'result', 'evidence', 'metric', 'roi', 'success', 'testimonial'],
      callToAction: ['action', 'next step', 'cta', 'contact', 'getting started', 'conclusion', 'closing'],
      personaFit: ['overview', 'introduction', 'summary', 'solution'],
    };

    const keywords = dimensionKeywords[dimension] || [];
    for (let i = 0; i < secs.length; i++) {
      const titleLower = secs[i].title.toLowerCase();
      if (keywords.some((kw) => titleLower.includes(kw))) return i;
    }

    if (dimension === 'callToAction') return secs.length - 1;
    return 0;
  };

  // Brand compliance check
  const checkBrandCompliance = useCallback(async (secs: GeneratedSection[]) => {
    setComplianceLoading(true);
    setCompliance(null);
    try {
      // Fetch brand guidelines from knowledge base
      const kbRes = await fetch('/api/knowledge-base');
      let brandGuidelines: BrandGuidelines | undefined;
      if (kbRes.ok) {
        const kb = await kbRes.json();
        brandGuidelines = kb.brandGuidelines;
      }

      const res = await fetch('/api/brand-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: secs, brandGuidelines }),
      });
      if (res.ok) {
        const result: BrandComplianceResult = await res.json();
        setCompliance(result);
        setExportWarningDismissed(false);
      }
    } catch { /* skip */ }
    setComplianceLoading(false);
  }, []);

  // Save to history
  const saveToHistory = async (secs: GeneratedSection[], contentScores?: ContentScores | null, contentGrades?: ContentGrades | null) => {
    const historyItem = {
      id: uuidv4(),
      contentType,
      prospect: { ...prospect },
      additionalContext,
      toneLevel,
      sections: secs,
      generatedAt: new Date().toISOString(),
      generatedBy: session?.user?.name || 'Unknown',
      scores: contentScores || undefined,
      grades: contentGrades || undefined,
      variationSeed: currentSeed || undefined,
    };
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyItem),
    });
  };

  // Core generation logic (called after product resolution)
  // Helper: build the full additional context string for generation
  const buildFinalContext = (resolvedProduct: ProductProfile | null) => {
    let finalAdditionalContext = additionalContext;

    if (resolvedProduct) {
      const productBlock = buildProductContextBlock(resolvedProduct);
      finalAdditionalContext = productBlock + '\n\n---\n\n' + finalAdditionalContext;
    }

    // Inject competitor research data when available
    if (competitorResearch && (contentType === 'competitive-analysis' || contentType === 'battle-card')) {
      const crBlock = `## COMPETITOR INTELLIGENCE (from their website)
Company: ${competitorName}
Description: ${competitorResearch.companyDescription}
Their Key Features: ${competitorResearch.keyFeatures.join(', ')}
Their Positioning: ${competitorResearch.positioning}
Their Taglines: ${competitorResearch.taglines.join(', ')}
Customer Claims: ${competitorResearch.customerClaims.join(', ')}
${competitorResearch.pricingInfo ? `Pricing Info: ${competitorResearch.pricingInfo}` : ''}
${competitorResearch.g2Rating ? `G2 Rating: ${competitorResearch.g2Rating}` : ''}
${competitorResearch.g2Pros.length > 0 ? `G2 Pros: ${competitorResearch.g2Pros.join(', ')}` : ''}
${competitorResearch.g2Cons.length > 0 ? `G2 Cons: ${competitorResearch.g2Cons.join(', ')}` : ''}

Use this real competitor data to create a specific, data-driven competitive analysis.
Include a side-by-side comparison table, their actual weaknesses from reviews,
and exact talk tracks for when prospects bring them up.`;
      finalAdditionalContext = crBlock + '\n\n---\n\n' + finalAdditionalContext;
    }

    // Inject product-specific competitive data when available
    const pcMatch = findProductCompetitorMapping(resolvedProduct, competitorName, additionalContext, allProducts);
    if (pcMatch) {
      const pcBlock = buildProductCompetitorBlock(pcMatch.product, pcMatch.mapping);
      finalAdditionalContext = pcBlock + '\n\n---\n\n' + finalAdditionalContext;
      setMatchedCompetitorMapping(pcMatch);
    } else {
      setMatchedCompetitorMapping(null);
    }

    // Inject persona context when personas are selected
    if (selectedPersonas.length > 0) {
      const activePersonaConfigs = PERSONA_CONFIGS.filter(p => selectedPersonas.includes(p.id));
      const personaBlock = buildPersonaContext(activePersonaConfigs, personaMode);
      finalAdditionalContext = personaBlock + '\n\n---\n\n' + finalAdditionalContext;
    }

    // Inject prospect intelligence when available
    if (prospectIntel) {
      const intelBlock = `## PROSPECT INTELLIGENCE (live data)
Company: ${prospectIntel.companySnapshot.description}
Industry: ${prospectIntel.companySnapshot.industry}, Size: ${prospectIntel.companySnapshot.estimatedSize}
Tech Stack: ${prospectIntel.techStack.join(', ')}
Hiring Signals: ${prospectIntel.hiringSignals.summary}
Suggested Angle: ${prospectIntel.suggestedAngle}
Pain Points: ${prospectIntel.painPointHypotheses.join(', ')}

Use this real prospect data to make the content highly specific and relevant.`;
      finalAdditionalContext = intelBlock + '\n\n---\n\n' + finalAdditionalContext;
    }

    // Inject style-specific writing instructions
    const effectiveStyle = selectedStyle || brandDefaultStyle;
    const styleInstruction = STYLE_WRITING_INSTRUCTIONS[effectiveStyle];
    if (styleInstruction) {
      finalAdditionalContext = `WRITING STYLE INSTRUCTION: ${styleInstruction}\n\n` + finalAdditionalContext;
    }

    return finalAdditionalContext;
  };

  // Helper: convert VisualSection[] to GeneratedSection[] for scoring/history/library
  const visualToGeneratedSections = (vs: VisualSection[]): GeneratedSection[] =>
    vs.map(s => ({
      id: uuidv4(),
      title: s.title,
      content: s.content || '',
    }));

  // Helper: handle streaming fallback for visual mode failure
  const handleStreamingResponse = async (res: Response) => {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

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
              streamRef.current += parsed.text;
              setRawStream(streamRef.current);
            }
          } catch { /* skip */ }
        }
      }
    }

    return parseSections(streamRef.current);
  };

  // Helper: post-generation steps (scoring, saving, compliance)
  const postGeneration = async (parsed: GeneratedSection[], resolvedProduct: ProductProfile | null) => {
    const contentScores = await scoreContent(parsed);
    const contentGrades = await gradeContent(parsed);
    await saveToHistory(parsed, contentScores, contentGrades);
    setScoring(false);

    await checkBrandCompliance(parsed);

    // Fetch images if toggle is on
    if (imagesOn && parsed.length > 0) {
      fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: parsed, contentType, prospect }),
      })
        .then(res => res.ok ? res.json() : { images: [] })
        .then(data => setGeneratedImages(data.images || []))
        .catch(() => setGeneratedImages([]));
    }

    if (resolvedProduct) {
      try {
        await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: resolvedProduct.id }),
        });
      } catch { /* skip */ }
    }
  };

  const executeGeneration = async () => {
    setGenerating(true);
    setSections([]);
    setVisualSections(null);
    setPlanningPhase('planning');
    setScores(null);
    setCompliance(null);
    setRawStream('');
    streamRef.current = '';

    try {
      const resolvedProduct = allProducts.find(p => p.id === selectedProductId) || null;
      const finalAdditionalContext = buildFinalContext(resolvedProduct);

      // Generate variation seed
      const seed = variationOn ? generateVariationSeed() : getFixedSeed();
      setCurrentSeed(seed);

      // Try visual mode first
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, prospect, additionalContext: finalAdditionalContext, toneLevel, sessionDocuments, visualMode: true, variationSeed: seed }),
      });

      if (!res.ok) {
        toast.error('Generation failed');
        setGenerating(false);
        setPlanningPhase('idle');
        return;
      }

      const contentTypeHeader = res.headers.get('Content-Type') || '';

      if (contentTypeHeader.includes('application/json')) {
        // Visual mode succeeded — got JSON response
        const data = await res.json();
        if (data.visual && Array.isArray(data.sections) && data.sections.length > 0) {
          setPlanningPhase('rendering');
          setVisualSections(data.sections);
          const generatedSections = visualToGeneratedSections(data.sections);
          setSections(generatedSections);
          setPlanningPhase('done');
          await postGeneration(generatedSections, resolvedProduct);
        } else {
          // Unexpected JSON but not visual — treat as error, shouldn't happen
          toast.error('Generation returned unexpected format');
          setPlanningPhase('idle');
        }
      } else {
        // SSE stream fallback — visual mode failed silently
        setPlanningPhase('idle');
        const parsed = await handleStreamingResponse(res);
        if (parsed && parsed.length > 0) {
          setSections(parsed);
          await postGeneration(parsed, resolvedProduct);
        }
      }
    } catch {
      toast.error('Generation failed');
      setPlanningPhase('idle');
    }
    setGenerating(false);
  };

  const generate = async () => {
    if (!prospect.companyName) {
      toast.error('Please enter a prospect company name');
      return;
    }

    // Product auto-detection logic
    if (selectedProductId) {
      // Product already selected via chip — proceed directly
      await executeGeneration();
      return;
    }

    // No product selected — try auto-detection from prompt text
    const combinedText = additionalContext + ' ' + prospect.companyName + ' ' + prospect.painPoints;
    const matches = detectProductsFromText(combinedText, activeProducts);

    if (matches.length === 0) {
      // No matches — generate without product
      await executeGeneration();
    } else if (matches.length === 1) {
      // Exactly 1 match — auto-select silently
      setSelectedProductId(matches[0].id);
      // Need to wait for state to settle, then generate
      // Use a ref approach so executeGeneration picks up the new ID
      // Since setState is async, we set it and use the product directly
      // We'll set the ID and immediately call executeGeneration
      // The executeGeneration reads from selectedProductId state,
      // but setState won't have flushed yet. So we temporarily override.
      setSelectedProductId(matches[0].id);
      // Force generation with this product by calling executeGeneration in next tick
      pendingGenerateRef.current = true;
      // The useEffect watching showProductPicker won't fire here, so we use a microtask
      setTimeout(async () => {
        pendingGenerateRef.current = false;
        // At this point selectedProductId should be set
        await executeGenerationWithProduct(matches[0]);
      }, 0);
    } else {
      // 2+ matches — show inline picker
      setPickerCandidates(matches.slice(0, 3));
      setPickerBestMatch(matches[0]);
      setShowProductPicker(true);
      // Generation will proceed after picker resolves
    }
  };

  // Variant of executeGeneration that takes a specific product (for auto-detect single match)
  const executeGenerationWithProduct = async (product: ProductProfile) => {
    setGenerating(true);
    setSections([]);
    setVisualSections(null);
    setPlanningPhase('planning');
    setScores(null);
    setCompliance(null);
    setRawStream('');
    streamRef.current = '';

    try {
      // Build context using the product directly (since selectedProductId may not be settled)
      const finalAdditionalContext = buildFinalContext(product);

      // Try visual mode first
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, prospect, additionalContext: finalAdditionalContext, toneLevel, sessionDocuments, visualMode: true }),
      });

      if (!res.ok) {
        toast.error('Generation failed');
        setGenerating(false);
        setPlanningPhase('idle');
        return;
      }

      const contentTypeHeader = res.headers.get('Content-Type') || '';

      if (contentTypeHeader.includes('application/json')) {
        // Visual mode succeeded
        const data = await res.json();
        if (data.visual && Array.isArray(data.sections) && data.sections.length > 0) {
          setPlanningPhase('rendering');
          setVisualSections(data.sections);
          const generatedSections = visualToGeneratedSections(data.sections);
          setSections(generatedSections);
          setPlanningPhase('done');
          await postGeneration(generatedSections, product);
        } else {
          toast.error('Generation returned unexpected format');
          setPlanningPhase('idle');
        }
      } else {
        // SSE stream fallback
        setPlanningPhase('idle');
        const parsed = await handleStreamingResponse(res);
        if (parsed && parsed.length > 0) {
          setSections(parsed);
          await postGeneration(parsed, product);
        }
      }
    } catch {
      toast.error('Generation failed');
      setPlanningPhase('idle');
    }
    setGenerating(false);
  };

  // Picker actions
  const handlePickerSelect = (product: ProductProfile | null) => {
    if (pickerTimerRef.current) clearInterval(pickerTimerRef.current);
    if (product) {
      setSelectedProductId(product.id);
    }
    setShowProductPicker(false);
    setPickerCandidates([]);
    if (product) {
      // Generate with the selected product
      setTimeout(async () => {
        await executeGenerationWithProduct(product);
      }, 0);
    } else {
      // Generate without product
      setTimeout(async () => {
        await executeGeneration();
      }, 0);
    }
  };

  const handlePickerCancel = () => {
    if (pickerTimerRef.current) clearInterval(pickerTimerRef.current);
    setShowProductPicker(false);
    setPickerCandidates([]);
  };

  const regenerateSection = async (section: GeneratedSection, coachingTip?: string) => {
    setRegeneratingId(section.id);
    try {
      const extraContext = coachingTip
        ? `IMPORTANT COACHING: ${coachingTip}. Strengthen this aspect in the regenerated content.`
        : '';
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType, prospect,
          additionalContext: extraContext,
          toneLevel, sessionDocuments: [],
          regenerateSection: section.title,
          originalSectionContent: section.content,
        }),
      });
      if (!res.ok) { toast.error('Regeneration failed'); setRegeneratingId(null); return; }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let newContent = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try { const p = JSON.parse(data); if (p.text) newContent += p.text; } catch { /* skip */ }
            }
          }
        }
      }
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, content: newContent.trim() } : s)));
      toast.success(`Regenerated: ${section.title}`);
    } catch { toast.error('Regeneration failed'); }
    setRegeneratingId(null);
  };

  const uploadSessionFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'session');
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) { toast.error('Upload failed'); return; }
    const data = await res.json();
    setSessionDocuments((prev) => [...prev, data.content]);
    setSessionFileNames((prev) => [...prev, file.name]);
    toast.success(`Added: ${file.name}`);
  };

  const copyToClipboard = () => {
    const text = sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const exportPDF = async () => {
    // Quality gate
    const overallScore = grades?.overallGrade ? parseInt(grades.overallGrade) : (scores?.overall || 10);
    if (overallScore < 6) {
      const proceed = window.confirm(
        `This document scored ${overallScore}/10. Strengthen it before sending?\n\nClick OK to export anyway, or Cancel to go back and improve.`
      );
      if (!proceed) return;
    }
    const res = await fetch('/api/export/pdf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sections, contentType, prospect,
        prospectLogoBase64: prospectBranding?.logoBase64 || '',
        prospectColor: prospectBranding?.primaryColor || '',
        styleOverride: selectedStyle || undefined,
        visualSections: visualSections || undefined,
      }),
    });
    const html = await res.text();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
  };

  const exportPPTX = async () => {
    const res = await fetch('/api/export/pptx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections, contentType, prospect }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${contentType}-${prospect.companyName}.pptx`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('PPTX downloaded!');
  };

  // Fetch prospect branding from website
  const fetchProspectBranding = async () => {
    if (!prospect.website) return;
    setFetchingBranding(true);
    try {
      const res = await fetch('/api/prospect-logo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: prospect.website }),
      });
      if (res.ok) {
        const data: ProspectBranding = await res.json();
        setProspectBranding(data);
        toast.success('Prospect branding fetched!');
      } else {
        toast.error('Could not fetch branding');
      }
    } catch {
      toast.error('Failed to fetch prospect branding');
    }
    setFetchingBranding(false);
  };

  // Brand Preview
  const openPreview = async () => {
    setShowPreview(true);
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections, contentType, prospect,
          prospectLogoBase64: prospectBranding?.logoBase64 || '',
          prospectColor: prospectBranding?.primaryColor || '',
          styleOverride: selectedStyle || undefined,
          visualSections: visualSections || undefined,
        }),
      });
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      toast.error('Failed to load preview');
    }
    setPreviewLoading(false);
  };

  const handleApproveAndPrint = () => {
    const iframe = previewIframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  // Fix a single brand violation
  const fixViolation = async (violation: BrandViolation) => {
    setFixingViolations((prev) => new Set(prev).add(violation.id));

    try {
      if (violation.type === 'banned-word' && violation.bannedWord) {
        // Instant find-and-replace for banned words
        const replacement = violation.suggestedFix || '';
        setSections((prev) =>
          prev.map((s) => {
            if (s.id === violation.sectionId) {
              const regex = new RegExp(violation.bannedWord!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
              return { ...s, content: s.content.replace(regex, replacement) };
            }
            return s;
          })
        );
        // Remove from compliance
        setCompliance((prev) => {
          if (!prev) return prev;
          const remaining = prev.violations.filter((v) => v.id !== violation.id);
          const newScore = remaining.length === 0 ? 100 : Math.min(100, prev.score + Math.round(100 / (prev.violations.length || 1)));
          return {
            score: newScore,
            status: newScore >= 90 ? 'green' : newScore >= 70 ? 'yellow' : 'red',
            violations: remaining,
          };
        });
        toast.success('Banned word removed');
      } else if (violation.type === 'off-voice' && violation.originalText) {
        // AI rewrite for off-voice violations
        const section = sections.find((s) => s.id === violation.sectionId);
        if (!section) return;

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType,
            prospect,
            additionalContext: `Rewrite the following sentence to match brand voice guidelines. Only return the rewritten sentence, nothing else. Original: "${violation.originalText}"`,
            toneLevel,
            sessionDocuments: [],
            regenerateSection: 'Brand Voice Fix',
            originalSectionContent: violation.originalText,
          }),
        });

        if (res.ok) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let rewritten = '';
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  try { const p = JSON.parse(data); if (p.text) rewritten += p.text; } catch { /* skip */ }
                }
              }
            }
          }

          // Clean up the rewritten text (remove section markers if present)
          rewritten = rewritten.replace(/## SECTION:.*\n/g, '').trim();

          if (rewritten) {
            setSections((prev) =>
              prev.map((s) => {
                if (s.id === violation.sectionId) {
                  return { ...s, content: s.content.replace(violation.originalText!, rewritten) };
                }
                return s;
              })
            );
            setCompliance((prev) => {
              if (!prev) return prev;
              const remaining = prev.violations.filter((v) => v.id !== violation.id);
              const newScore = remaining.length === 0 ? 100 : Math.min(100, prev.score + Math.round(100 / (prev.violations.length || 1)));
              return {
                score: newScore,
                status: newScore >= 90 ? 'green' : newScore >= 70 ? 'yellow' : 'red',
                violations: remaining,
              };
            });
            toast.success('Voice violation fixed');
          }
        }
      } else if (violation.type === 'missing-element') {
        // For missing elements, just remove from list (user should add manually)
        toast('Missing element noted — please add it manually', { icon: '\u{1F4CB}' });
        setCompliance((prev) => {
          if (!prev) return prev;
          const remaining = prev.violations.filter((v) => v.id !== violation.id);
          const newScore = remaining.length === 0 ? 100 : Math.min(100, prev.score + Math.round(100 / (prev.violations.length || 1)));
          return {
            score: newScore,
            status: newScore >= 90 ? 'green' : newScore >= 70 ? 'yellow' : 'red',
            violations: remaining,
          };
        });
      }
    } catch {
      toast.error('Failed to fix violation');
    }

    setFixingViolations((prev) => {
      const next = new Set(prev);
      next.delete(violation.id);
      return next;
    });
  };

  // Fix all violations at once
  const fixAllViolations = async () => {
    if (!compliance || compliance.violations.length === 0) return;
    setFixingAll(true);

    // Process banned-word violations instantly
    const bannedWordViolations = compliance.violations.filter((v) => v.type === 'banned-word' && v.bannedWord);
    for (const v of bannedWordViolations) {
      const replacement = v.suggestedFix || '';
      setSections((prev) =>
        prev.map((s) => {
          if (s.id === v.sectionId) {
            const regex = new RegExp(v.bannedWord!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            return { ...s, content: s.content.replace(regex, replacement) };
          }
          return s;
        })
      );
    }

    // Process off-voice violations via batched AI calls
    const offVoiceViolations = compliance.violations.filter((v) => v.type === 'off-voice' && v.originalText);
    for (const v of offVoiceViolations) {
      try {
        const section = sections.find((s) => s.id === v.sectionId);
        if (!section) continue;

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType,
            prospect,
            additionalContext: `Rewrite the following sentence to match brand voice guidelines. Only return the rewritten sentence, nothing else. Original: "${v.originalText}"`,
            toneLevel,
            sessionDocuments: [],
            regenerateSection: 'Brand Voice Fix',
            originalSectionContent: v.originalText,
          }),
        });

        if (res.ok) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let rewritten = '';
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  try { const p = JSON.parse(data); if (p.text) rewritten += p.text; } catch { /* skip */ }
                }
              }
            }
          }
          rewritten = rewritten.replace(/## SECTION:.*\n/g, '').trim();
          if (rewritten && v.originalText) {
            setSections((prev) =>
              prev.map((s) => {
                if (s.id === v.sectionId) {
                  return { ...s, content: s.content.replace(v.originalText!, rewritten) };
                }
                return s;
              })
            );
          }
        }
      } catch { /* skip individual failures */ }
    }

    // Mark missing-element violations as acknowledged
    const missingViolations = compliance.violations.filter((v) => v.type === 'missing-element');
    if (missingViolations.length > 0) {
      toast(`${missingViolations.length} missing element(s) noted — please add manually`, { icon: '\u{1F4CB}' });
    }

    // Clear all violations
    setCompliance({
      score: 100,
      status: 'green',
      violations: [],
    });

    setFixingAll(false);
    toast.success('All fixable violations resolved');
  };

  // Email integration
  const openEmailModal = async () => {
    setShowEmailModal(true);
    setLoadingEmail(true);
    try {
      const preview = sections.map((s) => s.content).join(' ');
      const res = await fetch('/api/email-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, prospectName: prospect.companyName, contentPreview: preview }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmailSubject(data.subject);
        setEmailBody(data.body);
      }
    } catch { /* use defaults */ }
    setLoadingEmail(false);
  };

  const copyEmailToClipboard = () => {
    const text = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(text);
    toast.success('Email copied to clipboard!');
  };

  const openInGmail = () => {
    const url = `https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(url, '_blank');
  };

  // Share to library
  const shareToLibrary = async () => {
    await fetch('/api/library', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uuidv4(),
        contentType,
        prospect: { ...prospect },
        sections,
        sharedBy: session?.user?.name || 'Unknown',
        sharedAt: new Date().toISOString(),
        tags: shareTags,
        pinned: false,
        scores: scores || undefined,
      }),
    });
    setShowShareModal(false);
    setShareTags([]);
    toast.success('Shared to Content Library!');
  };

  // Content type selection handler
  const handleContentTypeSelect = (ct: ContentType) => {
    setContentType(ct);
  };

  // Handle detected type suggestion click
  const handleDetectedTypeClick = () => {
    if (detectedType) {
      setContentType(detectedType);
      setActiveCategory(findCategoryForType(detectedType));
      setDetectedType(null);
    }
  };

  // Handle product chip click
  const handleProductChipClick = (productId: string) => {
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    } else {
      setSelectedProductId(productId);
    }
    setShowMoreProducts(false);
  };

  // Handle product prompt template click
  const handleProductPromptTemplate = (template: ProductPromptTemplate) => {
    setAdditionalContext(template.promptText);
    if (template.contentType) {
      setContentType(template.contentType);
      setActiveCategory(findCategoryForType(template.contentType));
    }
  };

  // ── Persona Handlers ──
  const togglePersona = (personaId: PersonaType) => {
    setSelectedPersonas(prev =>
      prev.includes(personaId)
        ? prev.filter(p => p !== personaId)
        : [...prev, personaId]
    );
  };

  const generateAllPersonaVersions = async () => {
    if (!prospect.companyName) {
      toast.error('Please enter a prospect company name');
      return;
    }
    if (selectedPersonas.length === 0) return;

    setGeneratingAllPersonas(true);
    setPersonaVersions({} as Record<PersonaType, GeneratedSection[]>);
    setActivePersonaTab(selectedPersonas[0]);
    const newVersions: Record<string, GeneratedSection[]> = {};

    for (let i = 0; i < selectedPersonas.length; i++) {
      const personaId = selectedPersonas[i];
      const personaConfig = PERSONA_CONFIGS.find(p => p.id === personaId);
      if (!personaConfig) continue;

      setPersonaProgress(`Generating for ${personaConfig.label} (${i + 1}/${selectedPersonas.length})...`);

      try {
        let finalCtx = additionalContext;

        // Product injection
        const resolvedProduct = allProducts.find(p => p.id === selectedProductId) || null;
        if (resolvedProduct) {
          finalCtx = buildProductContextBlock(resolvedProduct) + '\n\n---\n\n' + finalCtx;
        }

        // Competitor research injection
        if (competitorResearch && (contentType === 'competitive-analysis' || contentType === 'battle-card')) {
          const crBlock = `## COMPETITOR INTELLIGENCE (from their website)\nCompany: ${competitorName}\nDescription: ${competitorResearch.companyDescription}\nTheir Key Features: ${competitorResearch.keyFeatures.join(', ')}\nTheir Positioning: ${competitorResearch.positioning}\nTheir Taglines: ${competitorResearch.taglines.join(', ')}\nCustomer Claims: ${competitorResearch.customerClaims.join(', ')}\n${competitorResearch.pricingInfo ? `Pricing Info: ${competitorResearch.pricingInfo}` : ''}\n${competitorResearch.g2Rating ? `G2 Rating: ${competitorResearch.g2Rating}` : ''}\n${competitorResearch.g2Pros.length > 0 ? `G2 Pros: ${competitorResearch.g2Pros.join(', ')}` : ''}\n${competitorResearch.g2Cons.length > 0 ? `G2 Cons: ${competitorResearch.g2Cons.join(', ')}` : ''}`;
          finalCtx = crBlock + '\n\n---\n\n' + finalCtx;
        }

        // Product-specific competitive data injection
        const pcMatchPersona = findProductCompetitorMapping(resolvedProduct, competitorName, additionalContext, allProducts);
        if (pcMatchPersona) {
          const pcBlockPersona = buildProductCompetitorBlock(pcMatchPersona.product, pcMatchPersona.mapping);
          finalCtx = pcBlockPersona + '\n\n---\n\n' + finalCtx;
          setMatchedCompetitorMapping(pcMatchPersona);
        }

        // Persona context for single persona
        const personaBlock = buildPersonaContext([personaConfig], 'separate');
        finalCtx = personaBlock + '\n\n---\n\n' + finalCtx;

        // Style injection
        const effectiveStyle = selectedStyle || brandDefaultStyle;
        const styleInstruction = STYLE_WRITING_INSTRUCTIONS[effectiveStyle];
        if (styleInstruction) {
          finalCtx = `WRITING STYLE INSTRUCTION: ${styleInstruction}\n\n` + finalCtx;
        }

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType, prospect, additionalContext: finalCtx, toneLevel, sessionDocuments }),
        });

        if (!res.ok) {
          toast.error(`Generation failed for ${personaConfig.label}`);
          continue;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let streamContent = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) streamContent += parsed.text;
                } catch { /* skip */ }
              }
            }
          }
        }

        const parsedSections = parseSections(streamContent);
        newVersions[personaId] = parsedSections;
        setPersonaVersions(prev => ({ ...prev, [personaId]: parsedSections }));
      } catch {
        toast.error(`Generation failed for ${personaConfig.label}`);
      }
    }

    setPersonaProgress('');
    setGeneratingAllPersonas(false);
    toast.success(`Generated ${Object.keys(newVersions).length} persona versions`);
  };

  const exportAllPersonaPDFs = async () => {
    for (const personaId of Object.keys(personaVersions) as PersonaType[]) {
      const personaSections = personaVersions[personaId];
      if (!personaSections || personaSections.length === 0) continue;
      const personaConfig = PERSONA_CONFIGS.find(p => p.id === personaId);
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: personaSections,
          contentType,
          prospect,
          prospectLogoBase64: prospectBranding?.logoBase64 || '',
          prospectColor: prospectBranding?.primaryColor || '',
          styleOverride: selectedStyle || undefined,
          persona: personaId,
        }),
      });
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.document.title = `${CONTENT_TYPE_LABELS[contentType]} - ${personaConfig?.label || personaId} - ${prospect.companyName}`;
      }
    }
    toast.success('All persona PDFs exported');
  };

  const toneLabel = toneLevel <= 20 ? 'Very Formal' : toneLevel <= 40 ? 'Professional' : toneLevel <= 60 ? 'Balanced' : toneLevel <= 80 ? 'Conversational' : 'Casual';

  const scoreColor = (score: number) => score >= 8 ? 'text-green-600 bg-green-50' : score >= 5 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
  const scoreBadgeColor = (score: number) => score >= 8 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';
  const scoreBarColor = (score: number) => score >= 8 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';

  const complianceBarColor = compliance
    ? compliance.status === 'green' ? 'bg-green-500' : compliance.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
    : 'bg-gray-300';
  const complianceBadgeColor = compliance
    ? compliance.status === 'green' ? 'bg-green-100 text-green-800' : compliance.status === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-500';

  const violationIcon = (type: BrandViolation['type']) => {
    switch (type) {
      case 'banned-word': return '\u{1F6AB}';
      case 'off-voice': return '\u26A0\uFE0F';
      case 'missing-element': return '\u{1F4CB}';
    }
  };

  const categoryKeys = Object.keys(CONTENT_CATEGORIES) as ContentCategory[];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--content-bg)' }}>
        {/* ── Sticky Generate Bar ── */}
        <div
          className={`sticky top-0 z-30 h-14 border-b transition-shadow ${stickyScrolled ? 'shadow-md' : ''}`}
          style={{ backgroundColor: 'var(--content-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Left side: prospect info, content type, personas */}
            <div className="hidden md:flex items-center gap-3 min-w-0">
              {prospect.companyName && (
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                  {prospect.companyName}
                </span>
              )}
              <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                {CONTENT_TYPE_LABELS[contentType]}
              </span>
              {selectedPersonas.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {selectedPersonas.map(pId => {
                    const pc = PERSONA_CONFIGS.find(p => p.id === pId);
                    return pc ? <span key={pId} className="text-base leading-none" title={pc.label}>{pc.icon}</span> : null;
                  })}
                </div>
              )}
              {selectedProduct && (
                <span className="text-[10px] bg-violet-50 text-violet-700 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                  {selectedProduct.name}
                </span>
              )}
            </div>
            {/* Right side: Generate buttons */}
            <div className="flex items-center gap-2 ml-auto">
              {selectedPersonas.length >= 2 && personaMode === 'separate' && (
                <button onClick={generateAllPersonaVersions} disabled={generating || generatingAllPersonas}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                  {generatingAllPersonas ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>) : ('All Versions')}
                </button>
              )}
              <button onClick={generate} disabled={generating || generatingAllPersonas}
                className="btn-accent disabled:opacity-50 font-semibold py-2 px-6 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm">
                {generating ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><HiOutlineSparkles /> Generate</>
                )}
              </button>
            </div>
          </div>
          {generatingAllPersonas && personaProgress && (
            <div className="absolute bottom-0 left-0 right-0 bg-amber-50 border-t border-amber-200 px-4 py-1">
              <p className="text-xs text-amber-600 text-center animate-pulse">{personaProgress}</p>
            </div>
          )}
        </div>

        {/* ── Split Panel Layout ── */}
        <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 56px)' }}>
          {/* Left Panel: Form Inputs */}
          <div className="w-full lg:w-[45%] lg:border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0"
            onScroll={(e) => {
              const el = e.currentTarget;
              setStickyScrolled(el.scrollTop > 0);
            }}
          >
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold text-gray-900">Generate Content</h1>
              <p className="text-sm text-gray-500 mt-1">Fill in prospect details and generate</p>
            </div>

            <div className="p-6 space-y-5">
            {/* Content Category Tabs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                {categoryKeys.map((catKey) => {
                  const cat = CONTENT_CATEGORIES[catKey];
                  return (
                    <button
                      key={catKey}
                      onClick={() => setActiveCategory(catKey)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-center transition-colors ${
                        activeCategory === catKey
                          ? catKey === 'linkedin'
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                            : ''
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      style={activeCategory === catKey && catKey !== 'linkedin' ? {
                        backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                        color: 'var(--accent)',
                        borderBottom: '2px solid var(--accent)',
                      } : activeCategory !== catKey ? { backgroundColor: 'var(--card-bg)' } : undefined}
                    >
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span className="text-[10px] font-medium leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content type cards grid */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto">
                {CONTENT_CATEGORIES[activeCategory].types.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => handleContentTypeSelect(ct)}
                    className={`text-left text-xs px-2.5 py-2 rounded-lg border transition-all ${
                      contentType === ct
                        ? 'font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={contentType === ct ? {
                      borderColor: 'var(--accent)',
                      backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      color: 'var(--accent)',
                      boxShadow: '0 0 0 1px var(--accent)',
                    } : { backgroundColor: 'var(--card-bg)' }}
                  >
                    {CONTENT_TYPE_LABELS[ct]}
                  </button>
                ))}
              </div>
            </div>

            {/* Competitor Intelligence Panel — only for competitive-analysis and battle-card */}
            {(contentType === 'competitive-analysis' || contentType === 'battle-card') && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                <button onClick={() => setResearchPanelOpen(!researchPanelOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors" style={{ ['--tw-bg-opacity' as string]: 1 }}>
                  <div className="flex items-center gap-2">
                    <HiOutlineGlobeAlt style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-semibold text-gray-700">Competitor Intelligence</span>
                    {competitorResearch && (<span className="text-[10px] bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Live Data</span>)}
                  </div>
                  {researchPanelOpen ? <HiOutlineChevronUp className="text-gray-400" /> : <HiOutlineChevronDown className="text-gray-400" />}
                </button>
                {researchPanelOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Competitor Name</label>
                      <input type="text" value={competitorName} onChange={(e) => setCompetitorName(e.target.value)} placeholder="e.g. Salesforce" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Competitor Website URL</label>
                      <div className="flex gap-2">
                        <input type="url" value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} placeholder="https://competitor.com" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent bg-white" />
                        <button onClick={async () => { if (!competitorUrl || !competitorName) { toast.error('Enter both competitor name and URL'); return; } setResearchLoading(true); setResearchError(false); setCompetitorResearch(null); try { const res = await fetch('/api/competitor-research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: competitorUrl, competitorName }) }); const data = await res.json(); if (data.error || data.fallback) { setResearchError(true); } else { setCompetitorResearch(data); toast.success('Competitor intelligence gathered'); } } catch { setResearchError(true); } setResearchLoading(false); }} disabled={researchLoading || !competitorUrl || !competitorName} className="btn-accent flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 rounded-lg px-4 py-2 whitespace-nowrap">
                          {researchLoading ? (<><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Researching...</>) : (<><HiOutlineMagnifyingGlass /> Research</>)}
                        </button>
                      </div>
                    </div>
                    {competitorResearch && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2.5">
                        <div><p className="text-sm font-semibold text-gray-800">{competitorName}</p><p className="text-xs text-gray-500 mt-0.5">{competitorResearch.companyDescription}</p></div>
                        {competitorResearch.keyFeatures.length > 0 && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Key Features</p><div className="flex flex-wrap gap-1">{competitorResearch.keyFeatures.map((f, i) => (<span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>))}</div></div>)}
                        {competitorResearch.positioning && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Positioning</p><p className="text-xs text-gray-600 italic">{competitorResearch.positioning}</p></div>)}
                        {competitorResearch.taglines.length > 0 && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Taglines</p>{competitorResearch.taglines.map((t, i) => (<p key={i} className="text-xs text-gray-600 italic">&ldquo;{t}&rdquo;</p>))}</div>)}
                        {competitorResearch.g2Rating && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">G2 Reviews</p><p className="text-xs text-gray-700 font-medium">Rating: {competitorResearch.g2Rating}</p>{competitorResearch.g2Pros.length > 0 && (<div className="mt-1"><span className="text-[10px] text-green-600 font-medium">Pros: </span><span className="text-[10px] text-gray-500">{competitorResearch.g2Pros.join(' | ')}</span></div>)}{competitorResearch.g2Cons.length > 0 && (<div className="mt-0.5"><span className="text-[10px] text-red-600 font-medium">Cons: </span><span className="text-[10px] text-gray-500">{competitorResearch.g2Cons.join(' | ')}</span></div>)}</div>)}
                        <p className="text-[10px] text-green-600 flex items-center gap-1 pt-1 border-t border-gray-100"><HiOutlineCheck className="text-green-500" /> Real-time intelligence gathered from their website</p>
                      </div>
                    )}
                    {researchError && !competitorResearch && (<p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">This analysis will use AI knowledge about the competitor. Add their website URL for real-time intelligence.</p>)}
                  </div>
                )}
              </div>
            )}

            {/* Prospect Fields */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Prospect</h3>
              {([
                { key: 'companyName' as const, label: 'Company Name *', placeholder: 'Acme Corp' },
                { key: 'industry' as const, label: 'Industry', placeholder: 'Manufacturing' },
                { key: 'companySize' as const, label: 'Company Size', placeholder: '500-1000 employees' },
                { key: 'techStack' as const, label: 'Current Tech/ERP Stack', placeholder: 'SAP, Salesforce...' },
              ]).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type="text" value={prospect[field.key]}
                    onChange={(e) => setProspect({ ...prospect, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent" />
                </div>
              ))}
              {prospectSuggestion && (
                <div
                  className="mt-1 text-xs px-3 py-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                  onClick={() => {
                    setProspect(prev => ({
                      ...prev,
                      companyName: prospectSuggestion.companyName,
                      industry: (prospectSuggestion as any).latestIndustry || prev.industry,
                      companySize: (prospectSuggestion as any).latestCompanySize || prev.companySize,
                      techStack: (prospectSuggestion as any).latestTechStack || prev.techStack,
                      painPoints: (prospectSuggestion as any).latestPainPoints || prev.painPoints,
                    }));
                    setProspectSuggestion(null);
                  }}
                >
                  Previously generated for <strong>{prospectSuggestion.companyName}</strong>: {prospectSuggestion.items.map(i => i.contentTypeLabel).slice(0, 3).join(', ')}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Pain Points</label>
                <textarea value={prospect.painPoints}
                  onChange={(e) => setProspect({ ...prospect, painPoints: e.target.value })}
                  rows={3} placeholder="Slow manual processes, lack of visibility..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <div className="flex gap-2">
                  <input type="text" value={prospect.website || ''}
                    onChange={(e) => { setProspect({ ...prospect, website: e.target.value }); setProspectBranding(null); }}
                    placeholder="https://acme.com"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent" />
                  {prospect.website && (
                    <button
                      onClick={fetchProspectBranding}
                      disabled={fetchingBranding}
                      className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
                      style={{ border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                    >
                      {fetchingBranding ? 'Fetching...' : 'Fetch Branding'}
                    </button>
                  )}
                </div>
              </div>
              {prospectBranding && (prospectBranding.logoBase64 || prospectBranding.companyName) && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Co-Branding Preview</div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-600 font-medium">Your Company</div>
                    <div className="flex items-center gap-2">
                      {prospectBranding.logoBase64 ? (
                        <img src={prospectBranding.logoBase64} alt={prospectBranding.companyName} className="h-6 max-w-[100px] object-contain" />
                      ) : (
                        <span className="text-xs font-semibold text-gray-700">{prospectBranding.companyName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex mt-2 h-1 rounded-full overflow-hidden">
                    <div className="flex-1" style={{ backgroundColor: 'var(--accent)' }} />
                    <div className="flex-1" style={{ backgroundColor: prospectBranding.primaryColor }} />
                  </div>
                  <button onClick={() => setProspectBranding(null)} className="text-xs text-gray-400 hover:text-red-500 mt-1">Clear</button>
                </div>
              )}
            </div>

            {/* Product Quick Select Chips */}
            {activeProducts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product focus <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {visibleProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductChipClick(product.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedProductId === product.id
                          ? 'font-medium'
                          : 'border-gray-200 text-gray-600'
                      }`}
                      style={selectedProductId === product.id ? {
                        borderColor: 'var(--accent)',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--text-inverse)',
                        boxShadow: '0 0 0 1px var(--accent)',
                      } : { backgroundColor: 'var(--card-bg)' }}
                    >
                      {product.name}
                    </button>
                  ))}
                  {overflowProducts.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMoreProducts(!showMoreProducts)}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 transition-all"
                        style={{ backgroundColor: 'var(--card-bg)' }}
                      >
                        +{overflowProducts.length} more
                      </button>
                      {showMoreProducts && (
                        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] max-h-[200px] overflow-y-auto">
                          {overflowProducts.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => handleProductChipClick(product.id)}
                              className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                selectedProductId === product.id
                                  ? 'font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              style={selectedProductId === product.id ? {
                                backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                                color: 'var(--accent)',
                              } : undefined}
                            >
                              {product.name}
                              <span className="block text-[10px] text-gray-400 mt-0.5 truncate">{product.shortDescription}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Industry Mismatch Warning */}
                {industryMismatchWarning && (
                  <div className="mt-2 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <HiOutlineExclamationTriangle className="text-yellow-500 flex-shrink-0 mt-0.5 text-sm" />
                    <p className="text-xs text-yellow-700 flex-1">
                      Note: {industryMismatchWarning.productName} is typically sold to {industryMismatchWarning.targetIndustries} — you are generating for {industryMismatchWarning.prospectIndustry}. Continue anyway?
                    </p>
                    <button
                      onClick={() => setIndustryMismatchDismissed(true)}
                      className="text-yellow-500 hover:text-yellow-700 flex-shrink-0"
                    >
                      <HiOutlineXMark className="text-sm" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Additional Context */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Context
                  {selectedProduct && (
                    <span className="ml-2 inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)' }}>
                      {selectedProduct.name}
                    </span>
                  )}
                  {voiceDictated && (
                    <span className="ml-2 inline-flex items-center text-[10px] bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                      (Dictated)
                    </span>
                  )}
                </label>
              </div>
              <div className="relative">
                <textarea value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={4} placeholder="Paste call notes, competitor URL, prospect's about page... or use the microphone"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 ring-accent resize-y" />
                <div className="absolute top-2 right-2 z-10">
                  <VoiceButton
                    size="sm"
                    onTranscript={(text) => {
                      setAdditionalContext((prev) => prev ? prev + ' ' + text : text);
                      setVoiceDictated(true);
                    }}
                  />
                </div>
              </div>

              {/* Natural language detection chip */}
              {detectedType && (
                <button
                  onClick={handleDetectedTypeClick}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 hover:bg-amber-100 transition-colors"
                >
                  <HiOutlineBolt className="text-amber-500" />
                  Detected: {CONTENT_TYPE_LABELS[detectedType]} &mdash; Click to switch
                </button>
              )}

              {/* Starter Prompt Chips */}
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">Quick starters:</p>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_PROMPTS.map((sp, i) => (
                    <button key={i} onClick={() => {
                      setContentType(sp.contentType);
                      setActiveCategory(findCategoryForType(sp.contentType));
                      setAdditionalContext(sp.text);
                    }}
                      className="text-xs px-2.5 py-1 rounded-full transition-colors"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product-Specific Starter Prompts */}
              {selectedProduct && selectedProduct.promptTemplates.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">{selectedProduct.name} templates:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.promptTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleProductPromptTemplate(template)}
                        className="text-xs bg-violet-50 text-violet-600 hover:bg-violet-100 px-2.5 py-1 rounded-full transition-colors border border-violet-100"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Session File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Documents</label>
              <label className="cursor-pointer flex items-center gap-2 text-sm border border-dashed border-gray-200 rounded-lg p-3 transition-colors" style={{ color: 'var(--accent)' }}>
                <HiOutlineArrowUpTray />
                Upload context file (PDF, DOCX, TXT)
                <input type="file" accept=".pdf,.docx,.txt,.md" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadSessionFile(file); }} />
              </label>
              {sessionFileNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <HiOutlineDocumentText /> {name}
                  <button onClick={() => {
                    setSessionDocuments((prev) => prev.filter((_, idx) => idx !== i));
                    setSessionFileNames((prev) => prev.filter((_, idx) => idx !== i));
                  }} className="text-red-400 hover:text-red-600 ml-auto">&times;</button>
                </div>
              ))}
            </div>

            {/* Tone Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone: <span className="font-semibold" style={{ color: 'var(--accent)' }}>{toneLabel}</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Formal</span>
                <input type="range" min={0} max={100} value={toneLevel}
                  onChange={(e) => setToneLevel(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
                <span className="text-xs text-gray-400">Casual</span>
              </div>
            </div>
            {/* Document Style Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Style</label>
              <div className="grid grid-cols-2 gap-2">
                {DOCUMENT_STYLE_OPTIONS.map((style) => {
                  const isDefault = style.value === brandDefaultStyle;
                  const isSelected = selectedStyle === style.value || (!selectedStyle && isDefault);
                  return (
                    <button
                      key={style.value}
                      onClick={() => setSelectedStyle(isDefault && !selectedStyle ? null : (selectedStyle === style.value ? null : style.value))}
                      className={`relative text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? ''
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      style={isSelected ? {
                        borderColor: 'var(--accent)',
                        backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                        boxShadow: '0 0 0 1px var(--accent)',
                      } : { backgroundColor: 'var(--card-bg)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base">{style.icon}</span>
                        <span className="text-sm font-semibold text-gray-900">{style.label}</span>
                        {isDefault && (
                          <span className="text-[9px] bg-gray-200 text-gray-600 font-medium px-1.5 py-0.5 rounded-full ml-auto">Default</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight mb-1">{style.description}</p>
                      <p className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>Best for: {style.bestFor}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variation Toggle */}
            <div className="flex items-center gap-3 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={variationOn}
                    onChange={(e) => setVariationOn(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors ${variationOn ? '' : 'bg-gray-300'}`} style={variationOn ? { backgroundColor: 'var(--accent)' } : {}}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${variationOn ? 'translate-x-4.5 ml-[18px]' : 'ml-0.5'}`} />
                  </div>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Unique Style</span>
              </label>
              {variationOn && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Each generation will have a unique voice and structure</span>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={imagesOn} onChange={(e) => setImagesOn(e.target.checked)} className="sr-only" />
                  <div className={`w-9 h-5 rounded-full transition-colors ${imagesOn ? '' : 'bg-gray-300'}`} style={imagesOn ? { backgroundColor: 'var(--accent)' } : {}}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${imagesOn ? 'ml-[18px]' : 'ml-0.5'}`} />
                  </div>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Include Images</span>
              </label>
            </div>

            {/* Persona Selector */}
            {prospect.companyName.trim() && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Who is reading this?</label>
                  <span className="relative group">
                    <span className="text-gray-400 text-xs cursor-help border border-gray-300 rounded-full w-4 h-4 inline-flex items-center justify-center">?</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] rounded-lg px-3 py-2 w-52 text-center z-20 shadow-lg">Select one or more personas to tailor the document language, structure, and metrics for each audience.</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {PERSONA_CONFIGS.map((persona) => {
                    const isSelected = selectedPersonas.includes(persona.id);
                    return (
                      <button
                        key={persona.id}
                        onClick={() => togglePersona(persona.id)}
                        className={`text-left p-2 rounded-lg border-2 transition-all ${isSelected ? '' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        style={isSelected ? { borderColor: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' } : { backgroundColor: 'var(--card-bg)' }}
                      >
                        <div className="text-base leading-none mb-1">{persona.icon}</div>
                        <div className="text-[11px] font-semibold text-gray-800 leading-tight">{persona.label}</div>
                        <div className="text-[9px] text-gray-400 leading-tight mt-0.5">Cares about: {persona.cares.slice(0, 2).join(', ')}</div>
                      </button>
                    );
                  })}
                </div>
                {selectedPersonas.length >= 2 && (
                  <div className="mt-3 flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="personaMode" checked={personaMode === 'combined'} onChange={() => setPersonaMode('combined')} className="accent-[var(--accent)]" />
                      <span className="text-xs text-gray-700 font-medium">Combined document</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="personaMode" checked={personaMode === 'separate'} onChange={() => setPersonaMode('separate')} className="accent-[var(--accent)]" />
                      <span className="text-xs text-gray-700 font-medium">Separate versions</span>
                    </label>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Right Panel: Output */}
          <div ref={rightPanelRef} className="flex-1 overflow-y-auto bg-slate-50 lg:bg-slate-50" style={{ padding: '24px' }}>
            <div ref={resultRef} />
            {/* Inline Product Picker (ambiguous detection) */}
          {showProductPicker && (
            <div className="pb-0">
              <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Which product should I focus on?</h3>
                <div className="grid gap-2">
                  {pickerCandidates.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handlePickerSelect(product)}
                      className="text-left bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-all hover:border-gray-300"
                    >
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{product.shortDescription}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => handlePickerSelect(null)}
                    className="text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 transition-all"
                  >
                    <span className="text-sm font-medium text-gray-500">None — generate without product focus</span>
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Generating with <span className="font-medium" style={{ color: 'var(--accent)' }}>{pickerBestMatch?.name}</span> in {pickerCountdown}...
                  </p>
                  <button
                    onClick={handlePickerCancel}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prospect Intelligence Panel */}
          {(prospectIntel || prospectIntelLoading) && (
            <div className="pt-2 pb-0">
              <div className="border border-sky-200 rounded-xl overflow-hidden" style={{ backgroundColor: '#f0f9ff' }}>
                <div onClick={() => setProspectIntelExpanded(!prospectIntelExpanded)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-sky-100/50 transition-colors cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProspectIntelExpanded(!prospectIntelExpanded); } }}>
                  <div className="flex items-center gap-2">
                    <HiOutlineMagnifyingGlass className="text-sky-600" />
                    <span className="text-sm font-semibold text-gray-800">Prospect Intelligence</span>
                    <span className="text-[10px] bg-sky-100 text-sky-700 font-medium px-2 py-0.5 rounded-full">Powered by live data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {prospectIntel && (<button onClick={(e) => { e.stopPropagation(); const ck = `prospect-intel-${prospect.companyName.toLowerCase().trim()}`; try { sessionStorage.removeItem(ck); } catch { /* skip */ } lastIntelCompanyRef.current = ''; setProspectIntel(null); fetchProspectIntel(prospect.companyName.trim(), prospect.website || undefined); }} className="text-[10px] text-sky-600 hover:text-sky-800 font-medium px-2 py-0.5 rounded border border-sky-200 hover:bg-sky-50 transition-colors">Refresh</button>)}
                    {prospectIntelExpanded ? <HiOutlineChevronUp className="text-gray-400" /> : <HiOutlineChevronDown className="text-gray-400" />}
                  </div>
                </div>
                {prospectIntelExpanded && (
                  <div className="px-5 pb-5">
                    {prospectIntelLoading && !prospectIntel ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="flex items-center gap-2 text-sm text-sky-600"><div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />Gathering intelligence on {prospect.companyName}...</div>
                        <div className="h-4 bg-sky-100 rounded w-3/4" /><div className="h-4 bg-sky-100 rounded w-1/2" /><div className="h-4 bg-sky-100 rounded w-2/3" />
                      </div>
                    ) : prospectIntel ? (
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg border border-sky-100 p-3">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Company Snapshot</p>
                          <p className="text-sm text-gray-700 mb-2">{prospectIntel.companySnapshot.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            {prospectIntel.companySnapshot.industry && prospectIntel.companySnapshot.industry !== 'Unknown' && (<span><span className="font-medium text-gray-700">Industry:</span> {prospectIntel.companySnapshot.industry}</span>)}
                            {prospectIntel.companySnapshot.estimatedSize && prospectIntel.companySnapshot.estimatedSize !== 'Unknown' && (<span><span className="font-medium text-gray-700">Size:</span> {prospectIntel.companySnapshot.estimatedSize}</span>)}
                            {prospectIntel.companySnapshot.location && prospectIntel.companySnapshot.location !== 'Unknown' && (<span><span className="font-medium text-gray-700">Location:</span> {prospectIntel.companySnapshot.location}</span>)}
                          </div>
                        </div>
                        {prospectIntel.techStack.length > 0 && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tech Stack</p><div className="flex flex-wrap gap-1.5">{prospectIntel.techStack.map((tech, i) => { const tl = tech.toLowerCase(); const cc = tl.includes('crm') || tl.includes('salesforce') || tl.includes('hubspot') ? 'bg-blue-50 text-blue-700 border-blue-200' : tl.includes('analytics') || tl.includes('google') || tl.includes('segment') || tl.includes('mixpanel') ? 'bg-green-50 text-green-700 border-green-200' : tl.includes('chat') || tl.includes('drift') || tl.includes('intercom') ? 'bg-purple-50 text-purple-700 border-purple-200' : tl.includes('support') || tl.includes('zendesk') ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-700 border-gray-200'; return (<span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cc}`}>{tech}</span>); })}</div></div>)}
                        {prospectIntel.hiringSignals.summary && prospectIntel.hiringSignals.summary !== 'No hiring data available' && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hiring Signals</p><p className="text-xs text-gray-700 mb-1">{prospectIntel.hiringSignals.summary}</p>{prospectIntel.hiringSignals.signals.length > 0 && (<ul className="text-xs text-gray-500 space-y-0.5 ml-3 list-disc">{prospectIntel.hiringSignals.signals.slice(0, 5).map((sig, i) => (<li key={i}>{sig}</li>))}</ul>)}</div>)}
                        {prospectIntel.recentNews.length > 0 && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Recent News</p><div className="space-y-1.5">{prospectIntel.recentNews.slice(0, 3).map((news, i) => (<div key={i} className="flex items-start gap-2"><span className="text-xs text-gray-700 font-medium flex-1">{news.title}</span>{news.date && <span className="text-[10px] text-gray-400 whitespace-nowrap">{news.date}</span>}</div>))}</div></div>)}
                        {prospectIntel.suggestedAngle && (<div className="bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Suggested Angle</p><p className="text-xs text-amber-800">{prospectIntel.suggestedAngle}</p></div>)}
                        {prospectIntel.painPointHypotheses.length > 0 && (<div><p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pain Point Hypotheses</p><ul className="text-xs text-gray-600 space-y-0.5 ml-3 list-disc">{prospectIntel.painPointHypotheses.map((pp, i) => (<li key={i}>{pp}</li>))}</ul></div>)}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {sections.length === 0 && !generating && !generatingAllPersonas && !showProductPicker && Object.keys(personaVersions).length === 0 ? (
            <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px - 48px)' }}>
              <div className="text-center max-w-md">
                <HiOutlineDocumentText className="text-5xl text-gray-200 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-400 mb-2">Your generated content will appear here</h2>
                <p className="text-sm text-gray-400">Fill in the prospect details on the left and hit Generate to create content.</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Persona Version Tabs */}
              {Object.keys(personaVersions).length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {(Object.keys(personaVersions) as PersonaType[]).map((personaId) => {
                      const pConfig = PERSONA_CONFIGS.find(p => p.id === personaId);
                      if (!pConfig) return null;
                      return (
                        <button key={personaId} onClick={() => { setActivePersonaTab(personaId); setSections(personaVersions[personaId]); }}
                          className={`text-sm px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${activePersonaTab === personaId ? 'font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          style={activePersonaTab === personaId ? { borderColor: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' } : { backgroundColor: 'var(--card-bg)' }}>
                          <span>{pConfig.icon}</span> {pConfig.label}
                        </button>
                      );
                    })}
                    <button onClick={exportAllPersonaPDFs} className="ml-auto text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 transition-colors flex items-center gap-2">
                      <HiOutlineArrowDownTray /> Export All PDFs
                    </button>
                  </div>
                  {generatingAllPersonas && personaProgress && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 animate-pulse mb-4">
                      <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      {personaProgress}
                    </div>
                  )}
                </div>
              )}

              {/* Export Warning Banner */}
              {compliance && compliance.status === 'red' && !exportWarningDismissed && sections.length > 0 && !generating && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <HiOutlineExclamationTriangle className="text-amber-500 text-xl flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium flex-1">This document has brand violations</p>
                  <button
                    onClick={fixAllViolations}
                    disabled={fixingAll}
                    className="text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {fixingAll ? 'Fixing...' : 'Fix All'}
                  </button>
                  <button
                    onClick={() => setExportWarningDismissed(true)}
                    className="text-xs text-amber-600 hover:text-amber-800 underline"
                  >
                    Export Anyway
                  </button>
                </div>
              )}

              {/* Product-Specific Competitive Data Badge */}
              {matchedCompetitorMapping && sections.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <span className="text-green-600 text-sm font-medium">
                    Using product-specific competitive data for {matchedCompetitorMapping.product.name} vs {matchedCompetitorMapping.mapping.competitorName}
                  </span>
                  <span className="text-[10px] bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Product Match</span>
                </div>
              )}

              {/* Export toolbar */}
              {sections.length > 0 && (
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-900 flex-1">
                    {CONTENT_TYPE_LABELS[contentType]}
                    <span className="text-sm font-normal text-gray-400 ml-2">for {prospect.companyName}</span>
                  </h2>
                  {/* Overall score badge */}
                  {scores && (
                    <span className={`${scoreBadgeColor(scores.overall)} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                      Score: {scores.overall}/10
                    </span>
                  )}
                  {scoring && <span className="text-xs text-gray-400 animate-pulse">Scoring...</span>}
                  <button onClick={openPreview} className="btn-accent flex items-center gap-2 text-sm font-semibold rounded-lg px-5 py-2.5 shadow-sm">
                    <HiOutlineEye className="text-lg" /> Preview
                  </button>
                  <button onClick={exportPDF} className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-5 py-2.5 transition-colors shadow-sm">
                    <HiOutlineArrowDownTray className="text-lg" /> Export PDF
                  </button>
                  <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-300">
                    <HiOutlineClipboard /> Copy
                  </button>
                  <button onClick={exportPPTX} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-300">
                    <HiOutlineArrowDownTray /> PPTX
                  </button>
                  <button onClick={openEmailModal} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-300">
                    <HiOutlineEnvelope /> Send
                  </button>
                  <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-300">
                    <HiOutlineBookOpen /> Share to Library
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const themeRes = await fetch('/api/theme');
                        const themeData = await themeRes.json();
                        const res = await fetch('/api/share', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sections, contentType, prospect, logoBase64: themeData.logoBase64 }),
                        });
                        const data = await res.json();
                        if (data.url) {
                          navigator.clipboard.writeText(window.location.origin + data.url);
                          toast.success('Share link copied!');
                        }
                      } catch { toast.error('Failed to create share link'); }
                    }}
                    className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-300"
                  >
                    Share Link
                  </button>
                  <button
                    onClick={() => {
                      const html = generateShareableHtml(sections, contentType, prospect.companyName, prospect.industry);
                      const blob = new Blob([html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${contentType}-${prospect.companyName || 'document'}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('HTML exported');
                    }}
                    className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-300"
                  >
                    Export HTML
                  </button>
                  {variationOn && sections.length > 0 && (
                    <button
                      onClick={() => {
                        const newSeed = generateVariationSeed();
                        setCurrentSeed(newSeed);
                        executeGeneration();
                      }}
                      className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors hover:border-gray-300"
                    >
                      <HiOutlineArrowPath className="text-sm" /> Different Style
                    </button>
                  )}
                </div>
              )}

              {/* Variation Seed Display */}
              {currentSeed && variationOn && sections.length > 0 && !generating && (
                <div className="flex items-center gap-3 text-xs py-2 px-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--accent-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Style:</span>
                  <span className="font-medium" style={{ color: 'var(--accent)' }}>{getHookLabel(currentSeed.hookStyle)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>&middot;</span>
                  <span className="font-medium" style={{ color: 'var(--accent)' }}>{getVoiceLabel(currentSeed.voiceMode)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>&middot;</span>
                  <span className="font-medium" style={{ color: 'var(--accent)' }}>Seq {currentSeed.sequenceIndex + 1}</span>
                </div>
              )}

              {/* Content Scores Panel */}
              {scores && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Content Quality Scores</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {([
                      { key: 'clarity' as const, label: 'Clarity' },
                      { key: 'differentiation' as const, label: 'Differentiation' },
                      { key: 'proof' as const, label: 'Proof' },
                      { key: 'callToAction' as const, label: 'Call to Action' },
                    ]).map(({ key, label }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">{label}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${scoreColor(scores[key])}`}>{scores[key]}/10</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${scoreBarColor(scores[key])}`} style={{ width: `${scores[key] * 10}%` }} />
                        </div>
                        {scores.tips[key] && (
                          <p className="text-xs text-amber-600 mt-1">{scores.tips[key]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Content Grade Panel */}
              {(grades || grading) && !generating && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
                  <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                    <div className="flex items-center gap-4">
                      {grades ? (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm transition-all duration-500" style={{ backgroundColor: grades.overallGrade.startsWith('A') ? '#16a34a' : grades.overallGrade.startsWith('B') ? '#3b82f6' : grades.overallGrade.startsWith('C') ? '#f59e0b' : '#dc2626' }}>
                          {grades.overallGrade}
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center animate-pulse">
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Content Grade</h3>
                        {grades && <p className="text-xs text-gray-500 mt-0.5 max-w-md">{grades.summary}</p>}
                        {grading && !grades && <p className="text-xs text-gray-400 animate-pulse">Grading content...</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {previousGrades && grades && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">{previousGrades.overallGrade} &rarr; {grades.overallGrade}</span>
                      )}
                      {grades && (
                        <button onClick={() => setGradeExpanded(!gradeExpanded)} className="text-gray-400 hover:text-gray-600 p-1">
                          {gradeExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                        </button>
                      )}
                    </div>
                  </div>
                  {grades && gradeExpanded && (
                    <div className="p-5 space-y-4">
                      {([
                        { key: 'relevance' as const, label: 'Relevance' },
                        { key: 'clarity' as const, label: 'Clarity' },
                        { key: 'differentiation' as const, label: 'Differentiation' },
                        { key: 'proof' as const, label: 'Proof' },
                        { key: 'callToAction' as const, label: 'Call to Action' },
                        { key: 'personaFit' as const, label: 'Persona Fit' },
                      ] as { key: 'relevance' | 'clarity' | 'differentiation' | 'proof' | 'callToAction' | 'personaFit'; label: string }[]).map(({ key, label }) => {
                        const gradeItem: ContentGrade = grades[key];
                        const prevItem: ContentGrade | null = previousGrades ? previousGrades[key] : null;
                        const barClr = gradeItem.score >= 7 ? '#16a34a' : gradeItem.score >= 5 ? '#f59e0b' : '#dc2626';
                        return (
                          <div key={key}>
                            <div className="flex items-start justify-between py-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeItem.score >= 7 ? 'bg-green-50 text-green-600' : gradeItem.score >= 5 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                    {gradeItem.score}/10
                                  </span>
                                  {prevItem && prevItem.score !== gradeItem.score && (
                                    <span className="text-xs text-green-600 font-medium">{prevItem.score} &rarr; {gradeItem.score} &#10003;</span>
                                  )}
                                </div>
                                {gradeItem.suggestion && (
                                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{gradeItem.suggestion}</p>
                                )}
                              </div>
                              {gradeItem.score < 7 && gradeItem.suggestion && (
                                <button
                                  onClick={() => applyGradeFix(key, gradeItem.suggestion!)}
                                  disabled={fixingDimension === key || optimizingAll}
                                  className="text-xs font-medium px-2 py-1 rounded-lg ml-3 flex-shrink-0 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                  {fixingDimension === key ? (<><div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Fixing...</>) : 'Fix This'}
                                </button>
                              )}
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                              <div className="h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${gradeItem.score * 10}%`, backgroundColor: barClr }} />
                            </div>
                          </div>
                        );
                      })}
                      {(() => {
                        const dims = ['relevance', 'clarity', 'differentiation', 'proof', 'callToAction', 'personaFit'] as const;
                        const suggestionCount = dims.filter((d) => grades[d].suggestion !== null && grades[d].score < 7).length;
                        if (suggestionCount < 2) return null;
                        return (
                          <div className="pt-3 border-t">
                            <button onClick={optimizeAll} disabled={optimizingAll || !!fixingDimension} className="w-full btn-accent disabled:opacity-50 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                              {optimizingAll ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {optimizeProgress || 'Optimizing...'}</>) : (<><HiOutlineSparkles /> Optimize All ({suggestionCount} suggestions)</>)}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Visual mode planning phase */}
              {generating && planningPhase === 'planning' && !rawStream && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 border-2 rounded-full" style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }} />
                      <div className="absolute inset-0 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Planning document structure...</span>
                      <p className="text-xs text-gray-400 mt-0.5">Analyzing content type and selecting visual layouts</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual mode rendering phase */}
              {planningPhase === 'rendering' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 border-2 border-green-200 rounded-full" />
                      <div className="absolute inset-0 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Rendering visual components...</span>
                      <p className="text-xs text-gray-400 mt-0.5">Building rich visual sections for your document</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming preview (text fallback) */}
              {generating && sections.length === 0 && rawStream && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                    <span className="text-sm text-gray-500">Generating...</span>
                  </div>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{rawStream}</div>
                </div>
              )}

              {/* Sections — Visual or Text */}
              <div className="space-y-4">
                {sections.map((section, idx) => {
                  // Determine if this section has a low score area that needs strengthening
                  const sectionScoreKey = scores ? (
                    section.title.toLowerCase().includes('action') || section.title.toLowerCase().includes('next step') ? 'callToAction' :
                    section.title.toLowerCase().includes('proof') || section.title.toLowerCase().includes('case') || section.title.toLowerCase().includes('result') ? 'proof' :
                    section.title.toLowerCase().includes('differ') || section.title.toLowerCase().includes('why') || section.title.toLowerCase().includes('strength') || section.title.toLowerCase().includes('advantage') ? 'differentiation' :
                    null
                  ) : null;
                  const scoreVal = sectionScoreKey && scores ? (scores as unknown as Record<string, number>)[sectionScoreKey] : null;
                  const lowScoreTip = typeof scoreVal === 'number' && scoreVal < 7 && scores && sectionScoreKey
                    ? scores.tips[sectionScoreKey as string] : null;

                  // Check if we have a matching visual section
                  const vs = visualSections && visualSections[idx] ? visualSections[idx] : null;
                  const visualFormatLabel = vs ? vs.visualFormat.replace(/-/g, ' ') : null;

                  return (
                    <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-700">{section.title}</h3>
                          {visualFormatLabel && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>{visualFormatLabel}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {lowScoreTip && (
                            <button
                              onClick={() => regenerateSection(section, lowScoreTip)}
                              disabled={regeneratingId === section.id}
                              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 border border-amber-200 rounded-lg px-2 py-1 hover:bg-amber-50 transition-colors disabled:opacity-50"
                              title={lowScoreTip}
                            >
                              <HiOutlineBolt /> Strengthen
                            </button>
                          )}
                          {editingSectionId === section.id ? (
                            <button onClick={() => {
                              setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, content: editContent } : s)));
                              setEditingSectionId(null);
                              // Clear visual sections when editing since text has changed
                              setVisualSections(null);
                              toast.success('Section updated');
                            }} className="text-green-600 hover:text-green-700 p-1">
                              <HiOutlineCheck />
                            </button>
                          ) : (
                            <button onClick={() => { setEditingSectionId(section.id); setEditContent(section.content); }}
                              className="text-gray-400 hover:text-gray-700 p-1" title="Edit">
                              <HiOutlinePencil />
                            </button>
                          )}
                          <button onClick={() => regenerateSection(section)}
                            disabled={regeneratingId === section.id}
                            className="text-gray-400 hover:text-gray-700 p-1 disabled:opacity-50" title="Regenerate">
                            <HiOutlineArrowPath className={regeneratingId === section.id ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>
                      <div className="p-5">
                        {editingSectionId === section.id ? (
                          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                            rows={12} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent resize-y" />
                        ) : (
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{section.content}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Image Thumbnails */}
              {generatedImages.length > 0 && (
                <div className="flex flex-wrap gap-3 py-3 px-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  {generatedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.thumbUrl || img.url} alt={img.alt} className="w-24 h-16 object-cover rounded-lg border" style={{ borderColor: 'var(--card-border)' }} />
                      <button
                        onClick={() => setGeneratedImages(prev => prev.filter(i => i.id !== img.id))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >&times;</button>
                      {img.credit && <p className="text-[9px] mt-0.5 truncate w-24" style={{ color: 'var(--text-muted)' }}>{img.credit}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Reading Time Badge */}
              {sections.length > 0 && (() => {
                const allText = sections.map(s => s.content).join(' ');
                const { words, minutes } = calculateReadingTime(allText);
                return (
                  <div className="text-xs py-1.5 px-4" style={{ color: 'var(--text-muted)' }}>
                    {words.toLocaleString()} words &middot; {minutes} min read
                  </div>
                );
              })()}

              {/* LinkedIn Character Count Display */}
              {sections.length > 0 && !generating && contentType.startsWith('linkedin-') && (
                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">LinkedIn Character Counts</h3>
                  <div className="space-y-1.5">
                    {contentType === 'linkedin-post' && (() => {
                      const totalChars = sections.map(s => s.content).join('\n\n').length;
                      const isOptimal = totalChars >= 1200 && totalChars <= 1500;
                      const isOver = totalChars > 1500;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Total post length:</span>
                          <span className={`text-xs font-semibold ${isOptimal ? 'text-green-600' : isOver ? 'text-red-600' : 'text-amber-600'}`}>
                            {totalChars.toLocaleString()} / 1,300 characters
                          </span>
                          {isOptimal && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Optimal</span>}
                        </div>
                      );
                    })()}
                    {contentType === 'linkedin-connection-request' && sections.map((s) => {
                      const charCount = s.content.length;
                      const isOver = charCount > 300;
                      return (
                        <div key={s.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 truncate max-w-[200px]">{s.title}:</span>
                          <span className={`text-xs font-semibold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                            {charCount} / 300 characters
                          </span>
                          {isOver && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Over limit</span>}
                        </div>
                      );
                    })}
                    {contentType === 'linkedin-message-sequence' && sections.map((s) => {
                      const charCount = s.content.length;
                      const isOver = charCount > 500;
                      return (
                        <div key={s.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 truncate max-w-[200px]">{s.title}:</span>
                          <span className={`text-xs font-semibold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                            {charCount} / 500 characters
                          </span>
                          {isOver && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Over limit</span>}
                        </div>
                      );
                    })}
                    {(contentType === 'linkedin-comment-strategy' || contentType === 'linkedin-carousel-outline') && (() => {
                      const totalChars = sections.map(s => s.content).join('\n\n').length;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Total content length:</span>
                          <span className="text-xs font-semibold text-gray-700">{totalChars.toLocaleString()} characters</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Brand Compliance Panel */}
              {sections.length > 0 && !generating && (
                <div className="mt-6">
                  {complianceLoading && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
                        <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                        Checking brand compliance...
                      </div>
                    </div>
                  )}

                  {compliance && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      {/* Color bar */}
                      <div className={`h-1.5 ${complianceBarColor}`} />

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-semibold text-gray-700">Brand Compliance</h3>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${complianceBadgeColor}`}>
                              {compliance.score}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {compliance.violations.length > 0 && (
                              <>
                                <button
                                  onClick={fixAllViolations}
                                  disabled={fixingAll}
                                  className="text-xs font-semibold btn-accent rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                >
                                  {fixingAll ? 'Fixing...' : 'Fix All'}
                                </button>
                                <button
                                  onClick={() => setComplianceExpanded(!complianceExpanded)}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                  {complianceExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Violations list */}
                        {complianceExpanded && compliance.violations.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {compliance.violations.map((violation) => (
                              <div
                                key={violation.id}
                                className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 text-sm"
                              >
                                <span className="text-base leading-none mt-0.5">{violationIcon(violation.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-700">{violation.description}</p>
                                  {violation.originalText && (
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                      &ldquo;{violation.originalText}&rdquo;
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => fixViolation(violation)}
                                  disabled={fixingViolations.has(violation.id)}
                                  className="text-xs font-medium rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50 flex-shrink-0"
                                  style={{ color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
                                >
                                  {fixingViolations.has(violation.id) ? 'Fixing...' : 'Fix'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {compliance.violations.length === 0 && (
                          <p className="text-xs text-green-600 mt-1">All clear — no brand violations detected.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Brand Preview Modal (Full Screen) */}
      {showPreview && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Brand Preview</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleApproveAndPrint}
                disabled={previewLoading}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-5 py-2.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <HiOutlineCheck className="text-lg" /> Approve &amp; Print
              </button>
              <button
                onClick={() => { setShowPreview(false); setPreviewHtml(''); }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg px-5 py-2.5 transition-colors"
              >
                <HiOutlineArrowPath className="text-lg" /> Back to Edit
              </button>
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  <p className="text-sm text-gray-500">Loading preview...</p>
                </div>
              </div>
            ) : (
              <iframe
                ref={previewIframeRef}
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                title="Brand Preview"
              />
            )}
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Send to Prospect</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineXMark className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {loadingEmail ? (
                <div className="text-center py-8 text-gray-400 animate-pulse">Drafting email...</div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                    <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent resize-y" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={copyEmailToClipboard}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                      <HiOutlineClipboard /> Copy Email
                    </button>
                    <button onClick={openInGmail}
                      className="flex-1 btn-accent font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                      <HiOutlineEnvelope /> Open in Gmail
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share to Library Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Share to Library</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineXMark className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Add 1-3 tags to help others find this content.</p>
              <div className="flex flex-wrap gap-2">
                {shareTags.map((tag, i) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                    {tag}
                    <button onClick={() => setShareTags(shareTags.filter((_, idx) => idx !== i))} className="hover:text-red-600">&times;</button>
                  </span>
                ))}
              </div>
              {shareTags.length < 3 && (
                <div className="flex gap-2">
                  <input value={shareTagInput} onChange={(e) => setShareTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && shareTagInput.trim()) {
                        e.preventDefault();
                        setShareTags([...shareTags, shareTagInput.trim()]);
                        setShareTagInput('');
                      }
                    }}
                    placeholder="e.g. manufacturing, SAP, outbound"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-accent" />
                  <button onClick={() => {
                    if (shareTagInput.trim()) {
                      setShareTags([...shareTags, shareTagInput.trim()]);
                      setShareTagInput('');
                    }
                  }} className="text-sm px-3" style={{ color: 'var(--accent)' }}>Add</button>
                </div>
              )}
              <button onClick={shareToLibrary}
                className="w-full btn-accent font-medium py-2.5 rounded-lg">
                Share to Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
