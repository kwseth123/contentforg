'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  ProductProfile,
  ProductFeature,
  ProductObjection,
  ProductPromptTemplate,
  ProductCompetitorMapping,
  ProductStatus,
  ProductExtractionSource,
  ContentType,
  CONTENT_TYPE_LABELS,
  EMPTY_PRODUCT_PROFILE,
} from '@/lib/types';
import { INDUSTRY_LIST } from '@/lib/industryData';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineDocumentDuplicate,
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineBeaker,
  HiOutlineDocumentText,
  HiOutlineScale,
  HiOutlineFunnel,
  HiOutlineCheck,
} from 'react-icons/hi2';

// ═══════════════════════════════════════════════
// Demo product data
// ═══════════════════════════════════════════════

const DEMO_PRODUCTS: Omit<ProductProfile, 'id' | 'lastUpdated' | 'createdAt'>[] = [
  {
    name: 'CloudSync Platform',
    shortDescription: 'SaaS project management with real-time collaboration and AI-powered scheduling',
    fullDescription:
      'CloudSync Platform is a next-generation project management solution designed for distributed teams. It combines real-time document collaboration, AI-driven task prioritization, Gantt and Kanban views, resource allocation, and integrated time tracking into a unified workspace. Built for teams of 10 to 10,000, CloudSync eliminates tool sprawl and keeps every stakeholder aligned from kickoff to delivery.',
    features: [
      { id: '', name: 'AI Task Prioritization', description: 'Machine learning ranks tasks by impact, urgency, and team capacity to surface what matters most.' },
      { id: '', name: 'Real-Time Collaboration', description: 'Co-edit documents, whiteboards, and project plans simultaneously with zero lag.' },
      { id: '', name: 'Resource Forecasting', description: 'Predict team utilization 8 weeks ahead and rebalance workloads before burnout hits.' },
      { id: '', name: 'Custom Workflows', description: 'Drag-and-drop workflow builder with conditional logic, approvals, and SLA timers.' },
      { id: '', name: 'Unified Dashboard', description: 'Portfolio-level visibility across all projects with customizable KPI widgets.' },
    ],
    benefits: [
      '35% faster project delivery through AI-optimized scheduling',
      '60% reduction in status meeting time with real-time dashboards',
      'Single platform replaces 4-5 point solutions, saving $50K+/year',
      '99.99% uptime SLA with SOC 2 Type II certification',
    ],
    idealUseCase: 'Mid-market and enterprise teams managing 10+ concurrent projects who need real-time visibility and AI-driven prioritization without the complexity of legacy PPM tools.',
    targetPersonas: ['VP of Engineering', 'PMO Director', 'Product Manager', 'CTO'],
    targetIndustries: ['SaaS', 'Software Development', 'IT Consulting', 'Marketing Agencies', 'Management Consulting'],
    differentiators: [
      'Only PM tool with native AI task prioritization — no third-party add-ons',
      'Real-time collaboration engine built on CRDTs, not polling',
      'Portfolio-level resource forecasting included at no extra cost',
    ],
    proofPoints: [
      'Apex Software reduced project overruns by 42% in Q1 after switching to CloudSync',
      'BrightPath Consulting consolidated 5 tools into CloudSync, saving $180K annually',
      'Named a G2 Leader in Project Management for 6 consecutive quarters',
    ],
    objections: [
      { id: '', objection: 'We already use Jira/Asana and switching costs are high', response: 'CloudSync offers a free migration assistant that imports projects, histories, and automations from Jira, Asana, and Monday in under 48 hours. Customers report full team adoption within 2 weeks thanks to our familiar UX patterns.' },
      { id: '', objection: 'AI features sound like marketing hype', response: 'Our AI engine is trained on 2M+ real project timelines. In blind A/B tests, AI-prioritized teams shipped 28% faster. We offer a free 30-day proof-of-value so you can measure the impact on your own projects.' },
      { id: '', objection: 'Enterprise security requirements are strict', response: 'CloudSync is SOC 2 Type II certified, supports SAML SSO, and offers data residency in US, EU, and APAC. We pass security reviews at Fortune 500 companies routinely.' },
    ],
    pricingNotes: 'Starter: $12/user/mo (up to 50 users). Business: $24/user/mo (unlimited users, AI features). Enterprise: Custom pricing. Annual billing saves 20%.',
    relatedProducts: [],
    status: 'active',
    promptTemplates: [
      { id: '', label: 'CloudSync ROI Calculator', promptText: 'Create a detailed ROI analysis for a prospect evaluating CloudSync Platform. Include productivity gains, tool consolidation savings, and reduced project overruns.', contentType: 'roi-business-case' },
      { id: '', label: 'PM Tool Comparison', promptText: 'Generate a comparison document showing CloudSync Platform advantages over Jira, Asana, and Monday.com for enterprise project management.', contentType: 'comparison-guide' },
    ],
    contentGeneratedCount: 64,
    extractionSources: [],
  },
  {
    name: 'SecureVault Pro',
    shortDescription: 'Enterprise cybersecurity platform with zero-trust architecture and AI threat detection',
    fullDescription:
      'SecureVault Pro is a comprehensive cybersecurity platform that protects organizations from advanced threats through zero-trust network access, AI-powered threat detection, endpoint protection, and automated incident response. Designed for security teams managing hybrid cloud environments, it provides unified visibility across on-premise, cloud, and remote endpoints with a single pane of glass.',
    features: [
      { id: '', name: 'Zero-Trust Network Access', description: 'Identity-based micro-segmentation that verifies every user and device before granting access.' },
      { id: '', name: 'AI Threat Detection', description: 'Behavioral analytics engine processes 10B+ events/day to detect anomalies in real time.' },
      { id: '', name: 'Automated Incident Response', description: 'Playbook-driven response that contains threats in under 60 seconds without human intervention.' },
      { id: '', name: 'Endpoint Protection', description: 'Next-gen antivirus with fileless attack detection and ransomware rollback capabilities.' },
      { id: '', name: 'Compliance Dashboard', description: 'Continuous compliance monitoring for SOC 2, HIPAA, PCI-DSS, and GDPR with audit-ready reports.' },
    ],
    benefits: [
      '95% reduction in mean time to detect (MTTD) threats',
      '80% fewer false positives compared to legacy SIEM solutions',
      'Automated response reduces containment time from hours to seconds',
      'Unified platform eliminates the need for 6+ separate security tools',
    ],
    idealUseCase: 'Mid-market and enterprise organizations with 500+ employees managing hybrid cloud environments who need to modernize their security stack and achieve zero-trust compliance.',
    targetPersonas: ['CISO', 'VP of Security', 'Security Operations Manager', 'IT Director', 'Compliance Officer'],
    targetIndustries: ['Cybersecurity', 'Banking', 'Insurance', 'Healthcare IT', 'SaaS', 'Federal Government'],
    differentiators: [
      'Only platform combining ZTNA, EDR, and SIEM in a single agent — no integration headaches',
      'AI engine trained on 500M+ real attack patterns, not just signatures',
      '60-second automated containment SLA backed by financial guarantee',
    ],
    proofPoints: [
      'First National Bank blocked a sophisticated ransomware attack within 12 seconds of detection',
      'MedCore Health achieved HIPAA compliance in 30 days using SecureVault Pro compliance automation',
      'Recognized as a Gartner Magic Quadrant Leader in Endpoint Protection 2025',
    ],
    objections: [
      { id: '', objection: 'We have too many security tools already — adding another is a burden', response: 'SecureVault Pro replaces your SIEM, EDR, ZTNA, and compliance tools in one platform. Customers typically decommission 4-6 tools after deployment, reducing total security spend by 35%.' },
      { id: '', objection: 'Our team is too small to manage another platform', response: 'Our automated playbooks handle 90% of incidents without human intervention. Customers with 2-person security teams manage 10,000+ endpoints effectively with SecureVault Pro.' },
      { id: '', objection: 'AI security tools generate too many false positives', response: 'Our behavioral analytics correlate signals across identity, network, and endpoint data. This multi-signal approach delivers 80% fewer false positives than single-vector solutions. We offer a 30-day POC so you can measure your actual alert-to-noise ratio.' },
    ],
    pricingNotes: 'Per-endpoint pricing: $8/endpoint/mo (Core), $15/endpoint/mo (Pro with AI), $22/endpoint/mo (Enterprise with ZTNA). Minimum 100 endpoints. 3-year contracts receive 25% discount.',
    relatedProducts: [],
    status: 'active',
    promptTemplates: [
      { id: '', label: 'Security ROI Business Case', promptText: 'Build a compelling business case for replacing legacy security tools with SecureVault Pro. Include breach cost avoidance, tool consolidation savings, and productivity gains for the security team.', contentType: 'roi-business-case' },
    ],
    contentGeneratedCount: 41,
    extractionSources: [],
  },
  {
    name: 'DataFlow Analytics',
    shortDescription: 'Business intelligence platform with natural language queries and embedded analytics',
    fullDescription:
      'DataFlow Analytics democratizes data by letting business users ask questions in plain English and get instant visualizations. It connects to 200+ data sources, offers a drag-and-drop dashboard builder, and provides embedded analytics that can be white-labeled into any SaaS product. Purpose-built for organizations that want self-service BI without requiring every user to learn SQL.',
    features: [
      { id: '', name: 'Natural Language Queries', description: 'Ask data questions in plain English and get instant charts, tables, and insights.' },
      { id: '', name: '200+ Data Connectors', description: 'Pre-built connectors for databases, SaaS apps, spreadsheets, and APIs with automatic schema detection.' },
      { id: '', name: 'Embedded Analytics', description: 'White-label dashboards and reports directly into your product with full SSO and theming support.' },
      { id: '', name: 'Predictive Insights', description: 'Built-in forecasting models that project trends and flag anomalies without data science expertise.' },
      { id: '', name: 'Collaborative Notebooks', description: 'Shared analysis workspaces where teams can annotate, comment, and version-control their queries.' },
    ],
    benefits: [
      '10x faster time-to-insight vs. traditional BI tools',
      '75% of business users become self-serve within 30 days',
      'Embedded analytics adds analytics revenue to your SaaS product',
      'No SQL required — natural language lowers the barrier for non-technical users',
    ],
    idealUseCase: 'Data-driven organizations with 100+ employees that want to empower business users with self-service analytics or SaaS companies looking to embed analytics into their products.',
    targetPersonas: ['VP of Data', 'Head of Product', 'Business Intelligence Manager', 'CFO', 'COO'],
    targetIndustries: ['SaaS', 'FinTech', 'E-Commerce', 'Data Analytics', 'Insurance', 'Wholesale Distribution'],
    differentiators: [
      'Natural language query engine understands business context, not just SQL translation',
      'Only embedded analytics platform with built-in white-labeling and SSO at no extra cost',
      'Time-to-first-dashboard is 15 minutes vs. days with Tableau or Looker',
    ],
    proofPoints: [
      'RetailMax enabled 500 store managers to build their own reports, reducing BI team backlog by 70%',
      'FinEdge embedded DataFlow into their SaaS product and increased ARPU by 40%',
      'Named a Forrester Wave Leader in Augmented Analytics 2025',
    ],
    objections: [
      { id: '', objection: 'We already invested heavily in Tableau/Power BI', response: 'DataFlow complements existing BI tools — it handles the 80% of ad-hoc questions that do not need a data analyst. Customers keep Tableau for complex modeling while DataFlow serves self-service needs, reducing BI ticket volume by 60%.' },
      { id: '', objection: 'Natural language queries cannot be as accurate as SQL', response: 'Our NLQ engine achieves 94% accuracy on standard business queries. For complex joins, it shows the generated SQL for review. Most users find they need SQL less than 5% of the time after 30 days.' },
      { id: '', objection: 'Embedded analytics pricing is usually prohibitive', response: 'Our embedded tier is priced per-end-user at $0.50/user/mo with unlimited dashboards. Competitors charge $5-15/user/mo for comparable features. Run the math on your user base and the ROI becomes clear.' },
    ],
    pricingNotes: 'Self-Service: $30/user/mo (up to 500 users). Embedded: $0.50/end-user/mo + $2,000/mo platform fee. Enterprise: Custom. Free tier available for up to 5 users.',
    relatedProducts: [],
    status: 'coming-soon',
    promptTemplates: [
      { id: '', label: 'BI Tool Comparison', promptText: 'Create a comparison document positioning DataFlow Analytics against Tableau, Power BI, and Looker for self-service analytics use cases.', contentType: 'comparison-guide' },
      { id: '', label: 'Embedded Analytics Pitch', promptText: 'Generate a one-pager for SaaS companies explaining how embedding DataFlow Analytics can increase ARPU and reduce churn.', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 12,
    extractionSources: [],
  },
];

// ═══════════════════════════════════════════════
// Types for extraction preview
// ═══════════════════════════════════════════════

interface ExtractedProductData {
  name?: string;
  shortDescription?: string;
  fullDescription?: string;
  features?: { name: string; description: string }[];
  benefits?: string[];
  idealUseCase?: string;
  targetPersonas?: string[];
  targetIndustries?: string[];
  differentiators?: string[];
  proofPoints?: string[];
  objections?: { objection: string; response: string }[];
  pricingNotes?: string;
}

type EditorTab = 'overview' | 'features' | 'benefits' | 'personas' | 'objections' | 'proof' | 'templates' | 'competitive';

// ═══════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const isAdmin = role === 'admin';

  // Products state
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');

  // Editor state
  const [editingProduct, setEditingProduct] = useState<ProductProfile | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('overview');
  const [saving, setSaving] = useState(false);

  // Document extraction state
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProductData | null>(null);
  const [extractionFileName, setExtractionFileName] = useState('');
  const [selectedExtractFields, setSelectedExtractFields] = useState<Set<keyof ExtractedProductData>>(new Set());

  // Comparison state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  // Competitive Matrix state
  const [showCompetitiveMatrix, setShowCompetitiveMatrix] = useState(false);
  const [matrixSortCol, setMatrixSortCol] = useState<string | null>(null);
  const [matrixSortAsc, setMatrixSortAsc] = useState(true);
  const [matrixHoverCell, setMatrixHoverCell] = useState<{ productId: string; competitor: string } | null>(null);

  // Competitive Landscape tab state
  const [showInlineMatrix, setShowInlineMatrix] = useState(false);
  const [inlineMatrixSort, setInlineMatrixSort] = useState<'asc' | 'desc' | null>(null);

  // Demo loading state
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Industry autocomplete
  const [industryInput, setIndustryInput] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const industryRef = useRef<HTMLDivElement>(null);

  // Auth redirect
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProducts();
    }
  }, [status, loadProducts]);

  // Close industry dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (industryRef.current && !industryRef.current.contains(e.target as Node)) {
        setShowIndustryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── CRUD Helpers ──

  const saveProduct = async (product: ProductProfile) => {
    setSaving(true);
    try {
      const isNew = !products.some((p) => p.id === product.id);
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, lastUpdated: new Date().toISOString() }),
      });
      if (res.ok) {
        toast.success('Product saved');
        await loadProducts();
        setEditingProduct(null);
        setExtractedData(null);
        setExtractionFileName('');
        setSelectedExtractFields(new Set());
      } else {
        toast.error('Failed to save product');
      }
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Product deleted');
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const duplicateProduct = (product: ProductProfile) => {
    const dup: ProductProfile = {
      ...JSON.parse(JSON.stringify(product)),
      id: uuidv4(),
      name: `${product.name} (Copy)`,
      contentGeneratedCount: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    openEditor(dup);
  };

  const openEditor = (product: ProductProfile) => {
    setEditingProduct(JSON.parse(JSON.stringify(product)));
    setEditorTab('overview');
    setExtractedData(null);
    setExtractionFileName('');
    setSelectedExtractFields(new Set());
  };

  const openNewProduct = () => {
    const p = EMPTY_PRODUCT_PROFILE();
    p.id = uuidv4();
    openEditor(p);
  };

  // ── Demo products ──

  const loadDemoProducts = async () => {
    setLoadingDemo(true);
    try {
      for (const demo of DEMO_PRODUCTS) {
        const now = new Date().toISOString();
        const product: ProductProfile = {
          ...demo,
          id: uuidv4(),
          lastUpdated: now,
          createdAt: now,
          features: demo.features.map((f) => ({ ...f, id: uuidv4() })),
          objections: demo.objections.map((o) => ({ ...o, id: uuidv4() })),
          promptTemplates: demo.promptTemplates.map((t) => ({ ...t, id: uuidv4() })),
        };
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      }
      toast.success('Demo products loaded');
      await loadProducts();
    } catch {
      toast.error('Failed to load demo products');
    } finally {
      setLoadingDemo(false);
    }
  };

  // ── Document upload & extraction ──

  const handleDocumentUpload = async (file: File) => {
    if (!editingProduct) return;
    setUploading(true);
    try {
      // Step 1: Parse the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'session');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => null);
        const errMsg = errData?.error || 'Could not parse this document. Try a different format or paste content manually.';
        toast.error(errMsg);
        setUploading(false);
        return;
      }
      const uploadData = await uploadRes.json();

      // Step 2: Send to product-parse endpoint
      const parseRes = await fetch('/api/product-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: uploadData.content,
          fileName: file.name,
          existingProfile: editingProduct,
        }),
      });
      if (!parseRes.ok) {
        const errData = await parseRes.json().catch(() => null);
        const errMsg = errData?.error || 'Could not parse this document. Try a different format or paste content manually.';
        toast.error(errMsg);
        setUploading(false);
        return;
      }
      const parseData = await parseRes.json();
      const extracted: ExtractedProductData = parseData.extracted;
      if (!extracted || Object.keys(extracted).length === 0) {
        toast.error('No product information could be extracted from this document. Try a more detailed document or paste content manually.');
        setUploading(false);
        return;
      }
      setExtractedData(extracted);
      setExtractionFileName(parseData.sourceFile || file.name);
      setSelectedExtractFields(new Set());

      // Add extraction source
      setEditingProduct((prev) => {
        if (!prev) return prev;
        const source: ProductExtractionSource = { fileName: file.name, extractedAt: new Date().toISOString() };
        return { ...prev, extractionSources: [...prev.extractionSources, source] };
      });

      toast.success('Document parsed -- review extracted fields below');
    } catch (err) {
      console.error('Document extraction failed:', err);
      toast.error('Could not parse this document. Try a different format or paste content manually.');
    } finally {
      setUploading(false);
    }
  };

  // Merge a single extracted field
  const mergeField = (field: keyof ExtractedProductData) => {
    if (!editingProduct || !extractedData) return;
    const value = extractedData[field];
    if (value === undefined || value === null) return;

    setEditingProduct((prev) => {
      if (!prev) return prev;
      if (field === 'features') {
        const newFeatures = (value as { name: string; description: string }[]).map((f) => ({
          id: uuidv4(),
          name: f.name,
          description: f.description,
        }));
        return { ...prev, features: [...prev.features, ...newFeatures] };
      }
      if (field === 'objections') {
        const newObjections = (value as { objection: string; response: string }[]).map((o) => ({
          id: uuidv4(),
          objection: o.objection,
          response: o.response,
        }));
        return { ...prev, objections: [...prev.objections, ...newObjections] };
      }
      if (Array.isArray(value)) {
        const existing = (prev[field] as string[]) || [];
        const merged = [...new Set([...existing, ...(value as string[])])];
        return { ...prev, [field]: merged };
      }
      return { ...prev, [field]: value };
    });

    // Remove from extracted
    setExtractedData((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    toast.success(`Merged: ${field}`);
  };

  const mergeAll = () => {
    if (!extractedData) return;
    const fields = Object.keys(extractedData) as (keyof ExtractedProductData)[];
    for (const f of fields) {
      mergeField(f);
    }
  };

  const mergeSelected = () => {
    if (!extractedData || selectedExtractFields.size === 0) return;
    const fields = Array.from(selectedExtractFields);
    for (const f of fields) {
      mergeField(f);
    }
    setSelectedExtractFields(new Set());
  };

  const toggleExtractField = (field: keyof ExtractedProductData) => {
    setSelectedExtractFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  // ── Product comparison ──

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      else toast.error('Select up to 3 products for comparison');
      return next;
    });
  };

  // ── Filtering ──

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Status badge helper ──

  const statusBadge = (s: ProductStatus) => {
    const map: Record<ProductStatus, { label: string; cls: string }> = {
      active: { label: 'Active', cls: 'bg-green-100 text-green-700' },
      'coming-soon': { label: 'Coming Soon', cls: 'bg-yellow-100 text-yellow-700' },
      sunset: { label: 'Sunset', cls: 'bg-red-100 text-red-700' },
    };
    const { label, cls } = map[s];
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
  };

  // ── Format date helper ──

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  // ── Loading / Auth guard ──

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--content-bg)' }}>
          <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading products...</div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // Editor Panel (slide-over)
  // ═══════════════════════════════════════════════

  const editorTabs: { id: EditorTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'benefits', label: 'Benefits & Differentiators' },
    { id: 'personas', label: 'Personas & Industries' },
    { id: 'objections', label: 'Objections' },
    { id: 'proof', label: 'Proof Points' },
    { id: 'templates', label: 'Templates' },
    { id: 'competitive', label: 'Competitive Landscape' },
  ];

  const ep = editingProduct; // shorthand

  const updateEP = (updates: Partial<ProductProfile>) => {
    setEditingProduct((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  // ── Industry autocomplete helpers ──
  const filteredIndustries = INDUSTRY_LIST.filter(
    (ind) =>
      ind.toLowerCase().includes(industryInput.toLowerCase()) &&
      !ep?.targetIndustries.includes(ind)
  ).slice(0, 8);

  const addIndustry = (industry: string) => {
    if (!ep) return;
    if (!ep.targetIndustries.includes(industry)) {
      updateEP({ targetIndustries: [...ep.targetIndustries, industry] });
    }
    setIndustryInput('');
    setShowIndustryDropdown(false);
  };

  const renderEditor = () => {
    if (!ep) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => {
            setEditingProduct(null);
            setExtractedData(null);
          }}
        />

        {/* Slide-over panel */}
        <div className="fixed inset-y-0 right-0 w-full max-w-3xl shadow-2xl z-50 flex flex-col" style={{ backgroundColor: 'var(--card-bg)' }}>
          {/* Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{ep.name || 'New Product'}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {ep.createdAt ? `Created ${fmtDate(ep.createdAt)}` : 'New product'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Document Upload Button */}
              {isAdmin && (
                <label className="border text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
                  <HiOutlineArrowUpTray className="text-base" />
                  {uploading ? 'Parsing...' : 'Upload Doc'}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(file);
                    }}
                  />
                </label>
              )}
              {isAdmin && (
                <button
                  onClick={() => saveProduct(ep)}
                  disabled={saving || !ep.name || !ep.shortDescription}
                  className="btn-accent disabled:opacity-50 text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              )}
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setExtractedData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineXMark className="text-xl" />
              </button>
            </div>
          </div>

          {/* Extraction Preview Banner */}
          {extractedData && Object.keys(extractedData).length > 0 && (
            <div className="border-b px-6 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--accent)' }}>
                  <span className="font-semibold">{Object.keys(extractedData).length} fields</span> extracted from{' '}
                  <span className="font-medium">{extractionFileName}</span>
                </p>
                <div className="flex items-center gap-2">
                  {selectedExtractFields.size > 0 && (
                    <button
                      onClick={mergeSelected}
                      className="btn-accent text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Accept Selected ({selectedExtractFields.size})
                    </button>
                  )}
                  <button
                    onClick={mergeAll}
                    className="btn-accent text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => {
                      setExtractedData(null);
                      setSelectedExtractFields(new Set());
                    }}
                    className="text-xs px-2 py-1.5" style={{ color: 'var(--accent)' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b px-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div className="flex gap-1 overflow-x-auto">
              {editorTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEditorTab(tab.id)}
                  className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    editorTab === tab.id
                      ? 'border-b-2'
                      : ''
                  }`}
                  style={editorTab === tab.id
                    ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : { color: 'var(--text-secondary)' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Extraction Preview (shown above tab content when data exists) */}
            {extractedData && Object.keys(extractedData).length > 0 && (
              <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>Extraction Preview</h3>
                <div className="space-y-3">
                  {(Object.keys(extractedData) as (keyof ExtractedProductData)[]).map((field) => {
                    const value = extractedData[field];
                    if (value === undefined || value === null) return null;
                    const currentValue = ep[field as keyof ProductProfile];
                    const isFieldSelected = selectedExtractFields.has(field);

                    return (
                      <div
                        key={field}
                        className={`grid grid-cols-2 gap-4 rounded-lg p-4 cursor-pointer transition-colors ${
                          isFieldSelected ? 'ring-1' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        style={isFieldSelected ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', '--tw-ring-color': 'color-mix(in srgb, var(--accent) 40%, transparent)' } as React.CSSProperties : undefined}
                        onClick={() => toggleExtractField(field)}
                      >
                        {/* Left: Current Value */}
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase mb-1 block">
                            Current: {field}
                          </span>
                          <div className="text-sm text-gray-500 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                            {currentValue === undefined ||
                            currentValue === null ||
                            currentValue === '' ||
                            (Array.isArray(currentValue) && currentValue.length === 0) ? (
                              <span className="italic text-gray-300">Empty</span>
                            ) : typeof currentValue === 'string' ? (
                              currentValue
                            ) : (
                              JSON.stringify(currentValue, null, 2)
                            )}
                          </div>
                        </div>
                        {/* Right: Extracted Value */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold uppercase" style={{ color: 'var(--accent)' }}>Extracted</span>
                            <div className="flex items-center gap-2">
                              {isFieldSelected && (
                                <HiOutlineCheckCircle className="text-base" style={{ color: 'var(--accent)' }} />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mergeField(field);
                                }}
                                className="btn-accent text-xs px-2.5 py-1 rounded-md transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExtractedData((prev) => {
                                    if (!prev) return prev;
                                    const next = { ...prev };
                                    delete next[field];
                                    return next;
                                  });
                                }}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-2.5 py-1 rounded-md transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Extraction Sources */}
                {ep.extractionSources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">Extraction Sources</p>
                    <div className="space-y-1">
                      {ep.extractionSources.map((src, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                          <HiOutlineDocumentText className="text-gray-400" />
                          <span>{src.fileName}</span>
                          <span className="text-gray-300">{fmtDate(src.extractedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {editorTab === 'overview' && renderOverviewTab()}
            {editorTab === 'features' && renderFeaturesTab()}
            {editorTab === 'benefits' && renderBenefitsTab()}
            {editorTab === 'personas' && renderPersonasTab()}
            {editorTab === 'objections' && renderObjectionsTab()}
            {editorTab === 'proof' && renderProofTab()}
            {editorTab === 'templates' && renderTemplatesTab()}
            {editorTab === 'competitive' && renderCompetitiveTab()}
          </div>
        </div>
      </>
    );
  };

  // ── Tab Renderers ──

  const renderOverviewTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    return (
      <div className="space-y-4">
        <Section title="Basic Information">
          <Field label="Product Name *" value={ep.name} onChange={(v) => updateEP({ name: v })} disabled={disabled} />
          <Field
            label="Short Description *"
            value={ep.shortDescription}
            onChange={(v) => updateEP({ shortDescription: v })}
            disabled={disabled}
          />
          <TextArea
            label="Full Description"
            value={ep.fullDescription}
            onChange={(v) => updateEP({ fullDescription: v })}
            rows={5}
            disabled={disabled}
          />
          <TextArea
            label="Ideal Use Case"
            value={ep.idealUseCase}
            onChange={(v) => updateEP({ idealUseCase: v })}
            rows={3}
            disabled={disabled}
          />
          <TextArea
            label="Pricing Notes"
            value={ep.pricingNotes}
            onChange={(v) => updateEP({ pricingNotes: v })}
            rows={3}
            disabled={disabled}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={ep.status}
              onChange={(e) => updateEP({ status: e.target.value as ProductStatus })}
              disabled={disabled}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            >
              <option value="active">Active</option>
              <option value="coming-soon">Coming Soon</option>
              <option value="sunset">Sunset</option>
            </select>
          </div>
        </Section>
      </div>
    );
  };

  const renderFeaturesTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    return (
      <div className="space-y-6">
        <Section
          title="Features"
          action={
            isAdmin ? (
              <button
                onClick={() => {
                  const f: ProductFeature = { id: uuidv4(), name: '', description: '' };
                  updateEP({ features: [...ep.features, f] });
                }}
                className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}
              >
                <HiOutlinePlus /> Add Feature
              </button>
            ) : undefined
          }
        >
          {ep.features.length === 0 && <p className="text-sm text-gray-400">No features added yet.</p>}
          {ep.features.map((feat, idx) => (
            <div key={feat.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-gray-400">Feature {idx + 1}</span>
                {isAdmin && (
                  <button
                    onClick={() => updateEP({ features: ep.features.filter((f) => f.id !== feat.id) })}
                    className="text-red-400 hover:text-red-600"
                  >
                    <HiOutlineTrash className="text-sm" />
                  </button>
                )}
              </div>
              <input
                value={feat.name}
                onChange={(e) => {
                  const features = [...ep.features];
                  features[idx] = { ...feat, name: e.target.value };
                  updateEP({ features });
                }}
                disabled={disabled}
                placeholder="Feature name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              />
              <textarea
                value={feat.description}
                onChange={(e) => {
                  const features = [...ep.features];
                  features[idx] = { ...feat, description: e.target.value };
                  updateEP({ features });
                }}
                disabled={disabled}
                placeholder="Feature description"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-y disabled:bg-gray-100" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              />
            </div>
          ))}
        </Section>
      </div>
    );
  };

  const renderBenefitsTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    return (
      <div className="space-y-6">
        <Section title="Benefits">
          <StringList
            values={ep.benefits}
            onChange={(v) => updateEP({ benefits: v })}
            disabled={disabled}
            placeholder="Add a benefit"
          />
        </Section>

        <Section title="Differentiators">
          <StringList
            values={ep.differentiators}
            onChange={(v) => updateEP({ differentiators: v })}
            disabled={disabled}
            placeholder="Add a differentiator"
          />
        </Section>
      </div>
    );
  };

  const renderPersonasTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    return (
      <div className="space-y-6">
        <Section title="Target Personas">
          <ChipInput
            values={ep.targetPersonas}
            onChange={(v) => updateEP({ targetPersonas: v })}
            disabled={disabled}
            placeholder="Type a persona and press Enter"
          />
        </Section>

        <Section title="Target Industries">
          <div className="flex flex-wrap gap-2 mb-2">
            {ep.targetIndustries.map((ind, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
              >
                {ind}
                {!disabled && (
                  <button
                    onClick={() =>
                      updateEP({ targetIndustries: ep.targetIndustries.filter((_, idx) => idx !== i) })
                    }
                    className="hover:text-red-600"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>
          {!disabled && (
            <div className="relative" ref={industryRef}>
              <input
                value={industryInput}
                onChange={(e) => {
                  setIndustryInput(e.target.value);
                  setShowIndustryDropdown(true);
                }}
                onFocus={() => {
                  if (industryInput.length > 0) setShowIndustryDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = industryInput.trim();
                    if (trimmed) addIndustry(trimmed);
                  }
                }}
                placeholder="Search industries or type custom..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
              />
              {showIndustryDropdown && industryInput.length > 0 && filteredIndustries.length > 0 && (
                <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  {filteredIndustries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => addIndustry(ind)}
                      className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
      </div>
    );
  };

  const renderObjectionsTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    return (
      <div className="space-y-6">
        <Section
          title="Objection Handling"
          action={
            isAdmin ? (
              <button
                onClick={() => {
                  const o: ProductObjection = { id: uuidv4(), objection: '', response: '' };
                  updateEP({ objections: [...ep.objections, o] });
                }}
                className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}
              >
                <HiOutlinePlus /> Add Objection
              </button>
            ) : undefined
          }
        >
          {ep.objections.length === 0 && <p className="text-sm text-gray-400">No objections added yet.</p>}
          {ep.objections.map((obj, idx) => (
            <div key={obj.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-gray-400">Objection {idx + 1}</span>
                {isAdmin && (
                  <button
                    onClick={() => updateEP({ objections: ep.objections.filter((o) => o.id !== obj.id) })}
                    className="text-red-400 hover:text-red-600"
                  >
                    <HiOutlineTrash className="text-sm" />
                  </button>
                )}
              </div>
              <TextArea
                label="Objection"
                value={obj.objection}
                onChange={(v) => {
                  const objections = [...ep.objections];
                  objections[idx] = { ...obj, objection: v };
                  updateEP({ objections });
                }}
                rows={2}
                disabled={disabled}
              />
              <TextArea
                label="Response"
                value={obj.response}
                onChange={(v) => {
                  const objections = [...ep.objections];
                  objections[idx] = { ...obj, response: v };
                  updateEP({ objections });
                }}
                rows={3}
                disabled={disabled}
              />
            </div>
          ))}
        </Section>
      </div>
    );
  };

  const renderProofTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    return (
      <div className="space-y-6">
        <Section title="Proof Points">
          <StringList
            values={ep.proofPoints}
            onChange={(v) => updateEP({ proofPoints: v })}
            disabled={disabled}
            placeholder="Add a proof point"
          />
        </Section>
      </div>
    );
  };

  const renderTemplatesTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    return (
      <div className="space-y-6">
        <Section
          title="Product-Specific Prompt Templates"
          action={
            isAdmin ? (
              <button
                onClick={() => {
                  const t: ProductPromptTemplate = { id: uuidv4(), label: '', promptText: '' };
                  updateEP({ promptTemplates: [...ep.promptTemplates, t] });
                }}
                className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}
              >
                <HiOutlinePlus /> Add Template
              </button>
            ) : undefined
          }
        >
          {ep.promptTemplates.length === 0 && (
            <p className="text-sm text-gray-400">No templates yet. Add prompts tailored to this product.</p>
          )}
          {ep.promptTemplates.map((tpl, idx) => (
            <div key={tpl.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-gray-400">Template {idx + 1}</span>
                {isAdmin && (
                  <button
                    onClick={() =>
                      updateEP({ promptTemplates: ep.promptTemplates.filter((t) => t.id !== tpl.id) })
                    }
                    className="text-red-400 hover:text-red-600"
                  >
                    <HiOutlineTrash className="text-sm" />
                  </button>
                )}
              </div>
              <Field
                label="Label"
                value={tpl.label}
                onChange={(v) => {
                  const promptTemplates = [...ep.promptTemplates];
                  promptTemplates[idx] = { ...tpl, label: v };
                  updateEP({ promptTemplates });
                }}
                disabled={disabled}
                placeholder="Short label (4-5 words)"
              />
              <TextArea
                label="Prompt Text"
                value={tpl.promptText}
                onChange={(v) => {
                  const promptTemplates = [...ep.promptTemplates];
                  promptTemplates[idx] = { ...tpl, promptText: v };
                  updateEP({ promptTemplates });
                }}
                rows={4}
                disabled={disabled}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type (optional)</label>
                <select
                  value={tpl.contentType || ''}
                  onChange={(e) => {
                    const promptTemplates = [...ep.promptTemplates];
                    promptTemplates[idx] = {
                      ...tpl,
                      contentType: (e.target.value || undefined) as ContentType | undefined,
                    };
                    updateEP({ promptTemplates });
                  }}
                  disabled={disabled}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                >
                  <option value="">None</option>
                  {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </Section>
      </div>
    );
  };

  // ── Competitive Tab Renderer ──

  const renderCompetitiveTab = () => {
    if (!ep) return null;
    const disabled = !isAdmin;
    const mappings = ep.competitorMappings || [];

    const winRateColor = (rate: number) => {
      if (rate > 60) return 'text-green-600';
      if (rate >= 40) return 'text-yellow-600';
      return 'text-red-600';
    };

    const winRateBg = (rate: number) => {
      if (rate > 60) return 'bg-green-500';
      if (rate >= 40) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const winRateRowBg = (rate: number) => {
      if (rate > 60) return 'bg-green-50 border-green-200';
      if (rate >= 40) return 'bg-yellow-50 border-yellow-200';
      return 'bg-red-50 border-red-200';
    };

    const showMatrix = showInlineMatrix;
    const setShowMatrix = setShowInlineMatrix;
    const matrixSort = inlineMatrixSort;
    const setMatrixSort = setInlineMatrixSort;

    const sortedMappings = [...mappings];
    if (matrixSort) {
      sortedMappings.sort((a, b) => matrixSort === 'asc' ? a.winRate - b.winRate : b.winRate - a.winRate);
    }

    return (
      <div className="space-y-6">
        {/* Toggle between card and matrix view */}
        {mappings.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMatrix(false)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${!showMatrix ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              style={!showMatrix ? { backgroundColor: 'var(--accent)' } : undefined}
            >
              Card View
            </button>
            <button
              onClick={() => setShowMatrix(true)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${showMatrix ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              style={showMatrix ? { backgroundColor: 'var(--accent)' } : undefined}
            >
              Matrix View
            </button>
          </div>
        )}

        {/* Matrix View */}
        {showMatrix && mappings.length > 0 && (
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--card-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Competitor</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Their Product</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Target ERP</th>
                    <th
                      className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => {
                        if (matrixSort === 'desc') setMatrixSort('asc');
                        else setMatrixSort('desc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Win Rate
                        {matrixSort && <span className="text-xs" style={{ color: 'var(--accent)' }}>{matrixSort === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                      </div>
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Key Differentiators</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMappings.map((mapping, rowIdx) => (
                    <tr key={mapping.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="text-sm font-medium text-gray-700 px-4 py-3">{mapping.competitorName || '-'}</td>
                      <td className="text-sm text-gray-600 px-4 py-3">{mapping.theirEquivalentProduct || '-'}</td>
                      <td className="text-sm text-gray-600 px-4 py-3">{mapping.targetErp || '-'}</td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${winRateRowBg(mapping.winRate)}`}>
                          <span className={`text-sm font-bold ${winRateColor(mapping.winRate)}`}>{mapping.winRate}%</span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600 px-4 py-3">
                        {(mapping.keyDifferentiators || []).length > 0
                          ? (mapping.keyDifferentiators || []).join(', ')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Card View */}
        {!showMatrix && (
          <Section
            title="Competitor Mappings"
            action={
              isAdmin ? (
                <button
                  onClick={() => {
                    const m: ProductCompetitorMapping = {
                      id: uuidv4(),
                      competitorName: '',
                      theirEquivalentProduct: '',
                      howWeWin: [],
                      howTheyWin: [],
                      talkTrack: '',
                      winRate: 50,
                    };
                    updateEP({ competitorMappings: [...mappings, m] });
                  }}
                  className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}
                >
                  <HiOutlinePlus /> Add Competitor
                </button>
              ) : undefined
            }
          >
            {mappings.length === 0 && (
              <p className="text-sm text-gray-400">No competitor mappings yet. Add competitors to track how this product stacks up.</p>
            )}
            {mappings.map((mapping, idx) => (
              <div key={mapping.id} className="bg-gray-50 rounded-lg p-5 space-y-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Competitor {idx + 1}</span>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${winRateRowBg(mapping.winRate)}`}>
                      <span className={`text-xs font-bold ${winRateColor(mapping.winRate)}`}>{mapping.winRate}% win rate</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => updateEP({ competitorMappings: mappings.filter((m) => m.id !== mapping.id) })}
                      className="text-red-400 hover:text-red-600"
                    >
                      <HiOutlineTrash className="text-sm" />
                    </button>
                  )}
                </div>

                {/* Competitor name, their product, target ERP */}
                <div className="grid grid-cols-3 gap-4">
                  <Field
                    label="Competitor Name"
                    value={mapping.competitorName}
                    onChange={(v) => {
                      const updated = [...mappings];
                      updated[idx] = { ...mapping, competitorName: v };
                      updateEP({ competitorMappings: updated });
                    }}
                    disabled={disabled}
                    placeholder="e.g. Salesforce"
                  />
                  <Field
                    label="Their Equivalent Product"
                    value={mapping.theirEquivalentProduct}
                    onChange={(v) => {
                      const updated = [...mappings];
                      updated[idx] = { ...mapping, theirEquivalentProduct: v };
                      updateEP({ competitorMappings: updated });
                    }}
                    disabled={disabled}
                    placeholder="e.g. Sales Cloud"
                  />
                  <Field
                    label="Target ERP / Platform"
                    value={mapping.targetErp || ''}
                    onChange={(v) => {
                      const updated = [...mappings];
                      updated[idx] = { ...mapping, targetErp: v };
                      updateEP({ competitorMappings: updated });
                    }}
                    disabled={disabled}
                    placeholder="e.g. SAP, Oracle"
                  />
                </div>

                {/* How We Win */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How We Win</label>
                  <StringList
                    values={mapping.howWeWin}
                    onChange={(v) => {
                      const updated = [...mappings];
                      updated[idx] = { ...mapping, howWeWin: v };
                      updateEP({ competitorMappings: updated });
                    }}
                    disabled={disabled}
                    placeholder="Add a win point"
                  />
                </div>

                {/* How They Win */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">How They Win</label>
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Internal Only</span>
                  </div>
                  <StringList
                    values={mapping.howTheyWin}
                    onChange={(v) => {
                      const updated = [...mappings];
                      updated[idx] = { ...mapping, howTheyWin: v };
                      updateEP({ competitorMappings: updated });
                    }}
                    disabled={disabled}
                    placeholder="Add their strength (honest assessment)"
                  />
                </div>

                {/* Key Differentiators */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Differentiators</label>
                  <StringList
                    values={mapping.keyDifferentiators || []}
                    onChange={(v) => {
                      const updated = [...mappings];
                      updated[idx] = { ...mapping, keyDifferentiators: v };
                      updateEP({ competitorMappings: updated });
                    }}
                    disabled={disabled}
                    placeholder="Add a differentiator vs this competitor"
                  />
                </div>

                {/* Talk Track */}
                <TextArea
                  label="Recommended Talk Track"
                  value={mapping.talkTrack}
                  onChange={(v) => {
                    const updated = [...mappings];
                    updated[idx] = { ...mapping, talkTrack: v };
                    updateEP({ competitorMappings: updated });
                  }}
                  rows={3}
                  disabled={disabled}
                />

                {/* Landmine Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Landmine Questions</label>
                  <StringList
                    values={mapping.landmineQuestions || []}
                    onChange={(v) => {
                      const updated = [...mappings];
                      updated[idx] = { ...mapping, landmineQuestions: v };
                      updateEP({ competitorMappings: updated });
                    }}
                    disabled={disabled}
                    placeholder="Add a question to expose their weakness"
                  />
                </div>

                {/* Objection Responses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Objection Responses</label>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          const updated = [...mappings];
                          updated[idx] = {
                            ...mapping,
                            objectionResponses: [...(mapping.objectionResponses || []), { objection: '', response: '' }],
                          };
                          updateEP({ competitorMappings: updated });
                        }}
                        className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}
                      >
                        <HiOutlinePlus /> Add
                      </button>
                    )}
                  </div>
                  {(mapping.objectionResponses || []).length === 0 && (
                    <p className="text-xs text-gray-400">No objection responses yet.</p>
                  )}
                  {(mapping.objectionResponses || []).map((or, orIdx) => (
                    <div key={orIdx} className="grid grid-cols-2 gap-3 mb-2 items-start">
                      <div>
                        <input
                          type="text"
                          value={or.objection}
                          onChange={(e) => {
                            const updated = [...mappings];
                            const ors = [...(mapping.objectionResponses || [])];
                            ors[orIdx] = { ...or, objection: e.target.value };
                            updated[idx] = { ...mapping, objectionResponses: ors };
                            updateEP({ competitorMappings: updated });
                          }}
                          disabled={disabled}
                          placeholder="When prospect says..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                          style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={or.response}
                          onChange={(e) => {
                            const updated = [...mappings];
                            const ors = [...(mapping.objectionResponses || [])];
                            ors[orIdx] = { ...or, response: e.target.value };
                            updated[idx] = { ...mapping, objectionResponses: ors };
                            updateEP({ competitorMappings: updated });
                          }}
                          disabled={disabled}
                          placeholder="Respond with..."
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                          style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                        />
                        {isAdmin && (
                          <button
                            onClick={() => {
                              const updated = [...mappings];
                              const ors = [...(mapping.objectionResponses || [])];
                              ors.splice(orIdx, 1);
                              updated[idx] = { ...mapping, objectionResponses: ors };
                              updateEP({ competitorMappings: updated });
                            }}
                            className="text-red-400 hover:text-red-600 shrink-0"
                          >
                            <HiOutlineTrash className="text-sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Comparison */}
                <TextArea
                  label="Pricing Comparison"
                  value={mapping.pricingComparison || ''}
                  onChange={(v) => {
                    const updated = [...mappings];
                    updated[idx] = { ...mapping, pricingComparison: v };
                    updateEP({ competitorMappings: updated });
                  }}
                  rows={2}
                  disabled={disabled}
                />

                {/* Recent Intel */}
                <TextArea
                  label="Recent Competitive Intelligence"
                  value={mapping.recentIntel || ''}
                  onChange={(v) => {
                    const updated = [...mappings];
                    updated[idx] = { ...mapping, recentIntel: v };
                    updateEP({ competitorMappings: updated });
                  }}
                  rows={2}
                  disabled={disabled}
                />

                {/* Win Rate Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Win Rate: <span className={`font-bold ${winRateColor(mapping.winRate)}`}>{mapping.winRate}%</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={mapping.winRate}
                      onChange={(e) => {
                        const updated = [...mappings];
                        updated[idx] = { ...mapping, winRate: parseInt(e.target.value) };
                        updateEP({ competitorMappings: updated });
                      }}
                      disabled={disabled}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer" style={{ accentColor: 'var(--accent)' }}
                    />
                    <div className={`w-10 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${winRateBg(mapping.winRate)}`}>
                      {mapping.winRate}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  // Competitive Matrix View
  // ═══════════════════════════════════════════════

  const renderCompetitiveMatrix = () => {
    // Gather all unique competitors from all products
    const allCompetitors = new Set<string>();
    products.forEach((p) => {
      (p.competitorMappings || []).forEach((m) => {
        if (m.competitorName.trim()) allCompetitors.add(m.competitorName.trim());
      });
    });
    const competitorList = Array.from(allCompetitors);

    if (competitorList.length === 0) {
      return (
        <div className="mt-8 border rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No Competitive Data</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add competitor mappings to your products to see the competitive matrix.</p>
          <button
            onClick={() => setShowCompetitiveMatrix(false)}
            className="mt-4 text-sm" style={{ color: 'var(--accent)' }}
          >
            Close
          </button>
        </div>
      );
    }

    // Sort competitors if a column is selected
    let sortedCompetitors = [...competitorList];
    if (matrixSortCol) {
      const product = products.find((p) => p.id === matrixSortCol);
      if (product) {
        sortedCompetitors.sort((a, b) => {
          const mA = (product.competitorMappings || []).find((m) => m.competitorName.trim() === a);
          const mB = (product.competitorMappings || []).find((m) => m.competitorName.trim() === b);
          const rateA = mA ? mA.winRate : -1;
          const rateB = mB ? mB.winRate : -1;
          return matrixSortAsc ? rateA - rateB : rateB - rateA;
        });
      }
    }

    const winRateColor = (rate: number) => {
      if (rate >= 70) return 'text-green-600';
      if (rate >= 50) return 'text-yellow-600';
      return 'text-red-600';
    };

    const winRateBg = (rate: number) => {
      if (rate >= 70) return 'bg-green-50 border-green-200';
      if (rate >= 50) return 'bg-yellow-50 border-yellow-200';
      return 'bg-red-50 border-red-200';
    };

    return (
      <div className="mt-8 border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Competitive Matrix</h3>
          <button
            onClick={() => setShowCompetitiveMatrix(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiOutlineXMark className="text-xl" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 w-44 sticky left-0 bg-gray-50">
                  Competitor
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    onClick={() => {
                      if (matrixSortCol === p.id) {
                        setMatrixSortAsc(!matrixSortAsc);
                      } else {
                        setMatrixSortCol(p.id);
                        setMatrixSortAsc(false);
                      }
                    }}
                    className="text-left text-sm font-semibold px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      {p.name}
                      {matrixSortCol === p.id && (
                        <span className="text-xs" style={{ color: 'var(--accent)' }}>{matrixSortAsc ? '\u25B2' : '\u25BC'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCompetitors.map((competitor, rowIdx) => (
                <tr key={competitor} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="text-sm font-medium text-gray-700 px-6 py-3 sticky left-0 bg-inherit">
                    {competitor}
                  </td>
                  {products.map((p) => {
                    const mapping = (p.competitorMappings || []).find(
                      (m) => m.competitorName.trim().toLowerCase() === competitor.toLowerCase()
                    );
                    const isHovered =
                      matrixHoverCell?.productId === p.id && matrixHoverCell?.competitor === competitor;

                    if (!mapping) {
                      return (
                        <td key={p.id} className="px-6 py-3 text-center">
                          <span className="text-gray-300">&mdash;</span>
                        </td>
                      );
                    }

                    return (
                      <td key={p.id} className="px-6 py-3 relative">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${winRateBg(mapping.winRate)}`}
                          onMouseEnter={() => setMatrixHoverCell({ productId: p.id, competitor })}
                          onMouseLeave={() => setMatrixHoverCell(null)}
                        >
                          <span className={`text-sm font-bold ${winRateColor(mapping.winRate)}`}>
                            {mapping.winRate}%
                          </span>
                        </div>
                        {isHovered && mapping.talkTrack && (
                          <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none">
                            <p className="font-semibold mb-1">{p.name} vs {competitor}</p>
                            {mapping.theirEquivalentProduct && (
                              <p className="text-gray-300 mb-1">Their product: {mapping.theirEquivalentProduct}</p>
                            )}
                            <p className="text-gray-200">{mapping.talkTrack}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  // Comparison View
  // ═══════════════════════════════════════════════

  const comparedProducts = products.filter((p) => selectedIds.has(p.id));

  const renderComparison = () => {
    if (!showComparison || comparedProducts.length < 2) return null;

    const rows: { label: string; getValue: (p: ProductProfile) => React.ReactNode }[] = [
      { label: 'Status', getValue: (p) => statusBadge(p.status) },
      { label: 'Short Description', getValue: (p) => <span className="text-sm text-gray-600">{p.shortDescription}</span> },
      {
        label: 'Features',
        getValue: (p) => (
          <ul className="text-sm text-gray-600 space-y-1">
            {p.features.map((f) => (
              <li key={f.id} className="flex items-start gap-1">
                <HiOutlineCheck className="text-green-500 mt-0.5 shrink-0" />
                <span>{f.name}</span>
              </li>
            ))}
            {p.features.length === 0 && <li className="text-gray-400 italic">None</li>}
          </ul>
        ),
      },
      {
        label: 'Benefits',
        getValue: (p) => (
          <ul className="text-sm text-gray-600 space-y-1">
            {p.benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
            {p.benefits.length === 0 && <li className="text-gray-400 italic">None</li>}
          </ul>
        ),
      },
      {
        label: 'Differentiators',
        getValue: (p) => (
          <ul className="text-sm text-gray-600 space-y-1">
            {p.differentiators.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
            {p.differentiators.length === 0 && <li className="text-gray-400 italic">None</li>}
          </ul>
        ),
      },
      { label: 'Ideal Use Case', getValue: (p) => <span className="text-sm text-gray-600">{p.idealUseCase || <span className="text-gray-400 italic">Not specified</span>}</span> },
      {
        label: 'Target Personas',
        getValue: (p) => (
          <div className="flex flex-wrap gap-1">
            {p.targetPersonas.map((t, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
            {p.targetPersonas.length === 0 && <span className="text-sm text-gray-400 italic">None</span>}
          </div>
        ),
      },
      {
        label: 'Target Industries',
        getValue: (p) => (
          <div className="flex flex-wrap gap-1">
            {p.targetIndustries.map((t, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
            {p.targetIndustries.length === 0 && <span className="text-sm text-gray-400 italic">None</span>}
          </div>
        ),
      },
      { label: 'Pricing Notes', getValue: (p) => <span className="text-sm text-gray-600">{p.pricingNotes || <span className="text-gray-400 italic">Not specified</span>}</span> },
      { label: 'Proof Points', getValue: (p) => <span className="text-sm text-gray-600">{p.proofPoints.length} proof points</span> },
      { label: 'Objections', getValue: (p) => <span className="text-sm text-gray-600">{p.objections.length} objections handled</span> },
      { label: 'Content Generated', getValue: (p) => <span className="text-sm text-gray-600">{p.contentGeneratedCount} documents</span> },
      { label: 'Last Updated', getValue: (p) => <span className="text-sm text-gray-600">{fmtDate(p.lastUpdated)}</span> },
    ];

    return (
      <div className="mt-8 border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Product Comparison</h3>
          <button
            onClick={() => {
              setShowComparison(false);
              setSelectedIds(new Set());
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiOutlineXMark className="text-xl" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 w-44">Attribute</th>
                {comparedProducts.map((p) => (
                  <th key={p.id} className="text-left text-sm font-semibold px-6 py-3">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="text-sm font-medium text-gray-700 px-6 py-3 align-top">{row.label}</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="px-6 py-3 align-top">
                      {row.getValue(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1" style={{ backgroundColor: 'var(--content-bg)' }}>
        {/* Header */}
        <div className="border-b px-8 py-5 flex items-center justify-between" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Product Library</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your product catalog for content generation</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCompetitiveMatrix(!showCompetitiveMatrix)}
              className="border text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              style={showCompetitiveMatrix
                ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                : { backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }
              }
            >
              <HiOutlineScale className="text-lg" />
              Competitive Matrix
            </button>
            {selectedIds.size >= 2 && (
              <button
                onClick={() => setShowComparison(true)}
                className="border text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}
              >
                <HiOutlineScale className="text-lg" />
                Compare {selectedIds.size} Products
              </button>
            )}
            {isAdmin && (
              <button
                onClick={openNewProduct}
                className="btn-accent text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <HiOutlinePlus />
                Add Product
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Search + Filter Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                />
              </div>
              <div className="relative">
                <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')}
                  className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="coming-soon">Coming Soon</option>
                  <option value="sunset">Sunset</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && products.length === 0 && (
                <button
                  onClick={loadDemoProducts}
                  disabled={loadingDemo}
                  className="text-sm border px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50" style={{ color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
                >
                  <HiOutlineBeaker />
                  {loadingDemo ? 'Loading...' : 'Load Demo Products'}
                </button>
              )}
              {isAdmin && products.length > 0 && (
                <button
                  onClick={loadDemoProducts}
                  disabled={loadingDemo}
                  className="text-sm border px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50" style={{ color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
                >
                  <HiOutlineBeaker />
                  {loadingDemo ? 'Loading...' : 'Load Demo Products'}
                </button>
              )}
            </div>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-20">
              <HiOutlineDocumentText className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">
                {search || statusFilter !== 'all' ? 'No products match your filters' : 'No products yet'}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                {search || statusFilter !== 'all'
                  ? 'Try a different search term or filter.'
                  : 'Add your first product or load demo data to get started.'}
              </p>
              {!search && statusFilter === 'all' && isAdmin && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={openNewProduct}
                    className="btn-accent text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <HiOutlinePlus /> Add Product
                  </button>
                  <button
                    onClick={loadDemoProducts}
                    disabled={loadingDemo}
                    className="text-sm border px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50" style={{ color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
                  >
                    <HiOutlineBeaker /> {loadingDemo ? 'Loading...' : 'Load Demo Products'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const isSunset = product.status === 'sunset';
                const isSelected = selectedIds.has(product.id);
                return (
                  <div
                    key={product.id}
                    className={`border rounded-xl p-5 transition-all cursor-pointer group relative ${
                      isSunset
                        ? 'opacity-60'
                        : 'hover:shadow-md'
                    } ${isSelected ? 'ring-2' : ''}`}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--card-border)',
                      ...(isSelected ? { '--tw-ring-color': 'var(--accent)' } as React.CSSProperties : {}),
                    }}
                  >
                    {/* Checkbox for comparison */}
                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(product.id);
                        }}
                        className="w-4 h-4 border-gray-300 rounded cursor-pointer" style={{ color: 'var(--accent)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                      />
                    </div>

                    {/* Action buttons */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateProduct(product);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                          title="Duplicate"
                        >
                          <HiOutlineDocumentDuplicate className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProduct(product.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="text-sm" />
                        </button>
                      </div>
                    )}

                    {/* Card Body */}
                    <div onClick={() => openEditor(product)} className="pt-4">
                      <div className="flex items-center gap-2 mb-2">{statusBadge(product.status)}</div>
                      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                      <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>{product.shortDescription}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        <span>{product.features.length} features</span>
                        <span>{product.contentGeneratedCount} docs generated</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                        <span>Updated {fmtDate(product.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comparison Table */}
          {showCompetitiveMatrix && renderCompetitiveMatrix()}
          {showComparison && renderComparison()}
        </div>
      </main>

      {/* Editor Slide-over */}
      {editingProduct && renderEditor()}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Reusable sub-components
// ═══════════════════════════════════════════════

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-y disabled:bg-gray-50 disabled:text-gray-400"
        style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
      />
    </div>
  );
}

function ChipInput({
  values,
  onChange,
  disabled,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addChip = () => {
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
          <span
            key={i}
            className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
          >
            {v}
            {!disabled && (
              <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="hover:text-red-600">
                &times;
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addChip();
              }
            }}
            placeholder={placeholder || 'Type and press Enter'}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
          <button onClick={addChip} className="text-sm px-3" style={{ color: 'var(--accent)' }}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function StringList({
  values,
  onChange,
  disabled,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {values.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...values];
              next[idx] = e.target.value;
              onChange(next);
            }}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400" style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
          {!disabled && (
            <button onClick={() => onChange(values.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
              <HiOutlineTrash />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          onClick={() => onChange([...values, ''])}
          className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}
        >
          <HiOutlinePlus /> Add
        </button>
      )}
    </div>
  );
}
