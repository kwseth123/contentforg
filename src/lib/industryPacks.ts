export interface IndustryPack {
  id: string;
  name: string;
  icon: string;
  painPoints: string[];
  competitors: string[];
  promptTemplates: { label: string; prompt: string; contentType: string }[];
}

export const INDUSTRY_PACKS: IndustryPack[] = [
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: '🏭',
    painPoints: ['Production downtime and unplanned maintenance', 'Supply chain disruption and inventory management', 'Quality control and compliance reporting', 'Workforce scheduling and labor shortages', 'Equipment utilization and OEE improvement'],
    competitors: ['SAP', 'Oracle', 'Epicor', 'Infor'],
    promptTemplates: [
      { label: 'Plant manager one-pager', prompt: 'One-pager for a plant manager focused on reducing downtime', contentType: 'solution-one-pager' },
      { label: 'OEE improvement case', prompt: 'ROI business case showing OEE improvement metrics', contentType: 'roi-business-case' },
      { label: 'ERP migration battle card', prompt: 'Battle card for prospects currently using legacy ERP systems', contentType: 'battle-card' },
      { label: 'Quality compliance exec summary', prompt: 'Executive summary focused on quality compliance and audit readiness', contentType: 'executive-summary' },
      { label: 'Shift supervisor cold email', prompt: 'Cold email sequence targeting operations leaders at mid-size manufacturers', contentType: 'outbound-email-sequence' },
    ],
  },
  {
    id: 'distribution',
    name: 'Distribution',
    icon: '📦',
    painPoints: ['Order accuracy and pick/pack errors', 'Warehouse labor costs and productivity', 'Last-mile delivery optimization', 'Inventory visibility across locations', 'Customer delivery expectations and SLAs'],
    competitors: ['Manhattan Associates', 'Blue Yonder', 'Körber', 'HighJump'],
    promptTemplates: [
      { label: 'Warehouse ROI calculator', prompt: 'ROI business case for warehouse automation', contentType: 'roi-business-case' },
      { label: 'DC operations one-pager', prompt: 'One-pager for distribution center operations directors', contentType: 'solution-one-pager' },
      { label: 'WMS comparison guide', prompt: 'Comparison guide against legacy WMS systems', contentType: 'comparison-guide' },
      { label: 'Peak season prep', prompt: 'Battle card for peak season warehouse challenges', contentType: 'battle-card' },
      { label: '3PL outbound sequence', prompt: 'Outbound email sequence targeting 3PL operations leaders', contentType: 'outbound-email-sequence' },
    ],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    icon: '💼',
    painPoints: ['Billable utilization and revenue leakage', 'Project scope creep and budget overruns', 'Resource allocation and capacity planning', 'Client communication and reporting', 'Knowledge management across engagements'],
    competitors: ['Salesforce PSA', 'Mavenlink', 'Projector', 'NetSuite OpenAir'],
    promptTemplates: [
      { label: 'Utilization improvement case', prompt: 'ROI business case showing utilization rate improvement', contentType: 'roi-business-case' },
      { label: 'Partner firm one-pager', prompt: 'Solution one-pager for a consulting firm partner', contentType: 'solution-one-pager' },
      { label: 'Resource planning exec summary', prompt: 'Executive summary on resource planning and capacity optimization', contentType: 'executive-summary' },
      { label: 'Project delivery battle card', prompt: 'Battle card for prospects with project delivery challenges', contentType: 'battle-card' },
      { label: 'Managing director outreach', prompt: 'Cold email sequence targeting managing directors at professional services firms', contentType: 'outbound-email-sequence' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    painPoints: ['Patient data management and HIPAA compliance', 'Staff burnout and scheduling inefficiency', 'Revenue cycle management and claim denials', 'Interoperability between clinical systems', 'Patient experience and satisfaction scores'],
    competitors: ['Epic', 'Cerner', 'Meditech', 'Allscripts'],
    promptTemplates: [
      { label: 'HIPAA compliance one-pager', prompt: 'Solution one-pager emphasizing HIPAA compliance and data security', contentType: 'solution-one-pager' },
      { label: 'Revenue cycle ROI', prompt: 'ROI business case for revenue cycle management improvement', contentType: 'roi-business-case' },
      { label: 'Clinical workflow exec summary', prompt: 'Executive summary for clinical workflow optimization', contentType: 'executive-summary' },
      { label: 'EHR integration battle card', prompt: 'Battle card for EHR integration and interoperability', contentType: 'battle-card' },
      { label: 'Health system outreach', prompt: 'Outbound email sequence targeting health system CIOs', contentType: 'outbound-email-sequence' },
    ],
  },
  {
    id: 'construction',
    name: 'Construction',
    icon: '🏗️',
    painPoints: ['Project cost overruns and change orders', 'Safety compliance and incident tracking', 'Subcontractor coordination and scheduling', 'Document management and RFI tracking', 'Equipment fleet management and utilization'],
    competitors: ['Procore', 'PlanGrid', 'Buildertrend', 'Sage 300'],
    promptTemplates: [
      { label: 'Project manager one-pager', prompt: 'One-pager for construction project managers focused on schedule adherence', contentType: 'solution-one-pager' },
      { label: 'Safety compliance ROI', prompt: 'ROI business case for safety compliance and incident reduction', contentType: 'roi-business-case' },
      { label: 'GC operations battle card', prompt: 'Battle card for general contractors managing multiple job sites', contentType: 'battle-card' },
      { label: 'Preconstruction exec summary', prompt: 'Executive summary for preconstruction planning and estimating', contentType: 'executive-summary' },
      { label: 'Subcontractor cold email', prompt: 'Cold email sequence targeting subcontractor operations leaders', contentType: 'outbound-email-sequence' },
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: '💻',
    painPoints: ['Developer productivity and toolchain complexity', 'Cloud infrastructure costs and optimization', 'Security vulnerabilities and compliance', 'Time to market for new features', 'Customer churn and expansion revenue'],
    competitors: ['AWS', 'Azure', 'Google Cloud', 'Datadog'],
    promptTemplates: [
      { label: 'CTO infrastructure one-pager', prompt: 'Solution one-pager for CTOs focused on infrastructure modernization', contentType: 'solution-one-pager' },
      { label: 'Cloud cost ROI', prompt: 'ROI business case for cloud cost optimization', contentType: 'roi-business-case' },
      { label: 'DevOps battle card', prompt: 'Battle card for DevOps toolchain consolidation', contentType: 'battle-card' },
      { label: 'Platform engineering exec summary', prompt: 'Executive summary for platform engineering and developer experience', contentType: 'executive-summary' },
      { label: 'VP Engineering outreach', prompt: 'Outbound email sequence targeting VP Engineering at Series B+ startups', contentType: 'outbound-email-sequence' },
    ],
  },
];
