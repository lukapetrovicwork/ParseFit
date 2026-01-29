import { parsePDF } from './pdf-parser';
import { parseDOCX } from './docx-parser';
import { normalizeText, extractBullets } from './text-normalizer';
import { ParsedResume, ResumeMetadata, ResumeSection, SectionType } from '@/types';
import { detectSections } from '@/lib/nlp/section-detector';

export async function parseResume(buffer: Buffer, fileType: string, fileSize: number): Promise<ParsedResume> {
  let rawText: string;
  let partialMetadata: Partial<ResumeMetadata>;

  if (fileType === 'application/pdf') {
    const result = await parsePDF(buffer);
    rawText = result.text;
    partialMetadata = result.metadata;
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await parseDOCX(buffer);
    rawText = result.text;
    partialMetadata = result.metadata;
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  const normalizedText = normalizeText(rawText);
  const sections = detectSections(normalizedText);

  const sectionsWithBullets: ResumeSection[] = sections.map(section => ({
    ...section,
    bullets: extractBullets(section.content),
  }));

  const metadata: ResumeMetadata = {
    wordCount: partialMetadata.wordCount || countWords(normalizedText),
    lineCount: partialMetadata.lineCount || countLines(normalizedText),
    hasImages: partialMetadata.hasImages || false,
    hasTables: partialMetadata.hasTables || false,
    hasColumns: partialMetadata.hasColumns || false,
    hasHeadersFooters: partialMetadata.hasHeadersFooters || false,
    estimatedPages: partialMetadata.estimatedPages || 1,
    fileSize,
    fileType: fileType === 'application/pdf' ? 'pdf' : 'docx',
  };

  return {
    rawText,
    normalizedText,
    sections: sectionsWithBullets,
    metadata,
  };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function countLines(text: string): number {
  return text.split('\n').filter(line => line.trim().length > 0).length;
}

export { normalizeText, extractBullets } from './text-normalizer';
export { parsePDF } from './pdf-parser';
export { parseDOCX } from './docx-parser';
