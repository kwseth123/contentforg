export interface Product {
  id: string;
  name: string;
  description: string;
  keyFeatures: string[];
  pricing: string;
}

export interface Competitor {
  id: string;
  name: string;
  howWeBeatThem: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  content: string;
}

export interface BrandVoice {
  tone: string;
  wordsToUse: string[];
  wordsToAvoid: string[];
}

export interface ICP {
  industries: string[];
  companySize: string;
  personas: string[];
}

// ═══════════════════════════════════════════════
// Brand Fidelity System
// ═══════════════════════════════════════════════

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface BrandFonts {
  primary: string;
  secondary: string;
  sizes: {
    h1: number; // in points — app converts to px for screen
    h2: number;
    h3: number;
    body: number;
  };
}

export interface BrandLogos {
  primaryPath: string;
  secondaryPath: string; // white/dark-bg version
  placement: 'top-left' | 'top-center' | 'top-right';
}

export type DocumentStyle = 'modern' | 'corporate' | 'bold' | 'minimal';

export interface BrandGuidelines {
  colors: BrandColors;
  fonts: BrandFonts;
  logos: BrandLogos;
  voice: {
    guidelinesText: string;
    documentContent: string; // parsed from uploaded brand doc
    approvedTerms: string[];
    bannedTerms: string[];
    tagline: string;
  };
  documentStyle: DocumentStyle;
}

export const DEFAULT_BRAND_GUIDELINES: BrandGuidelines = {
  colors: {
    primary: '#1e293b',
    secondary: '#4a4ae0',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#334155',
  },
  fonts: {
    primary: 'Inter',
    secondary: 'Inter',
    sizes: { h1: 28, h2: 18, h3: 14, body: 11 },
  },
  logos: {
    primaryPath: '',
    secondaryPath: '',
    placement: 'top-left',
  },
  voice: {
    guidelinesText: '',
    documentContent: '',
    approvedTerms: [],
    bannedTerms: [],
    tagline: '',
  },
  documentStyle: 'modern',
};

// ═══════════════════════════════════════════════
// Brand Compliance
// ═══════════════════════════════════════════════

export interface BrandViolation {
  id: string;
  type: 'banned-word' | 'off-voice' | 'missing-element';
  severity: 'warning' | 'violation';
  sectionId: string;
  sectionTitle: string;
  description: string;
  originalText?: string;
  suggestedFix?: string;
  bannedWord?: string; // for quick find-replace
}

export interface BrandComplianceResult {
  score: number; // 0-100
  status: 'green' | 'yellow' | 'red';
  violations: BrandViolation[];
}

// ═══════════════════════════════════════════════
// Knowledge Base
// ═══════════════════════════════════════════════

export interface KnowledgeBase {
  companyName: string;
  tagline: string;
  website: string;
  aboutUs: string;
  products: Product[];
  differentiators: string;
  icp: ICP;
  competitors: Competitor[];
  brandVoice: BrandVoice;
  caseStudies: CaseStudy[];
  uploadedDocuments: UploadedDocument[];
  logoPath: string;
  brandColor?: string;
  brandGuidelines?: BrandGuidelines;
  settings?: AppSettings;
}

export interface AppSettings {
  expirationWarningDays: number;
  expirationCriticalDays: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  expirationWarningDays: 90,
  expirationCriticalDays: 180,
};

export interface UploadedDocument {
  id: string;
  fileName: string;
  content: string;
  uploadedAt: string;
}

// ═══════════════════════════════════════════════
// Content Types — all 37 types organized by category
// ═══════════════════════════════════════════════

