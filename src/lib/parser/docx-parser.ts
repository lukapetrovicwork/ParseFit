import mammoth from 'mammoth';
import { ResumeMetadata } from '@/types';

interface DOCXParseResult {
  text: string;
  metadata: Partial<ResumeMetadata>;
}

export async function parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });

  const text = result.value;
  const html = htmlResult.value;

  const hasImages = detectImagesInDocx(html, result.messages);
  const hasTables = detectTablesInDocx(html);
  const hasColumns = detectColumnsInDocx(text);

  return {
    text,
    metadata: {
      wordCount: countWords(text),
      lineCount: countLines(text),
      hasImages,
      hasTables,
      hasColumns,
      hasHeadersFooters: false,
      estimatedPages: estimatePages(text),
      fileType: 'docx',
    },
  };
}

function detectImagesInDocx(html: string, messages: mammoth.Message[]): boolean {
  if (html.includes('<img')) {
    return true;
  }

  for (const msg of messages) {
    if (msg.type === 'warning' && msg.message.toLowerCase().includes('image')) {
      return true;
    }
  }

  return false;
}

function detectTablesInDocx(html: string): boolean {
  return html.includes('<table') || html.includes('<tr') || html.includes('<td');
}

function detectColumnsInDocx(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  let shortLineCount = 0;
  let totalLines = 0;

  for (const line of lines) {
    totalLines++;
    if (line.length < 50 && line.trim().length > 5) {
      shortLineCount++;
    }
  }

  const shortLineRatio = shortLineCount / totalLines;

  const hasLargeGaps = lines.some(line => {
    const gapMatch = line.match(/\S\s{10,}\S/);
    return gapMatch !== null;
  });

  return shortLineRatio > 0.6 || hasLargeGaps;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function countLines(text: string): number {
  return text.split('\n').filter(line => line.trim().length > 0).length;
}

function estimatePages(text: string): number {
  const wordsPerPage = 500;
  const wordCount = countWords(text);
  return Math.max(1, Math.ceil(wordCount / wordsPerPage));
}
