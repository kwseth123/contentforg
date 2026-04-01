import {
  KnowledgeBase,
  HistoryItem,
  LibraryItem,
  ProductProfile,
} from './types';

// ═══════════════════════════════════════════════
// Demo Knowledge Base — Apex Distribution Solutions
// ═══════════════════════════════════════════════

export const DEMO_KNOWLEDGE_BASE: KnowledgeBase = {
  companyName: 'Apex Distribution Solutions',
  tagline: 'Streamlining Industrial Distribution for the Modern Supply Chain',
  website: 'https://www.apexdistribution.com',
  aboutUs:
    'Apex Distribution Solutions is a purpose-built technology platform for mid-market industrial distributors. Founded in 2018 by former distribution operations leaders, Apex combines cloud-native warehouse management, AI-powered route optimization, and automated EDI processing into a unified platform that deploys in 6-8 weeks. We serve over 340 distribution companies across North America, helping them achieve operational excellence and measurable supply chain velocity.',
  products: [
    {
      id: '1',
      name: 'ApexFlow WMS',
      description:
        'Cloud-based warehouse management system designed specifically for industrial distributors. ApexFlow digitizes every step from receiving to shipping with real-time visibility, automated workflows, and mobile-first interfaces that warehouse teams adopt in days.',
      keyFeatures: [
        'Real-time inventory tracking',
        'Automated pick-pack-ship',
        'Multi-warehouse support',
        'Barcode/RFID integration',
      ],
      pricing: '$2,500-8,000/month based on warehouse count',
    },
    {
      id: '2',
      name: 'ApexRoute Optimizer',
      description:
        'AI-powered delivery route planning and fleet management platform. ApexRoute uses machine learning to optimize delivery sequences, reduce fuel costs, and meet customer delivery windows — while giving dispatchers real-time GPS visibility across the entire fleet.',
      keyFeatures: [
        'Dynamic route optimization',
        'Real-time GPS tracking',
        'Fuel cost reduction',
        'Customer delivery windows',
      ],
      pricing: '$1,200-4,000/month based on fleet size',
    },
    {
      id: '3',
      name: 'ApexConnect EDI',
      description:
        'Electronic data interchange platform purpose-built for distribution trading partner networks. ApexConnect automates purchase order processing, invoice matching, and compliance reporting across 850+ pre-built trading partner connections.',
      keyFeatures: [
        '850+ trading partner connections',
        'Automated PO processing',
        'Invoice matching',
        'Compliance reporting',
      ],
      pricing: '$800-2,500/month based on transaction volume',
    },
  ],
  differentiators:
    'Purpose-built for industrial distributors unlike generic ERP. 98.7% uptime SLA. Implementation in 6-8 weeks vs 6-12 months for competitors. Dedicated distribution industry success team.',
  icp: {
    industries: [
      'Industrial Distribution',
      'Wholesale Distribution',
      'Building Materials',
      'Electrical Supply',
      'Plumbing Supply',
      'HVAC Distribution',
    ],
    companySize: '50-500 employees, $10M-$200M revenue',
    personas: [
      'VP of Operations',
      'Supply Chain Director',
      'Warehouse Manager',
      'CFO',
      'IT Director',
    ],
  },
  competitors: [
    {
      id: '1',
      name: 'Epicor Prophet 21',
      howWeBeatThem:
        'Epicor requires 6-12 month implementations and heavy customization. Our cloud-native platform deploys in 6-8 weeks. They charge $50K+ for customization; we include industry-specific workflows out of the box.',
    },
    {
      id: '2',
      name: 'Infor CloudSuite Distribution',
      howWeBeatThem:
        'Infor is enterprise-focused and overbuilt for mid-market. Pricing is 3-4x ours. Their UI requires extensive training. We offer intuitive interfaces that warehouse teams adopt in days, not months.',
    },
    {
      id: '3',
      name: 'NetSuite Distribution',
      howWeBeatThem:
        'NetSuite is a generic ERP that bolts on distribution features. Lacks deep warehouse management and route optimization. Our purpose-built tools outperform in pick accuracy (99.8% vs 97%), route efficiency (18% fuel savings), and EDI automation.',
    },
    {
      id: '4',
      name: 'SAP Business One',
      howWeBeatThem:
        'SAP B1 targets manufacturing, not distribution. Implementation costs $100K+. No native route optimization or advanced WMS. We deliver 3x the distribution-specific functionality at 40% of the cost.',
    },
    {
      id: '5',
      name: 'Acumatica Distribution',
      howWeBeatThem:
        'Acumatica has a strong platform but lacks deep distribution workflows. No built-in route optimization. Their partner-dependent model means inconsistent implementation quality. We own the full stack and support experience.',
    },
  ],
  brandVoice: {
    tone: 'Professional, confident, results-driven. We speak as distribution industry experts. No generic SaaS language.',
    wordsToUse: [
      'streamline',
      'purpose-built',
      'distribution-first',
      'operational excellence',
      'supply chain velocity',
      'pick accuracy',
      'fill rate',
      'warehouse throughput',
    ],
    wordsToAvoid: [
      'disrupt',
      'revolutionary',
      'game-changer',
      'synergy',
      'leverage',
      'best-in-class',
      'cutting-edge',
    ],
  },
  caseStudies: [
    {
      id: '1',
      title: 'Midwest Fastener Co — 340% ROI in 14 Months',
      content:
        'Midwest Fastener, a $45M industrial fastener distributor with 3 warehouses, was struggling with 94% pick accuracy and 12% order error rates. After implementing ApexFlow WMS, they achieved 99.6% pick accuracy, reduced order errors by 89%, and saw a 340% ROI within 14 months. Warehouse throughput increased 42% without adding staff.',
    },
    {
      id: '2',
      title: 'Pacific Electrical Supply — $1.2M Annual Savings',
      content:
        'Pacific Electrical Supply operates 8 branches across the West Coast. Route inefficiency and manual EDI processing cost them $1.2M annually. ApexRoute Optimizer reduced fuel costs by 22% and delivery time by 31%. ApexConnect EDI automated 94% of their PO processing, eliminating 3 FTE positions worth of manual data entry.',
    },
  ],
  uploadedDocuments: [],
  logoPath: '/uploads/demo-logo.svg',
  brandColor: '#1e40af',
  brandGuidelines: {
    colors: {
      primary: '#1e40af',
      secondary: '#059669',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1e293b',
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Inter',
      sizes: { h1: 28, h2: 18, h3: 14, body: 11 },
    },
    logos: {
      primaryPath: '/uploads/demo-logo.svg',
      secondaryPath: '',
      placement: 'top-left' as const,
    },
    voice: {
      guidelinesText:
        'Apex speaks with authority on distribution operations. We use specific metrics and outcomes. We never use generic tech buzzwords.',
      documentContent: '',
      approvedTerms: [
        'streamline',
        'purpose-built',
        'distribution-first',
        'operational excellence',
      ],
      bannedTerms: [
        'disrupt',
        'revolutionary',
        'game-changer',
        'synergy',
        'leverage',
      ],
      tagline:
        'Streamlining Industrial Distribution for the Modern Supply Chain',
    },
    documentStyle: 'modern' as const,
  },
  settings: { expirationWarningDays: 90, expirationCriticalDays: 180 },
};

// ═══════════════════════════════════════════════
// Demo History Items
// ═══════════════════════════════════════════════

