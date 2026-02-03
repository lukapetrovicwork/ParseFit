import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { BulletAnalysis, SectionType, ResumeSection } from '@/types';

interface AIOptimizedBullet {
  original: string;
  optimized: string;
  section: string;
}

interface OptimizedResumeData {
  resumeText: string;
  bulletAnalysis: BulletAnalysis[];
  missingKeywords: string[];
  foundKeywords: string[];
  fileName: string;
  parsedSections?: ResumeSection[];
  aiOptimizedBullets?: AIOptimizedBullet[];
  aiOptimizedSummary?: string;
}

interface ProcessedSection {
  type: string;
  title: string;
  entries: SectionEntry[];
}

interface SectionEntry {
  title?: string;
  subtitle?: string;
  date?: string;
  bullets: string[];
}

interface ContactInfo {
  name: string;
  lines: string[];
}

// Section display titles
const SECTION_TITLES: Record<string, string> = {
  summary: 'SUMMARY',
  experience: 'EXPERIENCE',
  education: 'EDUCATION',
  skills: 'SKILLS',
  projects: 'PROJECTS',
  certifications: 'CERTIFICATIONS',
  awards: 'AWARDS',
  publications: 'PUBLICATIONS',
  languages: 'LANGUAGES',
  interests: 'INTERESTS',
  references: 'REFERENCES',
  unknown: 'OTHER',
};

// Page dimensions (Letter size in points)
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Convert stored ResumeSection to ProcessedSection
function convertStoredSections(storedSections: ResumeSection[]): ProcessedSection[] {
  return storedSections
    .filter(s => s.name !== 'unknown' || s.bullets.length > 0)
    .map(section => {
      const title = SECTION_TITLES[section.name] || section.name.toUpperCase();
      const entries = parseContentIntoEntries(section.name, section.content, section.bullets);
      return { type: section.name, title, entries };
    });
}

// Check if line looks like a date range
function hasDatePattern(line: string): boolean {
  return /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}/i.test(line) ||
         /\d{1,2}\/\d{4}/i.test(line) ||
         /\d{4}\s*[-–—]\s*(present|\d{4}|current)/i.test(line) ||
         /\b(present|current)\s*$/i.test(line);
}

// Check if line looks like a bullet point
function isBulletLine(line: string): boolean {
  return /^[•\-\*\u2022\u2023\u25E6\u2043]\s/.test(line) ||
         /^\d+\.\s/.test(line); // Numbered lists
}

// Extract date from a line
function extractDate(line: string): string | null {
  // Match common date patterns
  const patterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\s*[-–—]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\s*[-–—]\s*(present|current)/i,
    /\d{4}\s*[-–—]\s*(present|\d{4}|current)/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}/i,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) return match[0];
  }
  return null;
}

