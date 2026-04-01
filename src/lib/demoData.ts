import {
  KnowledgeBase,
  HistoryItem,
  LibraryItem,
  ProductProfile,
  BrandGuidelines,
} from './types';

// ═══════════════════════════════════════════════
// Demo Company System — 6 fully detailed companies
// ═══════════════════════════════════════════════

export interface DemoCompany {
  id: string;
  knowledgeBase: KnowledgeBase;
  products: ProductProfile[];
  brandGuidelines: BrandGuidelines;
  employeeCount: number;
  industry: string;
  accentColor: string;
}

export interface DemoCompanyCard {
  id: string;
  name: string;
  industry: string;
  tagline: string;
  employeeCount: number;
  accentColor: string;
}

// ═══════════════════════════════════════════════
// Helper: generate deterministic IDs
// ═══════════════════════════════════════════════

function pid(company: string, n: number): string {
  return `${company}-prod-${String(n).padStart(3, '0')}`;
}
function cid(company: string, n: number): string {
  return `${company}-comp-${String(n).padStart(3, '0')}`;
}
function csid(company: string, n: number): string {
  return `${company}-cs-${String(n).padStart(3, '0')}`;
}
function fid(company: string, prefix: string, n: number): string {
  return `${company}-${prefix}-feat-${String(n).padStart(3, '0')}`;
}
function oid(company: string, prefix: string, n: number): string {
  return `${company}-${prefix}-obj-${String(n).padStart(3, '0')}`;
}
function ptid(company: string, prefix: string, n: number): string {
  return `${company}-${prefix}-pt-${String(n).padStart(3, '0')}`;
}
function cmid(company: string, prefix: string, n: number): string {
  return `${company}-${prefix}-cm-${String(n).padStart(3, '0')}`;
}

const NOW = '2026-03-28T10:00:00.000Z';
const CREATED = '2026-01-10T10:00:00.000Z';

// ═══════════════════════════════════════════════
// 1. APEX DISTRIBUTION
// ═══════════════════════════════════════════════

const apexKB: KnowledgeBase = {
  companyName: 'Apex Distribution',
  tagline: 'Warehouse precision, delivered.',
  website: 'https://www.apexdistribution.com',
  aboutUs: 'Apex Distribution is a technology company that builds warehouse execution software for mid-market industrial distributors running Sage 100, Acumatica, and QuickBooks. With 150 employees and 12 years of distribution-specific expertise, we help distributors with 5,000+ SKUs eliminate manual warehouse processes, achieve real-time ERP accuracy, and transform inventory management from reactive guesswork into data-driven precision. Our platform deploys in 4-6 weeks and pays for itself within the first 90 days.',
  products: [
    { id: '1', name: 'Warehouse Management Suite', description: 'End-to-end warehouse execution platform with barcode scanning, directed put-away optimization, and wave picking that turns chaotic warehouses into precision operations.', keyFeatures: ['Barcode scanning with 99.97% accuracy', 'AI-directed put-away optimization', 'Wave picking with dynamic batch grouping', 'Zone-based inventory management', 'Real-time dashboard with pick/pack/ship KPIs'], pricing: '$3,200-$8,500/month' },
    { id: '2', name: 'Real-Time ERP Sync', description: 'Bi-directional integration engine that keeps your Sage 100, Acumatica, or QuickBooks ERP in perfect sync with warehouse operations — no more end-of-day batch updates or reconciliation nightmares.', keyFeatures: ['Bi-directional Sage 100 integration', 'Automated PO matching and 3-way receipt', 'Real-time inventory level sync', 'Automated journal entries and cost updates'], pricing: '$1,800-$4,200/month' },
    { id: '3', name: 'Inventory Intelligence', description: 'Analytics and optimization platform that transforms raw inventory data into actionable intelligence — from automated cycle counting to AI-powered demand forecasting and ABC analysis.', keyFeatures: ['Perpetual cycle counting with guided workflows', 'AI demand forecasting (92% accuracy at 90 days)', 'Dynamic ABC/XYZ analysis', 'Min/max optimization engine', 'Dead stock identification and liquidation alerts'], pricing: '$2,100-$5,000/month' },
  ],
  differentiators: 'Only warehouse platform built specifically for mid-market distributors on Sage/Acumatica/QuickBooks. We deploy in 4-6 weeks (not 6-12 months). Flat-rate pricing with no per-user or per-device fees. 150+ distribution-specific workflows out of the box. Our team has 200+ combined years of distribution operations experience.',
  icp: {
    industries: ['Industrial Distribution', 'Wholesale Distribution', 'Electrical Supply', 'Plumbing Supply', 'HVAC Distribution', 'Building Materials'],
    companySize: '50-500 employees, 5,000+ SKUs, $10M-$500M revenue',
    personas: ['VP of Operations', 'Warehouse Manager', 'IT Director', 'CFO', 'Supply Chain Director'],
  },
  competitors: [
    { id: cid('apex', 1), name: 'ScanForce', howWeBeatThem: 'ScanForce is a bolt-on barcode solution, not a warehouse execution platform. It lacks put-away optimization, wave picking, demand forecasting, and cycle counting automation. Customers who switch from ScanForce typically see a 40-60% improvement in warehouse throughput because we optimize the entire workflow, not just the scanning step. ScanForce also requires expensive Sage-side customizations that we handle natively.' },
    { id: cid('apex', 2), name: 'Manual Processes / Spreadsheets', howWeBeatThem: 'Spreadsheet-based warehouse management caps out at roughly 3,000 SKUs before error rates become unmanageable. Our customers who migrate from spreadsheets see pick error rates drop from 3-5% to under 0.1%, saving $200K-$500K annually in mis-ships, returns processing, and customer credits. The ROI conversation is straightforward: calculate current error costs and multiply by 0.94.' },
    { id: cid('apex', 3), name: 'Fishbowl Inventory', howWeBeatThem: 'Fishbowl is a general-purpose inventory tool that lacks distribution-specific workflows like wave picking, directed put-away, and demand forecasting. Their QuickBooks integration is one-directional and batch-based, creating reconciliation gaps. We offer real-time bi-directional sync. Fishbowl also lacks the cycle counting automation and ABC analysis that distribution operations require at scale.' },
  ],
  brandVoice: {
    tone: 'Confident, technical, and direct. We speak like experienced operations leaders who understand warehouse floors — not like software salespeople. Use concrete numbers over vague promises. Short sentences. Active voice.',
    wordsToUse: ['precision', 'throughput', 'warehouse velocity', 'real-time accuracy', 'operational excellence', 'distribution-native', 'purpose-built'],
    wordsToAvoid: ['disrupt', 'revolutionary', 'synergy', 'best-in-class', 'leverage', 'paradigm', 'turnkey'],
  },
  caseStudies: [
    { id: csid('apex', 1), title: 'Great Lakes Industrial Supply: 94% Reduction in Pick Errors', content: 'Great Lakes Industrial Supply, a $45M electrical and industrial distributor with 12,000 SKUs across two warehouses, was losing $360K annually to pick errors, mis-ships, and return processing. Their warehouse team relied on paper pick tickets and visual bin location memory. After deploying the Apex Warehouse Management Suite, pick errors dropped from 4.2% to 0.25% — a 94% reduction. First-year savings totaled $340K, with the platform paying for itself in 11 weeks. Warehouse throughput increased 38%, allowing Great Lakes to handle a 22% volume increase without adding headcount.' },
    { id: csid('apex', 2), title: 'Mountain States Plumbing: Real-Time ERP Sync Eliminates Month-End Reconciliation', content: 'Mountain States Plumbing Supply, a $78M distributor running Sage 100 with 8 branch locations, was spending 120 person-hours per month on inventory reconciliation between their warehouse operations and Sage. Discrepancies averaged $180K per cycle. After implementing Real-Time ERP Sync, reconciliation time dropped to 4 hours per month — a 97% reduction. Inventory accuracy improved from 82% to 99.4%, and the finance team eliminated their quarterly wall-to-wall physical counts entirely. Annual savings: $285K in labor plus $140K in reduced inventory carrying costs.' },
    { id: csid('apex', 3), title: 'Pacific Coast Fasteners: Demand Forecasting Cuts Overstock by 31%', content: 'Pacific Coast Fasteners, a $32M specialty fastener distributor with 22,000 SKUs, was carrying $2.8M in excess inventory due to manual min/max settings and gut-feel purchasing. Dead stock represented 14% of total inventory value. After deploying Inventory Intelligence with AI demand forecasting, overstock dropped by 31% ($870K freed), dead stock was identified and liquidated ($390K recovered), and stockout rates decreased from 8.3% to 2.1%. The ABC analysis module automatically reclassifies items monthly, ensuring purchasing priorities always reflect actual demand patterns.' },
  ],
  uploadedDocuments: [],
  logoPath: '',
  brandColor: '#1E40AF',
  brandGuidelines: {
    colors: { primary: '#1E40AF', secondary: '#1E3A5F', accent: '#3B82F6', background: '#FFFFFF', text: '#1E293B' },
    fonts: { primary: 'Inter', secondary: 'Inter', sizes: { h1: 28, h2: 18, h3: 14, body: 11 } },
    logos: { primaryPath: '', secondaryPath: '', placement: 'top-left' },
    voice: { guidelinesText: 'Confident and technical. Lead with metrics. Speak like an operations leader.', documentContent: '', approvedTerms: ['precision', 'throughput', 'warehouse velocity', 'distribution-native'], bannedTerms: ['disrupt', 'revolutionary', 'synergy', 'paradigm'], tagline: 'Warehouse precision, delivered.' },
    documentStyle: 'modern',
  },
};