export const DEMO_HISTORY: HistoryItem[] = [
  // 1. Battle Card: Apex vs Epicor Prophet 21
  {
    id: 'demo-hist-001',
    contentType: 'battle-card',
    prospect: {
      companyName: 'General Industrial Supply Co.',
      industry: 'Industrial Distribution',
      companySize: '280 employees, $72M revenue',
      techStack: 'Epicor Prophet 21, legacy WMS, manual routing',
      painPoints: 'Slow order fulfillment, high pick error rates, expensive customization costs',
    },
    additionalContext: 'Prospect is in renewal cycle with Epicor. Decision expected Q2.',
    toneLevel: 3,
    sections: [
      {
        id: 'bc-s1',
        title: 'Competitive Overview',
        content:
          'Epicor Prophet 21 has been a staple in distribution ERP for decades, but its aging architecture and on-premise deployment model create significant friction for mid-market distributors seeking operational agility. Prophet 21 requires 6-12 month implementation timelines and $50K-$150K in customization fees before the system matches distribution-specific workflows.\n\nApex Distribution Solutions was purpose-built for the challenges mid-market distributors face today. Our cloud-native architecture deploys in 6-8 weeks with industry-specific workflows included out of the box. Where Epicor charges for every configuration change, Apex includes configurable workflows that warehouse managers can adjust without IT involvement.\n\nThe total cost of ownership comparison is stark: Epicor Prophet 21 customers typically spend $180K-$400K over three years including licenses, customization, and maintenance. Apex customers achieve equivalent or superior functionality at $90K-$200K over the same period — a 45-55% cost reduction.',
      },
      {
        id: 'bc-s2',
        title: 'Head-to-Head Feature Comparison',
        content:
          'Warehouse Management: Epicor offers basic WMS functionality that requires third-party add-ons for advanced pick-pack-ship automation. ApexFlow WMS delivers 99.8% pick accuracy out of the box with barcode and RFID integration, zone-based picking strategies, and wave management — all natively integrated.\n\nRoute Optimization: Epicor has no native route optimization capability. Customers must integrate third-party solutions at additional cost ($15K-$30K/year). ApexRoute Optimizer is fully integrated, using AI to reduce fuel costs by an average of 18% and delivery times by 27% across our customer base.\n\nEDI Processing: Epicor\'s EDI module supports approximately 200 pre-built trading partner connections and requires significant configuration for each new partner. ApexConnect EDI ships with 850+ pre-built connections and automates 94% of PO processing on average, compared to Epicor\'s 60-70% automation rate.',
      },
      {
        id: 'bc-s3',
        title: 'Key Objection Handling',
        content:
          '"We\'ve invested too much in Epicor to switch." — We understand the sunk cost concern. However, our customers who switched from Epicor saw payback in 8.3 months on average. The ongoing customization and maintenance costs with Epicor exceed the total investment in Apex within 18 months. We also offer a dedicated Epicor Migration Accelerator that handles data migration and user training.\n\n"Our team already knows Epicor." — ApexFlow\'s interface was designed with warehouse operators in mind. Average training time is 2.5 days versus the 2-4 weeks Epicor requires. Midwest Fastener Co. had their entire team productive within one week of go-live.\n\n"Epicor is a bigger company — they\'ll be around longer." — Apex is backed by $47M in Series B funding and serves 340+ distribution companies. Our 98.7% uptime SLA and 96% customer retention rate demonstrate our stability and commitment to the distribution vertical.',
      },
      {
        id: 'bc-s4',
        title: 'Win Strategy & Talk Track',
        content:
          'Lead with operational impact: Frame the conversation around pick accuracy, warehouse throughput, and delivery efficiency — metrics that resonate with operations leaders evaluating Epicor alternatives.\n\nQuantify the hidden costs: Epicor customers consistently underestimate their total cost of ownership. Help the prospect calculate their true Epicor spend including annual maintenance (18-22% of license), customization projects, and third-party integrations for WMS and route optimization.\n\nReference Midwest Fastener: This customer switched from Epicor Prophet 21 and achieved 340% ROI in 14 months. Their pick accuracy went from 94% to 99.6%, and warehouse throughput increased 42% without adding headcount. Ask for a reference call — they are enthusiastic advocates.',
      },
      {
        id: 'bc-s5',
        title: 'Pricing Comparison',
        content:
          'Epicor Prophet 21 typical mid-market pricing: $8,000-$15,000/month for licenses, plus $50K-$150K implementation, plus 18-22% annual maintenance. Three-year TCO: $380K-$650K.\n\nApex Distribution Solutions comparable pricing: $4,500-$14,500/month for the full platform (WMS + Route + EDI), $25K-$45K implementation. Three-year TCO: $187K-$567K.\n\nKey differentiator: Apex pricing includes all three modules, ongoing support, and quarterly product updates. Epicor charges separately for each module, support tier, and version upgrade. The prospect should request a detailed Epicor renewal quote to compare line by line.',
      },
    ],
    generatedAt: '2026-03-28T14:32:00.000Z',
    generatedBy: 'admin',
    scores: {
      clarity: 91,
      differentiation: 94,
      proof: 88,
      callToAction: 82,
      overall: 89,
      tips: {
        clarity: 'Content is well-structured with clear comparative framing.',
        differentiation: 'Strong specific metrics that separate Apex from Epicor.',
        proof: 'Good case study reference; consider adding a second proof point.',
        callToAction: 'Add a specific next step recommendation for the rep.',
      },
    },
  },
  // 2. Solution One-Pager
  {
    id: 'demo-hist-002',
    contentType: 'solution-one-pager',
    prospect: {
      companyName: 'Summit Building Materials',
      industry: 'Building Materials',
      companySize: '165 employees, $48M revenue',
      techStack: 'QuickBooks Enterprise, spreadsheet-based inventory, paper pick tickets',
      painPoints: 'Inventory inaccuracy, manual processes, scaling challenges',
    },
    additionalContext: 'Growing 15% YoY and current systems cannot keep pace. Opening a second warehouse in Q3.',
    toneLevel: 3,
    sections: [
      {
        id: 'op-s1',
        title: 'The Challenge',
        content:
          'Mid-market building materials distributors face a critical inflection point: manual processes and disconnected systems that worked at $20M in revenue become operational bottlenecks at $50M+. Inventory inaccuracy leads to stockouts on high-velocity SKUs while slow-moving inventory ties up working capital. Paper-based picking creates error rates of 8-15%, driving costly re-deliveries and eroding customer trust.\n\nSummit Building Materials is experiencing these exact pressures. With 15% year-over-year growth and a second warehouse opening in Q3, the gap between current capabilities and operational requirements is widening. Every week of delay adds complexity — and cost — to the eventual transition.',
      },
      {
        id: 'op-s2',
        title: 'The Apex Solution',
        content:
          'Apex Distribution Solutions provides a purpose-built technology platform that addresses the specific operational challenges building materials distributors face. Our integrated suite — ApexFlow WMS, ApexRoute Optimizer, and ApexConnect EDI — replaces disconnected tools with a unified platform that deploys in 6-8 weeks.\n\nApexFlow WMS digitizes inventory management with real-time tracking across multiple warehouses, automated pick-pack-ship workflows, and barcode scanning that eliminates paper pick tickets. For Summit, this means both the existing facility and the new Q3 warehouse will operate on a single platform from day one.\n\nApexRoute Optimizer uses AI to plan delivery routes that minimize fuel costs and meet customer delivery windows. Building materials deliveries involve complex constraints — load weight, vehicle capacity, site accessibility — that our algorithm handles natively.',
      },
      {
        id: 'op-s3',
        title: 'Measurable Outcomes',
        content:
          'Apex customers in building materials distribution consistently achieve:\n\n• 99.4% inventory accuracy (up from industry average of 88-92%)\n• 67% reduction in pick errors within 90 days of deployment\n• 22% reduction in fuel and delivery costs through route optimization\n• 38% increase in warehouse throughput without adding headcount\n• 6-8 week deployment timeline with dedicated implementation team\n\nOur building materials customers see full ROI within 11 months on average, with annual savings of $180K-$420K depending on operation size. Summit\'s profile suggests annual savings potential of approximately $275K based on comparable deployments.',
      },
      {
        id: 'op-s4',
        title: 'Why Apex',
        content:
          'Unlike generic ERP platforms that require months of customization, Apex was built by former distribution operations leaders who understand the specific workflows, metrics, and challenges of the industry. Our platform includes distribution-specific features out of the box: cycle count management, vendor-managed inventory, will-call processing, and job-site delivery scheduling.\n\nWe back our platform with a 98.7% uptime SLA and a dedicated distribution industry success team — not a generic support desk. Every Apex customer is assigned an implementation lead with distribution industry experience who guides the deployment and remains your ongoing strategic advisor.',
      },
      {
        id: 'op-s5',
        title: 'Investment & Next Steps',
        content:
          'For Summit\'s current operation plus planned expansion, the recommended Apex platform configuration is:\n\n• ApexFlow WMS (2 warehouses): $4,500/month\n• ApexRoute Optimizer (estimated 12-vehicle fleet): $2,200/month\n• ApexConnect EDI (estimated volume): $1,100/month\n• Total platform investment: $7,800/month\n• One-time implementation: $32,000\n\nBased on projected savings of $275K annually, Summit would achieve full payback within 5.4 months of go-live. We recommend scheduling a 45-minute platform demonstration with your operations team to validate these projections against your specific workflow requirements.',
      },
    ],
    generatedAt: '2026-03-27T10:15:00.000Z',
    generatedBy: 'admin',
    scores: {
      clarity: 93,
      differentiation: 87,
      proof: 85,
      callToAction: 91,
      overall: 89,
      tips: {
        clarity: 'Excellent prospect-specific framing and clear value articulation.',
        differentiation: 'Add more comparison to their current QuickBooks approach.',
        proof: 'Include a named customer reference in building materials.',
        callToAction: 'Strong next steps with specific recommendation.',
      },
    },
  },
  // 3. Competitive Analysis: Apex vs Infor CloudSuite
  {
    id: 'demo-hist-003',
    contentType: 'competitive-analysis',
    prospect: {
      companyName: 'National Pipe & Valve',
      industry: 'Plumbing Supply',
      companySize: '420 employees, $135M revenue',
      techStack: 'Infor CloudSuite Distribution, custom WMS, SAP for financials',
      painPoints: 'High licensing costs, complex integrations, slow vendor response times',
    },
    additionalContext: 'Evaluating alternatives as Infor contract comes up for renewal in 6 months.',
    toneLevel: 3,
    sections: [
      {
        id: 'ca-s1',
        title: 'Market Positioning Analysis',
        content:
          'Infor CloudSuite Distribution targets enterprise-scale distributors with $500M+ revenue, positioning itself as a comprehensive ERP replacement. This enterprise focus creates a fundamental mismatch for mid-market distributors like National Pipe & Valve: they pay enterprise-grade pricing for functionality that exceeds their requirements while lacking the distribution-specific depth they actually need.\n\nApex Distribution Solutions occupies a distinct market position: purpose-built technology for mid-market distributors ($10M-$200M revenue). Rather than adapting a generic ERP framework to distribution use cases, Apex was architected from the ground up around distribution workflows, metrics, and operational patterns. This focus translates to faster deployment, lower TCO, and deeper functionality in the areas that matter most to distribution operations.\n\nThe competitive dynamic is straightforward: Infor sells breadth, Apex sells depth. For a plumbing supply distributor managing complex inventory, multi-stop deliveries, and trading partner networks, depth wins.',
      },
      {
        id: 'ca-s2',
        title: 'Total Cost of Ownership Comparison',
        content:
          'Infor CloudSuite Distribution pricing for an operation of National Pipe & Valve\'s scale typically runs $18,000-$28,000/month in subscription fees, plus $150K-$300K for implementation, plus ongoing consulting fees for customization and integration work. Annual maintenance and support adds 20-25% to the subscription cost. Three-year TCO estimate: $900K-$1.4M.\n\nApex full-platform pricing for comparable scope: $10,500-$14,500/month, $35K-$55K implementation, support included. Three-year TCO: $413K-$577K. This represents a 54-62% cost reduction while delivering superior distribution-specific functionality.\n\nThe hidden cost multiplier with Infor is integration complexity. National Pipe & Valve currently runs SAP for financials alongside Infor CloudSuite — a common pattern that generates $40K-$80K annually in integration maintenance. Apex\'s open API architecture and pre-built financial system connectors reduce this integration burden by approximately 70%.',
      },
      {
        id: 'ca-s3',
        title: 'Functional Gap Analysis',
        content:
          'Warehouse Management: Infor\'s WMS module is adequate for basic inventory management but lacks the distribution-specific workflows that drive operational excellence. ApexFlow WMS includes zone-based picking optimization, wave management, cross-docking support, and real-time cycle counting — capabilities that require expensive third-party add-ons or custom development in Infor.\n\nRoute Optimization: Infor has no native route optimization capability. Customers must procure and integrate a separate TMS solution, adding $30K-$60K annually in licensing and integration costs. ApexRoute Optimizer is natively integrated, reducing fuel costs by an average of 18% and improving on-time delivery rates by 23%.\n\nEDI & Trading Partner Management: Infor\'s EDI capabilities cover basic transaction sets but require significant configuration for each new trading partner. ApexConnect EDI provides 850+ pre-built partner connections with an average setup time of 2 hours per new partner versus 2-3 weeks with Infor.\n\nUser Experience: Infor\'s interface requires 3-4 weeks of formal training for warehouse staff. Apex\'s mobile-first interface is designed for warehouse operators and achieves productive use within 2-3 days. This training differential directly impacts the speed and risk profile of the transition.',
      },
      {
        id: 'ca-s4',
        title: 'Migration Path & Risk Mitigation',
        content:
          'Transitioning from Infor CloudSuite to Apex involves three parallel workstreams managed by our dedicated migration team:\n\n1. Data Migration (Weeks 1-3): Automated extraction of master data, transaction history, and trading partner configurations from Infor. Our Infor Migration Toolkit has been refined across 28 successful Infor-to-Apex transitions and covers 94% of data mapping automatically.\n\n2. Workflow Configuration (Weeks 2-5): Apex implementation engineers configure distribution-specific workflows in parallel with data migration. Unlike Infor\'s custom development approach, Apex workflows are configured through a no-code interface, reducing both timeline and risk.\n\n3. User Transition (Weeks 4-7): Phased user onboarding starting with warehouse operations, then expanding to route management and EDI. Each user cohort receives hands-on training and goes live with dedicated support for the first two weeks.\n\nRisk is further mitigated by our parallel-run capability: Apex can operate alongside Infor for 2-4 weeks during transition, allowing the team to validate accuracy before full cutover. We include this parallel-run period in our standard implementation at no additional cost.',
      },
    ],
    generatedAt: '2026-03-26T16:45:00.000Z',
    generatedBy: 'admin',
    scores: {
      clarity: 90,
      differentiation: 92,
      proof: 83,
      callToAction: 78,
      overall: 86,
      tips: {
        clarity: 'Well-organized with clear analytical framework.',
        differentiation: 'Excellent TCO comparison with specific numbers.',
        proof: 'Add customer references who switched from Infor specifically.',
        callToAction: 'Include recommended next steps for the evaluation.',
      },
    },
  },
  // 4. Discovery Call Prep
  {
    id: 'demo-hist-004',
    contentType: 'discovery-call-prep',
    prospect: {
      companyName: 'Heritage Building Products',
      industry: 'Building Materials',
      companySize: '310 employees, $82M revenue',
      techStack: 'Custom-built ERP (20+ years old), Excel inventory tracking, paper-based delivery',
      painPoints: 'Legacy system dependency, retirement of key IT staff, expansion into new territory',
    },
    additionalContext: 'VP of Operations reached out after conference presentation. Primary IT developer retiring in 8 months.',
    toneLevel: 3,
    sections: [
      {
        id: 'dc-s1',
        title: 'Prospect Intelligence',
        content:
          'Heritage Building Products is an $82M building materials distributor operating 5 branches across the Southeast. They\'ve relied on a custom-built ERP system for 20+ years, maintained primarily by a single senior developer who is retiring in approximately 8 months. This creates an urgent technology transition timeline that is both a risk and an opportunity.\n\nThe company is also expanding into the Mid-Atlantic region with plans for 2 new branches in the next 18 months. Their current system cannot support multi-region operations, making the case for modernization both urgent and strategic. Heritage has 310 employees, with approximately 180 in warehouse and delivery operations — the population most impacted by technology decisions.\n\nVP of Operations, Mark Callahan, initiated contact after attending our "Distribution Operations in the Cloud Era" presentation at the National Association of Wholesaler-Distributors conference. His questions focused on implementation timeline and data migration from legacy systems — indicating these are top-of-mind concerns.',
      },
      {
        id: 'dc-s2',
        title: 'Discovery Questions — Prioritized',
        content:
          'Operations & Pain Discovery:\n• "Walk me through what happens when a customer order comes in today — from entry to delivery. Where are the manual handoffs?"\n• "What percentage of your orders require some form of manual intervention or correction before they ship?"\n• "How do you currently track inventory accuracy? What\'s your last cycle count accuracy rate?"\n• "When your IT developer retires, what\'s the contingency plan for system maintenance and updates?"\n\nStrategic Direction:\n• "You mentioned expansion into the Mid-Atlantic — what would need to be true about your technology to support that confidently?"\n• "If you could solve one operational bottleneck this year, what would have the biggest impact on your business?"\n• "How does your executive team measure operational efficiency today? What metrics matter most?"\n\nBudget & Decision Process:\n• "Have you allocated budget for a technology transition, or is this still in the evaluation stage?"\n• "Beyond yourself, who else would be involved in evaluating and approving a platform decision of this scope?"\n• "What\'s your realistic timeline for making a decision? Is the developer retirement creating a hard deadline?"',
      },
      {
        id: 'dc-s3',
        title: 'Value Hypotheses to Validate',
        content:
          'Based on Heritage\'s profile, we should validate three primary value hypotheses during discovery:\n\nHypothesis 1 — Legacy System Risk: The custom ERP dependency on a single developer creates existential operational risk. If validated, this positions Apex as risk mitigation, not just improvement. Quantify: What would 1 week of system downtime cost Heritage? (Estimate: $380K-$520K in lost revenue based on their daily run rate.)\n\nHypothesis 2 — Scaling Impossibility: The current system cannot support multi-branch, multi-region operations. If Heritage attempts to expand on legacy technology, they\'ll face manual workarounds, data synchronization issues, and operational fragmentation. Apex\'s multi-warehouse architecture eliminates this barrier entirely.\n\nHypothesis 3 — Operational Efficiency Gap: With 180 warehouse and delivery employees using paper-based processes, Heritage likely has significant labor efficiency opportunities. Comparable building materials distributors achieve 35-45% throughput improvement with ApexFlow WMS. For Heritage, this could translate to $400K-$600K in annual labor savings without reducing headcount.',
      },
      {
        id: 'dc-s4',
        title: 'Competitive Landscape Preparation',
        content:
          'Given Heritage\'s situation, they will likely evaluate 2-3 alternatives alongside Apex. Based on their profile, the most probable competitors are:\n\nEpicor Prophet 21: The default choice for many building materials distributors. Heritage may receive inbound outreach from Epicor\'s sales team. Our advantage: 6-8 week deployment vs. 6-12 months — critical given the 8-month IT retirement timeline.\n\nNetSuite: May appeal to Heritage\'s CFO due to financial system integration. Our advantage: purpose-built distribution functionality vs. generic ERP with distribution add-ons. Pick accuracy differential alone (99.8% vs. 97%) drives measurable savings.\n\nDo-Nothing / Hire Replacement Developer: The most dangerous competitor. Heritage may consider hiring a new developer to maintain the legacy system. Counter: This delays the inevitable and doesn\'t solve the scaling challenge. The cost of maintaining a 20-year-old custom system plus a senior developer salary ($120K-$160K) exceeds the Apex platform investment while providing none of the operational improvements.',
      },
      {
        id: 'dc-s5',
        title: 'Meeting Logistics & Approach',
        content:
          'Call Structure (45 minutes recommended):\n• 0-5 min: Rapport building — reference the NAW conference and his specific questions about implementation timeline\n• 5-25 min: Discovery questions — focus on operational pain and strategic vision\n• 25-35 min: Initial value framing — connect their pain to Apex capabilities without a full demo\n• 35-45 min: Next steps — propose a 60-minute platform demonstration with the operations team\n\nKey Do\'s:\n• Reference specific building materials distribution scenarios (will-call, job-site delivery, contractor credit)\n• Use their language — Mark is an operations leader, not an IT buyer\n• Acknowledge the difficulty of replacing a system their team has used for 20 years\n\nKey Don\'ts:\n• Don\'t criticize their current system — they built it and are proud of it\n• Don\'t lead with technology features — lead with operational outcomes\n• Don\'t rush to pricing — validate value first, then present investment in context of ROI',
      },
    ],
    generatedAt: '2026-03-25T09:20:00.000Z',
    generatedBy: 'rep',
    scores: {
      clarity: 95,
      differentiation: 86,
      proof: 82,
      callToAction: 90,
      overall: 88,
      tips: {
        clarity: 'Excellent structure with prioritized, actionable guidance.',
        differentiation: 'Could strengthen with more specific Apex vs. competitor proof.',
        proof: 'Add a building materials customer reference name.',
        callToAction: 'Clear meeting structure with well-defined next steps.',
      },
    },
  },
  // 5. Case Study: Midwest Fastener Co
  {
    id: 'demo-hist-005',
    contentType: 'case-study',
    prospect: {
      companyName: 'Midwest Fastener Co.',
      industry: 'Industrial Distribution',
      companySize: '145 employees, $45M revenue',
      techStack: 'Epicor Prophet 21 (migrated from), manual WMS',
      painPoints: 'Low pick accuracy, high error rates, warehouse capacity constraints',
    },
    additionalContext: 'Customer success story for marketing and sales use.',
    toneLevel: 3,
    sections: [
      {
        id: 'cs-s1',
        title: 'Company Background',
        content:
          'Midwest Fastener Co. is a $45M industrial fastener distributor headquartered in Columbus, Ohio, serving manufacturers and contractors across the Midwest. With over 47,000 SKUs across 3 warehouse facilities and 145 employees, Midwest Fastener had built a strong reputation for product breadth and customer service over their 32-year history.\n\nHowever, rapid growth — 23% revenue increase over three years — was straining their operational infrastructure. The company relied on Epicor Prophet 21 for order management and a manual, paper-based warehouse picking system that hadn\'t changed significantly in a decade. As order volume increased, the cracks in their processes became costly liabilities.',
      },
      {
        id: 'cs-s2',
        title: 'The Challenge',
        content:
          'Midwest Fastener\'s operational challenges had reached an inflection point. Pick accuracy had declined to 94%, meaning 6 out of every 100 orders contained errors. With an average of 840 daily orders across three facilities, this translated to approximately 50 erroneous shipments per day — each costing an average of $127 in re-pick, re-pack, re-ship, and customer management costs.\n\nThe annual cost of pick errors alone exceeded $1.6M. Beyond direct costs, error rates were damaging customer relationships: their Net Promoter Score had dropped 18 points in two years, and three key accounts representing $3.8M in annual revenue had issued formal complaints about fulfillment quality.\n\nTheir Epicor Prophet 21 system provided adequate order management but lacked the warehouse execution capabilities needed to address the root cause. Epicor\'s recommended solution — a third-party WMS integration costing $180K in implementation fees plus $45K annually — would take 9-12 months to deploy. Midwest Fastener needed results faster.',
      },
      {
        id: 'cs-s3',
        title: 'The Solution',
        content:
          'Midwest Fastener selected Apex Distribution Solutions based on three factors: purpose-built distribution functionality, a 7-week implementation timeline, and total cost that was 52% lower than the Epicor WMS add-on path.\n\nThe implementation began in January 2025 with ApexFlow WMS deployed across all three warehouses. The Apex team configured distribution-specific workflows for Midwest Fastener\'s operation, including zone-based picking optimized for fastener inventory (high SKU count, small-part picking), barcode scanning replacing paper pick tickets, and automated quality checkpoints at pack stations.\n\nThe rollout followed Apex\'s phased approach: Warehouse 1 (Columbus HQ) went live in week 4, with Warehouses 2 and 3 (Indianapolis and Detroit) following in weeks 5 and 7 respectively. Each facility received 2 days of hands-on training, with an Apex implementation engineer on-site for the first week of live operations.',
      },
      {
        id: 'cs-s4',
        title: 'Results & Impact',
        content:
          'Within 90 days of full deployment, Midwest Fastener achieved transformational operational improvements:\n\n• Pick Accuracy: 94% to 99.6% — a 93% reduction in pick errors\n• Order Error Rate: 12% to 1.3% — an 89% reduction in order errors\n• Warehouse Throughput: 42% increase in orders processed per shift without adding headcount\n• Average Order Fulfillment Time: Reduced from 4.2 hours to 2.1 hours\n• Customer NPS: Recovered 22 points within 6 months of deployment\n\nThe financial impact was equally compelling. Midwest Fastener calculated their 14-month ROI at 340% based on:\n• $1.4M annual savings from error reduction\n• $320K annual labor efficiency gains\n• $95K annual savings from eliminating paper-based processes\n• Total annual benefit: $1.815M against a $412K first-year investment\n\nThe three at-risk customer accounts renewed and expanded their purchasing, representing a $4.2M annual revenue retention.',
      },
      {
        id: 'cs-s5',
        title: 'Customer Perspective',
        content:
          '"We knew we had a picking problem, but we didn\'t realize how much it was actually costing us until Apex helped us quantify it," said Sarah Chen, VP of Operations at Midwest Fastener. "The implementation was remarkably smooth — our warehouse team was using the system confidently within the first week. That never happened with Epicor."\n\nJim Kowalski, CFO, added: "The ROI case was compelling on paper, but the reality exceeded our projections. We budgeted for a 12-month payback and hit it in 8.3 months. The board was so impressed that we\'ve approved ApexRoute Optimizer for Phase 2 to address our delivery efficiency."\n\nMidwest Fastener has since expanded their Apex deployment to include ApexRoute Optimizer and ApexConnect EDI, creating a fully integrated distribution operations platform. They are currently one of Apex\'s most active customer references and participate regularly in prospect reference calls.',
      },
    ],
    generatedAt: '2026-03-24T11:30:00.000Z',
    generatedBy: 'admin',
    scores: {
      clarity: 96,
      differentiation: 89,
      proof: 97,
      callToAction: 84,
      overall: 92,
      tips: {
        clarity: 'Excellent narrative structure with clear problem-solution-result flow.',
        differentiation: 'Strong competitive positioning against Epicor alternative.',
        proof: 'Outstanding quantified results with specific metrics and quotes.',
        callToAction: 'Consider adding a clear CTA for prospects reading this.',
      },
    },
  },
  // 6. ROI Business Case
  {
    id: 'demo-hist-006',
    contentType: 'roi-business-case',
    prospect: {
      companyName: 'Consolidated Electrical Distributors',
      industry: 'Electrical Supply',
      companySize: '210 employees, $67M revenue',
      techStack: 'NetSuite, manual warehouse processes, spreadsheet-based routing',
      painPoints: 'Rising operational costs, delivery inefficiency, manual EDI processing',
    },
    additionalContext: 'CFO-level presentation. Need hard numbers and conservative assumptions.',
    toneLevel: 4,
    sections: [
      {
        id: 'roi-s1',
        title: 'Executive Summary',
        content:
          'This business case presents the financial justification for Consolidated Electrical Distributors to deploy the Apex Distribution Solutions platform across its 6-branch operation. Based on conservative assumptions validated against comparable electrical supply deployments, the projected outcomes are:\n\n• Annual operational savings: $487,000\n• Total platform investment (Year 1): $178,400\n• Net Year 1 benefit: $308,600\n• 36-month ROI: 372%\n• Payback period: 4.4 months\n\nThese projections use conservative efficiency assumptions (25th percentile of actual Apex customer outcomes in electrical distribution) and do not include revenue growth benefits from improved fill rates and customer satisfaction.',
      },
      {
        id: 'roi-s2',
        title: 'Current State Cost Analysis',
        content:
          'Consolidated Electrical\'s current operational costs include several categories of inefficiency that are quantifiable and addressable:\n\nWarehouse Labor Inefficiency: With 85 warehouse employees across 6 branches using manual picking processes, estimated labor waste is 12.5 hours per employee per week (industry benchmark for manual vs. automated distribution). At a fully loaded hourly rate of $28.50, annual warehouse labor waste is approximately $1,597,500.\n\nPick Error Costs: Current estimated pick accuracy of 93.5% against 1,240 daily orders generates approximately 81 errors per day. At an average correction cost of $94 per error (re-pick, re-ship, customer credit), annual pick error costs are $2,774,040. Conservative assumption: Apex reduces errors by 75% (vs. actual average of 89%), saving $2,080,530.\n\nDelivery Route Inefficiency: Consolidated operates 28 delivery vehicles across its territory. Industry benchmarks for manual routing vs. AI-optimized routing show 18-24% fuel and time savings. At current fuel and labor costs of approximately $1.8M annually for delivery operations, a conservative 15% improvement yields $270,000 in annual savings.\n\nManual EDI Processing: Consolidated employs 4 FTEs dedicated to manual purchase order entry, invoice matching, and compliance reporting. ApexConnect EDI automates 92-96% of these transactions. Conservative estimate: 2.5 FTE equivalent savings at $52,000 fully loaded = $130,000 annual savings.',
      },
      {
        id: 'roi-s3',
        title: 'Investment Requirements',
        content:
          'Apex Platform Licensing (Annual):\n• ApexFlow WMS — 6 branches: $6,800/month ($81,600/year)\n• ApexRoute Optimizer — 28 vehicles: $3,200/month ($38,400/year)\n• ApexConnect EDI — estimated volume: $1,800/month ($21,600/year)\n• Total annual platform cost: $141,600\n\nOne-Time Implementation:\n• Implementation services: $32,000\n• Data migration & validation: $4,800\n• Total one-time: $36,800\n\nYear 1 Total Investment: $178,400\nYear 2+ Annual Investment: $141,600\n\nNote: Apex pricing includes all support, updates, and training. There are no additional maintenance fees, support tier charges, or per-user licensing costs. Price is locked for 36 months per standard agreement terms.',
      },
      {
        id: 'roi-s4',
        title: 'Three-Year Financial Projection',
        content:
          'Year 1:\n• Gross savings: $487,000 (6-month effective period due to phased deployment)\n• Adjusted Year 1 savings: $324,700 (conservative 8-month ramp)\n• Investment: $178,400\n• Net Year 1 benefit: $146,300\n\nYear 2:\n• Gross savings: $487,000 (full-year, conservative assumptions maintained)\n• Investment: $141,600\n• Net Year 2 benefit: $345,400\n\nYear 3:\n• Gross savings: $512,000 (3% improvement from optimization maturity)\n• Investment: $141,600\n• Net Year 3 benefit: $370,400\n\n36-Month Summary:\n• Total savings: $1,323,700\n• Total investment: $461,600\n• Net 36-month benefit: $862,100\n• 36-month ROI: 372%\n• Cumulative payback: Month 4.4\n\nSensitivity Analysis: Even at 50% of projected savings, Consolidated achieves 156% ROI over 36 months with payback in month 9.1. The investment is financially justified under virtually any reasonable performance scenario.',
      },
      {
        id: 'roi-s5',
        title: 'Risk Assessment & Mitigation',
        content:
          'Implementation Risk: Apex has completed 340+ distribution deployments with a 97.4% on-time delivery rate. The phased approach (2 branches per deployment wave, 3 waves over 8 weeks) minimizes operational disruption. A parallel-run period of 2 weeks per branch allows validation before full cutover.\n\nAdoption Risk: Apex\'s mobile-first interface achieves productive user adoption in 2-3 days for warehouse staff. Our implementation includes on-site training and a 30-day adoption support window with a dedicated success manager. Historical data shows 94% of users reach full proficiency within 10 business days.\n\nPerformance Risk: All financial projections use 25th percentile performance outcomes from Apex\'s electrical distribution customer base. Median outcomes would increase the savings projection by 35-40%. Apex offers a performance guarantee: if the platform does not deliver measurable improvement in pick accuracy and warehouse throughput within 90 days, Consolidated may exit the agreement with a full refund of implementation fees.\n\nNote: This business case does not quantify the revenue protection benefit of improved fill rates and customer satisfaction. Based on comparable deployments, electrical distributors typically see 3-5% revenue lift from improved service levels within 12 months — which for Consolidated would represent $2.0M-$3.35M in additional annual revenue.',
      },
    ],
    generatedAt: '2026-03-23T15:10:00.000Z',
    generatedBy: 'rep',
    scores: {
      clarity: 94,
      differentiation: 85,
      proof: 91,
      callToAction: 88,
      overall: 90,
      tips: {
        clarity: 'Exceptionally clear financial analysis with well-structured projections.',
        differentiation: 'Strengthen comparison to current NetSuite costs.',
        proof: 'Good use of conservative assumptions and sensitivity analysis.',
        callToAction: 'Include a clear decision timeline recommendation.',
      },
    },
  },
];

