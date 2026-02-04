import pdf from 'pdf-parse';
import { ResumeMetadata } from '@/types';

interface PDFParseResult {
  text: string;
  metadata: Partial<ResumeMetadata>;
}

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  let data;
  try {
    data = await pdf(buffer);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific PDF parsing errors with user-friendly messages
    if (errorMessage.includes('bad XRef entry') || errorMessage.includes('XRef')) {
      throw new Error('This PDF has a corrupted structure. Please try re-saving it from your PDF editor or converting it to a new PDF.');
    }
    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      throw new Error('This PDF is password-protected. Please remove the password protection and try again.');
    }
    if (errorMessage.includes('Invalid PDF')) {
      throw new Error('This file does not appear to be a valid PDF. Please check the file and try again.');
    }

    // Generic error
    throw new Error(`Could not read this PDF file. Try re-exporting it from your word processor or PDF editor. (${errorMessage})`);
  }

  // Post-process text to fix common PDF extraction issues
  const processedText = postProcessPDFText(data.text);

  const hasImages = detectImages(data);
  const hasTables = detectTables(processedText);
  const hasColumns = detectColumns(processedText);
  const hasHeadersFooters = detectHeadersFooters(processedText);

  return {
    text: processedText,
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

/**
 * Post-process PDF extracted text to fix common issues:
 * - Merge hyphenated words split across lines (e.g., "context-\naware" -> "context-aware")
 * - Fix words that got concatenated without spaces
 * - Normalize whitespace
 */
function postProcessPDFText(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let currentLine = lines[i];
    const nextLine = lines[i + 1];

    // Check if current line ends with a hyphen (word break)
    if (currentLine.endsWith('-') && nextLine) {
      const nextTrimmed = nextLine.trim();
      // If next line starts with lowercase, it's a continuation of a hyphenated word
      if (nextTrimmed && /^[a-z]/.test(nextTrimmed)) {
        // Remove the hyphen and merge with next line
        currentLine = currentLine.slice(0, -1) + nextTrimmed;
        i++; // Skip the next line since we merged it
      }
    }

    // Check if current line ends mid-word (no space/punctuation) and next starts lowercase
    // This handles cases where PDF extraction drops line breaks incorrectly
    if (nextLine && currentLine.length > 0) {
      const lastChar = currentLine[currentLine.length - 1];
      const nextTrimmed = nextLine.trim();

      // If line ends with a letter and next line starts lowercase, might need merging
      if (/[a-zA-Z]$/.test(currentLine) && nextTrimmed && /^[a-z]/.test(nextTrimmed)) {
        // Check if it looks like a broken word (no punctuation at end)
        if (!/[.!?,;:\s]$/.test(currentLine)) {
          // Merge with a space
          currentLine = currentLine + ' ' + nextTrimmed;
          i++; // Skip the next line
        }
      }
    }

    result.push(currentLine);
  }

  // Additional cleanup: fix common concatenation issues
  let processedText = result.join('\n');

  // Fix bullet points that got merged with previous text (e.g., "text•" -> "text\n•")
  processedText = processedText.replace(/([a-zA-Z.!?])([•\-\*])\s*/g, '$1\n$2 ');

  // Normalize multiple spaces to single space (but preserve newlines)
  processedText = processedText.replace(/[^\S\n]+/g, ' ');

  // Normalize multiple newlines to max 2
  processedText = processedText.replace(/\n{3,}/g, '\n\n');

  return processedText.trim();
}