// Parse section content into structured entries
function parseContentIntoEntries(
  sectionType: string,
  content: string,
  bullets: string[]
): SectionEntry[] {
  // Skills, languages, interests - simple list format
  if (['skills', 'languages', 'interests'].includes(sectionType)) {
    if (bullets.length > 0) {
      return [{ bullets }];
    }
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return [{ bullets: lines }];
  }

  // Summary - single paragraph
  if (sectionType === 'summary') {
    const text = bullets.length > 0
      ? bullets.join(' ')
      : content.replace(/\n+/g, ' ').trim();
    return [{ bullets: [text] }];
  }

  // Experience, Education, Projects, etc. - structured entries
  const contentLines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // If we have pre-extracted bullets, use a simpler approach
  if (bullets.length > 0) {
    // Try to find entry headers (company/school names) and associate bullets
    const entries: SectionEntry[] = [];
    let currentEntry: SectionEntry = { bullets: [] };
    let bulletIndex = 0;

    for (const line of contentLines) {
      if (isBulletLine(line)) {
        // Use pre-extracted bullet if available
        const bulletText = bulletIndex < bullets.length
          ? bullets[bulletIndex++]
          : line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\d+\.]\s*/, '');
        currentEntry.bullets.push(bulletText);
      } else {
        // Non-bullet line - could be title, subtitle, or date
        const date = extractDate(line);

        if (date && currentEntry.title) {
          // Date for current entry
          currentEntry.date = date;
        } else if (!currentEntry.title) {
          // First non-bullet line is the title
          currentEntry.title = line;
          const extractedDate = extractDate(line);
          if (extractedDate) {
            currentEntry.date = extractedDate;
            // Remove date from title if it was embedded
            currentEntry.title = line.replace(extractedDate, '').replace(/\s*[-–—|,]\s*$/, '').trim();
          }
        } else if (!currentEntry.subtitle && line.length < 80 && !date) {
          // Second non-bullet line could be subtitle (role, degree, etc.)
          currentEntry.subtitle = line;
        } else if (currentEntry.bullets.length > 0 && !isBulletLine(line)) {
          // We have bullets already and hit a new non-bullet line
          // This is likely a new entry
          if (currentEntry.title || currentEntry.bullets.length > 0) {
            entries.push(currentEntry);
          }
          currentEntry = { title: line, bullets: [] };
          const extractedDate = extractDate(line);
          if (extractedDate) {
            currentEntry.date = extractedDate;
            currentEntry.title = line.replace(extractedDate, '').replace(/\s*[-–—|,]\s*$/, '').trim();
          }
        }
      }
    }

    // Push the last entry
    if (currentEntry.title || currentEntry.bullets.length > 0) {
      entries.push(currentEntry);
    }

    // If no entries were created, just return bullets as-is
    if (entries.length === 0 && bullets.length > 0) {
      return [{ bullets }];
    }

    return entries;
  }

  // Fallback: No pre-extracted bullets, parse everything from content
  const entries: SectionEntry[] = [];
  let currentEntry: SectionEntry | null = null;

  for (const line of contentLines) {
    if (isBulletLine(line)) {
      const bulletText = line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\d+\.]\s*/, '');
      if (currentEntry) {
        currentEntry.bullets.push(bulletText);
      } else {
        currentEntry = { bullets: [bulletText] };
      }
    } else {
      // Non-bullet line
      const date = extractDate(line);
      const isShort = line.length < 80;

      if (!currentEntry || (currentEntry.bullets.length > 0 && isShort && !date)) {
        // Start new entry
        if (currentEntry) {
          entries.push(currentEntry);
        }
        currentEntry = { title: line, bullets: [] };
        if (date) {
          currentEntry.date = date;
          currentEntry.title = line.replace(date, '').replace(/\s*[-–—|,]\s*$/, '').trim();
        }
      } else if (date) {
        currentEntry.date = date;
      } else if (!currentEntry.subtitle && isShort) {
        currentEntry.subtitle = line;
      } else {
        currentEntry.bullets.push(line);
      }
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries.length > 0 ? entries : [{ bullets: [] }];
}

// Section header patterns for detecting where contact info ends
const SECTION_HEADER_PATTERNS = [
  /^(professional\s+)?summary$/i,
  /^(career\s+)?objective$/i,
  /^(career\s+)?profile$/i,
  /^(work\s+)?experience$/i,
  /^(professional\s+)?experience$/i,
  /^education$/i,
  /^(technical\s+)?skills?$/i,
  /^(core\s+)?competencies$/i,
  /^projects?$/i,
  /^certifications?$/i,
  /^awards?$/i,
  /^publications?$/i,
  /^languages?$/i,
  /^interests?$/i,
  /^references?$/i,
];

function isSectionHeader(line: string): boolean {
  const cleanLine = line.replace(/[:\-_•|]/g, '').trim();
  return SECTION_HEADER_PATTERNS.some(pattern => pattern.test(cleanLine));
}

// Extract contact info from resume text (lines before first section)
function extractContactInfo(resumeText: string, firstSectionLineIndex?: number): ContactInfo {
  const allLines = resumeText.split('\n');

  // Find where the header ends - either at firstSectionLineIndex or when we hit a section header
  let headerEndLine = firstSectionLineIndex ?? allLines.length;

  // Double-check by scanning for section headers (in case startIndex is wrong)
  for (let i = 0; i < Math.min(headerEndLine, 20); i++) {
    const line = allLines[i]?.trim() || '';
    if (isSectionHeader(line)) {
      headerEndLine = i;
      break;
    }
  }

  // Get header lines (non-empty lines before the first section)
  const headerLines = allLines
    .slice(0, headerEndLine)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (headerLines.length === 0) {
    return { name: '', lines: [] };
  }

  // First line is the name
  const name = headerLines[0];

  // Rest are contact details (email, phone, location, LinkedIn, etc.)
  const contactLines: string[] = [];
  for (let i = 1; i < headerLines.length; i++) {
    const line = headerLines[i];
    // Stop if we somehow hit a section header
    if (isSectionHeader(line)) break;
    contactLines.push(line);
  }

  return { name, lines: contactLines };
}