export type ContentType =
  // ── Prospect-Facing Documents ──
  | 'solution-one-pager'
  | 'executive-summary'
  | 'conference-leave-behind'
  | 'case-study'
  | 'roi-business-case'
  | 'proposal-framework'
  | 'implementation-timeline'
  | 'renewal-upsell'
  | 'product-feature-sheet'
  | 'comparison-guide'
  | 'reference-letter'
  | 'partnership-one-pager'
  | 'customer-success-story'
  | 'thought-leadership-article'
  // ── Internal Sales Tools ──
  | 'battle-card'
  | 'competitive-analysis'
  | 'discovery-call-prep'
  | 'objection-handling-guide'
  | 'cold-call-script'
  | 'voicemail-script'
  | 'champion-enablement-kit'
  | 'mutual-action-plan'
  | 'stakeholder-map'
  | 'qbr-review-deck'
  | 'win-loss-analysis'
  // ── Email & Outreach ──
  | 'outbound-email-sequence'
  | 'post-demo-followup'
  | 'post-meeting-summary'
  | 'executive-sponsor-email'
  | 'linkedin-message-sequence'
  // ── Marketing Support ──
  | 'linkedin-post'
  | 'email-newsletter-blurb'
  | 'webinar-invitation'
  | 'press-release'
  | 'blog-post-outline'
  | 'event-leave-behind'
  | 'video-script'
  // ── LinkedIn ──
  | 'linkedin-connection-request'
  | 'linkedin-comment-strategy'
  | 'linkedin-carousel-outline';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  // Prospect-Facing
  'solution-one-pager': 'Solution One-Pager',
  'executive-summary': 'Executive Summary',
  'conference-leave-behind': 'Conference Leave-Behind',
  'case-study': 'Case Study',
  'roi-business-case': 'ROI / Business Case',
  'proposal-framework': 'Proposal Framework',
  'implementation-timeline': 'Implementation Timeline',
  'renewal-upsell': 'Renewal / Upsell One-Pager',
  'product-feature-sheet': 'Product Feature Sheet',
  'comparison-guide': 'Comparison Guide',
  'reference-letter': 'Reference Letter Template',
  'partnership-one-pager': 'Partnership One-Pager',
  'customer-success-story': 'Customer Success Story',
  'thought-leadership-article': 'Thought Leadership Article',
  // Internal Sales
  'battle-card': 'Battle Card',
  'competitive-analysis': 'Competitive Analysis',
  'discovery-call-prep': 'Discovery Call Prep Sheet',
  'objection-handling-guide': 'Objection Handling Guide',
  'cold-call-script': 'Cold Call Script',
  'voicemail-script': 'Voicemail Script',
  'champion-enablement-kit': 'Champion Enablement Kit',
  'mutual-action-plan': 'Mutual Action Plan',
  'stakeholder-map': 'Stakeholder Map',
  'qbr-review-deck': 'QBR / Business Review Deck',
  'win-loss-analysis': 'Win/Loss Analysis',
  // Email & Outreach
  'outbound-email-sequence': 'Outbound Email Sequence',
  'post-demo-followup': 'Post-Demo Follow Up Email',
  'post-meeting-summary': 'Post-Meeting Summary Email',
  'executive-sponsor-email': 'Executive Sponsor Email',
  'linkedin-message-sequence': 'LinkedIn Message Sequence',
  // Marketing
  'linkedin-post': 'LinkedIn Post',
  'email-newsletter-blurb': 'Email Newsletter Blurb',
  'webinar-invitation': 'Webinar Invitation Email',
  'press-release': 'Press Release',
  'blog-post-outline': 'Blog Post Outline',
  'event-leave-behind': 'Event Leave-Behind',
  'video-script': 'Video Script',
  // LinkedIn
  'linkedin-connection-request': 'LinkedIn Connection Request',
  'linkedin-comment-strategy': 'LinkedIn Comment Strategy',
  'linkedin-carousel-outline': 'LinkedIn Carousel Outline',
};

// ═══════════════════════════════════════════════
// Content Categories
// ═══════════════════════════════════════════════

export type ContentCategory = 'prospect-documents' | 'internal-sales' | 'email-outreach' | 'linkedin' | 'marketing-support';

export const CONTENT_CATEGORIES: Record<ContentCategory, {
  label: string;
  description: string;
  icon: string;
  types: ContentType[];
}> = {
  'prospect-documents': {
    label: 'Prospect Documents',
    description: 'Client-facing collateral and proposals',
    icon: '📄',
    types: [
      'solution-one-pager', 'executive-summary', 'conference-leave-behind',
      'case-study', 'roi-business-case', 'proposal-framework',
      'implementation-timeline', 'renewal-upsell', 'product-feature-sheet',
      'comparison-guide', 'reference-letter', 'partnership-one-pager',
      'customer-success-story', 'thought-leadership-article',
    ],
  },
  'internal-sales': {
    label: 'Internal Sales Tools',
    description: 'Rep-facing strategy and prep docs',
    icon: '🎯',
    types: [
      'battle-card', 'competitive-analysis', 'discovery-call-prep',
      'objection-handling-guide', 'cold-call-script', 'voicemail-script',
      'champion-enablement-kit', 'mutual-action-plan', 'stakeholder-map',
      'qbr-review-deck', 'win-loss-analysis',
    ],
  },
  'email-outreach': {
    label: 'Email & Outreach',
    description: 'Messages, sequences, and follow-ups',
    icon: '✉️',
    types: [
      'outbound-email-sequence', 'post-demo-followup', 'post-meeting-summary',
      'executive-sponsor-email',
    ],
  },
  'linkedin': {
    label: 'LinkedIn',
    description: 'Social selling and thought leadership',
    icon: '💼',
    types: [
      'linkedin-post', 'linkedin-message-sequence',
      'linkedin-connection-request', 'linkedin-comment-strategy',
      'linkedin-carousel-outline',
    ],
  },
  'marketing-support': {
    label: 'Marketing Support',
    description: 'Content marketing and thought leadership',
    icon: '📣',
    types: [
      'email-newsletter-blurb', 'webinar-invitation',
      'press-release', 'blog-post-outline', 'event-leave-behind', 'video-script',
    ],
  },
};

