import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { getStyle, getDefaultStyleForContentType } from '@/lib/documentStyles/registry';
import type { StyleInput, BrandVars } from '@/lib/documentStyles/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RefreshFixes {
  updateBranding: boolean;
  refreshDates: boolean;
  updateProducts: boolean;
  fixBrandVoice: boolean;
  updateCompetitorIntel: boolean;
}

interface Section {
  id: string;
  title: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
      extractedText,
      contentType,
      styleId,
      prospectName,
      additionalContext,
      fixes,
      analysis,
    } = body as {
      extractedText: string;
      contentType: string;
      styleId: string;
      prospectName: string;
      additionalContext: string;
      fixes: RefreshFixes;
      analysis: Record<string, unknown>;
    };

    if (!extractedText || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: extractedText and contentType are required' },
        { status: 400 }
      );
    }

    // Fetch knowledge base and products
    const kb = await db.getKnowledgeBase('default');
    const products = await db.getProducts('default');

    // Build fix instructions based on enabled flags
    const fixInstructions: string[] = [];
    if (fixes?.updateBranding) {
      fixInstructions.push('Update all branding to match current brand guidelines. Replace any outdated company names, logos references, or brand elements.');
    }
    if (fixes?.refreshDates) {
      fixInstructions.push('Update all dates, years, and time references to be current as of today (April 1, 2026). Remove any outdated temporal references.');
    }
    if (fixes?.updateProducts) {
      fixInstructions.push('Replace all product names, features, and pricing with current information from the knowledge base. Remove any discontinued products or outdated feature descriptions.');
    }
    if (fixes?.fixBrandVoice) {
      fixInstructions.push('Rewrite content to match the current brand voice guidelines. Ensure tone, terminology, and messaging align with approved brand standards.');
    }
    if (fixes?.updateCompetitorIntel) {
      fixInstructions.push('Update all competitive references with current market intelligence. Refresh competitor comparisons and positioning statements.');
    }

    // Build knowledge base context
    const kbContext = [
      kb.companyName ? `Company Name: ${kb.companyName}` : '',
      kb.aboutUs ? `About Us: ${kb.aboutUs}` : '',
      kb.tagline ? `Tagline: ${kb.tagline}` : '',
      products.length > 0 ? `Products:\n${products.map(p => `- ${p.name}: ${p.shortDescription || ''} ${p.features?.length ? `(Features: ${p.features.map(f => f.name).join(', ')})` : ''}`).join('\n')}` : '',
      kb.differentiators ? `Key Differentiators:\n${kb.differentiators}` : '',
      kb.caseStudies?.length ? `Case Studies:\n${kb.caseStudies.map(cs => `- ${cs.title || JSON.stringify(cs)}`).join('\n')}` : '',
      kb.brandVoice ? `Brand Voice:\n- Tone: ${kb.brandVoice.tone || 'Professional'}\n- Words to Use: ${(kb.brandVoice.wordsToUse || []).join(', ')}\n- Words to Avoid: ${(kb.brandVoice.wordsToAvoid || []).join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    const systemPrompt = `You are refreshing an existing sales document. Use the extracted content as your knowledge source. Apply all brand guidelines strictly. Update all dates to today's date (April 1, 2026). Use current product names from the knowledge base. Incorporate any additional context provided. The output must feel like a freshly created document, not an edited old one. Match the document type and approximate length of the original.`;

    const userPrompt = `## KNOWLEDGE SOURCE (Original Document)
${extractedText}

## CURRENT KNOWLEDGE BASE
${kbContext}

## DOCUMENT TYPE
${contentType}

## PROSPECT
${prospectName || 'Unknown'}

${fixInstructions.length > 0 ? `## REQUIRED FIXES\n${fixInstructions.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : ''}

${additionalContext ? `## ADDITIONAL CONTEXT FROM USER\n${additionalContext}` : ''}

## OUTPUT FORMAT
Generate sections in this format: ## SECTION: Title

content

for each section. Generate 4-8 sections appropriate for the document type.

Regenerate this document completely using the knowledge source as your reference. Apply all required fixes. The result should read as a freshly created, professional document.`;

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text from response
    let responseText = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        responseText += block.text;
      }
    }

    // Parse response into sections — try multiple heading formats
    const sections: Section[] = [];
    let sectionIndex = 0;

    // Try "## SECTION: Title" format first
    const sectionRegex = /## SECTION:\s*(.+?)\n+?([\s\S]*?)(?=## SECTION:|$)/g;
    let match;
    while ((match = sectionRegex.exec(responseText)) !== null) {
      const content = match[2].trim();
      if (content) {
        sections.push({ id: `section-${sectionIndex++}`, title: match[1].trim(), content });
      }
    }

    // Fallback: try generic markdown ## headings
    if (sections.length === 0) {
      const headingRegex = /^##\s+(.+?)$/gm;
      const headings: { title: string; start: number; end: number }[] = [];
      while ((match = headingRegex.exec(responseText)) !== null) {
        headings.push({ title: match[1].trim(), start: match.index + match[0].length, end: 0 });
      }
      for (let i = 0; i < headings.length; i++) {
        headings[i].end = i + 1 < headings.length ? headings[i + 1].start - headings[i + 1].title.length - 3 : responseText.length;
        const content = responseText.slice(headings[i].start, headings[i].end).trim();
        if (content) {
          sections.push({ id: `section-${sectionIndex++}`, title: headings[i].title, content });
        }
      }
    }

    // Last resort: treat entire response as one section
    if (sections.length === 0 && responseText.trim()) {
      sections.push({
        id: 'section-0',
        title: contentType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        content: responseText.trim(),
      });
    }

    console.log(`[refresh/generate] Parsed ${sections.length} sections, total chars: ${responseText.length}`);

    // Resolve style and render HTML
    const resolvedStyleId = styleId || getDefaultStyleForContentType(contentType);
    const style = getStyle(resolvedStyleId);

    const { resolveBrandGuidelines } = await import('@/lib/brandDefaults');
    const brandGuidelines = resolveBrandGuidelines(kb);

    const ptToPx = (pt: number) => Math.round(pt * 1.333);
    const brandVars: BrandVars = {
      primary: brandGuidelines.colors?.primary || kb.brandColor || '#1e293b',
      secondary: brandGuidelines.colors?.secondary || kb.brandColor || '#4a4ae0',
      accent: brandGuidelines.colors?.accent || kb.brandColor || '#f59e0b',
      background: brandGuidelines.colors?.background || '#ffffff',
      text: brandGuidelines.colors?.text || '#334155',
      fontPrimary: brandGuidelines.fonts?.primary || 'Inter',
      fontSecondary: brandGuidelines.fonts?.secondary || 'Inter',
      h1Size: ptToPx(brandGuidelines.fonts?.sizes?.h1 || 28),
      h2Size: ptToPx(brandGuidelines.fonts?.sizes?.h2 || 18),
      h3Size: ptToPx(brandGuidelines.fonts?.sizes?.h3 || 14),
      bodySize: ptToPx(brandGuidelines.fonts?.sizes?.body || 11),
      documentStyle: (brandGuidelines.documentStyle as BrandVars['documentStyle']) || 'modern',
      logoPlacement: (brandGuidelines.logos?.placement as BrandVars['logoPlacement']) || 'top-left',
    };

    let primaryLogoBase64 = await db.getLogo('default', 'primary');

    const styleInput: StyleInput = {
      sections,
      contentType,
      prospect: {
        companyName: prospectName || 'Prospect',
      },
      companyName: kb.companyName || 'Company',
      companyDescription: kb.tagline || kb.aboutUs || '',
      logoBase64: primaryLogoBase64 || undefined,
      accentColor: kb.brandColor || brandGuidelines.colors?.primary || '#6366F1',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      brand: brandVars,
    };

    const html = style ? style.render(styleInput) : `<html><body>${sections.map(s => `<h2>${s.title}</h2><div>${s.content}</div>`).join('')}</body></html>`;

    // Optionally save to refresh_history
    try {
      await (db as any).addRefreshHistory('default', {
        original_filename: (body.originalFilename as string) || '',
        original_content: extractedText.slice(0, 50000),
        refreshed_content: html,
        changes_made: JSON.stringify(Object.entries(fixes || {}).filter(([, v]) => v).map(([k]) => k)),
        analysis: JSON.stringify(body.analysis || {}),
        style_id: styleId,
        content_type: contentType,
        prospect_name: prospectName,
      });
    } catch {
      // refresh_history table may not exist yet — silently ignore
    }

    return NextResponse.json({
      sections,
      html,
      contentType,
    });
  } catch (e) {
    console.error('[refresh/generate] Error:', e);
    return NextResponse.json(
      { error: 'An unexpected error occurred during document refresh' },
      { status: 500 }
    );
  }
}
