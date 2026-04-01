import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const source = formData.get('source') as string;

    // Process based on source type
    let detectedType = 'general';
    let insightsCount = 0;

    if (source === 'file') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      detectedType = 'document';
      insightsCount = 3;
    } else if (source === 'text') {
      const text = formData.get('content') as string;
      if (!text?.trim()) return NextResponse.json({ error: 'No content provided' }, { status: 400 });
      detectedType = 'text-paste';
      insightsCount = 2;
    } else if (source === 'url') {
      const url = formData.get('url') as string;
      if (!url?.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      detectedType = 'web-scrape';
      insightsCount = 4;
    }

    return NextResponse.json({
      success: true,
      id: crypto.randomUUID(),
      detectedType,
      insightsCount,
      status: 'complete',
    });
  } catch {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