// ═══════════════════════════════════════════════
// Product Library
// ═══════════════════════════════════════════════

export type ProductStatus = 'active' | 'coming-soon' | 'sunset';
export type ProductRelationType = 'complementary' | 'upgrade-path' | 'alternative';

export interface ProductObjection {
  id: string;
  objection: string;
  response: string;
}

export interface ProductFeature {
  id: string;
  name: string;
  description: string;
}

export interface ProductRelationship {
  productId: string;
  type: ProductRelationType;
}

export interface ProductPromptTemplate {
  id: string;
  label: string; // 4-5 words max, shown on chip
  promptText: string;
  contentType?: ContentType;
}

export interface ProductExtractionSource {
  fileName: string;
  extractedAt: string;
}

export interface ProductCompetitorMapping {
  id: string;
  competitorName: string;
  theirEquivalentProduct: string;
  howWeWin: string[]; // bullet points
  howTheyWin: string[]; // honest internal assessment
  talkTrack: string; // recommended talk track for this matchup
  winRate: number; // 0-100 percentage, manually entered
}

export interface ProductProfile {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  features: ProductFeature[];
  benefits: string[];
  idealUseCase: string;
  targetPersonas: string[];
  targetIndustries: string[];
  differentiators: string[];
  proofPoints: string[];
  objections: ProductObjection[];
  pricingNotes: string;
  relatedProducts: ProductRelationship[];
  status: ProductStatus;
  promptTemplates: ProductPromptTemplate[];
  contentGeneratedCount: number;
  lastUpdated: string;
  createdAt: string;
  extractionSources: ProductExtractionSource[];
  competitorMappings?: ProductCompetitorMapping[];
}

export const EMPTY_PRODUCT_PROFILE: () => ProductProfile = () => ({
  id: '',
  name: '',
  shortDescription: '',
  fullDescription: '',
  features: [],
  benefits: [],
  idealUseCase: '',
  targetPersonas: [],
  targetIndustries: [],
  differentiators: [],
  proofPoints: [],
  objections: [],
  pricingNotes: '',
  relatedProducts: [],
  status: 'active' as ProductStatus,
  promptTemplates: [],
  contentGeneratedCount: 0,
  lastUpdated: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  extractionSources: [],
  competitorMappings: [],
});

// ═══════════════════════════════════════════════
// Industry-Driven ROI Calculator
// ═══════════════════════════════════════════════

export interface IndustryMetricLabel {
  label: string;
  helper: string;
}

export interface IndustryConfig {
  industry: string;
  metricLabels: {
    employeesAffected: IndustryMetricLabel;
    hoursLostPerWeek: IndustryMetricLabel;
    hourlyRate: IndustryMetricLabel;
    errorsPerWeek: IndustryMetricLabel;
    costPerError: IndustryMetricLabel;
    currentMonthlySpend: IndustryMetricLabel;
    solutionMonthlyCost: IndustryMetricLabel;
  };
  benchmarkValues: ROIInputs;
  painPoints: string[];
  proofPointPrompts: string[];
  terminology: Record<string, string>;
}

// ═══════════════════════════════════════════════
// ROI Calculator
// ═══════════════════════════════════════════════

export interface ROIInputs {
  employeesAffected: number;
  hoursLostPerWeek: number;
  hourlyRate: number;
  errorsPerWeek: number;
  costPerError: number;
  currentMonthlySpend: number;
  solutionMonthlyCost: number;
}

export interface ROIOutputs {
  annualCostOfProblem: number;
  annualSavings: number;
  netAnnualBenefit: number;
  roiPercentage: number;
  paybackMonths: number;
  threeYearValue: number;
  fiveYearValue: number;
}