// ═══════════════════════════════════════════════
// Demo Library Items
// ═══════════════════════════════════════════════

export const DEMO_LIBRARY: LibraryItem[] = [
  // Battle card (shared by Admin User)
  {
    id: 'demo-lib-001',
    contentType: 'battle-card',
    prospect: DEMO_HISTORY[0].prospect,
    sections: DEMO_HISTORY[0].sections,
    sharedBy: 'Admin User',
    sharedAt: '2026-03-28T15:00:00.000Z',
    tags: ['epicor', 'competitive', 'industrial-distribution'],
    pinned: true,
    scores: DEMO_HISTORY[0].scores,
  },
  // One-pager (shared by Rep User)
  {
    id: 'demo-lib-002',
    contentType: 'solution-one-pager',
    prospect: DEMO_HISTORY[1].prospect,
    sections: DEMO_HISTORY[1].sections,
    sharedBy: 'Rep User',
    sharedAt: '2026-03-27T11:00:00.000Z',
    tags: ['building-materials', 'one-pager', 'prospect'],
    pinned: false,
    scores: DEMO_HISTORY[1].scores,
  },
  // Case study (shared by Admin User)
  {
    id: 'demo-lib-003',
    contentType: 'case-study',
    prospect: DEMO_HISTORY[4].prospect,
    sections: DEMO_HISTORY[4].sections,
    sharedBy: 'Admin User',
    sharedAt: '2026-03-24T12:00:00.000Z',
    tags: ['case-study', 'midwest-fastener', 'wms', 'roi'],
    pinned: true,
    scores: DEMO_HISTORY[4].scores,
  },
  // Discovery call prep (shared by Rep User)
  {
    id: 'demo-lib-004',
    contentType: 'discovery-call-prep',
    prospect: DEMO_HISTORY[3].prospect,
    sections: DEMO_HISTORY[3].sections,
    sharedBy: 'Rep User',
    sharedAt: '2026-03-25T10:00:00.000Z',
    tags: ['discovery', 'building-materials', 'heritage'],
    pinned: false,
    scores: DEMO_HISTORY[3].scores,
  },
];