// Fallback: Parse resume text when stored sections not available
function parseResumeTextFallback(resumeText: string): { contact: ContactInfo; sections: ProcessedSection[] } {
  const SECTION_PATTERNS: { pattern: RegExp; type: string }[] = [
    { pattern: /^(professional\s+)?summary$/i, type: 'summary' },
    { pattern: /^(work\s+|professional\s+)?experience$/i, type: 'experience' },
    { pattern: /^education$/i, type: 'education' },
    { pattern: /^(core\s+|technical\s+)?skills?$/i, type: 'skills' },
    { pattern: /^(technical\s+)?projects?$/i, type: 'projects' },
    { pattern: /^certifications?$/i, type: 'certifications' },
    { pattern: /^awards?/i, type: 'awards' },
    { pattern: /^languages?$/i, type: 'languages' },
  ];

  const lines = resumeText.split('\n');
  const sections: ProcessedSection[] = [];
  let currentSection: { type: string; content: string[] } | null = null;
  const headerLines: string[] = [];
  let foundFirstSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let matchedType: string | null = null;
    for (const { pattern, type } of SECTION_PATTERNS) {
      if (pattern.test(line)) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      foundFirstSection = true;
      if (currentSection) {
        sections.push({
          type: currentSection.type,
          title: SECTION_TITLES[currentSection.type] || currentSection.type.toUpperCase(),
          entries: parseContentIntoEntries(currentSection.type, currentSection.content.join('\n'), []),
        });
      }
      currentSection = { type: matchedType, content: [] };
    } else if (!foundFirstSection) {
      headerLines.push(line);
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    sections.push({
      type: currentSection.type,
      title: SECTION_TITLES[currentSection.type] || currentSection.type.toUpperCase(),
      entries: parseContentIntoEntries(currentSection.type, currentSection.content.join('\n'), []),
    });
  }

  const contact: ContactInfo = {
    name: headerLines[0] || '',
    lines: headerLines.slice(1),
  };

  return { contact, sections };
}

// Apply bullet rewrites from AI or rule-based analysis
function applyOptimizations(
  sections: ProcessedSection[],
  bulletAnalysis: BulletAnalysis[],
  aiOptimizedBullets?: AIOptimizedBullet[]
): ProcessedSection[] {
  const bulletRewrites = new Map<string, string>();

  // Prioritize AI-optimized bullets if available
  if (aiOptimizedBullets && aiOptimizedBullets.length > 0) {
    for (const aiBullet of aiOptimizedBullets) {
      const normalized = aiBullet.original.toLowerCase().trim().substring(0, 60);
      bulletRewrites.set(normalized, aiBullet.optimized);
    }
  } else {
    // Fallback to rule-based rewrites
    for (const analysis of bulletAnalysis) {
      if (analysis.rewriteSuggestion && analysis.score < 80) {
        const normalized = analysis.text.toLowerCase().trim().substring(0, 60);
        bulletRewrites.set(normalized, analysis.rewriteSuggestion);
      }
    }
  }

  if (bulletRewrites.size === 0) return sections;

  return sections.map(section => ({
    ...section,
    entries: section.entries.map(entry => ({
      ...entry,
      bullets: entry.bullets.map(bullet => {
        const normalized = bullet.toLowerCase().trim().substring(0, 60);
        for (const [original, rewrite] of bulletRewrites) {
          if (normalized === original ||
              normalized.includes(original.substring(0, 40)) ||
              original.includes(normalized.substring(0, 40))) {
            return rewrite;
          }
        }
        return bullet;
      }),
    })),
  }));
}

