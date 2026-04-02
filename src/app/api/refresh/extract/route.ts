import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;
    const ext = fileName.toLowerCase().split('.').pop();

    if (ext !== 'pdf' && ext !== 'docx') {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';
    let pageCount: number | undefined;

    if (ext === 'pdf') {
      const { parsePDF } = await import('@/lib/fileParser');
      const result = await parsePDF(buffer, { withMeta: true });
      text = result.text;
      pageCount = result.numpages;
    } else {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    // Fetch knowledge base data for comparison
    const kb = await db.getKnowledgeBase('default');
    const products = await db.getProducts('default');

    // Build context for the AI prompt
    const productNames = products.map((p) => p.name).filter(Boolean);
    const competitorNames = (kb.competitors || []).map((c: { name?: string }) =>
      typeof c === 'string' ? c : c.name || '',
    ).filter(Boolean);
    const wordsToAvoid = kb.brandVoice?.wordsToAvoid || [];
    const bannedTerms = kb.brandGuidelines?.voice?.bannedTerms || [];
    const allBannedWords = [...new Set([...wordsToAvoid, ...bannedTerms])];
    const caseStudies = (kb.caseStudies || []).map((cs: { title?: string; client?: string }) => {
      const title = cs.title || '';
      const client = cs.client || '';
      return `${title}${client ? ` (${client})` : ''}`;
    }).filter(Boolean);

    const anthropic = new Anthropic();

    const analysisPrompt = `You are analyzing a sales/marketing document for a "Document Refresh" feature. Analyze the following document text and return a JSON object with your analysis.

KNOWLEDGE BASE CONTEXT:
- Current products: ${JSON.stringify(productNames)}
- Known competitors: ${JSON.stringify(competitorNames)}
- Banned words/phrases to avoid: ${JSON.stringify(allBannedWords)}
- Case studies available: ${JSON.stringify(caseStudies)}

DOCUMENT TEXT:
${text.substring(0, 50000)}

Return ONLY a valid JSON object (no markdown, no code fences) with these fields:

{
  "documentType": one of: "solution-one-pager", "battle-card", "competitive-analysis", "executive-summary", "discovery-call-prep", "roi-business-case", "case-study", "email-sequence", "proposal", "implementation-timeline", "mutual-action-plan", "linkedin-post", "conference-leave-behind", "objection-handling-guide", "post-demo-follow-up",
  "prospectName": detected prospect or company name if present (string or null),
  "dates": array of {original: string, context: string} for ALL dates found in the document,
  "outdatedProducts": array of {found: string, current: string, context: string} for any product names that don't match current products or appear to be old versions,
  "brandVoiceIssues": array of {term: string, issue: string, context: string} for any banned words or tone violations found,
  "competitorMentions": array of {name: string, context: string, hasCurrentIntel: boolean} for any competitor mentions (hasCurrentIntel is true if the competitor is in our known competitors list),
  "summary": 2-3 sentence summary of the document,
  "sectionCount": number of distinct sections detected,
  "wordCount": total word count,
  "smartSuggestions": array of {id: string, text: string, type: "case-study"|"competitive"|"product"|"general"} with AI-generated suggestions for improvements based on the knowledge base data. For example: suggest adding a relevant case study, updating competitive positioning, refreshing product details, or general improvements. Generate 3-8 actionable suggestions.
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI analysis response as JSON');
      }
    }

    return NextResponse.json({
      extractedText: text.substring(0, 50000),
      analysis,
      fileName,
      fileSize,
      pageCount: pageCount ?? null,
    });
  } catch (err) {
    console.error('[refresh/extract] Error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
