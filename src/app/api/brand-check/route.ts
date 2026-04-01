import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { BrandGuidelines, BrandViolation, BrandComplianceResult, GeneratedSection } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function findBannedWords(
  sections: GeneratedSection[],
  bannedTerms: string[]
): BrandViolation[] {
  const violations: BrandViolation[] = [];
  if (!bannedTerms || bannedTerms.length === 0) return violations;

  for (const section of sections) {
    const sentences = section.content.split(/(?<=[.!?])\s+/);
    for (const term of bannedTerms) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      for (const sentence of sentences) {
        if (regex.test(sentence)) {
          violations.push({
            id: generateId(),
            type: 'banned-word',
            severity: 'violation',
            sectionId: section.id,
            sectionTitle: section.title,
            bannedWord: term,
            description: `Banned term "${term}" found in section`,
            originalText: sentence.trim(),
            suggestedFix: sentence.replace(regex, `[REMOVE: "${term}"]`).trim(),
          });
        }
      }
    }
  }

  return violations;
}

async function checkVoiceCompliance(
  sections: GeneratedSection[],
  brandGuidelines: BrandGuidelines
): Promise<BrandViolation[]> {
  const voiceText = brandGuidelines.voice.guidelinesText || '';
  const docContent = brandGuidelines.voice.documentContent || '';

  if (!voiceText && !docContent) return [];

  const fullContent = sections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join('\n\n');

  const brandVoiceContext = [
    voiceText ? `Brand Voice Guidelines:\n${voiceText}` : '',
    docContent ? `Brand Document:\n${docContent}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:
        'You are a brand compliance reviewer. Check if the content follows the brand voice guidelines. Return ONLY a JSON array of violations. If there are no violations, return an empty array []. Each violation object must have: sectionTitle, description, originalText, suggestedFix.',
      messages: [
        {
          role: 'user',
          content: `Check this content against the brand voice guidelines.

${brandVoiceContext}

Content to check:
${fullContent}

Return ONLY a valid JSON array of violation objects. No other text.`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(
      (v: {
        sectionTitle?: string;
        description?: string;
        originalText?: string;
        suggestedFix?: string;
      }) => {
        const matchingSection = sections.find(
          (s) =>
            s.title.toLowerCase() === (v.sectionTitle || '').toLowerCase()
        );
        return {
          id: generateId(),
          type: 'off-voice' as const,
          severity: 'warning' as const,
          sectionId: matchingSection?.id || sections[0]?.id || '',
          sectionTitle: v.sectionTitle || 'Unknown',
          description: v.description || 'Voice compliance issue',
          originalText: v.originalText,
          suggestedFix: v.suggestedFix,
        };
      }
    );
  } catch {
    return [];
  }
}

function checkMissingElements(
  sections: GeneratedSection[],
  brandGuidelines: BrandGuidelines,
  companyName?: string
): BrandViolation[] {
  const violations: BrandViolation[] = [];
  const allContent = sections.map((s) => s.content).join(' ');

  const tagline = brandGuidelines.voice.tagline;
  if (tagline && tagline.trim().length > 0) {
    const taglineFound = allContent
      .toLowerCase()
      .includes(tagline.toLowerCase());
    if (!taglineFound) {
      violations.push({
        id: generateId(),
        type: 'missing-element',
        severity: 'warning',
        sectionId: sections[0]?.id || '',
        sectionTitle: 'Document-wide',
        description: `Brand tagline "${tagline}" is not present in any section`,
        suggestedFix: `Consider incorporating the tagline "${tagline}" in a prominent section`,
      });
    }
  }

  if (companyName && companyName.trim().length > 0) {
    const nameFound = allContent
      .toLowerCase()
      .includes(companyName.toLowerCase());
    if (!nameFound) {
      violations.push({
        id: generateId(),
        type: 'missing-element',
        severity: 'warning',
        sectionId: sections[0]?.id || '',
        sectionTitle: 'Document-wide',
        description: `Company name "${companyName}" is not referenced in any section`,
        suggestedFix: `Ensure the company name "${companyName}" appears at least once in the content`,
      });
    }
  }

  return violations;
}

function calculateScore(violations: BrandViolation[]): number {
  let score = 100;
  for (const v of violations) {
    if (v.severity === 'violation') {
      score -= 15;
    } else if (v.severity === 'warning') {
      score -= 5;
    }
  }
  return Math.max(0, score);
}

function getStatus(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sections, brandGuidelines, companyName } = await req.json();

    if (!sections || !brandGuidelines) {
      return NextResponse.json(
        { error: 'Missing required fields: sections, brandGuidelines' },
        { status: 400 }
      );
    }

    // Check A: Banned word detection (instant, no AI)
    const bannedWordViolations = findBannedWords(
      sections,
      brandGuidelines.voice?.bannedTerms || []
    );

    // Check B: Voice compliance (AI call)
    const voiceViolations = await checkVoiceCompliance(
      sections,
      brandGuidelines
    );

    // Check C: Missing elements
    const missingElementViolations = checkMissingElements(
      sections,
      brandGuidelines,
      companyName
    );

    const allViolations = [
      ...bannedWordViolations,
      ...voiceViolations,
      ...missingElementViolations,
    ];

    const score = calculateScore(allViolations);

    const result: BrandComplianceResult = {
      score,
      status: getStatus(score),
      violations: allViolations,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Brand compliance check failed' },
      { status: 500 }
    );
  }
}