// ═══════════════════════════════════════════════
// Demo Product Profiles
// ═══════════════════════════════════════════════

export const DEMO_PRODUCTS: ProductProfile[] = [
  // ApexFlow WMS
  {
    id: 'demo-prod-001',
    name: 'ApexFlow WMS',
    shortDescription: 'Cloud-based warehouse management system purpose-built for industrial distributors.',
    fullDescription:
      'ApexFlow WMS is a cloud-native warehouse management system designed exclusively for the operational patterns of industrial distribution. Unlike generic WMS platforms that require extensive customization, ApexFlow ships with distribution-specific workflows including zone-based picking, wave management, cross-docking, cycle counting, will-call processing, and vendor-managed inventory. The mobile-first interface enables warehouse teams to achieve productive use within 2-3 days of training, and the platform supports multi-warehouse operations with real-time inventory synchronization across unlimited locations.',
    features: [
      { id: 'f1', name: 'Real-Time Inventory Tracking', description: 'Live visibility into inventory levels, locations, and movements across all warehouses with automatic reorder point alerts and ABC analysis.' },
      { id: 'f2', name: 'Automated Pick-Pack-Ship', description: 'Configurable picking strategies (zone, wave, batch, cluster) with barcode validation at every step. Reduces pick errors to <0.2% industry-leading accuracy.' },
      { id: 'f3', name: 'Multi-Warehouse Support', description: 'Manage unlimited warehouse locations from a single platform with real-time inventory synchronization, inter-facility transfers, and centralized reporting.' },
      { id: 'f4', name: 'Barcode & RFID Integration', description: 'Native support for barcode scanning and RFID tracking across all warehouse operations. Compatible with Zebra, Honeywell, and major hardware vendors.' },
      { id: 'f5', name: 'Cycle Count Management', description: 'Automated cycle counting schedules with ABC classification, exception-based counting, and variance reporting for continuous inventory accuracy.' },
      { id: 'f6', name: 'Will-Call & Counter Sales', description: 'Dedicated workflows for will-call order processing and counter sales common in distribution, with customer notification and staging management.' },
    ],
    benefits: [
      '99.8% pick accuracy — industry-leading for distribution WMS',
      '42% average increase in warehouse throughput without adding headcount',
      '67% reduction in pick errors within 90 days of deployment',
      '2-3 day training time vs. 2-4 weeks for competing platforms',
      'Deploys in 6-8 weeks, not 6-12 months',
    ],
    idealUseCase: 'Mid-market industrial distributors ($10M-$200M revenue) operating 1-15 warehouse locations who need to modernize paper-based or legacy WMS processes to improve pick accuracy, throughput, and inventory visibility.',
    targetPersonas: ['VP of Operations', 'Warehouse Manager', 'Supply Chain Director', 'IT Director'],
    targetIndustries: ['Industrial Distribution', 'Electrical Supply', 'Plumbing Supply', 'Building Materials', 'HVAC Distribution'],
    differentiators: [
      'Purpose-built for distribution — not a generic WMS adapted to distribution',
      'Mobile-first interface designed for warehouse operators, not IT staff',
      '6-8 week deployment vs. 6-12 months for Epicor, Infor, or SAP alternatives',
      'No per-user licensing — unlimited warehouse users included',
      'Distribution-specific workflows included out of the box (will-call, VMI, cross-dock)',
    ],
    proofPoints: [
      'Midwest Fastener Co: 94% to 99.6% pick accuracy, 340% ROI in 14 months',
      '340+ distribution companies deployed across North America',
      '98.7% platform uptime SLA with 99.2% actual uptime over trailing 12 months',
      'Average customer achieves full payback in 8.3 months',
      'Pacific Electrical Supply: 42% throughput increase across 8 branches',
    ],
    objections: [
      { id: 'o1', objection: 'We already have a WMS in our ERP.', response: 'Most ERP-embedded WMS modules provide basic inventory tracking but lack the distribution-specific workflows that drive operational excellence — zone-based picking, wave management, cross-docking, and cycle counting. Our customers who switch from ERP-embedded WMS see an average 42% throughput improvement because ApexFlow was purpose-built for how distributors actually operate.' },
      { id: 'o2', objection: 'Switching WMS is too risky for our operation.', response: 'We mitigate transition risk with our phased deployment approach and parallel-run capability. Apex can operate alongside your current system for 2-4 weeks during cutover. Of our 340+ deployments, 97.4% were completed on time and on budget. We also offer a 90-day performance guarantee.' },
      { id: 'o3', objection: 'Our warehouse team won\'t adopt new technology.', response: 'ApexFlow was designed by former warehouse operators. The mobile interface is intuitive enough that 94% of warehouse staff reach full proficiency within 10 business days — compared to 3-4 weeks for competing platforms. Midwest Fastener had their entire team productive within the first week.' },
    ],
    pricingNotes: '$2,500-$8,000/month based on warehouse count. Includes unlimited users, support, and quarterly updates. One-time implementation: $15,000-$35,000 depending on complexity.',
    relatedProducts: [
      { productId: 'demo-prod-002', type: 'complementary' },
      { productId: 'demo-prod-003', type: 'complementary' },
    ],
    status: 'active',
    promptTemplates: [
      { id: 'pt1', label: 'WMS battle card', promptText: 'Create a battle card comparing ApexFlow WMS against {competitor} for a {industry} distributor', contentType: 'battle-card' },
      { id: 'pt2', label: 'WMS one-pager', promptText: 'Create a solution one-pager for ApexFlow WMS targeting a {companySize} {industry} distributor', contentType: 'solution-one-pager' },
      { id: 'pt3', label: 'WMS ROI case', promptText: 'Build an ROI business case for ApexFlow WMS for a distributor with {warehouseCount} warehouses', contentType: 'roi-business-case' },
    ],
    contentGeneratedCount: 24,
    lastUpdated: '2026-03-20T10:00:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
    extractionSources: [],
  },
  // ApexRoute Optimizer
  {
    id: 'demo-prod-002',
    name: 'ApexRoute Optimizer',
    shortDescription: 'AI-powered delivery route planning and fleet management for distribution operations.',
    fullDescription:
      'ApexRoute Optimizer uses machine learning to plan optimal delivery routes that account for the unique constraints of industrial distribution: load weight and dimensions, vehicle capacity, delivery time windows, site accessibility, and driver specialization. The platform integrates real-time GPS tracking, dynamic re-routing for same-day additions, and customer notification workflows. ApexRoute reduces fuel costs by an average of 18% and delivery times by 27% while improving on-time delivery rates to 96.3% across our customer base.',
    features: [
      { id: 'f1', name: 'Dynamic Route Optimization', description: 'AI-powered routing that considers load constraints, time windows, traffic patterns, and delivery priorities. Re-optimizes in real-time as same-day orders are added.' },
      { id: 'f2', name: 'Real-Time GPS Tracking', description: 'Live fleet visibility with ETAs, delivery confirmation, proof-of-delivery capture, and exception alerting for dispatchers and customers.' },
      { id: 'f3', name: 'Fuel Cost Analytics', description: 'Track fuel consumption by route, driver, and vehicle. Identify optimization opportunities and measure improvement over time.' },
      { id: 'f4', name: 'Customer Delivery Windows', description: 'Honor customer-specified delivery windows while maximizing route efficiency. Automated customer notifications with live ETAs.' },
      { id: 'f5', name: 'Load Planning', description: 'Optimize vehicle loading sequence based on delivery order, weight distribution, and product dimensions. Critical for building materials and heavy industrial goods.' },
    ],
    benefits: [
      '18% average reduction in fuel costs across customer base',
      '27% average reduction in delivery times',
      '96.3% on-time delivery rate (vs. industry average of 87%)',
      'Real-time visibility for dispatchers and customers',
      'Same-day order accommodation without route disruption',
    ],
    idealUseCase: 'Distribution companies operating delivery fleets of 5-100+ vehicles who need to optimize routes, reduce fuel costs, and improve delivery reliability while accommodating complex load and schedule constraints.',
    targetPersonas: ['VP of Operations', 'Fleet Manager', 'Logistics Director', 'Supply Chain Director'],
    targetIndustries: ['Industrial Distribution', 'Building Materials', 'Electrical Supply', 'Plumbing Supply', 'HVAC Distribution'],
    differentiators: [
      'Distribution-specific load constraints (weight, dimensions, vehicle type) built into the optimization algorithm',
      'Natively integrated with ApexFlow WMS for seamless order-to-delivery workflow',
      'Same-day dynamic re-routing without manual dispatcher intervention',
      'Customer-facing delivery tracking and notification included at no extra cost',
    ],
    proofPoints: [
      'Pacific Electrical Supply: 22% fuel cost reduction, 31% delivery time reduction across 8 branches',
      'Average customer achieves 18% fuel savings within 60 days of deployment',
      'Handles 2.3M+ optimized deliveries per month across customer base',
      '96.3% on-time delivery rate vs. 87% industry average',
    ],
    objections: [
      { id: 'o1', objection: 'Our drivers know the routes — they don\'t need software.', response: 'Even experienced drivers typically follow habitual routes rather than optimal ones. Our data shows that AI-optimized routing improves efficiency by 15-22% over experienced driver routing. The system doesn\'t replace driver knowledge — it enhances it by handling the complex multi-variable optimization that no human can do in real-time across a full fleet.' },
      { id: 'o2', objection: 'We already use Google Maps / Waze for routing.', response: 'Consumer navigation tools optimize for a single vehicle going from A to B. Distribution routing requires optimizing sequences across multiple stops, multiple vehicles, load constraints, delivery windows, and real-time order additions. ApexRoute handles all of these simultaneously — something consumer tools cannot do.' },
      { id: 'o3', objection: 'Our delivery patterns are too complex for automated routing.', response: 'Complex delivery patterns are exactly where AI optimization delivers the most value. Building materials with weight constraints, hazmat requirements, site-specific delivery instructions — our algorithm handles all of these natively. The more complex your routing, the greater the efficiency gains.' },
    ],
    pricingNotes: '$1,200-$4,000/month based on fleet size. Includes GPS tracking hardware integration, customer notification portal, and unlimited dispatcher users.',
    relatedProducts: [
      { productId: 'demo-prod-001', type: 'complementary' },
      { productId: 'demo-prod-003', type: 'complementary' },
    ],
    status: 'active',
    promptTemplates: [
      { id: 'pt1', label: 'Route optimization pitch', promptText: 'Create a solution one-pager for ApexRoute Optimizer targeting a {industry} distributor with {fleetSize} vehicles', contentType: 'solution-one-pager' },
      { id: 'pt2', label: 'Fuel savings ROI', promptText: 'Build an ROI business case focused on fuel cost reduction with ApexRoute Optimizer', contentType: 'roi-business-case' },
    ],
    contentGeneratedCount: 18,
    lastUpdated: '2026-03-18T14:00:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
    extractionSources: [],
  },
  // ApexConnect EDI
  {
    id: 'demo-prod-003',
    name: 'ApexConnect EDI',
    shortDescription: 'Electronic data interchange platform with 850+ pre-built trading partner connections.',
    fullDescription:
      'ApexConnect EDI automates the electronic exchange of business documents — purchase orders, invoices, advance ship notices, and compliance reports — across distribution trading partner networks. With 850+ pre-built trading partner connections and automated document matching, ApexConnect eliminates 92-96% of manual EDI processing while ensuring compliance with trading partner requirements. The platform includes automated exception handling, compliance monitoring, and analytics dashboards that give operations leaders visibility into their trading partner performance.',
    features: [
      { id: 'f1', name: '850+ Trading Partner Connections', description: 'Pre-built connections to major manufacturers, retailers, and buying groups in industrial distribution. New partner onboarding averages 2 hours vs. 2-3 weeks with traditional EDI platforms.' },
      { id: 'f2', name: 'Automated PO Processing', description: 'Inbound purchase orders are automatically validated, matched, and routed for fulfillment. Exception-based workflow ensures staff only handles orders that require attention.' },
      { id: 'f3', name: 'Invoice Matching', description: 'Three-way matching between POs, receiving documents, and invoices with automated discrepancy resolution and approval routing.' },
      { id: 'f4', name: 'Compliance Reporting', description: 'Automated compliance monitoring and reporting for trading partner requirements including SLA adherence, fill rates, and on-time shipping metrics.' },
      { id: 'f5', name: 'Analytics Dashboard', description: 'Trading partner performance analytics including transaction volumes, error rates, processing times, and compliance scores.' },
    ],
    benefits: [
      '92-96% automation rate for EDI transactions',
      '2-hour average new trading partner setup (vs. 2-3 weeks)',
      'Eliminates 2-4 FTE equivalents of manual data entry',
      'Reduces invoice discrepancies by 78%',
      'Real-time compliance monitoring prevents chargebacks',
    ],
    idealUseCase: 'Distribution companies processing 500+ EDI transactions per month who need to reduce manual processing costs, improve trading partner compliance, and scale their partner network without adding headcount.',
    targetPersonas: ['Supply Chain Director', 'IT Director', 'CFO', 'Operations Manager'],
    targetIndustries: ['Industrial Distribution', 'Wholesale Distribution', 'Electrical Supply', 'Plumbing Supply', 'Building Materials'],
    differentiators: [
      '850+ pre-built connections — the largest distribution-focused EDI partner library',
      '2-hour partner onboarding vs. 2-3 weeks for traditional EDI platforms',
      'Natively integrated with ApexFlow WMS for automated order-to-shipment flow',
      'No per-transaction pricing — flat monthly rate regardless of volume',
      'Built-in compliance monitoring prevents costly trading partner chargebacks',
    ],
    proofPoints: [
      'Pacific Electrical Supply: automated 94% of PO processing, eliminated 3 FTE of manual data entry',
      'Average customer onboards 15 new trading partners per year with 2-hour setup time each',
      'Processes 4.7M+ EDI transactions per month across customer base',
      'Customers report 78% average reduction in invoice discrepancies within 90 days',
    ],
    objections: [
      { id: 'o1', objection: 'We already have an EDI provider.', response: 'Most traditional EDI providers charge per transaction and require weeks to onboard new partners. ApexConnect offers flat-rate pricing and 2-hour partner setup. More importantly, our native integration with ApexFlow WMS creates an automated order-to-shipment flow that standalone EDI providers cannot match.' },
      { id: 'o2', objection: 'EDI is a solved problem — why switch?', response: 'Traditional EDI handles document exchange. ApexConnect handles document exchange plus automated matching, exception handling, compliance monitoring, and analytics. The 92-96% automation rate means your team focuses on exceptions, not data entry. Customers typically eliminate 2-4 FTE equivalents of manual processing.' },
      { id: 'o3', objection: 'What about our custom EDI mappings?', response: 'Our migration team handles custom mapping conversion as part of implementation. We have migrated customers from every major EDI platform (SPS Commerce, TrueCommerce, DiCentral) with a 98% mapping compatibility rate. Custom mappings that require modification are handled during the implementation window at no additional cost.' },
    ],
    pricingNotes: '$800-$2,500/month based on transaction volume tier. Flat-rate pricing — no per-transaction fees. Includes all partner connections, compliance monitoring, and support.',
    relatedProducts: [
      { productId: 'demo-prod-001', type: 'complementary' },
      { productId: 'demo-prod-002', type: 'complementary' },
    ],
    status: 'active',
    promptTemplates: [
      { id: 'pt1', label: 'EDI automation pitch', promptText: 'Create a solution one-pager for ApexConnect EDI targeting a {industry} distributor processing {transactionVolume} transactions/month', contentType: 'solution-one-pager' },
      { id: 'pt2', label: 'EDI cost savings', promptText: 'Build an ROI business case for ApexConnect EDI focusing on manual processing elimination', contentType: 'roi-business-case' },
    ],
    contentGeneratedCount: 12,
    lastUpdated: '2026-03-15T09:00:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
    extractionSources: [],
  },
];
