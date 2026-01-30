import { TDocumentDefinitions, Content, ContentText, ContentColumns } from 'pdfmake/interfaces';
import { BulletAnalysis, SectionType, ResumeSection } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/src/printer');

// Define fonts for pdfmake (using built-in fonts)
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

interface OptimizedResumeData {
  resumeText: string;
  bulletAnalysis: BulletAnalysis[];
  missingKeywords: string[];
  foundKeywords: string[];
  fileName: string;
  parsedSections?: ResumeSection[]; // Stored sections from database
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

// Convert stored ResumeSection to ProcessedSection
function convertStoredSections(storedSections: ResumeSection[]): ProcessedSection[] {
  return storedSections
    .filter(s => s.name !== 'unknown' || s.bullets.length > 0)
    .map(section => {
      const title = SECTION_TITLES[section.name] || section.name.toUpperCase();

      // Parse the content to extract entries
      const entries = parseContentIntoEntries(section.name, section.content, section.bullets);

      return {
        type: section.name,
        title,
        entries,
      };
    });
}

// Parse section content into structured entries
function parseContentIntoEntries(
  sectionType: string,
  content: string,
  bullets: string[]
): SectionEntry[] {
  // Skills-type sections: just return bullets as-is
  if (['skills', 'languages', 'interests'].includes(sectionType)) {
    if (bullets.length > 0) {
      return [{ bullets }];
    }
    // Fall back to content lines
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return [{ bullets: lines }];
  }

  // Summary: combine into one paragraph
  if (sectionType === 'summary') {
    const text = bullets.length > 0
      ? bullets.join(' ')
      : content.replace(/\n+/g, ' ').trim();
    return [{ bullets: [text] }];
  }

  // Experience/Projects/Education: parse into entries with titles and bullets
  const contentLines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const entries: SectionEntry[] = [];
  let currentEntry: SectionEntry | null = null;
  let bulletIndex = 0;

  for (const line of contentLines) {
    const isBullet = /^[•\-\*\u2022\u2023\u25E6\u2043]\s/.test(line);
    const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}/i.test(line) ||
                    /\d{4}\s*[-–—]\s*(present|\d{4})/i.test(line) ||
                    /\b(present|current)\b/i.test(line);
    const isShort = line.length < 80;

    if (isBullet) {
      // Use the stored bullet if available, otherwise clean this line
      const bulletText = bulletIndex < bullets.length
        ? bullets[bulletIndex++]
        : line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043]\s*/, '');

      if (currentEntry) {
        currentEntry.bullets.push(bulletText);
      } else {
        currentEntry = { bullets: [bulletText] };
      }
    } else if (hasDate) {
      if (currentEntry) {
        currentEntry.date = line;
      } else {
        currentEntry = { title: line, bullets: [] };
      }
    } else if (isShort && (!currentEntry || currentEntry.bullets.length > 0)) {
      // Looks like a new entry title
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = { title: line, bullets: [] };
    } else if (currentEntry && !currentEntry.subtitle && isShort && !hasDate) {
      currentEntry.subtitle = line;
    } else if (currentEntry) {
      // Treat as bullet content
      currentEntry.bullets.push(line);
    } else {
      currentEntry = { title: line, bullets: [] };
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  // If no entries were created but we have bullets, create a single entry
  if (entries.length === 0 && bullets.length > 0) {
    entries.push({ bullets });
  }

  return entries;
}

// Extract contact info from resume text (header before first section)
function extractContactInfo(resumeText: string, firstSectionStart?: number): ContactInfo {
  const headerText = firstSectionStart
    ? resumeText.substring(0, firstSectionStart)
    : resumeText.substring(0, 500); // Fallback to first 500 chars

  const lines = headerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return { name: '', lines: [] };
  }

  // First line is usually the name
  const name = lines[0];
  const contactLines: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Skip if it looks like a section header
    if (/^(summary|experience|education|skills|projects)/i.test(line)) break;
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

