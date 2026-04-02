import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

const anthropic = new Anthropic();

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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contentTypeHeader = request.headers.get('content-type') || '';
    let processed = 0;

    if (contentTypeHeader.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];

      for (const file of files.slice(0, 20)) {
        const text = await file.text();
        const analysis = await processContent(text, file.name, file.type);

        await db.addBrainItem('default', {
          id: uuidv4(),
          company_id: 'default',
          file_name: file.name,
          content_type: file.type.includes('pdf') ? 'pdf' : file.type.includes('word') ? 'docx' : 'txt',
          raw_text: text.slice(0, 50000),
          summary: analysis.summary,
          insights: analysis.insights || [],
          entities: analysis.entities || [],
          tags: analysis.tags || [],
          category: analysis.category || 'product',
          confidence: analysis.confidence || 50,
          source_count: 1,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
        processed++;
      }
    } else {
      // JSON body (paste or URL)
      const body = await request.json();
      const { text, url, type } = body;

      let content = text || '';
      let fileName = type === 'url' ? url : 'Pasted Text';

      if (type === 'url' && url) {
        try {
          const res = await fetch(url);
          content = await res.text();
          // Basic HTML stripping
          content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
          content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          content = content.replace(/<[^>]+>/g, ' ');
          content = content.replace(/\s+/g, ' ').trim();
        } catch {
          return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
        }
      }

      if (content) {
        const analysis = await processContent(content, fileName, type);

        await db.addBrainItem('default', {
          id: uuidv4(),
          company_id: 'default',
          file_name: fileName,
          content_type: type || 'paste',
          raw_text: content.slice(0, 50000),
          summary: analysis.summary,
          insights: analysis.insights || [],
          entities: analysis.entities || [],
          tags: analysis.tags || [],
          category: analysis.category || 'product',
          confidence: analysis.confidence || 50,
          source_count: 1,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
        processed = 1;
      }
    }

    return NextResponse.json({ processed });
  } catch (err) {
    console.error('Brain upload error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