// Add missing keywords to skills
function addMissingKeywords(
  sections: ProcessedSection[],
  missingKeywords: string[]
): ProcessedSection[] {
  if (missingKeywords.length === 0) return sections;

  const skillsIdx = sections.findIndex(s => s.type === 'skills');

  if (skillsIdx >= 0) {
    const skills = sections[skillsIdx];
    const existing = skills.entries.flatMap(e => e.bullets).join(' ').toLowerCase();
    const toAdd = missingKeywords.filter(kw => !existing.includes(kw.toLowerCase())).slice(0, 8);

    if (toAdd.length > 0 && skills.entries.length > 0) {
      const lastEntry = skills.entries[skills.entries.length - 1];
      if (lastEntry.bullets.length > 0) {
        lastEntry.bullets[lastEntry.bullets.length - 1] += ', ' + toAdd.join(', ');
      } else {
        lastEntry.bullets.push(toAdd.join(', '));
      }
    }
  }

  return sections;
}

// Helper to wrap text to fit within a width
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// PDF Generator class to handle page management
class PDFGenerator {
  private doc: PDFDocument;
  private currentPage: PDFPage;
  private yPosition: number;
  private regularFont!: PDFFont;
  private boldFont!: PDFFont;
  private italicFont!: PDFFont;

  constructor(doc: PDFDocument) {
    this.doc = doc;
    this.currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.yPosition = PAGE_HEIGHT - MARGIN_TOP;
  }

  async initFonts() {
    this.regularFont = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.italicFont = await this.doc.embedFont(StandardFonts.HelveticaOblique);
  }

  private checkNewPage(neededHeight: number) {
    if (this.yPosition - neededHeight < MARGIN_BOTTOM) {
      this.currentPage = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.yPosition = PAGE_HEIGHT - MARGIN_TOP;
    }
  }