const apexProducts: ProductProfile[] = [
  {
    id: pid('apex', 1), name: 'Warehouse Management Suite', shortDescription: 'End-to-end warehouse execution with barcode scanning, directed put-away, and wave picking',
    fullDescription: 'The Apex Warehouse Management Suite transforms chaotic distribution warehouses into precision operations. Built specifically for mid-market distributors managing 5,000-100,000 SKUs, the platform combines barcode-driven receiving, AI-directed put-away optimization, and dynamic wave picking into a unified mobile-first experience. Warehouse teams typically achieve full adoption within 5 days, and customers see measurable throughput improvements within the first two weeks.',
    features: [
      { id: fid('apex', 'wms', 1), name: 'Barcode Scanning Engine', description: 'Industrial-grade barcode scanning with 99.97% first-scan accuracy. Supports 1D, 2D, QR, and RFID. Works with consumer-grade Android devices — no expensive proprietary hardware required.' },
      { id: fid('apex', 'wms', 2), name: 'AI Put-Away Optimization', description: 'Machine learning analyzes pick frequency, item velocity, and physical dimensions to recommend optimal bin locations. Reduces average pick travel distance by 34%.' },
      { id: fid('apex', 'wms', 3), name: 'Wave Picking Engine', description: 'Dynamic wave creation groups orders by zone, carrier, priority, and ship date. Supports batch picking, cluster picking, and zone picking strategies. Average pick rate improvement: 45%.' },
      { id: fid('apex', 'wms', 4), name: 'Real-Time Floor Dashboard', description: 'Live warehouse performance metrics: picks per hour, orders in queue, shipping SLA status, and team productivity. Displays on warehouse floor monitors or any browser.' },
      { id: fid('apex', 'wms', 5), name: 'Receiving & QC Workflows', description: 'Guided receiving workflows with automatic PO matching, quantity verification, damage inspection, and directed put-away assignment. Reduces receiving time by 52%.' },
    ],
    benefits: ['Reduce pick errors by 90-96% within 30 days', 'Increase warehouse throughput 35-50% without adding headcount', 'Deploy in 4-6 weeks with 5-day team adoption', 'Eliminate paper pick tickets and manual processes entirely'],
    idealUseCase: 'Mid-market distributors with 5,000+ SKUs running Sage 100, Acumatica, or QuickBooks who need to modernize warehouse operations, reduce errors, and scale throughput without proportional headcount increases.',
    targetPersonas: ['VP of Operations', 'Warehouse Manager', 'Distribution Center Director', 'COO'],
    targetIndustries: ['Industrial Distribution', 'Wholesale Distribution', 'Electrical Supply', 'Plumbing Supply', 'HVAC Distribution'],
    differentiators: ['Distribution-specific workflows vs. generic WMS', 'Works with consumer Android devices — no proprietary hardware', '5-day average team adoption vs. 6-8 weeks for enterprise WMS', 'Flat-rate pricing with unlimited users and devices'],
    proofPoints: ['Great Lakes Industrial Supply: 94% pick error reduction, $340K saved in year one', 'Average customer achieves 42% throughput improvement within 60 days', 'Under 0.1% average pick error rate across 150+ distribution customers', '5-day average time to full warehouse team adoption'],
    objections: [
      { id: oid('apex', 'wms', 1), objection: 'We already have a WMS.', response: 'Most distribution WMS platforms were designed for 3PL or enterprise retail. They require 6-12 months to deploy and cost 3-5x more. Apex deploys in 4-6 weeks with distribution-specific workflows that work out of the box. We consistently win against legacy WMS platforms on time-to-value and total cost of ownership.' },
      { id: oid('apex', 'wms', 2), objection: 'Our warehouse team won\'t adopt new technology.', response: 'Our mobile-first interface was designed with warehouse workers, not just for them. Average adoption time is 5 days. The barcode scanning interface requires zero typing — scan, confirm, move. We provide on-site training and have a 98% adoption success rate across 150+ deployments.' },
      { id: oid('apex', 'wms', 3), objection: 'We can\'t afford the downtime during implementation.', response: 'We deploy in parallel — your existing processes continue running while we configure and test Apex alongside them. The cutover happens over a weekend with our implementation team on-site. Zero customers have experienced operational disruption during deployment.' },
    ],
    pricingNotes: '$3,200-$8,500/month based on warehouse count and SKU volume. Unlimited users and devices. Includes implementation, training, and ongoing support.',
    relatedProducts: [{ productId: pid('apex', 2), type: 'complementary' }, { productId: pid('apex', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('apex', 'wms', 1), label: 'WMS one-pager for distributor', promptText: 'Create a solution one-pager for the Warehouse Management Suite targeting a {industry} distributor with {skuCount} SKUs currently using paper-based picking', contentType: 'solution-one-pager' },
      { id: ptid('apex', 'wms', 2), label: 'Pick error ROI calculator', promptText: 'Build an ROI business case showing pick error cost savings for a distributor with {errorRate}% current error rate and {orderVolume} daily orders', contentType: 'roi-business-case' },
      { id: ptid('apex', 'wms', 3), label: 'WMS vs ScanForce battle card', promptText: 'Create a competitive battle card comparing Apex Warehouse Management Suite against ScanForce for a mid-market distributor evaluation', contentType: 'battle-card' },
      { id: ptid('apex', 'wms', 4), label: 'Warehouse modernization email', promptText: 'Draft a 3-email outbound sequence targeting VP of Operations at distributors still using paper pick tickets and manual processes', contentType: 'outbound-email-sequence' },
      { id: ptid('apex', 'wms', 5), label: 'Great Lakes case study', promptText: 'Create a customer success story based on Great Lakes Industrial Supply achieving 94% pick error reduction and $340K first-year savings', contentType: 'case-study' },
    ],
    contentGeneratedCount: 47,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [
      { id: cmid('apex', 'wms', 1), competitorName: 'ScanForce', theirEquivalentProduct: 'ScanForce WMS', howWeWin: ['Full warehouse execution vs. bolt-on scanning', 'AI put-away optimization they lack entirely', 'Wave picking engine vs. basic pick lists', 'Flat-rate pricing vs. per-device licensing'], howTheyWin: ['Lower initial price point', 'Tighter Sage 100 native integration', 'Simpler for small operations under 2,000 SKUs'], talkTrack: 'ScanForce is a great barcode solution, but it is not a warehouse execution platform. If you have over 5,000 SKUs and need put-away optimization, wave picking, or cycle counting — you will outgrow ScanForce within months.', winRate: 78 },
      { id: cmid('apex', 'wms', 2), competitorName: 'Fishbowl Inventory', theirEquivalentProduct: 'Fishbowl Warehouse', howWeWin: ['Distribution-specific workflows vs. generic inventory', 'Real-time bi-directional ERP sync vs. batch updates', 'AI-directed put-away and wave picking', 'Purpose-built for 5,000+ SKU operations'], howTheyWin: ['Lower cost for small operations', 'Broader manufacturing features', 'QuickBooks marketplace presence'], talkTrack: 'Fishbowl is a solid general-purpose inventory tool. But distribution operations at scale need wave picking, directed put-away, and real-time ERP sync that Fishbowl was not designed to handle.', winRate: 72 },
    ],
  },
  {
    id: pid('apex', 2), name: 'Real-Time ERP Sync', shortDescription: 'Bi-directional Sage/Acumatica/QuickBooks integration with automated PO matching',
    fullDescription: 'Real-Time ERP Sync eliminates the gap between warehouse operations and your ERP system. Instead of end-of-day batch updates and manual reconciliation, every warehouse transaction — receiving, picking, shipping, adjustments — flows to your ERP in real time. Built with native connectors for Sage 100, Acumatica, and QuickBooks, the platform handles automated 3-way PO matching, inventory level sync, and journal entry creation without any manual intervention.',
    features: [
      { id: fid('apex', 'erp', 1), name: 'Bi-Directional Sage 100 Connector', description: 'Native integration that syncs inventory levels, sales orders, purchase orders, and financial transactions in real time. No middleware required.' },
      { id: fid('apex', 'erp', 2), name: 'Automated 3-Way PO Matching', description: 'Automatically matches purchase orders, receiving documents, and vendor invoices. Flags discrepancies for review instead of manual line-by-line comparison.' },
      { id: fid('apex', 'erp', 3), name: 'Real-Time Inventory Sync', description: 'Every warehouse transaction updates ERP inventory levels within 3 seconds. Eliminates end-of-day batch reconciliation entirely.' },
      { id: fid('apex', 'erp', 4), name: 'Multi-ERP Support', description: 'Native connectors for Sage 100, Sage X3, Acumatica, and QuickBooks Enterprise. Pre-built field mappings with customizable transformation rules.' },
    ],
    benefits: ['Eliminate 95%+ of manual inventory reconciliation time', 'Achieve 99.4% inventory accuracy across all locations', 'Reduce month-end close by 3-5 days', 'Prevent costly discrepancies between warehouse and financial systems'],
    idealUseCase: 'Distributors running Sage 100, Acumatica, or QuickBooks who are spending significant time on manual reconciliation between warehouse operations and their ERP, or experiencing inventory accuracy issues due to batch update delays.',
    targetPersonas: ['IT Director', 'CFO', 'Controller', 'ERP Administrator'],
    targetIndustries: ['Industrial Distribution', 'Wholesale Distribution', 'Electrical Supply', 'Plumbing Supply'],
    differentiators: ['Native ERP connectors — no middleware or iPaaS required', 'Sub-3-second sync latency vs. end-of-day batch', 'Automated 3-way PO matching built in', 'Pre-built distribution-specific field mappings'],
    proofPoints: ['Mountain States Plumbing: 97% reduction in reconciliation time, $285K annual labor savings', 'Average customer achieves 99.4% inventory accuracy within 90 days', 'Eliminates 120+ person-hours per month of manual reconciliation for typical mid-market distributor'],
    objections: [
      { id: oid('apex', 'erp', 1), objection: 'Our ERP vendor says they can build this.', response: 'ERP vendors build general-purpose integration, not distribution-specific warehouse sync. Their solutions typically require 3-6 months of custom development and ongoing maintenance. Our pre-built connectors deploy in 2-3 weeks with distribution-specific field mappings that handle the nuances of warehouse operations — lot tracking, bin locations, unit-of-measure conversions — that generic ERP integrations miss.' },
      { id: oid('apex', 'erp', 2), objection: 'We already use a middleware platform.', response: 'Middleware adds latency, complexity, and another point of failure. Our native connectors eliminate the middleware layer entirely. Customers who switch from middleware-based integration see sync times drop from 15-60 minutes to under 3 seconds, and reduce integration maintenance costs by 60-80%.' },
    ],
    pricingNotes: '$1,800-$4,200/month based on ERP platform and transaction volume. Includes all ERP connectors, implementation, and ongoing support.',
    relatedProducts: [{ productId: pid('apex', 1), type: 'complementary' }, { productId: pid('apex', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('apex', 'erp', 1), label: 'ERP integration pitch', promptText: 'Create a solution one-pager for Real-Time ERP Sync targeting a distributor running {erpSystem} with {locationCount} locations', contentType: 'solution-one-pager' },
      { id: ptid('apex', 'erp', 2), label: 'Reconciliation ROI case', promptText: 'Build an ROI business case showing reconciliation labor savings for a distributor spending {hours} hours per month on manual ERP reconciliation', contentType: 'roi-business-case' },
    ],
    contentGeneratedCount: 31,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
  {
    id: pid('apex', 3), name: 'Inventory Intelligence', shortDescription: 'Cycle counting, demand forecasting, and ABC analysis for data-driven inventory management',
    fullDescription: 'Inventory Intelligence transforms inventory management from reactive guesswork into data-driven precision. The platform combines automated cycle counting with guided mobile workflows, AI-powered demand forecasting with 92% accuracy at 90 days, and dynamic ABC/XYZ analysis that automatically reclassifies items as demand patterns shift. Distributors typically recover $500K-$2M in excess inventory within the first six months while simultaneously reducing stockout rates by 60-75%.',
    features: [
      { id: fid('apex', 'inv', 1), name: 'Perpetual Cycle Counting', description: 'Guided mobile workflows prioritize counts by value, velocity, and variance. Eliminates annual wall-to-wall physical inventory counts entirely.' },
      { id: fid('apex', 'inv', 2), name: 'AI Demand Forecasting', description: '92% forecast accuracy at 90-day horizon. Factors in seasonality, trends, promotions, and economic indicators. Updates weekly with actuals-vs-forecast tracking.' },
      { id: fid('apex', 'inv', 3), name: 'Dynamic ABC/XYZ Analysis', description: 'Automatic monthly reclassification based on revenue contribution (ABC) and demand variability (XYZ). Drives differentiated replenishment strategies by classification.' },
      { id: fid('apex', 'inv', 4), name: 'Min/Max Optimization Engine', description: 'Calculates optimal reorder points and quantities for every SKU based on demand forecast, lead time variability, and target service level. Updates daily.' },
      { id: fid('apex', 'inv', 5), name: 'Dead Stock Alerts', description: 'Identifies slow-moving and obsolete inventory with automated liquidation recommendations. Tracks aging by category with configurable threshold alerts.' },
    ],
    benefits: ['Recover $500K-$2M in excess inventory within 6 months', 'Reduce stockout rates by 60-75%', 'Eliminate annual physical inventory counts', 'Automate purchasing decisions with AI-driven reorder points'],
    idealUseCase: 'Distributors with 10,000+ SKUs who are carrying too much inventory, experiencing frequent stockouts, or still relying on manual min/max settings and annual physical counts.',
    targetPersonas: ['VP of Operations', 'Purchasing Manager', 'Inventory Manager', 'CFO'],
    targetIndustries: ['Industrial Distribution', 'Wholesale Distribution', 'Electrical Supply', 'HVAC Distribution', 'Building Materials'],
    differentiators: ['AI forecasting built for distribution demand patterns', 'Monthly auto-reclassification vs. annual manual ABC review', 'Guided mobile cycle counting vs. manual count sheets', 'Integrated with Apex WMS for automated count scheduling'],
    proofPoints: ['Pacific Coast Fasteners: 31% overstock reduction, $870K freed, $390K dead stock recovered', 'Average customer reduces stockouts by 67% within 90 days', '92% demand forecast accuracy at 90-day horizon across customer base'],
    objections: [
      { id: oid('apex', 'inv', 1), objection: 'Our ERP already has inventory management.', response: 'ERP inventory modules handle transactions, not optimization. They cannot forecast demand, dynamically reclassify ABC categories, or guide cycle counting workflows. Our customers who add Inventory Intelligence on top of their ERP typically free $500K-$2M in excess inventory within 6 months — savings that static ERP min/max settings cannot deliver.' },
      { id: oid('apex', 'inv', 2), objection: 'AI forecasting sounds unreliable.', response: 'Our forecasting engine achieves 92% accuracy at 90 days by training on distribution-specific demand patterns — not generic retail or manufacturing models. Every forecast includes a confidence interval, and the system continuously improves as it ingests actuals. Customers see meaningful improvements over manual forecasting within the first 60 days.' },
    ],
    pricingNotes: '$2,100-$5,000/month based on SKU count. Includes all modules, implementation, and ongoing support.',
    relatedProducts: [{ productId: pid('apex', 1), type: 'complementary' }, { productId: pid('apex', 2), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('apex', 'inv', 1), label: 'Inventory optimization pitch', promptText: 'Create a solution one-pager for Inventory Intelligence targeting a distributor carrying ${excessInventory} in excess inventory across {skuCount} SKUs', contentType: 'solution-one-pager' },
      { id: ptid('apex', 'inv', 2), label: 'Dead stock recovery case', promptText: 'Build a case study document showing how a distributor recovered {amount} in dead stock using Inventory Intelligence', contentType: 'case-study' },
    ],
    contentGeneratedCount: 24,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
];

// ═══════════════════════════════════════════════
// 2. PINNACLE MANUFACTURING
// ═══════════════════════════════════════════════

const pinnacleKB: KnowledgeBase = {
  companyName: 'Pinnacle Manufacturing',
  tagline: 'From shop floor to top floor.',
  website: 'https://www.pinnaclemfg.com',
  aboutUs: 'Pinnacle Manufacturing builds production execution and inventory control software for discrete manufacturers — metal fabricators, machine shops, and precision component producers running Acumatica or similar cloud ERPs. With 200 employees and deep expertise in make-to-order and make-to-stock environments, we help manufacturers eliminate the visibility gap between the shop floor and the front office. Our platform captures real-time production data, enforces quality standards, and gives leadership the operational intelligence they need to make confident decisions.',
  products: [
    { id: '1', name: 'Production Floor Execution', description: 'Real-time work order tracking, labor collection, and machine utilization monitoring for discrete manufacturing operations.', keyFeatures: ['Digital work order tracking with real-time status', 'Touchscreen labor collection at every work center', 'Machine utilization and OEE monitoring', 'Automated routing and operation sequencing', 'Real-time production schedule board'], pricing: '$4,000-$12,000/month' },
    { id: '2', name: 'Inventory Control', description: 'Comprehensive inventory management with cycle counting, lot/serial tracking, and intelligent min-max optimization for manufacturing environments.', keyFeatures: ['Lot and serial number tracking with full genealogy', 'Guided cycle counting with variance analysis', 'Dynamic min-max with lead time factoring', 'Raw material, WIP, and finished goods tracking'], pricing: '$2,500-$7,000/month' },
    { id: '3', name: 'Quality Management', description: 'Inspection workflows, non-conformance tracking, and CAPA management that embed quality into every step of the production process.', keyFeatures: ['Configurable inspection plans by operation', 'Non-conformance tracking with root cause analysis', 'CAPA workflow with automated escalation', 'First article inspection (FAI) management', 'Statistical process control (SPC) charting'], pricing: '$2,000-$6,000/month' },
  ],
  differentiators: 'Purpose-built for discrete manufacturing — not adapted from process manufacturing or distribution. We capture data at the work center level, not just the order level. Native Acumatica integration with real-time cost roll-up. Our quality module is built into the production workflow, not bolted on. Implementation includes shop floor process mapping by former manufacturing operations leaders.',
  icp: {
    industries: ['Metal Fabrication', 'CNC Machining', 'Precision Components', 'Sheet Metal', 'Welding & Assembly', 'Contract Manufacturing'],
    companySize: '100-1000 employees, make-to-order or make-to-stock, $15M-$300M revenue',
    personas: ['VP of Manufacturing', 'Plant Manager', 'Quality Director', 'Production Supervisor', 'CFO'],
  },
  competitors: [
    { id: cid('pinnacle', 1), name: 'Spreadsheets & Whiteboards', howWeBeatThem: 'Spreadsheet-based production tracking breaks down at 20+ concurrent work orders. There is no real-time visibility, no machine utilization data, and no quality enforcement. Manufacturers who switch from spreadsheets typically discover 15-25% of WIP was untracked, recover $300K-$800K in lost inventory, and reduce on-time delivery failures by 40-60%.' },
    { id: cid('pinnacle', 2), name: 'Legacy MES Systems', howWeBeatThem: 'Legacy MES platforms (Plex, IQMS, Epicor MES) were designed for large enterprise manufacturers. They require 12-18 month implementations, $500K+ budgets, and dedicated IT teams. Pinnacle deploys in 6-10 weeks at a fraction of the cost, with a modern interface that shop floor workers actually use. Our cloud-native architecture eliminates on-premise infrastructure costs entirely.' },
    { id: cid('pinnacle', 3), name: 'Fishbowl Manufacturing', howWeBeatThem: 'Fishbowl offers basic manufacturing features bolted onto an inventory platform. It lacks real-time labor collection, machine utilization monitoring, quality management, and SPC. For any manufacturer running more than a single production line, Fishbowl cannot provide the shop floor visibility that Pinnacle delivers natively.' },
  ],
  brandVoice: {
    tone: 'Authoritative and practical. We understand manufacturing because our founders ran manufacturing operations. Speak in concrete terms — cycle times, OEE percentages, scrap rates. No fluff.',
    wordsToUse: ['shop floor visibility', 'production intelligence', 'operational excellence', 'real-time execution', 'quality-driven', 'purpose-built'],
    wordsToAvoid: ['disruption', 'game-changer', 'next-gen', 'bleeding edge', 'pivot', 'synergy'],
  },
  caseStudies: [
    { id: csid('pinnacle', 1), title: 'Precision Metal Works: 78% Reduction in WIP Tracking Time', content: 'Precision Metal Works, a $62M contract manufacturer with 180 employees and 4 production lines, was losing track of work-in-process inventory across 300+ concurrent jobs. Manual tracking consumed 45 hours per week and still resulted in $520K of unaccounted WIP annually. After deploying Production Floor Execution, WIP tracking time dropped by 78%, the $520K inventory gap was eliminated within 90 days, and on-time delivery improved from 72% to 94%. Shop floor workers adopted the touchscreen labor collection interface within 3 days.' },
    { id: csid('pinnacle', 2), title: 'Heartland Fabrication: Quality Management Reduces Scrap by 42%', content: 'Heartland Fabrication, a $38M structural steel and miscellaneous metals fabricator, was running a 6.8% scrap rate with quality issues caught late in the production process. Non-conformances were tracked on paper and rarely led to corrective action. After implementing the Quality Management module with in-process inspections, scrap rate dropped to 3.9% — a 42% reduction saving $410K annually. The CAPA module identified three recurring root causes that accounted for 61% of all non-conformances, enabling targeted process improvements.' },
    { id: csid('pinnacle', 3), title: 'Summit CNC: Machine Utilization Jumps from 54% to 81%', content: 'Summit CNC Services, a $25M precision machining operation with 35 CNC machines, had no visibility into machine utilization. Management estimated utilization at 70% — actual measurement revealed 54%. After deploying the machine monitoring module, real-time OEE dashboards exposed setup time waste, unplanned downtime patterns, and scheduling gaps. Within 6 months, utilization improved to 81%, effectively adding the equivalent of 9 machines worth of capacity without capital expenditure. The $1.2M in recovered capacity eliminated a planned $3.5M equipment purchase.' },
  ],
  uploadedDocuments: [],
  logoPath: '',
  brandColor: '#B91C1C',
  brandGuidelines: {
    colors: { primary: '#B91C1C', secondary: '#7F1D1D', accent: '#EF4444', background: '#FFFFFF', text: '#1E293B' },
    fonts: { primary: 'Inter', secondary: 'Inter', sizes: { h1: 28, h2: 18, h3: 14, body: 11 } },
    logos: { primaryPath: '', secondaryPath: '', placement: 'top-left' },
    voice: { guidelinesText: 'Authoritative and practical. Lead with shop floor metrics. Speak like a plant manager.', documentContent: '', approvedTerms: ['shop floor visibility', 'production intelligence', 'operational excellence', 'quality-driven'], bannedTerms: ['disruption', 'game-changer', 'next-gen', 'bleeding edge'], tagline: 'From shop floor to top floor.' },
    documentStyle: 'corporate',
  },
};

const pinnacleProducts: ProductProfile[] = [
  {
    id: pid('pinnacle', 1), name: 'Production Floor Execution', shortDescription: 'Real-time work order tracking, labor collection, and machine utilization for discrete manufacturers',
    fullDescription: 'Production Floor Execution gives discrete manufacturers complete real-time visibility into every work order, every work center, and every machine on the shop floor. The platform replaces paper travelers, whiteboard scheduling, and manual labor tracking with touchscreen interfaces that production workers adopt in days. Real-time data flows from the shop floor to management dashboards, ERP cost roll-ups, and customer-facing delivery commitments — eliminating the information lag that causes missed deliveries and cost overruns.',
    features: [
      { id: fid('pinnacle', 'pfe', 1), name: 'Digital Work Order Tracking', description: 'Real-time status visibility for every work order across all operations. Color-coded priority boards replace whiteboard scheduling. Automatic alerts for bottlenecks and late jobs.' },
      { id: fid('pinnacle', 'pfe', 2), name: 'Touchscreen Labor Collection', description: 'Workers clock on/off operations with a single tap. Captures labor hours, setup time, and run time at the operation level. Eliminates paper time cards and manual data entry.' },
      { id: fid('pinnacle', 'pfe', 3), name: 'Machine Utilization & OEE', description: 'Real-time monitoring of machine status — running, idle, setup, down. Calculates OEE (Overall Equipment Effectiveness) by machine, cell, and plant. Identifies utilization gaps and downtime patterns.' },
      { id: fid('pinnacle', 'pfe', 4), name: 'Production Schedule Board', description: 'Visual drag-and-drop scheduling with capacity constraints, material availability checks, and automatic conflict detection. Integrates with ERP sales orders for demand-driven scheduling.' },
    ],
    benefits: ['Eliminate WIP tracking gaps and recover lost inventory', 'Improve on-time delivery 20-30% within 90 days', 'Increase machine utilization 15-25% through visibility', 'Replace paper travelers and manual labor tracking entirely'],
    idealUseCase: 'Discrete manufacturers running 20+ concurrent work orders who lack real-time shop floor visibility and are experiencing missed deliveries, untracked WIP, or unknown machine utilization.',
    targetPersonas: ['VP of Manufacturing', 'Plant Manager', 'Production Supervisor', 'Operations Director'],
    targetIndustries: ['Metal Fabrication', 'CNC Machining', 'Precision Components', 'Contract Manufacturing'],
    differentiators: ['Touchscreen interface designed for shop floor workers, not office users', 'Operation-level data capture vs. order-level only', 'Real-time OEE calculation built in', 'Deploys in 6-10 weeks vs. 12-18 months for legacy MES'],
    proofPoints: ['Precision Metal Works: 78% reduction in WIP tracking time, $520K in lost inventory recovered', 'Summit CNC: machine utilization improved from 54% to 81%, $1.2M capacity recovered', 'Average customer improves on-time delivery by 26% within 90 days'],
    objections: [
      { id: oid('pinnacle', 'pfe', 1), objection: 'Our shop floor workers won\'t use it.', response: 'Our interface was designed by former production supervisors. It uses large touch targets, minimal text, and single-tap operations. Workers clock on/off a job with one touch — simpler than a paper time card. Average adoption time is 3 days. We have deployed in 200+ manufacturing facilities with a 97% adoption success rate.' },
      { id: oid('pinnacle', 'pfe', 2), objection: 'We already track jobs in our ERP.', response: 'ERP job tracking shows you what should be happening. Production Floor Execution shows you what is actually happening — in real time. The gap between these two is where missed deliveries, cost overruns, and lost WIP live. Our customers typically discover 15-25% of their WIP was untracked when they deploy real-time shop floor capture.' },
    ],
    pricingNotes: '$4,000-$12,000/month based on work center count and production volume. Includes touchscreen hardware recommendations, implementation, and training.',
    relatedProducts: [{ productId: pid('pinnacle', 2), type: 'complementary' }, { productId: pid('pinnacle', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('pinnacle', 'pfe', 1), label: 'Shop floor visibility pitch', promptText: 'Create a solution one-pager for Production Floor Execution targeting a {industry} manufacturer with {workCenterCount} work centers still using paper travelers', contentType: 'solution-one-pager' },
      { id: ptid('pinnacle', 'pfe', 2), label: 'WIP recovery ROI case', promptText: 'Build an ROI business case showing WIP inventory recovery for a manufacturer with ${wipGap} in annual untracked WIP', contentType: 'roi-business-case' },
      { id: ptid('pinnacle', 'pfe', 3), label: 'MES replacement battle card', promptText: 'Create a competitive battle card comparing Pinnacle Production Floor Execution against legacy MES platforms for a mid-market manufacturer evaluation', contentType: 'battle-card' },
      { id: ptid('pinnacle', 'pfe', 4), label: 'Manufacturing discovery prep', promptText: 'Create a discovery call prep sheet for a meeting with the plant manager at a {industry} manufacturer running {employeeCount} employees', contentType: 'discovery-call-prep' },
      { id: ptid('pinnacle', 'pfe', 5), label: 'On-time delivery email', promptText: 'Draft a 3-email outbound sequence targeting VP of Manufacturing at discrete manufacturers with on-time delivery challenges', contentType: 'outbound-email-sequence' },
    ],
    contentGeneratedCount: 38,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [
      { id: cmid('pinnacle', 'pfe', 1), competitorName: 'Spreadsheets & Whiteboards', theirEquivalentProduct: 'Manual tracking', howWeWin: ['Real-time visibility vs. stale data', 'Automatic labor collection vs. paper time cards', 'Machine utilization tracking impossible manually', 'Scales to 100+ concurrent jobs'], howTheyWin: ['Zero cost', 'No implementation required', 'Familiar to everyone'], talkTrack: 'Spreadsheets and whiteboards work until they don\'t. The question is: how much invisible waste are you tolerating? Our customers typically discover 15-25% of WIP was untracked and $300K-$800K was silently lost.', winRate: 85 },
    ],
  },
  {
    id: pid('pinnacle', 2), name: 'Inventory Control', shortDescription: 'Lot/serial tracking, cycle counting, and min-max optimization for manufacturing',
    fullDescription: 'Pinnacle Inventory Control provides complete material visibility across raw materials, work-in-process, and finished goods with lot/serial genealogy, guided cycle counting, and intelligent min-max optimization designed for manufacturing replenishment cycles.',
    features: [
      { id: fid('pinnacle', 'ic', 1), name: 'Lot/Serial Genealogy', description: 'Full forward and backward traceability from raw material lot through production to finished goods serial number. Supports regulatory recall requirements.' },
      { id: fid('pinnacle', 'ic', 2), name: 'Guided Cycle Counting', description: 'Mobile-guided cycle count workflows prioritized by value, variance history, and classification. Eliminates annual physical inventory shutdowns.' },
      { id: fid('pinnacle', 'ic', 3), name: 'Manufacturing Min-Max', description: 'Intelligent reorder point calculation that factors in production lead times, supplier lead times, and demand forecast from the production schedule.' },
      { id: fid('pinnacle', 'ic', 4), name: 'Multi-Stage Tracking', description: 'Separate visibility for raw material, WIP at each operation, and finished goods inventory. Accurate costing at every stage.' },
    ],
    benefits: ['Achieve 99%+ inventory accuracy across all material stages', 'Full lot/serial traceability for regulatory compliance', 'Eliminate annual physical inventory shutdowns', 'Reduce raw material stockouts by 50-70%'],
    idealUseCase: 'Manufacturers requiring lot/serial traceability, experiencing inventory accuracy issues across material stages, or spending excessive time on physical inventory counts.',
    targetPersonas: ['Inventory Manager', 'Quality Director', 'Purchasing Manager', 'Plant Manager'],
    targetIndustries: ['Metal Fabrication', 'CNC Machining', 'Precision Components', 'Aerospace Components', 'Medical Devices'],
    differentiators: ['Multi-stage tracking (raw, WIP, finished) vs. single-state systems', 'Manufacturing-specific min-max with production schedule integration', 'Full lot-to-serial genealogy for traceability', 'Guided mobile cycle counting with variance analysis'],
    proofPoints: ['Average customer achieves 99.2% inventory accuracy within 120 days', 'Eliminates 2-3 day annual physical inventory shutdown', 'Customers reduce raw material stockouts by 62% on average'],
    objections: [
      { id: oid('pinnacle', 'ic', 1), objection: 'Our ERP handles inventory.', response: 'ERP inventory modules track quantities by location. They do not provide multi-stage WIP visibility, guided cycle counting workflows, or manufacturing-specific min-max optimization. The gap between ERP inventory records and physical reality is where production delays and cost overruns originate.' },
    ],
    pricingNotes: '$2,500-$7,000/month based on SKU count and location count.',
    relatedProducts: [{ productId: pid('pinnacle', 1), type: 'complementary' }, { productId: pid('pinnacle', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('pinnacle', 'ic', 1), label: 'Traceability compliance pitch', promptText: 'Create a solution one-pager for Inventory Control targeting a {industry} manufacturer that needs lot/serial traceability for regulatory compliance', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 19,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
  {
    id: pid('pinnacle', 3), name: 'Quality Management', shortDescription: 'Inspection workflows, non-conformance tracking, and CAPA for manufacturing quality',
    fullDescription: 'Pinnacle Quality Management embeds quality into every step of the production process instead of catching defects after the fact. Configurable inspection plans trigger at each operation, non-conformance tracking captures root cause data, and the CAPA workflow ensures corrective actions are implemented and verified. SPC charting provides statistical visibility into process capability and drift.',
    features: [
      { id: fid('pinnacle', 'qm', 1), name: 'In-Process Inspection Plans', description: 'Configurable inspection checklists triggered at specific operations. Supports dimensional, visual, and functional inspection types with pass/fail/conditional dispositions.' },
      { id: fid('pinnacle', 'qm', 2), name: 'Non-Conformance Tracking', description: 'Structured capture of defects with root cause classification, containment actions, and disposition workflows. Links NCRs to specific lots, operations, and work centers for pattern analysis.' },
      { id: fid('pinnacle', 'qm', 3), name: 'CAPA Workflow', description: 'Corrective and preventive action workflows with automated assignment, escalation timers, effectiveness verification, and closure tracking. Full audit trail for compliance.' },
      { id: fid('pinnacle', 'qm', 4), name: 'SPC Charting', description: 'Real-time statistical process control charts (X-bar, R, p, c) with control limit calculation, trend detection, and out-of-control alerts.' },
    ],
    benefits: ['Reduce scrap rates 30-50% through early defect detection', 'Achieve ISO 9001/AS9100 compliance with built-in audit trails', 'Identify root causes driving 60%+ of quality issues', 'Eliminate paper-based quality records entirely'],
    idealUseCase: 'Manufacturers with scrap rate concerns, ISO/AS9100 compliance requirements, or paper-based quality systems that fail to drive corrective action.',
    targetPersonas: ['Quality Director', 'Quality Manager', 'VP of Manufacturing', 'Plant Manager'],
    targetIndustries: ['Metal Fabrication', 'Precision Components', 'Aerospace Components', 'Medical Devices', 'Contract Manufacturing'],
    differentiators: ['Quality built into production workflow vs. standalone QMS', 'Root cause pattern analysis across operations and work centers', 'CAPA with automated escalation and effectiveness verification', 'SPC integrated with production data — no manual data entry'],
    proofPoints: ['Heartland Fabrication: 42% scrap rate reduction, $410K annual savings', 'CAPA root cause analysis identifies patterns driving 60%+ of NCRs on average', 'Customers achieve ISO audit readiness within 90 days of deployment'],
    objections: [
      { id: oid('pinnacle', 'qm', 1), objection: 'We already have a quality system.', response: 'Most manufacturing quality systems are paper-based or standalone. They capture defects but do not prevent them. Pinnacle Quality Management integrates directly into the production workflow — inspections trigger automatically at each operation, non-conformances link to specific lots and work centers, and CAPA workflows ensure corrective actions actually happen. The result is 30-50% scrap reduction, not just better record-keeping.' },
    ],
    pricingNotes: '$2,000-$6,000/month based on inspection volume and user count.',
    relatedProducts: [{ productId: pid('pinnacle', 1), type: 'complementary' }, { productId: pid('pinnacle', 2), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('pinnacle', 'qm', 1), label: 'Quality ROI by scrap rate', promptText: 'Build an ROI business case showing scrap reduction savings for a manufacturer with {scrapRate}% current scrap rate and ${annualRevenue} annual revenue', contentType: 'roi-business-case' },
    ],
    contentGeneratedCount: 15,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
];

// ═══════════════════════════════════════════════
// 3. SUMMIT STAFFING
// ═══════════════════════════════════════════════

const summitKB: KnowledgeBase = {
  companyName: 'Summit Staffing',
  tagline: 'Fill faster. Bill smarter.',
  website: 'https://www.summitstaffing.io',
  aboutUs: 'Summit Staffing builds workforce management technology for staffing agencies that place light industrial, skilled trades, and professional talent. With 75 employees and a leadership team drawn from the staffing industry, we understand that every unfilled requisition is lost revenue and every slow invoice is cash flow damage. Our platform automates the candidate pipeline from sourcing through placement, gives clients real-time visibility into their workforce, and turns placement data into actionable intelligence that improves fill rates, margins, and retention.',
  products: [
    { id: '1', name: 'Candidate Pipeline Manager', description: 'AI-powered candidate matching, automated outreach sequences, and integrated interview scheduling that cuts time-to-fill by 40-60%.', keyFeatures: ['AI candidate-job matching with skill scoring', 'Automated multi-channel outreach sequences', 'Self-service interview scheduling', 'Candidate engagement scoring and re-activation', 'Integrated background check and compliance tracking'], pricing: '$2,500-$6,000/month' },
    { id: '2', name: 'Client Portal', description: 'Branded client-facing portal with real-time placement tracking, invoice status, compliance documentation, and workforce analytics.', keyFeatures: ['Real-time placement and attendance tracking', 'Invoice status and payment history', 'Compliance document management', 'Workforce analytics and reporting'], pricing: '$1,500-$4,000/month' },
    { id: '3', name: 'Placement Analytics', description: 'Business intelligence platform that transforms placement data into actionable insights — time-to-fill trends, margin analysis, recruiter productivity, and retention scoring.', keyFeatures: ['Time-to-fill analysis by client, role, and recruiter', 'Gross margin analysis with rate optimization', 'Retention scoring and early warning alerts', 'Recruiter productivity benchmarking'], pricing: '$1,200-$3,500/month' },
  ],
  differentiators: 'Built by staffing people for staffing people — not adapted from generic HR or CRM platforms. AI matching trained on 4M+ staffing placements. Unified platform eliminates the 5-7 tool stack most agencies cobble together. Transparent per-recruiter pricing with no hidden fees. Implementation in 3-4 weeks with staffing-specific data migration.',
  icp: {
    industries: ['Light Industrial Staffing', 'Professional Staffing', 'Skilled Trades Staffing', 'Clerical Staffing', 'IT Staffing'],
    companySize: '25-200 employees, 100+ placements per month, $5M-$100M revenue',
    personas: ['Agency Owner', 'VP of Operations', 'Branch Manager', 'Director of Recruiting', 'CFO'],
  },
  competitors: [
    { id: cid('summit', 1), name: 'Bullhorn', howWeBeatThem: 'Bullhorn is the 800-pound gorilla, but it is built for enterprise staffing firms and priced accordingly. Mid-market agencies pay $150-300/user/month for features they do not use, plus $50K+ for implementation. Summit delivers the core functionality mid-market agencies need at 40-60% lower total cost, with 3-4 week implementation instead of 3-6 months. Our AI matching outperforms Bullhorn\'s keyword-based search for light industrial and skilled trades placements.' },
    { id: cid('summit', 2), name: 'Manual Tracking / Spreadsheets', howWeBeatThem: 'Spreadsheet-based candidate tracking caps out at roughly 50 open requisitions before recruiters start losing candidates. Average time-to-fill increases 30-40% as the pipeline grows because there is no automated matching, no outreach sequencing, and no engagement scoring. Our customers who migrate from spreadsheets cut time-to-fill by 40-60% and increase placements per recruiter by 25-35%.' },
    { id: cid('summit', 3), name: 'Indeed / Job Board Dependence', howWeBeatThem: 'Over-reliance on Indeed creates a costly, reactive sourcing model. The average cost-per-hire through Indeed is $3,200-$4,800 for staffing agencies. Summit\'s AI matching re-activates existing database candidates first — reducing job board spend by 35-50% while improving candidate quality through historical performance data that job boards cannot provide.' },
  ],
  brandVoice: {
    tone: 'Energetic, direct, and results-focused. We speak the language of staffing — fill rates, gross margins, time-to-fill, bill rates. No enterprise jargon. Keep it punchy and practical.',
    wordsToUse: ['fill rate', 'time-to-fill', 'gross margin', 'placements per recruiter', 'candidate pipeline', 'workforce intelligence', 'revenue per recruiter'],
    wordsToAvoid: ['human capital', 'talent ecosystem', 'synergy', 'paradigm shift', 'thought leader', 'best-in-class'],
  },
  caseStudies: [
    { id: csid('summit', 1), title: 'ProStaff Solutions: 52% Faster Time-to-Fill, $1.8M Revenue Increase', content: 'ProStaff Solutions, a 45-person light industrial staffing agency placing 400+ temps per month, was struggling with 8.2-day average time-to-fill and losing requisitions to faster competitors. Recruiters spent 3+ hours daily on manual candidate searching and phone outreach. After deploying the Candidate Pipeline Manager, time-to-fill dropped to 3.9 days — a 52% reduction. AI matching surfaced qualified candidates from their existing 28,000-person database that recruiters had forgotten about. Placements per recruiter increased from 18 to 24 per month. The resulting revenue increase: $1.8M in the first year from faster fills and higher requisition capture.' },
    { id: csid('summit', 2), title: 'Keystone Workforce: Client Portal Drives 34% Improvement in Client Retention', content: 'Keystone Workforce, a $22M professional staffing firm serving 85 clients, was losing 18% of clients annually — with "lack of visibility" cited as the top reason in exit interviews. Account managers spent 6+ hours per week compiling manual status reports for top clients. After launching the Client Portal, client retention improved by 34% (churn dropped from 18% to 12%), and account manager reporting time dropped by 82%. Three clients specifically cited the portal as the reason they renewed multi-year contracts totaling $3.2M in annual revenue.' },
    { id: csid('summit', 3), title: 'Trident Staffing Group: Margin Analysis Recovers $420K in Underpriced Placements', content: 'Trident Staffing Group, a 60-person agency with 12 branch offices, had no standardized way to analyze gross margins by client, role type, or branch. The Placement Analytics module revealed that 23% of active client accounts were operating below the 22% margin floor — with some as low as 14%. Armed with data, the sales team renegotiated rates on 31 accounts over 90 days, recovering $420K in annual margin. The retention scoring module also identified 340 at-risk placements and enabled targeted intervention, reducing 90-day turnover from 28% to 19%.' },
  ],
  uploadedDocuments: [],
  logoPath: '',
  brandColor: '#7C3AED',
  brandGuidelines: {
    colors: { primary: '#7C3AED', secondary: '#5B21B6', accent: '#8B5CF6', background: '#FFFFFF', text: '#1E293B' },
    fonts: { primary: 'Inter', secondary: 'Inter', sizes: { h1: 28, h2: 18, h3: 14, body: 11 } },
    logos: { primaryPath: '', secondaryPath: '', placement: 'top-left' },
    voice: { guidelinesText: 'Energetic and results-focused. Speak staffing language. Lead with fill rates and revenue impact.', documentContent: '', approvedTerms: ['fill rate', 'time-to-fill', 'gross margin', 'placements per recruiter', 'workforce intelligence'], bannedTerms: ['human capital', 'talent ecosystem', 'synergy', 'paradigm shift'], tagline: 'Fill faster. Bill smarter.' },
    documentStyle: 'bold',
  },
};

const summitProducts: ProductProfile[] = [
  {
    id: pid('summit', 1), name: 'Candidate Pipeline Manager', shortDescription: 'AI matching, automated outreach, and interview scheduling for staffing agencies',
    fullDescription: 'The Candidate Pipeline Manager is the recruiting engine that staffing agencies need to compete for requisitions. AI matching scores candidates against job requirements using skills, experience, location, availability, and historical placement success — not just keyword matching. Automated outreach sequences engage candidates across text, email, and voice. Self-service interview scheduling eliminates the phone tag that costs recruiters 2+ hours daily.',
    features: [
      { id: fid('summit', 'cpm', 1), name: 'AI Candidate Matching', description: 'Scores candidates on 40+ factors including skills, experience, commute distance, availability, and historical placement success rate. Trained on 4M+ staffing placements across light industrial, skilled trades, and professional roles.' },
      { id: fid('summit', 'cpm', 2), name: 'Automated Outreach Sequences', description: 'Multi-channel sequences across text, email, and ringless voicemail. Configurable by role type, urgency, and candidate tier. Average response rate improvement: 3.2x over manual outreach.' },
      { id: fid('summit', 'cpm', 3), name: 'Self-Service Interview Scheduling', description: 'Candidates select available slots from a branded scheduling page. Integrates with recruiter calendars and sends automated reminders. Reduces scheduling time by 85%.' },
      { id: fid('summit', 'cpm', 4), name: 'Candidate Engagement Scoring', description: 'Tracks candidate responsiveness, application completeness, and interaction history. Flags re-activation opportunities for passive candidates in your database.' },
      { id: fid('summit', 'cpm', 5), name: 'Compliance & Background Checks', description: 'Integrated background check ordering, drug screen tracking, and compliance document management. Ensures every placement meets client and regulatory requirements before start date.' },
    ],
    benefits: ['Cut time-to-fill by 40-60%', 'Increase placements per recruiter by 25-35%', 'Reduce job board spend by 35-50% through database reactivation', 'Eliminate 2+ hours daily of manual candidate searching per recruiter'],
    idealUseCase: 'Staffing agencies placing 100+ candidates per month who need to fill faster, reduce recruiter burnout, and stop losing requisitions to faster competitors.',
    targetPersonas: ['Director of Recruiting', 'Branch Manager', 'Agency Owner', 'VP of Operations'],
    targetIndustries: ['Light Industrial Staffing', 'Skilled Trades Staffing', 'Professional Staffing', 'Clerical Staffing'],
    differentiators: ['AI trained on 4M+ staffing placements vs. generic HR AI', 'Multi-channel outreach (text + email + voice) in one platform', 'Database reactivation reduces job board dependency', 'Staffing-specific compliance workflows built in'],
    proofPoints: ['ProStaff Solutions: 52% faster time-to-fill, $1.8M revenue increase in year one', 'Average customer increases placements per recruiter from 18 to 24 per month', '3.2x average response rate improvement with automated outreach vs. manual'],
    objections: [
      { id: oid('summit', 'cpm', 1), objection: 'We already use Bullhorn.', response: 'Bullhorn is a CRM with basic matching. Summit is a recruiting execution engine. Our AI matching scores candidates on 40+ factors including historical placement success — something keyword-based systems cannot do. Mid-market agencies typically find Summit delivers 80% of Bullhorn\'s functionality at 40-60% lower total cost, with implementation in weeks instead of months.' },
      { id: oid('summit', 'cpm', 2), objection: 'AI matching won\'t work for our niche.', response: 'Our matching model is trained on 4M+ staffing placements across light industrial, skilled trades, professional, and IT roles. It learns your specific placement patterns within 60 days. Customers in niche verticals consistently see 40%+ time-to-fill reduction because the AI surfaces qualified candidates from deep in their database that manual search misses.' },
    ],
    pricingNotes: '$2,500-$6,000/month based on recruiter count. Per-recruiter pricing with no hidden fees. Includes AI matching, outreach automation, scheduling, and compliance modules.',
    relatedProducts: [{ productId: pid('summit', 2), type: 'complementary' }, { productId: pid('summit', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('summit', 'cpm', 1), label: 'Staffing agency pitch', promptText: 'Create a solution one-pager for the Candidate Pipeline Manager targeting a {size}-person staffing agency specializing in {vertical} placements', contentType: 'solution-one-pager' },
      { id: ptid('summit', 'cpm', 2), label: 'Time-to-fill ROI case', promptText: 'Build an ROI business case for a staffing agency with {ttf}-day average time-to-fill and {reqCount} open requisitions per month', contentType: 'roi-business-case' },
      { id: ptid('summit', 'cpm', 3), label: 'Bullhorn comparison card', promptText: 'Create a competitive battle card comparing Summit Candidate Pipeline Manager against Bullhorn for a mid-market staffing agency', contentType: 'battle-card' },
      { id: ptid('summit', 'cpm', 4), label: 'Recruiter productivity email', promptText: 'Draft a 3-email outbound sequence targeting agency owners focused on recruiter productivity and placements per recruiter improvement', contentType: 'outbound-email-sequence' },
      { id: ptid('summit', 'cpm', 5), label: 'ProStaff success story', promptText: 'Create a customer success story based on ProStaff Solutions achieving 52% faster time-to-fill and $1.8M revenue increase', contentType: 'case-study' },
    ],
    contentGeneratedCount: 33,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [
      { id: cmid('summit', 'cpm', 1), competitorName: 'Bullhorn', theirEquivalentProduct: 'Bullhorn ATS/CRM', howWeWin: ['AI matching on 40+ factors vs. keyword search', 'Integrated multi-channel outreach', '40-60% lower total cost', '3-4 week implementation vs. 3-6 months'], howTheyWin: ['Larger brand recognition', 'Deeper enterprise features', 'Broader integration ecosystem', 'Established customer base'], talkTrack: 'Bullhorn is great for enterprise staffing firms with 500+ recruiters and dedicated IT teams. For mid-market agencies, Summit delivers the recruiting execution capabilities that actually drive placements — AI matching, automated outreach, and compliance — at a fraction of the cost and implementation time.', winRate: 65 },
    ],
  },
  {
    id: pid('summit', 2), name: 'Client Portal', shortDescription: 'Branded client portal with placement tracking, invoicing, and compliance docs',
    fullDescription: 'The Summit Client Portal transforms how staffing agencies serve their clients. Instead of weekly email reports and phone calls asking "where\'s my temp?", clients get real-time visibility into every placement, invoice, and compliance document through a branded self-service portal. Account managers reclaim 6+ hours per week spent on manual reporting, and client satisfaction scores increase measurably within 90 days.',
    features: [
      { id: fid('summit', 'cp', 1), name: 'Real-Time Placement Dashboard', description: 'Live status for every active placement — start dates, attendance tracking, assignment duration, and end-date alerts. Clients see their entire workforce at a glance.' },
      { id: fid('summit', 'cp', 2), name: 'Invoice & Payment Hub', description: 'Online invoice access, payment status tracking, and historical billing data. Reduces AP inquiries by 70% and accelerates payment cycles by an average of 8 days.' },
      { id: fid('summit', 'cp', 3), name: 'Compliance Document Center', description: 'Centralized repository for all placement-related compliance documents — background checks, drug screens, certifications, and insurance certificates. Clients can verify compliance status in real time.' },
      { id: fid('summit', 'cp', 4), name: 'Workforce Analytics', description: 'Client-facing analytics on headcount trends, attendance rates, turnover, and spend analysis. Helps clients optimize their contingent workforce strategy.' },
    ],
    benefits: ['Improve client retention by 25-35%', 'Reduce account manager reporting time by 80%', 'Accelerate invoice payment by 5-10 days', 'Differentiate from competitors with white-label technology'],
    idealUseCase: 'Staffing agencies serving 50+ clients who need to improve retention, reduce manual reporting overhead, and differentiate through technology.',
    targetPersonas: ['Agency Owner', 'VP of Operations', 'Account Manager', 'CFO'],
    targetIndustries: ['Light Industrial Staffing', 'Professional Staffing', 'Skilled Trades Staffing'],
    differentiators: ['White-label branded portal vs. generic dashboards', 'Combined placement + billing + compliance in one view', 'Self-service reduces account manager overhead by 80%', 'Mobile-responsive for client managers in the field'],
    proofPoints: ['Keystone Workforce: 34% client retention improvement, $3.2M in renewed contracts', 'Average 82% reduction in account manager reporting time', '70% reduction in AP-related client inquiries'],
    objections: [
      { id: oid('summit', 'cp', 1), objection: 'Our clients don\'t want another login.', response: 'Our portal is mobile-responsive with optional email digest summaries — clients who prefer not to log in still get weekly automated reports. But 78% of clients who are given portal access use it weekly, and the top client complaint in our industry is lack of visibility. Giving clients self-service access is the number one driver of retention improvement.' },
    ],
    pricingNotes: '$1,500-$4,000/month based on client count. White-label branding included.',
    relatedProducts: [{ productId: pid('summit', 1), type: 'complementary' }, { productId: pid('summit', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('summit', 'cp', 1), label: 'Client retention pitch', promptText: 'Create a solution one-pager showing how the Client Portal improves retention for a staffing agency losing {churnRate}% of clients annually', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 16,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
  {
    id: pid('summit', 3), name: 'Placement Analytics', shortDescription: 'Time-to-fill trends, margin analysis, and retention scoring for staffing intelligence',
    fullDescription: 'Placement Analytics transforms raw staffing data into the intelligence that drives revenue growth. The platform analyzes time-to-fill by client, role, and recruiter to identify bottlenecks. Margin analysis reveals underpriced accounts and rate optimization opportunities. Retention scoring flags at-risk placements before they turn over, enabling targeted intervention that improves 90-day retention by 20-30%.',
    features: [
      { id: fid('summit', 'pa', 1), name: 'Time-to-Fill Analysis', description: 'Breakdown by client, role type, recruiter, and branch. Identifies bottlenecks in the pipeline and benchmarks performance against industry standards.' },
      { id: fid('summit', 'pa', 2), name: 'Gross Margin Dashboard', description: 'Real-time margin visibility by client, placement, and branch. Flags accounts operating below margin floors and identifies rate optimization opportunities.' },
      { id: fid('summit', 'pa', 3), name: 'Retention Scoring', description: 'Predictive scoring identifies at-risk placements based on attendance patterns, tenure, and engagement signals. Enables proactive intervention before turnover occurs.' },
      { id: fid('summit', 'pa', 4), name: 'Recruiter Productivity', description: 'Benchmarks recruiter performance on submittals, interviews, placements, and revenue per recruiter. Identifies coaching opportunities and top performer patterns.' },
    ],
    benefits: ['Recover $200K-$500K annually in underpriced placements', 'Reduce 90-day turnover by 20-30% through early intervention', 'Identify top recruiter patterns and replicate across the team', 'Make data-driven decisions on client pricing and branch performance'],
    idealUseCase: 'Staffing agencies with 100+ monthly placements who lack visibility into margins, retention drivers, and recruiter productivity.',
    targetPersonas: ['Agency Owner', 'CFO', 'VP of Operations', 'Branch Manager'],
    targetIndustries: ['Light Industrial Staffing', 'Professional Staffing', 'Skilled Trades Staffing'],
    differentiators: ['Staffing-specific analytics vs. generic BI tools', 'Retention scoring with proactive alert workflows', 'Margin analysis with rate optimization recommendations', 'Recruiter productivity benchmarking built in'],
    proofPoints: ['Trident Staffing Group: $420K recovered in underpriced placements, 90-day turnover reduced from 28% to 19%', 'Average customer identifies 20-25% of accounts operating below margin floor', 'Retention scoring reduces 90-day turnover by 24% on average'],
    objections: [
      { id: oid('summit', 'pa', 1), objection: 'We can build this in Excel.', response: 'You can build point-in-time reports in Excel. You cannot build real-time margin monitoring, predictive retention scoring, or automated alerts in Excel. Our customers who migrate from Excel-based analytics typically discover 20-25% of their accounts are operating below margin floor — a finding that requires continuous monitoring, not quarterly spreadsheet analysis.' },
    ],
    pricingNotes: '$1,200-$3,500/month based on placement volume.',
    relatedProducts: [{ productId: pid('summit', 1), type: 'complementary' }, { productId: pid('summit', 2), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('summit', 'pa', 1), label: 'Margin recovery pitch', promptText: 'Create a solution one-pager for Placement Analytics targeting an agency owner concerned about margin erosion across {clientCount} active clients', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 12,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
];

// ═══════════════════════════════════════════════
// 4. CLEARVIEW TECHNOLOGY
// ═══════════════════════════════════════════════

const clearviewKB: KnowledgeBase = {
  companyName: 'Clearview Technology',
  tagline: 'Sales content that closes.',
  website: 'https://www.clearviewtech.io',
  aboutUs: 'Clearview Technology is a B2B SaaS company that builds AI-powered content creation and sales enablement tools for growing sales organizations. With 50 employees and a founding team from Salesforce and HubSpot, we solve the problem that kills deal velocity: sales teams waiting days or weeks for marketing to produce the one-pagers, battle cards, and email sequences they need right now. Our AI Content Engine is trained on your brand voice, your product positioning, and your competitive landscape — producing sales-ready content in minutes that actually sounds like your company.',
  products: [
    { id: '1', name: 'AI Content Engine', description: 'Brand-trained AI that generates sales collateral, marketing content, and prospect communications in your company\'s voice — with built-in compliance checking.', keyFeatures: ['Brand-trained generation tuned to your voice and terminology', 'Multi-format output: one-pagers, emails, battle cards, case studies', 'Compliance checking against brand guidelines and legal requirements', 'Prospect personalization with company and industry context', 'Version history and approval workflows'], pricing: '$3,000-$8,000/month' },
    { id: '2', name: 'Sales Enablement Suite', description: 'Ready-to-use battle cards, one-pagers, and email sequences that sales reps can personalize and deploy in minutes — not days.', keyFeatures: ['Competitive battle cards with talk tracks', 'Product one-pagers by persona and use case', 'Multi-touch email sequences with A/B variants', 'Meeting prep sheets with prospect intelligence'], pricing: '$2,000-$5,500/month' },
    { id: '3', name: 'Brand Compliance Dashboard', description: 'Real-time monitoring of all sales content against brand guidelines — voice scoring, terminology enforcement, and approval workflows.', keyFeatures: ['AI voice scoring against brand guidelines', 'Terminology enforcement with approved/banned word lists', 'Approval workflows with role-based routing', 'Usage analytics showing content adoption by rep'], pricing: '$1,500-$4,000/month' },
  ],
  differentiators: 'Our AI is trained on your specific brand — not generic models producing generic content. Sales reps generate compliant, on-brand content in minutes instead of waiting days for marketing. Brand compliance is automated, not manual review. Every piece of content is personalized to the specific prospect and deal context. We integrate directly into Salesforce and HubSpot workflows.',
  icp: {
    industries: ['B2B SaaS', 'Technology', 'Professional Services', 'Financial Services', 'Healthcare Technology'],
    companySize: '20-500 employees, 5+ person sales team, $5M-$200M revenue',
    personas: ['VP of Sales', 'VP of Marketing', 'Sales Enablement Manager', 'Head of Content', 'CMO'],
  },
  competitors: [
    { id: cid('clearview', 1), name: 'Jasper AI', howWeBeatThem: 'Jasper is a general-purpose AI writing tool. It does not understand your competitive positioning, your product nuances, or your sales process. Content from Jasper requires heavy editing to sound like your brand and reflect accurate product details. Clearview is trained on your specific brand voice, product data, and competitive intelligence — producing sales-ready content that reps can use immediately without marketing review.' },
    { id: cid('clearview', 2), name: 'Generic AI Tools (ChatGPT, etc.)', howWeBeatThem: 'Generic AI tools produce generic content. They do not know your products, your competitors, or your brand voice. Every output requires manual editing to add accurate product details, competitive positioning, and brand-appropriate language. Clearview eliminates this editing cycle entirely because the AI is trained on your complete knowledge base. Average content production time drops from 4-6 hours to 15 minutes.' },
    { id: cid('clearview', 3), name: 'Freelance Writers / Agency', howWeBeatThem: 'Freelancers and agencies produce high-quality content — eventually. Average turnaround is 5-10 business days at $500-$2,000 per asset. They require detailed briefs, multiple revision cycles, and never fully internalize your competitive positioning. Clearview produces comparable quality in 15 minutes, at a fraction of the cost per asset, with no brief required because the AI already knows your business inside and out.' },
  ],
  brandVoice: {
    tone: 'Sharp, modern, and confident. We write like a top-performing sales leader — clear, concise, and persuasive. No fluff, no buzzwords, no filler paragraphs. Every sentence earns its place.',
    wordsToUse: ['brand-trained', 'sales-ready', 'on-brand', 'deal velocity', 'content at speed', 'compliant', 'personalized'],
    wordsToAvoid: ['revolutionary', 'cutting-edge', 'best-in-class', 'world-class', 'disruptive', 'synergy'],
  },
  caseStudies: [
    { id: csid('clearview', 1), title: 'DataForge: 73% Reduction in Content Production Time, 28% Higher Win Rate', content: 'DataForge, a $45M B2B data platform with a 22-person sales team, was losing deals because reps could not get custom one-pagers and battle cards fast enough. Marketing had a 7-day average turnaround, and reps were sending generic decks that did not address prospect-specific pain points. After deploying the AI Content Engine, content production time dropped from 5.2 hours to 18 minutes per asset — a 73% reduction. More importantly, win rate on competitive deals increased from 31% to 40% because reps could deploy personalized, accurate battle cards within hours of learning about a competitor in a deal. Estimated annual revenue impact: $2.4M.' },
    { id: csid('clearview', 2), title: 'Meridian SaaS: Sales Enablement Suite Powers 45% Faster Ramp for New Reps', content: 'Meridian SaaS, a $28M cloud security company, was struggling with 6-month ramp time for new sales reps. New hires spent weeks searching for the right battle cards, learning competitive positioning, and figuring out which case studies to reference. After deploying the Sales Enablement Suite, new rep ramp time dropped to 3.3 months — a 45% reduction. The pre-built battle cards and email sequences gave new reps immediate access to proven messaging, and the meeting prep module ensured they walked into every call prepared. First-year quota attainment for new hires improved from 62% to 84%.' },
    { id: csid('clearview', 3), title: 'Vantage Analytics: Brand Compliance Dashboard Eliminates Off-Brand Content', content: 'Vantage Analytics, a $67M enterprise analytics company with 45 sales reps across 4 regions, discovered that 38% of sales content being sent to prospects contained outdated product information, banned terminology, or off-brand messaging. Two deals were nearly lost due to inaccurate competitive claims in rep-created battle cards. After deploying the Brand Compliance Dashboard, off-brand content dropped from 38% to under 3%. The automated voice scoring catches terminology violations before content leaves the building, and the approval workflow routes high-stakes content to marketing for review without slowing down routine content. Legal review requests dropped by 60%.' },
  ],
  uploadedDocuments: [],
  logoPath: '',
  brandColor: '#059669',
  brandGuidelines: {
    colors: { primary: '#059669', secondary: '#065F46', accent: '#10B981', background: '#FFFFFF', text: '#1E293B' },
    fonts: { primary: 'Inter', secondary: 'Inter', sizes: { h1: 28, h2: 18, h3: 14, body: 11 } },
    logos: { primaryPath: '', secondaryPath: '', placement: 'top-left' },
    voice: { guidelinesText: 'Sharp and modern. Write like a top sales leader. No fluff or buzzwords.', documentContent: '', approvedTerms: ['brand-trained', 'sales-ready', 'on-brand', 'deal velocity', 'content at speed'], bannedTerms: ['revolutionary', 'cutting-edge', 'best-in-class', 'world-class', 'disruptive'], tagline: 'Sales content that closes.' },
    documentStyle: 'modern',
  },
};

const clearviewProducts: ProductProfile[] = [
  {
    id: pid('clearview', 1), name: 'AI Content Engine', shortDescription: 'Brand-trained AI generation with multi-format output and compliance checking',
    fullDescription: 'The AI Content Engine is a brand-trained content generation platform that produces sales collateral, marketing content, and prospect communications in your company\'s authentic voice. Unlike generic AI tools, the engine is trained on your product data, competitive positioning, case studies, and brand guidelines — producing content that sales reps can use immediately without marketing review. Built-in compliance checking ensures every piece of content meets brand standards before it reaches a prospect.',
    features: [
      { id: fid('clearview', 'ace', 1), name: 'Brand Training Engine', description: 'Upload your brand guidelines, product documentation, case studies, and competitive intel. The AI learns your specific voice, terminology, and positioning — not generic marketing language.' },
      { id: fid('clearview', 'ace', 2), name: 'Multi-Format Generation', description: 'Produce one-pagers, battle cards, email sequences, case studies, executive summaries, and proposals from a single content request. Each format follows proven templates optimized for that content type.' },
      { id: fid('clearview', 'ace', 3), name: 'Prospect Personalization', description: 'Enter prospect company name, industry, and pain points. The AI customizes every piece of content to address the specific prospect\'s situation with relevant case studies, metrics, and use cases.' },
      { id: fid('clearview', 'ace', 4), name: 'Compliance Auto-Check', description: 'Every generated piece is automatically scored against brand guidelines, approved terminology lists, and legal compliance rules. Violations are flagged with suggested corrections before content can be shared.' },
    ],
    benefits: ['Reduce content production time from hours to minutes', 'Increase competitive win rate with personalized battle cards', 'Eliminate off-brand content with automated compliance', 'Scale content production without scaling marketing headcount'],
    idealUseCase: 'B2B companies with 5+ sales reps who need to produce personalized sales collateral faster than marketing can deliver it, while maintaining brand consistency.',
    targetPersonas: ['VP of Sales', 'VP of Marketing', 'Sales Enablement Manager', 'CMO'],
    targetIndustries: ['B2B SaaS', 'Technology', 'Professional Services', 'Financial Services'],
    differentiators: ['Brand-trained AI vs. generic content generation', 'Multi-format output from single request', 'Built-in compliance checking vs. manual review', 'Prospect personalization with deal context'],
    proofPoints: ['DataForge: 73% reduction in content production time, 28% higher competitive win rate', 'Average content generation time: 15 minutes vs. 4-6 hours with traditional processes', 'Customers report 90%+ of AI-generated content is usable without editing'],
    objections: [
      { id: oid('clearview', 'ace', 1), objection: 'We already use ChatGPT.', response: 'ChatGPT produces generic content that requires heavy editing to match your brand voice, include accurate product details, and reflect your competitive positioning. Our customers who switch from generic AI tools reduce editing time by 85% because the content is already on-brand, accurate, and personalized to the specific prospect. The 15 minutes you save per asset multiplies across every rep, every deal, every day.' },
      { id: oid('clearview', 'ace', 2), objection: 'AI content sounds robotic.', response: 'Generic AI content sounds robotic. Brand-trained AI content sounds like your best writer. We train on your existing high-performing content — the emails that get responses, the one-pagers that close deals, the case studies that resonate. Our customers consistently report that colleagues cannot distinguish AI-generated content from human-written content after the brand training is complete.' },
    ],
    pricingNotes: '$3,000-$8,000/month based on user count and content volume. Includes brand training, all content types, and compliance checking.',
    relatedProducts: [{ productId: pid('clearview', 2), type: 'complementary' }, { productId: pid('clearview', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('clearview', 'ace', 1), label: 'AI content platform pitch', promptText: 'Create a solution one-pager for the AI Content Engine targeting a {industry} company with {repCount} sales reps struggling with content production bottlenecks', contentType: 'solution-one-pager' },
      { id: ptid('clearview', 'ace', 2), label: 'Content velocity ROI case', promptText: 'Build an ROI business case showing content production time savings for a sales team producing {assetsPerMonth} content assets per month', contentType: 'roi-business-case' },
      { id: ptid('clearview', 'ace', 3), label: 'Generic AI comparison card', promptText: 'Create a battle card comparing Clearview AI Content Engine against ChatGPT and Jasper for sales content generation', contentType: 'battle-card' },
      { id: ptid('clearview', 'ace', 4), label: 'VP Sales outreach email', promptText: 'Draft a 3-email outbound sequence targeting VP of Sales at B2B companies frustrated with slow content production from marketing', contentType: 'outbound-email-sequence' },
      { id: ptid('clearview', 'ace', 5), label: 'DataForge case study', promptText: 'Create a customer success story based on DataForge achieving 73% reduction in content production time and 28% higher win rate', contentType: 'case-study' },
    ],
    contentGeneratedCount: 52,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [
      { id: cmid('clearview', 'ace', 1), competitorName: 'Jasper AI', theirEquivalentProduct: 'Jasper for Business', howWeWin: ['Brand-trained vs. generic AI', 'Sales-specific templates and workflows', 'Built-in compliance checking', 'Prospect personalization with deal context'], howTheyWin: ['Broader marketing use cases', 'Larger template library', 'Better-known brand', 'Lower entry price point'], talkTrack: 'Jasper is a great general-purpose AI writer. But sales content needs to be accurate about your products, honest about your competitors, and personalized to each prospect. That requires brand training that Jasper does not offer.', winRate: 71 },
    ],
  },
  {
    id: pid('clearview', 2), name: 'Sales Enablement Suite', shortDescription: 'Battle cards, one-pagers, and email sequences personalized for every deal',
    fullDescription: 'The Sales Enablement Suite provides sales reps with ready-to-use competitive battle cards, product one-pagers, and multi-touch email sequences that can be personalized and deployed in minutes. New reps get immediate access to proven messaging, and experienced reps can customize content for specific deal situations without waiting for marketing.',
    features: [
      { id: fid('clearview', 'ses', 1), name: 'Competitive Battle Cards', description: 'Always-current battle cards for every competitor with win/loss data, talk tracks, trap-setting questions, and landmine responses. Updated automatically as competitive intel changes.' },
      { id: fid('clearview', 'ses', 2), name: 'Product One-Pagers', description: 'Persona-specific one-pagers for every product. CFO version leads with ROI, IT Director version leads with architecture, end-user version leads with workflow improvement.' },
      { id: fid('clearview', 'ses', 3), name: 'Email Sequence Builder', description: 'Pre-built multi-touch email sequences for prospecting, post-demo follow-up, competitive displacement, and renewal. A/B variants included for testing.' },
      { id: fid('clearview', 'ses', 4), name: 'Meeting Prep Module', description: 'Automated meeting prep sheets with prospect intelligence, suggested talking points, relevant case studies, and competitive context based on the prospect\'s tech stack and industry.' },
    ],
    benefits: ['Reduce new rep ramp time by 40-50%', 'Equip every rep with competitive intelligence instantly', 'Standardize messaging while allowing personalization', 'Eliminate "I couldn\'t find the right content" as a deal blocker'],
    idealUseCase: 'B2B sales teams with 5+ reps who need consistent, competitive, and persona-relevant content available on demand.',
    targetPersonas: ['VP of Sales', 'Sales Enablement Manager', 'Sales Director', 'Revenue Operations'],
    targetIndustries: ['B2B SaaS', 'Technology', 'Professional Services'],
    differentiators: ['Auto-updating battle cards vs. static PDFs', 'Persona-specific content variants', 'Meeting prep with prospect intelligence', 'Integrated with AI Content Engine for custom generation'],
    proofPoints: ['Meridian SaaS: 45% faster new rep ramp, first-year quota attainment improved from 62% to 84%', 'Average customer reduces "content search time" by 3.2 hours per rep per week'],
    objections: [
      { id: oid('clearview', 'ses', 1), objection: 'We have content on our intranet.', response: 'Having content and having reps use content are different problems. Our customers report that reps spend 3+ hours per week searching for the right content — and often give up and use outdated materials. The Sales Enablement Suite surfaces the right content for the specific deal context automatically.' },
    ],
    pricingNotes: '$2,000-$5,500/month based on rep count.',
    relatedProducts: [{ productId: pid('clearview', 1), type: 'complementary' }, { productId: pid('clearview', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('clearview', 'ses', 1), label: 'Enablement ROI pitch', promptText: 'Create a solution one-pager showing how the Sales Enablement Suite reduces new rep ramp time for a company hiring {newReps} reps this year', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 28,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
  {
    id: pid('clearview', 3), name: 'Brand Compliance Dashboard', shortDescription: 'Voice scoring, terminology enforcement, and approval workflows for sales content',
    fullDescription: 'The Brand Compliance Dashboard monitors every piece of sales content against your brand guidelines in real time. AI voice scoring evaluates tone and style consistency, terminology enforcement catches banned words and outdated product names, and configurable approval workflows route high-stakes content for review without slowing down routine content production.',
    features: [
      { id: fid('clearview', 'bcd', 1), name: 'AI Voice Scoring', description: 'Scores every piece of content against your brand voice guidelines on a 0-100 scale. Provides specific feedback on tone, formality, and style consistency with suggested improvements.' },
      { id: fid('clearview', 'bcd', 2), name: 'Terminology Enforcement', description: 'Approved and banned word lists with real-time checking. Catches outdated product names, competitor references, unapproved claims, and off-brand language before content leaves the building.' },
      { id: fid('clearview', 'bcd', 3), name: 'Approval Workflows', description: 'Configurable routing rules based on content type, audience, and risk level. High-stakes content gets marketing review; routine content flows through automatically.' },
      { id: fid('clearview', 'bcd', 4), name: 'Usage Analytics', description: 'Track content adoption by rep, team, and content type. Identify which assets drive engagement and which sit unused. Measure brand compliance trends over time.' },
    ],
    benefits: ['Reduce off-brand content from 30-40% to under 5%', 'Eliminate legal risk from inaccurate competitive claims', 'Measure and improve brand consistency across the sales team', 'Reduce marketing review bottleneck by 60%+'],
    idealUseCase: 'B2B companies with 10+ sales reps producing their own content who need to maintain brand consistency and compliance without creating a marketing bottleneck.',
    targetPersonas: ['VP of Marketing', 'CMO', 'Sales Enablement Manager', 'Brand Manager'],
    targetIndustries: ['B2B SaaS', 'Financial Services', 'Healthcare Technology', 'Professional Services'],
    differentiators: ['AI voice scoring vs. manual review', 'Real-time checking vs. after-the-fact audits', 'Configurable approval routing vs. all-or-nothing review', 'Integrated with AI Content Engine for pre-compliant generation'],
    proofPoints: ['Vantage Analytics: off-brand content reduced from 38% to under 3%, legal review requests down 60%', 'Average customer achieves 95%+ brand compliance within 60 days'],
    objections: [
      { id: oid('clearview', 'bcd', 1), objection: 'Marketing already reviews everything.', response: 'That is the problem. Marketing review creates a 3-7 day bottleneck that kills deal velocity. The Brand Compliance Dashboard automates 80% of that review — catching terminology violations and voice inconsistencies instantly. Marketing only reviews the 20% of content that genuinely needs human judgment.' },
    ],
    pricingNotes: '$1,500-$4,000/month based on user count and content volume.',
    relatedProducts: [{ productId: pid('clearview', 1), type: 'complementary' }, { productId: pid('clearview', 2), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('clearview', 'bcd', 1), label: 'Brand compliance pitch', promptText: 'Create a solution one-pager for the Brand Compliance Dashboard targeting a CMO concerned about {offBrandRate}% of sales content being off-brand', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 14,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
];

// ═══════════════════════════════════════════════
// 5. CORNERSTONE CONSTRUCTION
// ═══════════════════════════════════════════════

const cornerstoneKB: KnowledgeBase = {
  companyName: 'Cornerstone Construction',
  tagline: 'Build with confidence.',
  website: 'https://www.cornerstoneconstruction.com',
  aboutUs: 'Cornerstone Construction builds project management and bid management software for commercial general contractors and specialty subcontractors. With 100 employees and a founding team of former project managers and estimators, we understand that construction profitability lives and dies in the estimate. Our platform combines automated takeoff tools, historical cost databases, and real-time project tracking to help contractors win more bids at better margins and deliver projects on time and on budget.',
  products: [
    { id: '1', name: 'Bid Management Platform', description: 'Automated quantity takeoffs, historical cost intelligence, and subcontractor management that help contractors bid faster, more accurately, and at the right margin.', keyFeatures: ['AI-assisted quantity takeoffs from plan sets', 'Historical cost database with 500,000+ data points', 'Subcontractor bid leveling and comparison', 'Margin analysis and sensitivity modeling', 'Bid calendar with deadline tracking and notifications'], pricing: '$2,500-$7,500/month' },
    { id: '2', name: 'Project Tracker', description: 'Real-time project progress tracking with change order management, photo documentation, and daily log automation for commercial construction projects.', keyFeatures: ['Real-time progress tracking against schedule and budget', 'Digital change order management with approval workflows', 'Photo documentation linked to schedule activities', 'Automated daily log generation', 'Subcontractor payment application processing'], pricing: '$2,000-$6,000/month' },
    { id: '3', name: 'Subcontractor Portal', description: 'Prequalification management, compliance tracking, and payment scheduling for managing subcontractor relationships at scale.', keyFeatures: ['Digital prequalification with auto-scoring', 'Insurance and compliance certificate tracking', 'Payment schedule management with lien waiver automation', 'Performance scoring based on project history', 'Bid invitation management'], pricing: '$1,500-$4,500/month' },
  ],
  differentiators: 'Built by construction people — our founders managed $500M+ in commercial projects before writing a line of code. Our historical cost database has 500,000+ data points from real commercial projects. We focus exclusively on commercial contractors ($5M-$100M) — not residential, not enterprise. Implementation takes 3-4 weeks, not months. Our subcontractor portal is included, not sold separately.',
  icp: {
    industries: ['Commercial General Contracting', 'Specialty Subcontracting', 'Design-Build', 'Construction Management'],
    companySize: '50-500 employees, $5M-$100M annual revenue, 10+ concurrent projects',
    personas: ['Owner/President', 'VP of Preconstruction', 'Chief Estimator', 'Project Manager', 'CFO'],
  },
  competitors: [
    { id: cid('cornerstone', 1), name: 'Manual Bidding / Spreadsheets', howWeBeatThem: 'Spreadsheet-based estimating is the number one source of bid errors in commercial construction. The average manual takeoff takes 40-60 hours per bid — our AI-assisted takeoff cuts that to 8-15 hours. More importantly, spreadsheet estimates lack historical cost validation, making it impossible to know if your unit costs are competitive. Our customers who migrate from spreadsheets report 35% faster bid production and 22% improvement in bid accuracy.' },
    { id: cid('cornerstone', 2), name: 'Procore', howWeBeatThem: 'Procore is the industry standard for project management, but it is not a bid management platform. Their estimating tools are basic, and they lack the historical cost intelligence that drives accurate pricing. More critically, Procore is priced for enterprise contractors — $10K-$50K+/year — making it cost-prohibitive for contractors under $100M. Cornerstone delivers project tracking comparable to Procore plus superior bid management at 50-70% lower total cost.' },
    { id: cid('cornerstone', 3), name: 'On-Screen Takeoff / Bluebeam', howWeBeatThem: 'On-Screen Takeoff and Bluebeam are measurement tools, not estimating platforms. They help you count and measure, but they do not provide historical cost data, margin analysis, or subcontractor bid leveling. Our AI-assisted takeoff handles measurement plus pricing in a single workflow, and the historical cost database validates every line item against 500,000+ real project data points.' },
  ],
  brandVoice: {
    tone: 'Straightforward and credible. We speak like experienced project managers — practical, no-nonsense, and focused on the bottom line. Construction people distrust slick marketing. Be direct. Use real numbers.',
    wordsToUse: ['bottom line', 'bid accuracy', 'margin protection', 'project visibility', 'field-tested', 'built for contractors'],
    wordsToAvoid: ['innovative', 'disruptive', 'game-changing', 'enterprise-grade', 'platform play', 'synergy'],
  },
  caseStudies: [
    { id: csid('cornerstone', 1), title: 'Meridian Builders: 35% Faster Bid Turnaround, $680K in Recovered Margin', content: 'Meridian Builders, a $42M commercial GC specializing in healthcare and education projects, was losing bids due to slow turnaround and margin-eroding estimating errors. Their 4-person estimating team manually produced takeoffs in spreadsheets, averaging 52 hours per bid with a 3.2% average cost variance. After deploying the Bid Management Platform, bid turnaround dropped from 14 days to 9 days — a 35% improvement. The historical cost database caught $680K in aggregate estimating errors across 28 bids in the first year — including a $210K underestimate on a medical office building that would have been a loss at completion. Win rate improved from 18% to 24% as faster, more competitive bids reached owners ahead of competitors.' },
    { id: csid('cornerstone', 2), title: 'Atlas Mechanical: Project Tracker Eliminates $340K in Change Order Leakage', content: 'Atlas Mechanical, a $28M HVAC and plumbing subcontractor, was losing money on change orders. Their project managers tracked changes on paper, and 23% of legitimate change orders were never submitted to the GC — either forgotten, poorly documented, or submitted too late. After deploying Project Tracker, digital change order capture became part of the daily workflow. In the first year, previously unsubmitted change orders were captured and billed, recovering $340K in revenue. Photo documentation linked to change orders reduced GC disputes by 61%, and average change order approval time dropped from 18 days to 7 days.' },
    { id: csid('cornerstone', 3), title: 'Pacific Construction Group: Subcontractor Portal Cuts Prequalification Time by 72%', content: 'Pacific Construction Group, a $65M general contractor managing 200+ subcontractor relationships, was spending 340 hours annually on subcontractor prequalification — collecting insurance certificates, financial statements, safety records, and references through email and phone calls. After deploying the Subcontractor Portal, prequalification became a self-service digital process. Processing time dropped by 72%, expired insurance certificates dropped from 12% of active subs to under 1%, and the auto-scoring system identified 8 subcontractors with financial risk indicators that manual review had missed. Annual labor savings: $95K. Risk mitigation value: incalculable.' },
  ],
  uploadedDocuments: [],
  logoPath: '',
  brandColor: '#D97706',
  brandGuidelines: {
    colors: { primary: '#D97706', secondary: '#92400E', accent: '#F59E0B', background: '#FFFFFF', text: '#1E293B' },
    fonts: { primary: 'Inter', secondary: 'Inter', sizes: { h1: 28, h2: 18, h3: 14, body: 11 } },
    logos: { primaryPath: '', secondaryPath: '', placement: 'top-left' },
    voice: { guidelinesText: 'Straightforward and credible. Speak like a PM. Use real numbers.', documentContent: '', approvedTerms: ['bottom line', 'bid accuracy', 'margin protection', 'field-tested', 'built for contractors'], bannedTerms: ['innovative', 'disruptive', 'game-changing', 'enterprise-grade', 'platform play'], tagline: 'Build with confidence.' },
    documentStyle: 'corporate',
  },
};

const cornerstoneProducts: ProductProfile[] = [
  {
    id: pid('cornerstone', 1), name: 'Bid Management Platform', shortDescription: 'AI-assisted takeoffs, historical cost data, and subcontractor bid leveling',
    fullDescription: 'The Bid Management Platform combines AI-assisted quantity takeoffs, a historical cost database with 500,000+ data points, and subcontractor bid leveling into a unified estimating workflow. Commercial contractors produce bids 35% faster with 22% better accuracy, winning more work at margins they can actually deliver.',
    features: [
      { id: fid('cornerstone', 'bmp', 1), name: 'AI-Assisted Takeoffs', description: 'Upload plan sets and get AI-generated quantity takeoffs in hours instead of days. The AI identifies walls, doors, fixtures, and MEP components with 94% accuracy. Human estimators review and refine rather than starting from scratch.' },
      { id: fid('cornerstone', 'bmp', 2), name: 'Historical Cost Database', description: '500,000+ cost data points from real commercial projects, normalized by region, building type, and market conditions. Every line item in your estimate is validated against actual project costs.' },
      { id: fid('cornerstone', 'bmp', 3), name: 'Subcontractor Bid Leveling', description: 'Side-by-side comparison of subcontractor bids with scope normalization. Identifies missing scope items, allowances vs. firm pricing, and terms that affect true cost. Leveling time reduced by 60%.' },
      { id: fid('cornerstone', 'bmp', 4), name: 'Margin Sensitivity Analysis', description: 'Model different scenarios — material escalation, labor rate changes, subcontractor alternatives — and see the impact on project margin in real time. Know your risk before you submit.' },
      { id: fid('cornerstone', 'bmp', 5), name: 'Bid Calendar & Pipeline', description: 'Track every opportunity from invitation through submission with deadline alerts, document management, and win/loss tracking. Never miss a bid deadline again.' },
    ],
    benefits: ['Produce bids 35% faster with fewer estimating hours', 'Improve bid accuracy by 20-25% with historical cost validation', 'Win more work with faster turnaround and competitive pricing', 'Protect margins by catching cost errors before submission'],
    idealUseCase: 'Commercial GCs and specialty subs producing 5+ bids per month who need to bid faster and more accurately while protecting margins.',
    targetPersonas: ['VP of Preconstruction', 'Chief Estimator', 'Owner/President', 'Business Development'],
    targetIndustries: ['Commercial General Contracting', 'Specialty Subcontracting', 'Design-Build'],
    differentiators: ['AI takeoffs from plan sets vs. manual measurement', '500K+ historical cost data points for price validation', 'Sub bid leveling with scope normalization built in', 'Margin sensitivity modeling before submission'],
    proofPoints: ['Meridian Builders: 35% faster bid turnaround, $680K in recovered margin from error prevention', 'Average customer produces bids 35% faster within 60 days', '94% accuracy on AI-generated quantity takeoffs'],
    objections: [
      { id: oid('cornerstone', 'bmp', 1), objection: 'We\'ve always bid in spreadsheets.', response: 'And spreadsheets have always had errors. The average commercial estimate has a 2-5% cost variance — on a $10M project, that is $200K-$500K of margin risk. Our historical cost database catches pricing errors by validating every line item against 500,000+ real project data points. Customers typically identify $100K+ in estimating errors within their first 10 bids.' },
      { id: oid('cornerstone', 'bmp', 2), objection: 'We already use On-Screen Takeoff.', response: 'On-Screen Takeoff measures quantities. It does not price them, validate them against historical costs, or help you level sub bids. Cornerstone handles the full estimating workflow — from takeoff through pricing through sub leveling through margin analysis — in a single platform.' },
    ],
    pricingNotes: '$2,500-$7,500/month based on estimator count and bid volume.',
    relatedProducts: [{ productId: pid('cornerstone', 2), type: 'complementary' }, { productId: pid('cornerstone', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('cornerstone', 'bmp', 1), label: 'Estimating accuracy pitch', promptText: 'Create a solution one-pager for the Bid Management Platform targeting a {type} contractor producing {bidsPerMonth} bids per month using spreadsheet estimates', contentType: 'solution-one-pager' },
      { id: ptid('cornerstone', 'bmp', 2), label: 'Bid error ROI case', promptText: 'Build an ROI business case showing margin protection for a contractor with {avgProjectSize} average project size and {errorRate}% historical cost variance', contentType: 'roi-business-case' },
      { id: ptid('cornerstone', 'bmp', 3), label: 'Procore comparison card', promptText: 'Create a competitive battle card comparing Cornerstone Bid Management against Procore for a mid-market commercial contractor', contentType: 'battle-card' },
      { id: ptid('cornerstone', 'bmp', 4), label: 'Estimator outreach email', promptText: 'Draft a 3-email outbound sequence targeting chief estimators at commercial GCs frustrated with slow bid turnaround and margin erosion', contentType: 'outbound-email-sequence' },
      { id: ptid('cornerstone', 'bmp', 5), label: 'Meridian Builders case study', promptText: 'Create a customer success story based on Meridian Builders achieving 35% faster bids and $680K in recovered margin', contentType: 'case-study' },
    ],
    contentGeneratedCount: 41,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [
      { id: cmid('cornerstone', 'bmp', 1), competitorName: 'Procore', theirEquivalentProduct: 'Procore Preconstruction', howWeWin: ['500K+ historical cost database they lack', 'AI-assisted takeoffs vs. basic measurement', 'Sub bid leveling with scope normalization', '50-70% lower total cost for mid-market'], howTheyWin: ['Dominant brand in construction tech', 'Broader project management features', 'Larger integration ecosystem', 'Enterprise-grade infrastructure'], talkTrack: 'Procore is the gold standard for project management, but their estimating tools are basic. If preconstruction accuracy and bid speed are your priority, Cornerstone delivers capabilities Procore does not offer — at a fraction of the price.', winRate: 62 },
    ],
  },
  {
    id: pid('cornerstone', 2), name: 'Project Tracker', shortDescription: 'Real-time progress tracking, change order management, and photo documentation',
    fullDescription: 'Project Tracker gives commercial contractors real-time visibility into every active project — schedule progress, budget status, change orders, and field documentation. Digital change order management captures and tracks every scope change, and photo documentation linked to schedule activities creates an undeniable record of progress and conditions.',
    features: [
      { id: fid('cornerstone', 'pt', 1), name: 'Schedule & Budget Dashboard', description: 'Real-time view of schedule progress vs. plan and cost vs. budget for every active project. Earned value metrics and forecasting identify problems before they become crises.' },
      { id: fid('cornerstone', 'pt', 2), name: 'Digital Change Orders', description: 'Capture, price, submit, and track change orders digitally. Photo and plan markup attachments support every change request. Average approval time reduced from 18 to 7 days.' },
      { id: fid('cornerstone', 'pt', 3), name: 'Photo Documentation', description: 'Field photos linked to schedule activities, locations, and dates. Time-stamped and GPS-tagged for dispute resolution. Unlimited storage.' },
      { id: fid('cornerstone', 'pt', 4), name: 'Daily Log Automation', description: 'Auto-generated daily logs from field activity data — weather, manpower, equipment, work completed, and safety observations. PMs review and approve instead of writing from scratch.' },
    ],
    benefits: ['Recover 100% of legitimate change orders through digital capture', 'Reduce change order disputes by 50-60% with photo documentation', 'Save PMs 5+ hours per week on reporting and documentation', 'Provide ownership with real-time project health visibility'],
    idealUseCase: 'Commercial contractors managing 5+ concurrent projects who need real-time visibility and are losing money on undocumented change orders.',
    targetPersonas: ['Project Manager', 'VP of Operations', 'Owner/President', 'Superintendent'],
    targetIndustries: ['Commercial General Contracting', 'Specialty Subcontracting', 'Design-Build'],
    differentiators: ['Change order capture integrated into daily workflow', 'Photo documentation linked to schedule activities', 'Automated daily logs from field data', 'Purpose-built for commercial contractors vs. generic PM tools'],
    proofPoints: ['Atlas Mechanical: $340K in recovered change order revenue, 61% fewer GC disputes', 'Average PM saves 5.3 hours per week on reporting', 'Change order approval time reduced from 18 to 7 days on average'],
    objections: [
      { id: oid('cornerstone', 'pt', 1), objection: 'We already use Procore.', response: 'If Procore is working for your project management, great. But are you capturing every change order? Our customers typically discover that 20-25% of legitimate changes were being missed or under-documented. Project Tracker can complement or replace Procore at significantly lower cost for mid-market contractors.' },
    ],
    pricingNotes: '$2,000-$6,000/month based on project count.',
    relatedProducts: [{ productId: pid('cornerstone', 1), type: 'complementary' }, { productId: pid('cornerstone', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('cornerstone', 'pt', 1), label: 'Change order recovery pitch', promptText: 'Create a solution one-pager for Project Tracker targeting a contractor losing money on undocumented change orders across {projectCount} active projects', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 22,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
  {
    id: pid('cornerstone', 3), name: 'Subcontractor Portal', shortDescription: 'Prequalification, compliance tracking, and payment scheduling for sub management',
    fullDescription: 'The Subcontractor Portal transforms how contractors manage their subcontractor relationships. Digital prequalification with auto-scoring replaces paper applications and phone calls. Insurance and compliance certificate tracking with expiration alerts prevents coverage gaps. Payment scheduling with automated lien waiver collection streamlines the most painful part of subcontractor administration.',
    features: [
      { id: fid('cornerstone', 'sp', 1), name: 'Digital Prequalification', description: 'Self-service prequalification application with auto-scoring based on financial health, safety record, insurance coverage, and past performance. Replaces manual paper process.' },
      { id: fid('cornerstone', 'sp', 2), name: 'Compliance Certificate Tracking', description: 'Automated tracking of insurance certificates, licenses, and certifications with expiration alerts. Ensures every active sub has current coverage.' },
      { id: fid('cornerstone', 'sp', 3), name: 'Payment Schedule Management', description: 'Digital payment application processing with automated lien waiver collection and tracking. Reduces payment processing time by 45%.' },
      { id: fid('cornerstone', 'sp', 4), name: 'Performance Scoring', description: 'Objective performance scores based on schedule adherence, quality, safety, and responsiveness across all projects. Data-driven sub selection for future bids.' },
    ],
    benefits: ['Cut prequalification processing time by 70%+', 'Eliminate expired insurance gaps across all active subs', 'Accelerate sub payment processing by 45%', 'Make data-driven subcontractor selection decisions'],
    idealUseCase: 'General contractors managing 100+ subcontractor relationships who need to streamline prequalification, maintain compliance, and make better sub selection decisions.',
    targetPersonas: ['VP of Preconstruction', 'Project Manager', 'Office Manager', 'Risk Manager'],
    targetIndustries: ['Commercial General Contracting', 'Construction Management', 'Design-Build'],
    differentiators: ['Self-service prequalification with auto-scoring', 'Integrated compliance tracking with expiration alerts', 'Performance scoring based on actual project data', 'Included with Cornerstone platform — not sold separately'],
    proofPoints: ['Pacific Construction Group: 72% reduction in prequalification time, expired insurance dropped from 12% to under 1%', 'Average customer saves 340+ hours annually on sub administration'],
    objections: [
      { id: oid('cornerstone', 'sp', 1), objection: 'Our subs won\'t fill out a digital application.', response: 'The application takes 15 minutes and can be completed on a phone. We have onboarded 12,000+ subcontractors across our customer base with a 92% completion rate. Subs actually prefer it to emailing PDFs and waiting for callbacks.' },
    ],
    pricingNotes: '$1,500-$4,500/month based on active subcontractor count. Included at no extra cost for customers on the full Cornerstone platform.',
    relatedProducts: [{ productId: pid('cornerstone', 1), type: 'complementary' }, { productId: pid('cornerstone', 2), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('cornerstone', 'sp', 1), label: 'Sub management pitch', promptText: 'Create a solution one-pager for the Subcontractor Portal targeting a GC managing {subCount} subcontractor relationships', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 11,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
];

// ═══════════════════════════════════════════════
// 6. MERIDIAN PROFESSIONAL SERVICES
// ═══════════════════════════════════════════════

const meridianKB: KnowledgeBase = {
  companyName: 'Meridian Professional Services',
  tagline: 'Automate the back office. Wow the client.',
  website: 'https://www.meridianpro.com',
  aboutUs: 'Meridian Professional Services builds practice management and client reporting software for accounting firms, consulting practices, and professional services organizations running NetSuite or similar cloud ERPs. With 40 employees and a founding team of former Big Four consultants and CPA firm partners, we understand that professional services firms are drowning in manual report preparation, inconsistent deliverables, and compliance tracking spreadsheets. Our platform automates the repetitive back-office work so your team can focus on the advisory work that clients actually value.',
  products: [
    { id: '1', name: 'Client Reporting Automation', description: 'One-click financial report generation, branded deliverable templates, and interactive data visualization that turns hours of report preparation into minutes.', keyFeatures: ['One-click financial report generation from NetSuite/ERP data', 'Branded deliverable templates with firm styling', 'Interactive data visualizations and charts', 'Automated commentary generation for standard variances', 'Client-ready PDF/Excel/web output formats'], pricing: '$2,000-$6,000/month' },
    { id: '2', name: 'Workflow Manager', description: 'Engagement tracking, deadline management, and team allocation that keeps every client engagement on track and every team member productive.', keyFeatures: ['Engagement-level time and status tracking', 'Deadline management with automated alerts', 'Team capacity planning and allocation', 'Client communication log', 'Utilization dashboards by team and individual'], pricing: '$1,500-$4,500/month' },
    { id: '3', name: 'Compliance Hub', description: 'Regulatory deadline tracking, audit trail management, and secure document management purpose-built for accounting and consulting firms.', keyFeatures: ['Regulatory deadline calendar with multi-client tracking', 'Automated audit trail for all client interactions', 'Secure document vault with version control', 'Role-based access control by engagement', 'Retention policy management with automated archiving'], pricing: '$1,200-$3,500/month' },
  ],
  differentiators: 'Built by CPAs and consultants for CPAs and consultants — not generic project management adapted for professional services. We pull data directly from NetSuite, QuickBooks, and Xero for automated report generation. Our deliverable templates produce client-ready output, not drafts that need reformatting. Compliance tracking is purpose-built for accounting regulatory requirements. Implementation includes engagement workflow mapping by former Big Four process consultants.',
  icp: {
    industries: ['Accounting Firms', 'Consulting Practices', 'Tax Advisory', 'Audit Firms', 'Financial Advisory', 'Business Consulting'],
    companySize: '20-200 employees, 50+ active clients, $3M-$50M revenue',
    personas: ['Managing Partner', 'Practice Leader', 'Engagement Manager', 'CFO/Controller', 'Operations Director'],
  },
  competitors: [
    { id: cid('meridian', 1), name: 'Manual Reporting / Spreadsheets', howWeBeatThem: 'Manual report preparation consumes 30-50% of a senior accountant\'s time — time that should be spent on advisory work billed at $200-$400/hour. Our customers who migrate from manual reporting reclaim an average of 12 hours per person per week, redirecting that capacity to higher-value billable work. The ROI is straightforward: 12 hours x $250/hour x 48 weeks = $144K per person per year in recovered capacity.' },
    { id: cid('meridian', 2), name: 'Generic Project Management Tools', howWeBeatThem: 'Tools like Monday, Asana, and Smartsheet are not designed for professional services engagements. They lack engagement-level time tracking, client reporting integration, compliance deadline management, and utilization analytics. Firms that use generic PM tools end up maintaining parallel systems for time tracking, reporting, and compliance — creating more work, not less. Meridian replaces 3-5 tools with one purpose-built platform.' },
    { id: cid('meridian', 3), name: 'Practice Management Software (CCH, Thomson)', howWeBeatThem: 'Legacy practice management platforms from CCH Axcess and Thomson Reuters are monolithic, expensive, and difficult to customize. They were designed for large national firms, not growing mid-market practices. Monthly costs run $300-$500/user with 6-12 month implementations. Meridian delivers modern, cloud-native practice management at 40-60% lower cost with 4-6 week implementation and a user interface that staff actually enjoy using.' },
  ],
  brandVoice: {
    tone: 'Professional, warm, and knowledgeable. We speak like a trusted advisor — confident but approachable. Use the language of professional services: engagements, utilization, realization, client deliverables. Avoid the cold, corporate tone that firms are trying to move away from.',
    wordsToUse: ['client experience', 'advisory capacity', 'engagement excellence', 'practice intelligence', 'deliverable quality', 'utilization', 'realization rate'],
    wordsToAvoid: ['disrupt', 'hack', 'crush it', 'grind', 'unicorn', 'synergy', 'leverage'],
  },
  caseStudies: [
    { id: csid('meridian', 1), title: 'Cascade Accounting Group: Report Automation Recovers $890K in Billable Capacity', content: 'Cascade Accounting Group, a 65-person CPA firm with 280 clients, had senior accountants spending 35% of their time on manual report preparation — pulling data from NetSuite, formatting spreadsheets, building charts, and assembling branded deliverables. At average billing rates of $275/hour, this represented $890K in annual capacity consumed by non-advisory work. After deploying Client Reporting Automation, monthly financial report packages that took 4-6 hours to prepare were produced in 22 minutes. The 35% of senior capacity previously consumed by reporting dropped to 6%, freeing $890K in billable capacity that the firm redirected to advisory engagements — resulting in a $640K increase in advisory revenue in the first year.' },
    { id: csid('meridian', 2), title: 'Sterling Advisors: Workflow Manager Improves Utilization from 62% to 78%', content: 'Sterling Advisors, a 35-person management consulting firm, had no centralized visibility into engagement status, team allocation, or utilization. Partners made staffing decisions based on hallway conversations, resulting in 62% average utilization (industry benchmark: 75%+). After deploying Workflow Manager, real-time utilization dashboards exposed staffing imbalances — some consultants at 90%+ while others sat at 45%. The team allocation module enabled proactive rebalancing, and utilization improved from 62% to 78% within 6 months. At an average billing rate of $325/hour, the 16-point utilization improvement generated $1.1M in additional annual revenue.' },
    { id: csid('meridian', 3), title: 'Pacific Tax Partners: Compliance Hub Prevents $150K in Late Filing Penalties', content: 'Pacific Tax Partners, a 45-person tax advisory firm managing 420 client entities, was tracking regulatory deadlines across 12 separate spreadsheets maintained by different team members. In the prior year, 3 client filings were submitted late, resulting in $150K in combined penalties and a damaged client relationship that led to one client departure ($85K annual fees). After deploying Compliance Hub, all regulatory deadlines were consolidated into a single calendar with automated alerts at 30, 14, and 7 days. In the first full year on the platform, zero deadlines were missed. The document vault with version control also eliminated a recurring issue where team members worked on outdated versions of client documents.' },
  ],
  uploadedDocuments: [],
  logoPath: '',
  brandColor: '#0F766E',
  brandGuidelines: {
    colors: { primary: '#0F766E', secondary: '#134E4A', accent: '#14B8A6', background: '#FFFFFF', text: '#1E293B' },
    fonts: { primary: 'Inter', secondary: 'Inter', sizes: { h1: 28, h2: 18, h3: 14, body: 11 } },
    logos: { primaryPath: '', secondaryPath: '', placement: 'top-left' },
    voice: { guidelinesText: 'Professional and warm. Speak like a trusted advisor. Use professional services language.', documentContent: '', approvedTerms: ['client experience', 'advisory capacity', 'engagement excellence', 'practice intelligence', 'deliverable quality'], bannedTerms: ['disrupt', 'hack', 'crush it', 'grind', 'unicorn', 'synergy'], tagline: 'Automate the back office. Wow the client.' },
    documentStyle: 'modern',
  },
};

const meridianProducts: ProductProfile[] = [
  {
    id: pid('meridian', 1), name: 'Client Reporting Automation', shortDescription: 'One-click financial reports, branded deliverables, and data visualization',
    fullDescription: 'Client Reporting Automation transforms the most time-consuming task in professional services — monthly and quarterly report preparation — from hours of manual work into a one-click process. The platform pulls live data from NetSuite, QuickBooks, and Xero, applies your firm\'s branded templates, generates standard variance commentary, and produces client-ready deliverables in PDF, Excel, and interactive web formats. Senior professionals reclaim 30-50% of their capacity for advisory work that clients value and firms bill at premium rates.',
    features: [
      { id: fid('meridian', 'cra', 1), name: 'One-Click Report Generation', description: 'Pull live data from NetSuite/QuickBooks/Xero, apply branded templates, and produce client-ready financial packages in under 30 minutes — down from 4-6 hours of manual preparation.' },
      { id: fid('meridian', 'cra', 2), name: 'Branded Deliverable Templates', description: 'Professional, customizable templates that reflect your firm\'s branding. Cover pages, table of contents, charts, and narrative sections configured once and applied consistently across all clients.' },
      { id: fid('meridian', 'cra', 3), name: 'Interactive Data Visualization', description: 'Automatically generated charts, trend lines, and variance highlights that make financial data accessible. Interactive web versions let clients explore their own data.' },
      { id: fid('meridian', 'cra', 4), name: 'Automated Commentary', description: 'AI-generated variance commentary for standard fluctuations — revenue changes, expense variances, balance sheet movements. Staff review and customize rather than writing from scratch.' },
      { id: fid('meridian', 'cra', 5), name: 'Multi-Format Output', description: 'Produce identical reports in PDF (for formal delivery), Excel (for detailed analysis), and interactive web (for client self-service). One source, three formats, zero reformatting.' },
    ],
    benefits: ['Reclaim 30-50% of senior professional capacity for advisory work', 'Produce consistent, branded deliverables across all clients', 'Reduce report preparation from 4-6 hours to under 30 minutes', 'Impress clients with interactive visualizations and professional presentation'],
    idealUseCase: 'Accounting and consulting firms preparing 50+ client reports per month where senior professionals spend 30%+ of their time on manual report preparation instead of advisory work.',
    targetPersonas: ['Managing Partner', 'Practice Leader', 'Engagement Manager', 'Senior Accountant'],
    targetIndustries: ['Accounting Firms', 'Financial Advisory', 'Business Consulting', 'Tax Advisory'],
    differentiators: ['Live ERP data pull vs. manual data export', 'Firm-branded templates with automatic styling', 'AI-generated variance commentary', 'Three output formats from one source'],
    proofPoints: ['Cascade Accounting Group: $890K in billable capacity recovered, $640K advisory revenue increase', 'Average report preparation time reduced from 4.7 hours to 22 minutes', 'Customers report 94% of automated reports require minimal editing'],
    objections: [
      { id: oid('meridian', 'cra', 1), objection: 'Our clients expect custom reports.', response: 'They do get custom reports. Every report is generated from their specific financial data with client-specific templates, commentary, and benchmarks. The automation eliminates the manual data pulling, formatting, and chart building — not the customization. Your staff spends their time on the narrative and advisory insights that make your reports valuable, not on copy-pasting numbers into Excel.' },
      { id: oid('meridian', 'cra', 2), objection: 'We already have report templates.', response: 'Templates standardize the format. They do not automate the data pulling, chart generation, or variance commentary that consume 80% of report preparation time. Our customers who had existing templates still saw report prep time drop from 4+ hours to under 30 minutes because the automation handles the data-intensive work, not just the formatting.' },
    ],
    pricingNotes: '$2,000-$6,000/month based on client count and report volume. Includes all ERP connectors, template customization, and ongoing support.',
    relatedProducts: [{ productId: pid('meridian', 2), type: 'complementary' }, { productId: pid('meridian', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('meridian', 'cra', 1), label: 'Report automation pitch', promptText: 'Create a solution one-pager for Client Reporting Automation targeting a {size}-person accounting firm preparing {reportCount} client reports per month', contentType: 'solution-one-pager' },
      { id: ptid('meridian', 'cra', 2), label: 'Advisory capacity ROI case', promptText: 'Build an ROI business case showing billable capacity recovery for a firm where senior accountants billing at ${rate}/hour spend {pct}% of time on manual report preparation', contentType: 'roi-business-case' },
      { id: ptid('meridian', 'cra', 3), label: 'Legacy PM comparison card', promptText: 'Create a competitive battle card comparing Meridian against CCH Axcess and Thomson Reuters practice management for a mid-market accounting firm', contentType: 'battle-card' },
      { id: ptid('meridian', 'cra', 4), label: 'Managing partner email', promptText: 'Draft a 3-email outbound sequence targeting managing partners at CPA firms frustrated with senior staff spending too much time on report preparation', contentType: 'outbound-email-sequence' },
      { id: ptid('meridian', 'cra', 5), label: 'Cascade AG case study', promptText: 'Create a customer success story based on Cascade Accounting Group recovering $890K in billable capacity through report automation', contentType: 'case-study' },
    ],
    contentGeneratedCount: 36,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [
      { id: cmid('meridian', 'cra', 1), competitorName: 'Manual Reporting / Spreadsheets', theirEquivalentProduct: 'Excel-based report preparation', howWeWin: ['One-click generation vs. 4-6 hour manual process', 'Live ERP data pull vs. manual export', 'Automated variance commentary', 'Interactive client-facing visualizations'], howTheyWin: ['Zero cost', 'Total flexibility', 'No implementation', 'Staff already knows Excel'], talkTrack: 'Every hour a senior accountant spends formatting spreadsheets is an hour they are not spending on advisory work billed at $250-$400/hour. Report automation pays for itself by freeing your most expensive resource for your most valuable work.', winRate: 82 },
    ],
  },
  {
    id: pid('meridian', 2), name: 'Workflow Manager', shortDescription: 'Engagement tracking, deadline management, and team allocation for professional services',
    fullDescription: 'Workflow Manager provides the engagement-level visibility that professional services firms need to run efficiently. Track every engagement from kick-off through delivery, manage deadlines with automated alerts, and allocate team capacity to maximize utilization and avoid burnout. Real-time utilization dashboards replace the guesswork that leads to overworked senior staff and underutilized junior staff.',
    features: [
      { id: fid('meridian', 'wm', 1), name: 'Engagement Dashboard', description: 'Centralized view of every active engagement — status, budget vs. actual, team allocation, and upcoming milestones. Partners see their entire book of business at a glance.' },
      { id: fid('meridian', 'wm', 2), name: 'Deadline Management', description: 'Multi-client deadline calendar with automated alerts at configurable intervals. Never miss a filing deadline, deliverable due date, or client meeting again.' },
      { id: fid('meridian', 'wm', 3), name: 'Team Allocation', description: 'Visual capacity planning that shows who is available, who is overloaded, and where the staffing gaps are. Make data-driven assignment decisions instead of hallway conversations.' },
      { id: fid('meridian', 'wm', 4), name: 'Utilization Analytics', description: 'Real-time utilization by person, team, and practice area. Benchmark against targets, identify trends, and take action before utilization problems become revenue problems.' },
    ],
    benefits: ['Improve utilization 10-20 points toward industry benchmarks', 'Prevent missed deadlines and the penalties they cause', 'Balance team workload to reduce burnout and improve retention', 'Give partners real-time visibility into engagement health'],
    idealUseCase: 'Professional services firms with 20+ staff where utilization is below industry benchmarks, deadlines are managed in spreadsheets, and partners lack visibility into team capacity.',
    targetPersonas: ['Managing Partner', 'Operations Director', 'Practice Leader', 'HR Director'],
    targetIndustries: ['Accounting Firms', 'Consulting Practices', 'Financial Advisory', 'Business Consulting'],
    differentiators: ['Engagement-level tracking vs. generic project tasks', 'Multi-client deadline calendar with compliance focus', 'Utilization analytics built for professional services billing model', 'Team allocation with capacity visualization'],
    proofPoints: ['Sterling Advisors: utilization improved from 62% to 78%, $1.1M additional annual revenue', 'Average customer improves utilization by 14 percentage points within 6 months'],
    objections: [
      { id: oid('meridian', 'wm', 1), objection: 'We use Monday/Asana for this.', response: 'Generic PM tools track tasks. They do not track engagements, utilization, realization, or multi-client deadlines in the way professional services firms need. Our customers who switch from generic PM tools report that Workflow Manager replaced 3-4 separate tools (PM tool, time tracking, deadline spreadsheets, utilization reports) with a single purpose-built platform.' },
    ],
    pricingNotes: '$1,500-$4,500/month based on user count.',
    relatedProducts: [{ productId: pid('meridian', 1), type: 'complementary' }, { productId: pid('meridian', 3), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('meridian', 'wm', 1), label: 'Utilization improvement pitch', promptText: 'Create a solution one-pager for Workflow Manager targeting a firm with {currentUtil}% utilization vs. {targetUtil}% target', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 18,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
  {
    id: pid('meridian', 3), name: 'Compliance Hub', shortDescription: 'Regulatory tracking, audit trails, and document management for professional services',
    fullDescription: 'Compliance Hub consolidates regulatory deadline tracking, audit trail management, and secure document storage into a single platform purpose-built for accounting and consulting firms. Multi-client deadline calendars with automated alerts prevent missed filings, comprehensive audit trails satisfy regulatory requirements, and secure document vaults with version control eliminate the chaos of shared drives and email attachments.',
    features: [
      { id: fid('meridian', 'ch', 1), name: 'Regulatory Deadline Calendar', description: 'Consolidated calendar tracking filing deadlines across all client entities. Multi-jurisdiction support with automated alerts at 30, 14, and 7 days. Extension tracking and filing confirmation.' },
      { id: fid('meridian', 'ch', 2), name: 'Audit Trail', description: 'Comprehensive, tamper-proof audit trail for all client interactions, document access, and deliverable changes. Satisfies regulatory examination requirements without manual log maintenance.' },
      { id: fid('meridian', 'ch', 3), name: 'Secure Document Vault', description: 'Encrypted document storage with version control, retention policy management, and role-based access control. Replaces shared drives and email attachments with a governed repository.' },
      { id: fid('meridian', 'ch', 4), name: 'Retention Management', description: 'Automated retention policy enforcement with configurable rules by document type and engagement. Automated archiving and disposition when retention periods expire.' },
    ],
    benefits: ['Prevent late filing penalties through automated deadline tracking', 'Satisfy regulatory audit requirements with automated audit trails', 'Eliminate version control chaos with governed document management', 'Reduce compliance administration overhead by 50-60%'],
    idealUseCase: 'Accounting and tax firms managing regulatory deadlines across 50+ client entities who need to prevent missed filings and satisfy audit trail requirements without manual tracking.',
    targetPersonas: ['Managing Partner', 'Tax Partner', 'Compliance Manager', 'Operations Director'],
    targetIndustries: ['Accounting Firms', 'Tax Advisory', 'Audit Firms', 'Financial Advisory'],
    differentiators: ['Multi-client regulatory calendar vs. generic deadline tracking', 'Purpose-built audit trail for professional services compliance', 'Integrated document vault with retention management', 'Automated alerts prevent missed deadlines proactively'],
    proofPoints: ['Pacific Tax Partners: zero missed deadlines in first year (vs. 3 in prior year), prevented $150K in penalties', 'Average customer eliminates 12+ separate deadline tracking spreadsheets'],
    objections: [
      { id: oid('meridian', 'ch', 1), objection: 'We track deadlines in spreadsheets.', response: 'Spreadsheet-based deadline tracking depends entirely on the person who maintains it. When that person is out sick, on vacation, or leaves the firm, deadlines get missed. Our customers who switch from spreadsheets to Compliance Hub eliminate single-point-of-failure risk entirely. Pacific Tax Partners prevented $150K in late filing penalties in their first year on the platform.' },
    ],
    pricingNotes: '$1,200-$3,500/month based on client entity count.',
    relatedProducts: [{ productId: pid('meridian', 1), type: 'complementary' }, { productId: pid('meridian', 2), type: 'complementary' }],
    status: 'active',
    promptTemplates: [
      { id: ptid('meridian', 'ch', 1), label: 'Compliance risk pitch', promptText: 'Create a solution one-pager for Compliance Hub targeting a firm managing {entityCount} client entities with deadline tracking in {trackingMethod}', contentType: 'solution-one-pager' },
    ],
    contentGeneratedCount: 9,
    lastUpdated: NOW,
    createdAt: CREATED,
    extractionSources: [],
    competitorMappings: [],
  },
];

// ═══════════════════════════════════════════════
// DEMO_COMPANIES — Master Array
// ═══════════════════════════════════════════════

export const DEMO_COMPANIES: DemoCompany[] = [
  {
    id: 'apex-distribution',
    knowledgeBase: apexKB,
    products: apexProducts,
    brandGuidelines: apexKB.brandGuidelines!,
    employeeCount: 150,
    industry: 'Industrial Distribution',
    accentColor: '#3B82F6',
  },
  {
    id: 'pinnacle-manufacturing',
    knowledgeBase: pinnacleKB,
    products: pinnacleProducts,
    brandGuidelines: pinnacleKB.brandGuidelines!,
    employeeCount: 200,
    industry: 'Metal Fabrication / Manufacturing',
    accentColor: '#EF4444',
  },
  {
    id: 'summit-staffing',
    knowledgeBase: summitKB,
    products: summitProducts,
    brandGuidelines: summitKB.brandGuidelines!,
    employeeCount: 75,
    industry: 'Workforce Solutions / Staffing',
    accentColor: '#8B5CF6',
  },
  {
    id: 'clearview-technology',
    knowledgeBase: clearviewKB,
    products: clearviewProducts,
    brandGuidelines: clearviewKB.brandGuidelines!,
    employeeCount: 50,
    industry: 'B2B SaaS',
    accentColor: '#10B981',
  },
  {
    id: 'cornerstone-construction',
    knowledgeBase: cornerstoneKB,
    products: cornerstoneProducts,
    brandGuidelines: cornerstoneKB.brandGuidelines!,
    employeeCount: 100,
    industry: 'Commercial Construction',
    accentColor: '#F59E0B',
  },
  {
    id: 'meridian-professional',
    knowledgeBase: meridianKB,
    products: meridianProducts,
    brandGuidelines: meridianKB.brandGuidelines!,
    employeeCount: 40,
    industry: 'Accounting / Consulting',
    accentColor: '#14B8A6',
  },
];

// ═══════════════════════════════════════════════
// DEMO_COMPANY_CARDS — Summary info for card display
// ═══════════════════════════════════════════════

export const DEMO_COMPANY_CARDS: DemoCompanyCard[] = DEMO_COMPANIES.map((c) => ({
  id: c.id,
  name: c.knowledgeBase.companyName,
  industry: c.industry,
  tagline: c.knowledgeBase.tagline,
  employeeCount: c.employeeCount,
  accentColor: c.accentColor,
}));

// ═══════════════════════════════════════════════
// loadDemoCompany — Returns full KB for a company by ID
// ═══════════════════════════════════════════════

export function loadDemoCompany(id: string): DemoCompany | undefined {
  return DEMO_COMPANIES.find((c) => c.id === id);
}

// ═══════════════════════════════════════════════
// Backward compatibility — default demo exports
// These use Apex Distribution as the default demo company
// so existing demo route continues to work unchanged.
// ═══════════════════════════════════════════════

export const DEMO_KNOWLEDGE_BASE: KnowledgeBase = apexKB;

export const DEMO_PRODUCTS: ProductProfile[] = apexProducts;

// Minimal demo history for backward compatibility
export const DEMO_HISTORY: HistoryItem[] = [
  {
    id: 'demo-hist-001',
    contentType: 'solution-one-pager',
    prospect: {
      companyName: 'Great Lakes Industrial Supply',
      industry: 'Industrial Distribution',
      companySize: '120 employees',
      techStack: 'Sage 100, manual warehouse processes',
      painPoints: 'High pick error rates, manual paper-based picking, no real-time inventory visibility',
    },
    additionalContext: 'Currently experiencing 4.2% pick error rate costing $360K annually',
    toneLevel: 5,
    sections: [
      {
        id: 's1',
        title: 'The Challenge',
        content: 'Great Lakes Industrial Supply manages 12,000 SKUs across two warehouses using paper pick tickets and visual bin location memory. Pick errors run at 4.2% — costing $360K annually in mis-ships, returns processing, and customer credits. Every error erodes margin and risks the customer relationships that took years to build.',
      },
      {
        id: 's2',
        title: 'The Apex Solution',
        content: 'The Apex Warehouse Management Suite replaces paper-based picking with barcode-driven, AI-optimized warehouse execution. Directed put-away places inventory in optimal locations. Wave picking groups orders for maximum efficiency. Real-time dashboards give managers visibility into every pick, pack, and ship operation.',
      },
      {
        id: 's3',
        title: 'Expected Outcomes',
        content: 'Based on results with comparable distributors, Great Lakes can expect: pick error reduction from 4.2% to under 0.25% (94% improvement), warehouse throughput increase of 35-40%, and first-year savings of $300K-$350K. The platform typically pays for itself within 90 days.',
      },
    ],
    generatedAt: '2026-03-25T14:30:00.000Z',
    generatedBy: 'admin',
    scores: {
      clarity: 92,
      differentiation: 88,
      proof: 95,
      callToAction: 78,
      overall: 88,
      tips: {
        callToAction: 'Add a specific next step — suggest a warehouse walk-through or ROI workshop',
      },
    },
  },
  {
    id: 'demo-hist-002',
    contentType: 'battle-card',
    prospect: {
      companyName: 'Mountain States Plumbing Supply',
      industry: 'Plumbing Distribution',
      companySize: '200 employees',
      techStack: 'Sage 100, ScanForce',
      painPoints: 'ScanForce limitations, manual reconciliation, multi-location inventory sync issues',
    },
    additionalContext: 'Currently using ScanForce but hitting limitations at 8 branch locations',
    toneLevel: 7,
    sections: [
      {
        id: 's1',
        title: 'Competitive Overview: Apex vs. ScanForce',
        content: 'ScanForce is a barcode scanning bolt-on for Sage 100. Apex is a complete warehouse execution platform. This distinction matters when operations scale beyond a single warehouse.',
      },
      {
        id: 's2',
        title: 'Where We Win',
        content: 'Full warehouse execution (put-away, wave picking, cycle counting) vs. scanning only. Real-time bi-directional ERP sync vs. batch updates. AI demand forecasting and ABC analysis. Multi-warehouse support with centralized visibility. Flat-rate pricing vs. per-device licensing.',
      },
      {
        id: 's3',
        title: 'Where They Compete',
        content: 'Lower initial price point for single-warehouse operations. Tighter native Sage 100 integration for basic scanning workflows. Simpler for operations under 2,000 SKUs.',
      },
      {
        id: 's4',
        title: 'Recommended Talk Track',
        content: 'ScanForce was the right choice when you were a single-warehouse operation. But at 8 locations with 15,000+ SKUs, you need put-away optimization, wave picking, and real-time multi-warehouse visibility that ScanForce was not designed to provide. Our customers who switch from ScanForce see a 40-60% throughput improvement because we optimize the entire warehouse workflow, not just the scanning step.',
      },
    ],
    generatedAt: '2026-03-24T09:15:00.000Z',
    generatedBy: 'admin',
    scores: {
      clarity: 94,
      differentiation: 96,
      proof: 82,
      callToAction: 72,
      overall: 86,
      tips: {
        proof: 'Add specific customer switch stories from ScanForce to Apex with metrics',
        callToAction: 'Include a suggested demo flow for ScanForce displacement deals',
      },
    },
  },
];

// Minimal demo library for backward compatibility
export const DEMO_LIBRARY: LibraryItem[] = [
  {
    id: 'demo-lib-001',
    contentType: 'solution-one-pager',
    prospect: DEMO_HISTORY[0].prospect,
    sections: DEMO_HISTORY[0].sections,
    sharedBy: 'admin',
    sharedAt: '2026-03-25T15:00:00.000Z',
    tags: ['distribution', 'warehouse', 'pick-accuracy'],
    pinned: true,
    scores: DEMO_HISTORY[0].scores,
  },
  {
    id: 'demo-lib-002',
    contentType: 'battle-card',
    prospect: DEMO_HISTORY[1].prospect,
    sections: DEMO_HISTORY[1].sections,
    sharedBy: 'admin',
    sharedAt: '2026-03-24T10:00:00.000Z',
    tags: ['competitive', 'scanforce', 'displacement'],
    pinned: false,
    scores: DEMO_HISTORY[1].scores,
  },
];
