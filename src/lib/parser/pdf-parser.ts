import pdf from 'pdf-parse';
import { ResumeMetadata } from '@/types';

interface PDFParseResult {
  text: string;
  metadata: Partial<ResumeMetadata>;
}

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  const data = await pdf(buffer);

  const hasImages = detectImages(data);
  const hasTables = detectTables(data.text);
  const hasColumns = detectColumns(data.text);
  const hasHeadersFooters = detectHeadersFooters(data.text);

  return {
    text: data.text,
    metadata: {
      wordCount: countWords(data.text),
      lineCount: countLines(data.text),
      hasImages,
      hasTables,
      hasColumns,
      hasHeadersFooters,
      estimatedPages: data.numpages,
      fileType: 'pdf',
    },
  };
}

function detectImages(data: pdf.Result): boolean {
  if (data.info && typeof data.info === 'object') {
    const info = data.info as Record<string, unknown>;
    if (info.IsAcroFormPresent || info.IsXFAPresent) {
      return true;
    }
  }

  const textLength = data.text.length;
  const expectedMinLength = data.numpages * 500;

  if (textLength < expectedMinLength && data.numpages > 0) {
    return true;
  }

  return false;
}

function detectTables(text: string): boolean {
  const lines = text.split('\n');
  let consecutiveTabLines = 0;
  let consecutivePipeLines = 0;

  for (const line of lines) {
    const tabCount = (line.match(/\t/g) || []).length;
    const pipeCount = (line.match(/\|/g) || []).length;
    const multipleSpaces = (line.match(/\s{3,}/g) || []).length;

    if (tabCount >= 2 || pipeCount >= 2 || multipleSpaces >= 3) {
      consecutiveTabLines++;
      consecutivePipeLines++;
    } else {
      consecutiveTabLines = 0;
      consecutivePipeLines = 0;
    }

    if (consecutiveTabLines >= 3 || consecutivePipeLines >= 3) {
      return true;
    }
  }

  return false;
}

function detectColumns(text: string): boolean {
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

function detectHeadersFooters(text: string): boolean {
  const lines = text.split('\n');

  const patterns = [
    /page\s*\d+\s*(of\s*\d+)?/i,
    /^\d+$/,
    /confidential/i,
    /©\s*\d{4}/,
    /all rights reserved/i,
  ];

  let headerFooterCount = 0;

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    for (const pattern of patterns) {
      if (pattern.test(lines[i])) {
        headerFooterCount++;
        break;
      }
    }
  }

  for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
    for (const pattern of patterns) {
      if (pattern.test(lines[i])) {
        headerFooterCount++;
        break;
      }
    }
  }

  return headerFooterCount >= 2;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function countLines(text: string): number {
  return text.split('\n').filter(line => line.trim().length > 0).length;
}