export function calculateROI(inputs: ROIInputs): ROIOutputs {
  const weeklyLaborCost = inputs.employeesAffected * inputs.hoursLostPerWeek * inputs.hourlyRate;
  const weeklyErrorCost = inputs.errorsPerWeek * inputs.costPerError;
  const annualProblemCost = (weeklyLaborCost + weeklyErrorCost) * 52;
  const annualCurrentSpend = inputs.currentMonthlySpend * 12;
  const annualSolutionCost = inputs.solutionMonthlyCost * 12;
  const annualCostOfProblem = annualProblemCost + annualCurrentSpend;
  const annualSavings = annualCostOfProblem - annualSolutionCost;
  const netAnnualBenefit = annualSavings;
  const roiPercentage = annualSolutionCost > 0 ? Math.round((netAnnualBenefit / annualSolutionCost) * 100) : 0;
  const paybackMonths = netAnnualBenefit > 0 ? Math.round((annualSolutionCost / netAnnualBenefit) * 12 * 10) / 10 : 0;
  const threeYearValue = netAnnualBenefit * 3;
  const fiveYearValue = netAnnualBenefit * 5;

  return {
    annualCostOfProblem,
    annualSavings,
    netAnnualBenefit,
    roiPercentage,
    paybackMonths,
    threeYearValue,
    fiveYearValue,
  };
}

// ═══════════════════════════════════════════════
// Generation, Auth, History, Library, Scoring
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// Persona-Aware Generation
// ═══════════════════════════════════════════════

export type PersonaType = 'cfo' | 'ceo' | 'vp-ops' | 'it-director' | 'end-user' | 'procurement';

export interface PersonaConfig {
  id: PersonaType;
  label: string;
  title: string;
  icon: string;
  cares: string[];
  languageStyle: string;
  metricsToHighlight: string[];
  documentLead: string;
}

export const PERSONA_CONFIGS: PersonaConfig[] = [
  {
    id: 'cfo',
    label: 'CFO / Finance',
    title: 'Chief Financial Officer',
    icon: '\u{1F4B0}',
    cares: ['ROI', 'cost reduction', 'payback period', 'risk mitigation', 'total cost of ownership'],
    languageStyle: 'Use financial language. Lead with numbers and ROI. Frame everything as investment vs. return. Quantify risk and savings precisely.',
    metricsToHighlight: ['ROI percentage', 'payback period', 'annual savings', 'cost per unit reduction', 'total cost of ownership'],
    documentLead: 'Lead with the financial business case and ROI analysis',
  },
  {
    id: 'ceo',
    label: 'CEO / Executive',
    title: 'Chief Executive Officer',
    icon: '\u{1F454}',
    cares: ['strategic impact', 'competitive advantage', 'growth', 'market position', 'board-level outcomes'],
    languageStyle: 'Use strategic, high-level language. Focus on competitive advantage and market position. Be concise \u2014 executives scan, they don\'t read. Lead with the punchline.',
    metricsToHighlight: ['market share impact', 'competitive advantage', 'revenue growth', 'strategic alignment', 'time to value'],
    documentLead: 'Lead with strategic impact and competitive positioning',
  },
  {
    id: 'vp-ops',
    label: 'VP of Operations',
    title: 'VP of Operations',
    icon: '\u2699\uFE0F',
    cares: ['efficiency', 'process improvement', 'team adoption', 'throughput', 'quality metrics'],
    languageStyle: 'Use operational language. Focus on process improvement, efficiency gains, and team impact. Include before/after comparisons. Be specific about workflows.',
    metricsToHighlight: ['efficiency gain', 'throughput increase', 'error reduction', 'time savings per process', 'adoption timeline'],
    documentLead: 'Lead with operational efficiency improvements and process impact',
  },
  {
    id: 'it-director',
    label: 'IT Director',
    title: 'IT Director',
    icon: '\u{1F5A5}\uFE0F',
    cares: ['integration', 'security', 'implementation complexity', 'support', 'technical architecture'],
    languageStyle: 'Use technical language. Address integration details, security compliance, and architecture. Include API specs, data flow, and implementation requirements. Be precise and detailed.',
    metricsToHighlight: ['uptime SLA', 'integration points', 'implementation timeline', 'security certifications', 'API response time'],
    documentLead: 'Lead with technical architecture, integration capabilities, and security',
  },
  {
    id: 'end-user',
    label: 'End User / Staff',
    title: 'End User',
    icon: '\u{1F464}',
    cares: ['ease of use', 'time savings', 'daily workflow impact', 'learning curve', 'mobile access'],
    languageStyle: 'Use simple, plain language. No jargon. Focus on daily workflow improvements and time savings. Show how it makes their specific job easier. Be relatable and practical.',
    metricsToHighlight: ['time saved per day', 'clicks reduced', 'training time', 'mobile accessibility', 'user satisfaction'],
    documentLead: 'Lead with day-to-day workflow improvements and ease of use',
  },
  {
    id: 'procurement',
    label: 'Procurement',
    title: 'Procurement Manager',
    icon: '\u{1F4CB}',
    cares: ['pricing', 'contract terms', 'vendor stability', 'references', 'compliance', 'SLAs'],
    languageStyle: 'Use business-formal language. Focus on vendor credentials, pricing structure, contract flexibility, and risk mitigation. Include references and compliance certifications. Be thorough on terms.',
    metricsToHighlight: ['pricing tiers', 'contract flexibility', 'vendor references', 'compliance certifications', 'SLA guarantees'],
    documentLead: 'Lead with vendor credentials, pricing, and contract terms',
  },
];

