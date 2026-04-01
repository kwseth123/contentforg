import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseFile } from '@/lib/fileParser';
import { v4 as uuidv4 } from 'uuid';
import * as db from '@/lib/db';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const purpose = formData.get('purpose') as string; // 'knowledge-base' | 'session' | 'logo' | 'logo-secondary' | 'brand-voice'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // ── Logo uploads (primary and secondary) ──
  if (purpose === 'logo' || purpose === 'logo-secondary') {
    const ext = '.' + (file.name.split('.').pop() || 'png').toLowerCase();
    const mime = MIME_MAP[ext] || 'image/png';
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    const logoType = purpose === 'logo-secondary' ? 'secondary' : 'primary';

    await db.saveLogo('default', logoType, dataUrl);

    // Return a logoPath that the KB can reference
    const logoPath = dataUrl;
    return NextResponse.json({ logoPath });
  }

  // ── Brand voice document upload ──
  if (purpose === 'brand-voice') {
    try {
      const content = await parseFile(buffer, file.name);
      return NextResponse.json({
        id: uuidv4(),
        fileName: file.name,
        content,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to parse brand voice document: ${(error as Error).message}` },
        { status: 400 }
      );
    }
  }

  try {
    const content = await parseFile(buffer, file.name);
    if (!content || content.trim().length < 10) {
      console.error(`[upload] Parsed content too short for file: ${file.name} (${content?.length ?? 0} chars)`);
      return NextResponse.json(
        { error: 'Could not extract meaningful text from this file. Try a text-based PDF or paste the content manually.' },
        { status: 400 }
      );
    }
    return NextResponse.json({
      id: uuidv4(),
      fileName: file.name,
      content,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[upload] File parse error for ${file.name}:`, (error as Error).message);
    return NextResponse.json(
      { error: `Failed to parse file: ${(error as Error).message}` },
      { status: 400 }
    );
  }
}
