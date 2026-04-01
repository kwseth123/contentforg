export interface BrandVars {
  primary: string;       // --brand-primary
  secondary: string;     // --brand-secondary
  accent: string;        // --brand-accent
  background: string;    // --brand-background
  text: string;          // --brand-text
  fontPrimary: string;   // --brand-font-primary (Google Font name)
  fontSecondary: string; // --brand-font-secondary
  h1Size: number;        // in px
  h2Size: number;
  h3Size: number;
  bodySize: number;
  documentStyle: 'modern' | 'corporate' | 'bold' | 'minimal';
  logoPlacement: 'top-left' | 'top-center' | 'top-right';
}

export interface StyleInput {
  sections: { id: string; title: string; content: string }[];
  contentType: string;
  prospect: { companyName: string; industry?: string; companySize?: string };
  companyName: string;
  companyDescription?: string;
  logoBase64?: string;        // seller's logo
  prospectLogoBase64?: string; // prospect's logo
  accentColor: string;        // hex like #6366F1 (legacy, use brand.accent)
  date?: string;
  brand?: BrandVars;          // full brand override — templates should use this
}

export interface DocumentStyle {
  id: string;
  name: string;
  category: 'clean' | 'bold' | 'corporate' | 'creative';
  description: string;     // one-liner for tooltip
  keywords: string[];      // for search filtering
  render: (input: StyleInput) => string;  // returns complete HTML document
  thumbnail: (accentColor: string) => string; // returns minimal HTML for preview thumbnail
}

export const STYLE_CATEGORIES = {
  clean: { label: 'Clean & Modern', range: '01-08' },
  bold: { label: 'Bold & Impactful', range: '09-16' },
  corporate: { label: 'Corporate & Professional', range: '17-23' },  // Note: only 7
  creative: { label: 'Creative & Distinctive', range: '24-30' },     // 7
} as const;
