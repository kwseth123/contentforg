import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

const anthropic = new Anthropic();

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const { parsePDF } = await import('@/lib/fileParser');
    const result = { text: await parsePDF(buffer) };
    return result.text || '';
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
    // .doc files — best effort: extract as text
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // CSV, TXT, and other text formats
  return await file.text();
}

async function processContent(text: string, fileName: string, contentType: string): Promise<any> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze this content and extract intelligence. Return a JSON object with these fields:
- summary: 2-3 sentence summary
- insights: array of 3-8 key insights (specific, actionable strings)
- entities: array of company names, product names, people mentioned
- tags: array of 5-10 relevant tags
- category: one of "product", "competitive", "customer", "market"
- confidence: 0-100 confidence score

Content from "${fileName}" (${contentType}):

${text.slice(0, 8000)}

Return ONLY valid JSON, no markdown.`
    }],
  });

  try {
    const responseText = (message.content[0] as any).text;
    return JSON.parse(responseText);
  } catch {
    return {
      summary: 'Content processed but AI analysis failed.',
      insights: [],
      entities: [],
      tags: [],
      category: 'product',
      confidence: 30,
    };
  }
}

function buildBrainItem(id: string, fileName: string, contentType: string, rawText: string, analysis: any) {
  return {
    id,
    company_id: 'default',
    filename: fileName,
    content_type: contentType,
    extracted_text: rawText.slice(0, 50000),
    summary: analysis.summary || '',
    insights: analysis.insights || [],
    entities: analysis.entities || [],
    tags: analysis.tags || [],
    category: analysis.category || 'product',
    confidence: analysis.confidence || 50,
    source_count: 1,
    status: 'processed',
    processed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contentTypeHeader = request.headers.get('content-type') || '';
    let processed = 0;

    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];

      for (const file of files.slice(0, 20)) {
        try {
          const text = await extractTextFromFile(file);
          if (!text.trim()) {
            console.warn(`[Brain] Empty extraction for ${file.name}`);
            continue;
          }
          const analysis = await processContent(text, file.name, file.type);
          const ct = file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'txt';
          await db.addBrainItem('default', buildBrainItem(uuidv4(), file.name, ct, text, analysis));
          processed++;
        } catch (fileErr) {
          console.error(`[Brain] Failed to process ${file.name}:`, fileErr);
        }
      }
    } else {
      const body = await request.json();
      const { text, url, type } = body;

      let content = text || '';
      let fileName = type === 'url' ? url : 'Pasted Text';

      if (type === 'url' && url) {
        try {
          const res = await fetch(url);
          content = await res.text();
          content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
          content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          content = content.replace(/<[^>]+>/g, ' ');
          content = content.replace(/\s+/g, ' ').trim();
        } catch {
          return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
        }
      }

      if (content.trim()) {
        const analysis = await processContent(content, fileName, type);
        await db.addBrainItem('default', buildBrainItem(uuidv4(), fileName, type || 'paste', content, analysis));
        processed = 1;
      }
    }

    return NextResponse.json({ processed });
  } catch (err) {
    console.error('Brain upload error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
