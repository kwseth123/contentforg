// ═══════════════════════════════════════════════
// 150+ Industries organized by sector
// ═══════════════════════════════════════════════

export const INDUSTRY_LIST: string[] = [
  // Manufacturing (12)
  'Automotive Manufacturing', 'Aerospace Manufacturing', 'Food Manufacturing',
  'Pharmaceutical Manufacturing', 'Chemical Manufacturing', 'Electronics Manufacturing',
  'Metal Fabrication', 'Plastics Manufacturing', 'Textile Manufacturing',
  'Furniture Manufacturing', 'Industrial Equipment Manufacturing', 'Consumer Goods Manufacturing',
  // Distribution & Logistics (10)
  'Wholesale Distribution', 'Third-Party Logistics (3PL)', 'Freight and Trucking',
  'Warehousing and Fulfillment', 'Cold Chain Distribution', 'Medical Device Distribution',
  'Building Materials Distribution', 'Food and Beverage Distribution', 'Auto Parts Distribution',
  'Industrial Supply Distribution',
  // Professional Services (12)
  'Legal Services', 'Accounting and Tax', 'Management Consulting', 'IT Consulting',
  'Marketing Agencies', 'Architecture Firms', 'Engineering Consulting',
  'HR and Staffing', 'Recruitment Agencies', 'Financial Advisory',
  'Public Relations', 'Executive Search',
  // Healthcare (12)
  'Hospitals and Health Systems', 'Dental Practices', 'Veterinary Clinics',
  'Home Health and Hospice', 'Mental Health Services', 'Urgent Care Centers',
  'Medical Labs and Diagnostics', 'Physical Therapy', 'Optometry',
  'Dermatology Practices', 'Chiropractic', 'Healthcare IT',
  // Construction (10)
  'General Contracting', 'Residential Construction', 'Commercial Construction',
  'Electrical Contracting', 'Plumbing and HVAC', 'Roofing',
  'Concrete and Masonry', 'Landscaping', 'Civil Engineering', 'Environmental Remediation',
  // Retail (10)
  'E-Commerce', 'Grocery and Supermarkets', 'Specialty Retail',
  'Franchise Operations', 'Automotive Dealerships', 'Jewelry Retail',
  'Home Improvement Retail', 'Fashion and Apparel', 'Pet Retail', 'Sporting Goods Retail',
  // Food and Beverage (10)
  'Restaurants', 'Quick Service Restaurants', 'Catering and Events',
  'Craft Brewing', 'Wineries and Vineyards', 'Coffee Shops and Cafes',
  'Food Trucks', 'Bakeries', 'Ghost Kitchens', 'Meal Prep Services',
  // Technology (12)
  'SaaS', 'Cybersecurity', 'Cloud Infrastructure', 'Data Analytics',
  'AI and Machine Learning', 'IT Managed Services', 'Software Development',
  'Hardware and IoT', 'Telecommunications', 'EdTech', 'FinTech', 'HealthTech',
  // Financial Services (10)
  'Banking', 'Credit Unions', 'Insurance', 'Mortgage and Lending',
  'Wealth Management', 'Payment Processing', 'Private Equity',
  'Venture Capital', 'Tax Preparation', 'Collections and Debt Recovery',
  // Real Estate (8)
  'Commercial Real Estate', 'Residential Real Estate', 'Property Management',
  'Real Estate Development', 'REITs', 'Mortgage Brokerage',
  'Appraisal Services', 'Title and Escrow',
  // Education (8)
  'K-12 Education', 'Higher Education', 'Trade Schools',
  'Online Learning Platforms', 'Corporate Training', 'Tutoring Services',
  'Early Childhood Education', 'Education Technology',
  // Hospitality (8)
  'Hotels and Resorts', 'Event Venues', 'Travel Agencies',
  'Tourism and Attractions', 'Casinos and Gaming', 'Cruise Lines',
  'Campgrounds and RV Parks', 'Bed and Breakfasts',
  // Transportation (8)
  'Fleet Management', 'Public Transit', 'Ride-Sharing and Mobility',
  'Aviation Services', 'Maritime and Shipping', 'Railroad',
  'Last-Mile Delivery', 'Moving and Relocation',
  // Agriculture (8)
  'Farming and Crop Production', 'Livestock and Dairy', 'Agricultural Equipment',
  'Agrochemicals', 'Irrigation and Water Management', 'Forestry',
  'Aquaculture', 'Cannabis and Hemp',
  // Energy (8)
  'Oil and Gas', 'Solar Energy', 'Wind Energy', 'Electric Utilities',
  'Energy Storage', 'Energy Consulting', 'Mining', 'Nuclear Energy',
  // Media and Entertainment (8)
  'Publishing', 'Broadcasting', 'Film and Television Production',
  'Music Industry', 'Gaming and Esports', 'Advertising',
  'Podcasting', 'Streaming Services',
  // Non-Profit (6)
  'Charitable Organizations', 'Foundations', 'Associations and Membership',
  'Religious Organizations', 'Social Services', 'Environmental Non-Profits',
  // Government (6)
  'Federal Government', 'State and Local Government', 'Defense and Military',
  'Public Safety', 'Water and Waste Management', 'Parks and Recreation',
  // Field Services (10)
  'Pest Control', 'Cleaning and Janitorial', 'Security Services',
  'Fire Protection', 'Elevator and Escalator Services', 'Appliance Repair',
  'Pool and Spa Services', 'Tree Care and Arborist', 'Locksmith Services',
  'Waste Hauling',
].sort();

export const DEMO_INDUSTRIES = [
  'Automotive Manufacturing',
  'Wholesale Distribution',
  'Legal Services',
  'Hospitals and Health Systems',
  'General Contracting',
  'SaaS',
  'Pest Control',
  'HR and Staffing',
] as const;

// Demo data with pre-built industry configs for instant load
export interface DemoIndustryData {
  industry: string;
  prospectName: string;
  painPointIndices: number[]; // indices of which pain points to pre-check
}

export const DEMO_INDUSTRY_DATA: DemoIndustryData[] = [
  { industry: 'Automotive Manufacturing', prospectName: 'Acme Motors', painPointIndices: [0, 1, 3] },
  { industry: 'Wholesale Distribution', prospectName: 'Midwest Supply Co', painPointIndices: [0, 2, 4] },
  { industry: 'Legal Services', prospectName: 'Henderson & Associates', painPointIndices: [0, 1, 2] },
  { industry: 'Hospitals and Health Systems', prospectName: 'Metro Health Network', painPointIndices: [0, 2, 3] },
  { industry: 'General Contracting', prospectName: 'Summit Builders', painPointIndices: [0, 1, 4] },
  { industry: 'SaaS', prospectName: 'CloudSync Technologies', painPointIndices: [0, 1, 2] },
  { industry: 'Pest Control', prospectName: 'Guardian Pest Solutions', painPointIndices: [0, 2, 3] },
  { industry: 'HR and Staffing', prospectName: 'TalentBridge Group', painPointIndices: [0, 1, 3] },
];