export interface ProspectInfo {
  companyName: string;
  industry: string;
  companySize: string;
  techStack: string;
  painPoints: string;
  website?: string;
}

export interface ProspectBranding {
  logoBase64: string;
  companyName: string;
  description: string;
  primaryColor: string;
}

export interface GenerationRequest {
  contentType: ContentType;
  prospect: ProspectInfo;
  additionalContext: string;
  toneLevel: number;
  sessionDocuments: string[];
}

export interface GeneratedSection {
  id: string;
  title: string;
  content: string;
}

// ═══════════════════════════════════════════════
// Visual Generation Pipeline
// ═══════════════════════════════════════════════

export type VisualFormat =
  | 'highlight-box'
  | 'stat-cards'
  | 'numbered-flow'
  | 'before-after'
  | 'icon-grid'
  | 'comparison-table'
  | 'timeline'
  | 'blockquote'
  | 'pricing-cards'
  | 'cta-box';

export interface VisualSection {
  title: string;
  content: string;
  visualFormat: VisualFormat;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  before?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  after?: any;
  headers?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows?: any[];
  quote?: string;
  attribution?: string;
  role?: string;
  headline?: string;
  bullets?: string[];
  contactInfo?: string;
}

export interface GeneratedContent {
  sections: GeneratedSection[];
  contentType: ContentType;
  prospect: ProspectInfo;
  generatedAt: string;
}

export type UserRole = 'admin' | 'rep';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

// ── History ──

export interface HistoryItem {
  id: string;
  contentType: ContentType;
  prospect: ProspectInfo;
  additionalContext: string;
  toneLevel: number;
  sections: GeneratedSection[];
  generatedAt: string;
  generatedBy: string;
  scores?: ContentScores;
  brandCompliance?: BrandComplianceResult;
  grades?: ContentGrades;
  variationSeed?: {
    hookStyle: string;
    voiceMode: string;
    sequenceIndex: number;
  };
}

// ── Content Scoring ──

export interface ContentScores {
  clarity: number;
  differentiation: number;
  proof: number;
  callToAction: number;
  overall: number;
  tips: Record<string, string>;
}

// ── AI Content Grading ──

export interface ContentGrade {
  score: number;
  suggestion: string | null;
}

export interface ContentGrades {
  relevance: ContentGrade;
  clarity: ContentGrade;
  differentiation: ContentGrade;
  proof: ContentGrade;
  callToAction: ContentGrade;
  personaFit: ContentGrade;
  overallGrade: string;
  summary: string;
}

// ── Team Library ──

export interface LibraryItem {
  id: string;
  contentType: ContentType;
  prospect: ProspectInfo;
  sections: GeneratedSection[];
  sharedBy: string;
  sharedAt: string;
  tags: string[];
  pinned: boolean;
  scores?: ContentScores;
}

// ═══════════════════════════════════════════════
// Prospect Intelligence
// ═══════════════════════════════════════════════

export interface ProspectIntel {
  companySnapshot: {
    description: string;
    industry: string;
    estimatedSize: string;
    location: string;
  };
  techStack: string[];
  hiringSignals: {
    summary: string;
    signals: string[];
  };
  recentNews: { title: string; date: string; relevance: string }[];
  suggestedAngle: string;
  painPointHypotheses: string[];
  fetchedAt: string;
}

// ── Expiration helpers ──

export type ExpirationStatus = 'fresh' | 'warning' | 'expired';

export function getExpirationStatus(
  dateStr: string,
  warningDays: number = 90,
  criticalDays: number = 180
): ExpirationStatus {
  const age = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  if (age >= criticalDays) return 'expired';
  if (age >= warningDays) return 'warning';
  return 'fresh';
}