  drawCenteredText(text: string, fontSize: number, bold: boolean = false) {
    const font = bold ? this.boldFont : this.regularFont;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const x = (PAGE_WIDTH - textWidth) / 2;

    this.checkNewPage(fontSize + 4);
    this.currentPage.drawText(text, {
      x,
      y: this.yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    this.yPosition -= fontSize + 4;
  }

  drawText(text: string, fontSize: number, options: {
    bold?: boolean;
    italic?: boolean;
    indent?: number;
    color?: { r: number; g: number; b: number };
    rightAlign?: string;
  } = {}) {
    const font = options.bold ? this.boldFont : options.italic ? this.italicFont : this.regularFont;
    const x = MARGIN_LEFT + (options.indent || 0);
    const maxWidth = CONTENT_WIDTH - (options.indent || 0);
    const color = options.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0, 0, 0);

    const lines = wrapText(text, font, fontSize, maxWidth);

    for (const line of lines) {
      this.checkNewPage(fontSize + 2);
      this.currentPage.drawText(line, {
        x,
        y: this.yPosition,
        size: fontSize,
        font,
        color,
      });

      // Draw right-aligned text on the same line (for dates)
      if (options.rightAlign && lines.indexOf(line) === 0) {
        const rightText = options.rightAlign;
        const rightWidth = this.regularFont.widthOfTextAtSize(rightText, fontSize - 1);
        this.currentPage.drawText(rightText, {
          x: PAGE_WIDTH - MARGIN_RIGHT - rightWidth,
          y: this.yPosition,
          size: fontSize - 1,
          font: this.regularFont,
          color: rgb(0.33, 0.33, 0.33),
        });
      }

      this.yPosition -= fontSize + 2;
    }
  }

  drawSectionHeader(title: string) {
    this.checkNewPage(20);
    this.yPosition -= 8; // Extra space before section

    // Draw the header text
    this.currentPage.drawText(title, {
      x: MARGIN_LEFT,
      y: this.yPosition,
      size: 11,
      font: this.boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw underline
    const textWidth = this.boldFont.widthOfTextAtSize(title, 11);
    this.currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: this.yPosition - 2 },
      end: { x: MARGIN_LEFT + textWidth, y: this.yPosition - 2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    this.yPosition -= 16;
  }

  drawBullet(text: string, fontSize: number = 10) {
    const bulletChar = '•';
    const bulletIndent = 15;
    const textIndent = 25;

    this.checkNewPage(fontSize + 2);

    // Draw bullet
    this.currentPage.drawText(bulletChar, {
      x: MARGIN_LEFT + bulletIndent,
      y: this.yPosition,
      size: fontSize,
      font: this.regularFont,
      color: rgb(0, 0, 0),
    });

    // Draw wrapped text
    const maxWidth = CONTENT_WIDTH - textIndent;
    const lines = wrapText(text, this.regularFont, fontSize, maxWidth);

    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        this.checkNewPage(fontSize + 2);
      }
      this.currentPage.drawText(lines[i], {
        x: MARGIN_LEFT + textIndent,
        y: this.yPosition,
        size: fontSize,
        font: this.regularFont,
        color: rgb(0, 0, 0),
      });
      this.yPosition -= fontSize + 2;
    }
  }

  addSpace(height: number) {
    this.yPosition -= height;
  }
}

// Generate PDF
export async function generateOptimizedResume(
  data: OptimizedResumeData
): Promise<Buffer> {
  let contact: ContactInfo;
  let sections: ProcessedSection[];

  // Use stored sections if available, otherwise parse from text
  if (data.parsedSections && data.parsedSections.length > 0) {
    const firstSectionStart = data.parsedSections[0]?.startIndex;
    contact = extractContactInfo(data.resumeText, firstSectionStart);
    sections = convertStoredSections(data.parsedSections);
  } else {
    const parsed = parseResumeTextFallback(data.resumeText);
    contact = parsed.contact;
    sections = parsed.sections;
  }

  // Apply optimizations (AI-powered if available, rule-based otherwise)
  let optimizedSections = applyOptimizations(sections, data.bulletAnalysis, data.aiOptimizedBullets);
  optimizedSections = addMissingKeywords(optimizedSections, data.missingKeywords);

  // Apply AI-optimized summary if available
  if (data.aiOptimizedSummary) {
    const summaryIdx = optimizedSections.findIndex(s => s.type === 'summary');
    if (summaryIdx >= 0) {
      optimizedSections[summaryIdx].entries = [{ bullets: [data.aiOptimizedSummary] }];
    } else {
      // Add summary section at the beginning if it doesn't exist
      optimizedSections.unshift({
        type: 'summary',
        title: 'SUMMARY',
        entries: [{ bullets: [data.aiOptimizedSummary] }],
      });
    }
  }

  // Create PDF document
  const doc = await PDFDocument.create();
  const generator = new PDFGenerator(doc);
  await generator.initFonts();

  // Name - centered, large
  if (contact.name) {
    generator.drawCenteredText(contact.name, 20, true);
  }

  // Contact info - centered
  for (const line of contact.lines) {
    generator.drawCenteredText(line, 9);
  }

  generator.addSpace(10);

  // Sections
  for (const section of optimizedSections) {
    generator.drawSectionHeader(section.title);

    for (const entry of section.entries) {
      // Entry header with date
      if (entry.title) {
        generator.drawText(entry.title, 10, {
          bold: true,
          rightAlign: entry.date,
        });
      } else if (entry.date) {
        generator.drawText(entry.date, 9, { color: { r: 0.33, g: 0.33, b: 0.33 } });
      }

      // Subtitle
      if (entry.subtitle) {
        generator.drawText(entry.subtitle, 10, { italic: true });
      }

      // Content/bullets
      if (entry.bullets.length > 0) {
        if (['skills', 'languages', 'interests'].includes(section.type)) {
          // Skills-type: comma-separated
          generator.drawText(entry.bullets.join(', '), 10);
        } else if (section.type === 'summary') {
          // Summary: paragraph
          generator.drawText(entry.bullets.join(' '), 10);
        } else {
          // Regular bullets
          for (const bullet of entry.bullets) {
            generator.drawBullet(bullet);
          }
        }
      }

      generator.addSpace(4);
    }
  }

  // Save and return
  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

// Preview data for UI
export function getOptimizationPreview(
  bulletAnalysis: BulletAnalysis[],
  missingKeywords: string[]
): {
  optimizedBullets: Array<{ original: string; optimized: string; section: SectionType }>;
  keywordsToAdd: string[];
  totalImprovements: number;
} {
  const optimizedBullets = bulletAnalysis
    .filter(b => b.rewriteSuggestion && b.score < 80)
    .map(b => ({
      original: b.text,
      optimized: b.rewriteSuggestion!,
      section: b.section,
    }));

  return {
    optimizedBullets,
    keywordsToAdd: missingKeywords.slice(0, 15),
    totalImprovements: optimizedBullets.length + Math.min(missingKeywords.length, 10),
  };
}
