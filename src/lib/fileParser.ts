import * as mammoth from 'mammoth';

export interface PDFResult {
  text: string;
  numpages?: number;
}

export async function parsePDF(buffer: Buffer): Promise<string>;
export async function parsePDF(buffer: Buffer, opts: { withMeta: true }): Promise<PDFResult>;
export async function parsePDF(buffer: Buffer, opts?: { withMeta: true }): Promise<string | PDFResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF file is empty or corrupt');
  }
  try {
    // Use the inner module to avoid pdf-parse's default test-file loader
    // which fails with ENOENT looking for test/data/05-versions-space.pdf
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require('pdf-parse/lib/pdf-parse.js');
    const data = await pdf(buffer);
    const text = (data.text || '').trim();
    if (!text || text.length < 10) {
      throw new Error(
        'Could not extract text from this PDF. It may be scanned/image-based. Try a text-based PDF or paste the content manually.'
      );
    }
    if (opts?.withMeta) {
      return { text, numpages: data.numpages };
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Could not extract text')) {
      throw err;
    }
    throw new Error(
      `Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}. Try a different file or paste the content manually.`
    );
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error('DOCX file is empty or corrupt');
  }
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();
    if (!text || text.length < 10) {
      throw new Error(
        'Could not extract text from this document. The file may be empty or contain only images.'
      );
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Could not extract text')) {
      throw err;
    }
    throw new Error(
      `Failed to parse DOCX: ${err instanceof Error ? err.message : 'Unknown error'}. Try a different format or paste content manually.`
    );
  }
}

export async function parseFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf':
      return parsePDF(buffer);
    case 'docx':
      return parseDOCX(buffer);
    case 'txt':
    case 'md': {
      const text = buffer.toString('utf-8').trim();
      if (!text || text.length < 10) {
        throw new Error('File is empty or contains very little text.');
      }
      return text;
    }
    default:
      throw new Error(`Unsupported file type: .${ext}. Supported formats: PDF, DOCX, TXT, MD.`);
  }
}
