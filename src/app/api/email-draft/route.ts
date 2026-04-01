import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { getKnowledgeBase } from '@/lib/knowledgeBase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contentType, prospectName, contentPreview } = await req.json();
  const kb = getKnowledgeBase();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Generate a professional email to send with an attached sales document.

Company: ${kb.companyName || 'Our company'}
Prospect: ${prospectName}
Document type: ${contentType}
Content preview (first 200 chars): ${contentPreview.slice(0, 200)}

Respond ONLY with valid JSON:
{
  "subject": "<email subject line>",
  "body": "<2-3 sentence professional email body referencing the attached document>"
}`
    }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch {
    return NextResponse.json({
      subject: `${contentType.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} for ${prospectName}`,
      body: `Hi,\n\nPlease find attached the ${contentType.replace(/-/g, ' ')} we prepared for ${prospectName}. I'd love to schedule a brief call to walk through the key points.\n\nBest regards`,
    });
  }
}