// Apply bullet rewrites from analysis
function applyOptimizations(
  sections: ProcessedSection[],
  bulletAnalysis: BulletAnalysis[]
): ProcessedSection[] {
  const bulletRewrites = new Map<string, string>();

  for (const analysis of bulletAnalysis) {
    if (analysis.rewriteSuggestion && analysis.score < 80) {
      const normalized = analysis.text.toLowerCase().trim().substring(0, 60);
      bulletRewrites.set(normalized, analysis.rewriteSuggestion);
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

// Generate PDF
export async function generateOptimizedResume(
  data: OptimizedResumeData
): Promise<Buffer> {
  let contact: ContactInfo;
  let sections: ProcessedSection[];

  // Use stored sections if available, otherwise parse from text
  if (data.parsedSections && data.parsedSections.length > 0) {
    // Find the first section's start index for contact extraction
    const firstSectionStart = data.parsedSections[0]?.startIndex;
    contact = extractContactInfo(data.resumeText, firstSectionStart);
    sections = convertStoredSections(data.parsedSections);
  } else {
    // Fallback to text parsing
    const parsed = parseResumeTextFallback(data.resumeText);
    contact = parsed.contact;
    sections = parsed.sections;
  }

  // Apply optimizations
  let optimizedSections = applyOptimizations(sections, data.bulletAnalysis);
  optimizedSections = addMissingKeywords(optimizedSections, data.missingKeywords);

  const content: Content[] = [];

  // Name - centered, large
  if (contact.name) {
    content.push({
      text: contact.name,
      fontSize: 20,
      bold: true,
      alignment: 'center',
      margin: [0, 0, 0, 4],
    } as ContentText);
  }

  // Contact info - centered
  for (const line of contact.lines) {
    content.push({
      text: line,
      fontSize: 9,
      alignment: 'center',
      color: '#333333',
      margin: [0, 0, 0, 2],
    } as ContentText);
  }

  // Spacer after contact
  content.push({ text: '', margin: [0, 0, 0, 10] } as ContentText);

  // Sections
  for (const section of optimizedSections) {
    // Section header with underline
    content.push({
      text: section.title,
      fontSize: 11,
      bold: true,
      margin: [0, 8, 0, 4],
      decoration: 'underline',
    } as ContentText);

    // Section content
    for (const entry of section.entries) {
      // Entry header (title + date on same line if both exist)
      if (entry.title) {
        if (entry.date) {
          content.push({
            columns: [
              { text: entry.title, bold: true, fontSize: 10 },
              { text: entry.date, fontSize: 9, alignment: 'right', color: '#555555' },
            ],
            margin: [0, 4, 0, 1],
          } as ContentColumns);
        } else {
          content.push({
            text: entry.title,
            bold: true,
            fontSize: 10,
            margin: [0, 4, 0, 1],
          } as ContentText);
        }
      }

      // Subtitle (job title, degree, etc)
      if (entry.subtitle) {
        content.push({
          text: entry.subtitle,
          italics: true,
          fontSize: 10,
          margin: [0, 0, 0, 2],
        } as ContentText);
      }

      // Content/bullets
      if (entry.bullets.length > 0) {
        if (['skills', 'languages', 'interests'].includes(section.type)) {
          // Skills-type: comma-separated or as lines
          content.push({
            text: entry.bullets.join(', '),
            fontSize: 10,
            margin: [0, 2, 0, 4],
          } as ContentText);
        } else if (section.type === 'summary') {
          // Summary: paragraph
          content.push({
            text: entry.bullets.join(' '),
            fontSize: 10,
            margin: [0, 2, 0, 4],
          } as ContentText);
        } else {
          // Regular bullets
          content.push({
            ul: entry.bullets,
            fontSize: 10,
            margin: [15, 2, 0, 4],
          });
        }
      }
    }
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
      lineHeight: 1.15,
    },
    pageSize: 'LETTER',
    pageMargins: [50, 40, 50, 40],
  };

  const printer = new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    pdfDoc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
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
