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

// Check if a bullet-prefixed line is actually a job/entry header (not a real bullet)
function isBulletActuallyEntryHeader(line: string): boolean {
  // Remove the bullet prefix to analyze the content
  const content = line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\d+\.]\s*/, '').trim();

  // Check for job title patterns with company/org (e.g., "Software Engineer -- Company")
  if (/\s+[-–—]+\s+/.test(content)) {
    // Has a separator like " -- " which often separates title from company
    return true;
  }

  // Check for role patterns like "Intern", "Mentee", "Fellow" with organization context
  if (/\b(Intern|Mentee|Fellow|Contractor|Consultant|Freelancer)\b/i.test(content) &&
      /\b(at|@|--|–|—)\b/i.test(content)) {
    return true;
  }

  // Check for patterns like "Role at/@ Company" or "Role, Company"
  if (/\b(Engineer|Developer|Analyst|Designer|Manager|Director|Lead|Specialist)\b.*\b(at|@)\s+\w/i.test(content)) {
    return true;
  }

  return false;
}

// Get bullet text content (without the bullet prefix)
function getBulletContent(line: string): string {
  return line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\d+\.]\s*/, '');
}

// Check if a line is just a label without meaningful content (e.g., "Expected Graduation:")
function isLabelOnlyLine(line: string): boolean {
  // Lines that are just labels ending with colon
  if (/^(Expected Graduation|Graduation Date|GPA|Degree|Major|Minor|Concentration|Honors|Awards?):?\s*$/i.test(line)) {
    return true;
  }
  return false;
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

// Check if a line looks like an entry header (company name, project name, etc.)
function looksLikeEntryHeader(line: string, prevLineWasBlank: boolean, sectionType?: string): boolean {
  const words = line.split(/\s+/);

  // Lines with dates are likely headers
  if (extractDate(line)) return true;

  // After a blank line, shorter lines are more likely to be headers
  if (prevLineWasBlank) {
    if (words.length <= 6 && line.length < 70) return true;
  }

  // Very short lines (1-4 words) that look like titles
  if (words.length <= 4 && line.length < 50) return true;

  // Lines that are all caps might be headers
  const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line) && line.length < 50;
  if (isAllCaps) return true;

  // Lines containing common company/org patterns (anywhere in line)
  if (/\b(Inc\.|LLC|Corp\.|Ltd\.|University|College|Institute|School|Company|Technologies|Solutions)\b/i.test(line)) return true;

  // Lines with location patterns like "City, ST" or "City, State"
  if (/,\s*[A-Z]{2}(\s|$|,)/.test(line) && line.length < 70) return true;

  // For education: lines starting with degree types
  if (sectionType === 'education') {
    if (/^(Bachelor|Master|Doctor|PhD|MBA|BS|BA|MS|MA|BBA|Associate|Diploma)/i.test(line)) return false; // Degree is subtitle, not new entry
  }

  // Lines that look like job titles (contains common title words)
  if (/\b(Engineer|Developer|Manager|Director|Analyst|Designer|Lead|Senior|Junior|Intern|Specialist|Coordinator|Assistant|Associate|Consultant)\b/i.test(line) && words.length <= 6) {
    return false; // Job titles are subtitles, not new entries
  }

  return false;
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

  // For experience, education, projects - preserve blank lines as entry separators
  // Split content into groups separated by blank lines
  const rawLines = content.split('\n').map(l => l.trim());
  const entryGroups: string[][] = [];
  let currentGroup: string[] = [];

  for (const line of rawLines) {
    if (line === '') {
      // Blank line - might indicate entry boundary
      if (currentGroup.length > 0) {
        entryGroups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      currentGroup.push(line);
    }
  }
  if (currentGroup.length > 0) {
    entryGroups.push(currentGroup);
  }

  // Helper to parse a single entry group
  const parseEntryGroup = (group: string[], bulletIdx: { value: number }): SectionEntry => {
    const entry: SectionEntry = { bullets: [] };
    let seenBullet = false;
    let pendingLabel = ''; // For labels like "Expected Graduation:"

    for (let i = 0; i < group.length; i++) {
      const line = group[i];

      // Skip or combine label-only lines
      if (isLabelOnlyLine(line)) {
        // Check if next line has content to combine with
        const nextLine = group[i + 1];
        if (nextLine) {
          const nextDate = extractDate(nextLine);
          if (nextDate && !entry.date) {
            // Combine label with next line's date
            entry.date = nextDate;
            i++; // Skip next line since we consumed it
            continue;
          }
        }
        // Otherwise skip the label-only line
        continue;
      }

      // Check if this looks like a bullet but is actually an entry header
      if (isBulletLine(line) && !isBulletActuallyEntryHeader(line)) {
        const bulletText = bulletIdx.value < bullets.length
          ? bullets[bulletIdx.value++]
          : getBulletContent(line);
        entry.bullets.push(bulletText);
        seenBullet = true;
      } else {
        // Treat as non-bullet line (including fake bullets that are entry headers)
        const actualLine = isBulletLine(line) ? getBulletContent(line) : line;
        const date = extractDate(actualLine);
        const lineWithoutDate = date ? actualLine.replace(date, '').replace(/\s*[-–—|,]\s*$/, '').trim() : null;

        if (!entry.title) {
          // First line becomes title
          if (date) {
            entry.date = date;
            entry.title = lineWithoutDate || '';
          } else {
            entry.title = actualLine;
          }
        } else if (date && !entry.date) {
          // Line with date - save date and remaining content
          entry.date = date;
          if (lineWithoutDate && lineWithoutDate.length > 0) {
            if (!entry.subtitle && !seenBullet) {
              entry.subtitle = lineWithoutDate;
            } else {
              entry.bullets.push(lineWithoutDate);
            }
          }
        } else if (!entry.subtitle && !seenBullet && actualLine.length < 80) {
          // Second non-bullet line becomes subtitle
          entry.subtitle = actualLine;
        } else {
          // Everything else is content
          entry.bullets.push(actualLine);
          seenBullet = true;
        }
      }
    }

    return entry;
  };

  // If we got clear entry groups from blank lines, use them
  if (entryGroups.length > 1) {
    const entries: SectionEntry[] = [];
    const bulletIdx = { value: 0 };

    for (const group of entryGroups) {
      const entry = parseEntryGroup(group, bulletIdx);
      if (entry.title || entry.bullets.length > 0) {
        entries.push(entry);
      }
    }

    return entries.length > 0 ? entries : [{ bullets }];
  }

  // No clear blank line separation - fall back to header detection
  const contentLines = rawLines.filter(l => l.length > 0);

  // Helper to check if we should start a new entry
  const shouldStartNewEntry = (
    line: string,
    currentEntry: SectionEntry,
    hasContent: boolean,
    prevWasBlank: boolean
  ): boolean => {
    // If current entry has content (bullets or subtitle), and this looks like a new header
    if (!hasContent) return false;

    // Lines with " — " or " -- " separator often indicate "Title — Company" format
    if (/\s+[-–—]+\s+/.test(line) && line.length < 100) {
      // This looks like a job entry header (e.g., "Software Engineer — Company")
      return true;
    }

    // Check for company/institution patterns that indicate new entry
    if (/\b(Inc\.|LLC|Corp\.|Ltd\.|University|College|Institute|School|Company|Technologies|Solutions|Mentorship|Program|Foundation|Organization|Group|Labs?|Studio)\b/i.test(line)) {
      return true;
    }

    // Lines with location patterns often start new entries
    if (/,\s*[A-Z]{2}(\s|$|,)/.test(line) && line.length < 70) {
      return true;
    }

    // Lines that look like "Role at Company" patterns
    if (/\b(Intern|Mentee|Fellow|Contractor|Consultant)\b.*\b(at|@)\s+\w/i.test(line)) {
      return true;
    }

    // Short lines that look like company/org names (2-5 words, no common subtitle words)
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && line.length < 50) {
      // But not if it looks like a job title or degree
      if (!/\b(Engineer|Developer|Manager|Director|Bachelor|Master|PhD|MBA|Intern)\b/i.test(line)) {
        return true;
      }
    }

    return false;
  };

  if (bullets.length > 0) {
    const entries: SectionEntry[] = [];
    let currentEntry: SectionEntry = { bullets: [] };
    let bulletIndex = 0;
    let hasContentInEntry = false;
    let prevWasBlank = true;

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i];

      // Check if a bullet-formatted line is actually an entry header
      if (isBulletLine(line) && isBulletActuallyEntryHeader(line)) {
        // This bullet is actually a new entry - start new entry
        if (currentEntry.title || currentEntry.bullets.length > 0) {
          entries.push(currentEntry);
        }
        const content = getBulletContent(line);
        const date = extractDate(content);
        currentEntry = { bullets: [] };
        hasContentInEntry = false;
        if (date) {
          currentEntry.date = date;
          currentEntry.title = content.replace(date, '').replace(/\s*[-–—|,]\s*$/, '').trim();
        } else {
          currentEntry.title = content;
        }
        prevWasBlank = false;
        continue;
      }

      const date = extractDate(line);
      const lineWithoutDate = date ? line.replace(date, '').replace(/\s*[-–—|,]\s*$/, '').trim() : null;

      if (isBulletLine(line)) {
        const bulletText = bulletIndex < bullets.length
          ? bullets[bulletIndex++]
          : getBulletContent(line);
        currentEntry.bullets.push(bulletText);
        hasContentInEntry = true;
        prevWasBlank = false;
      } else if (shouldStartNewEntry(line, currentEntry, hasContentInEntry, prevWasBlank)) {
        // Start new entry
        if (currentEntry.title || currentEntry.bullets.length > 0) {
          entries.push(currentEntry);
        }
        currentEntry = { bullets: [] };
        hasContentInEntry = false;

        if (date) {
          currentEntry.date = date;
          currentEntry.title = lineWithoutDate || '';
        } else {
          currentEntry.title = line;
        }
        prevWasBlank = false;
      } else if (!currentEntry.title) {
        if (date) {
          currentEntry.date = date;
          currentEntry.title = lineWithoutDate || '';
        } else {
          currentEntry.title = line;
        }
        prevWasBlank = false;
      } else if (date && !currentEntry.date) {
        currentEntry.date = date;
        if (lineWithoutDate && lineWithoutDate.length > 0) {
          if (!currentEntry.subtitle && !hasContentInEntry) {
            currentEntry.subtitle = lineWithoutDate;
          } else {
            currentEntry.bullets.push(lineWithoutDate);
            hasContentInEntry = true;
          }
        }
        prevWasBlank = false;
      } else if (!currentEntry.subtitle && !hasContentInEntry && line.length < 80) {
        currentEntry.subtitle = line;
        prevWasBlank = false;
      } else {
        currentEntry.bullets.push(line);
        hasContentInEntry = true;
        prevWasBlank = false;
      }
    }

    if (currentEntry.title || currentEntry.bullets.length > 0) {
      entries.push(currentEntry);
    }

    return entries.length > 0 ? entries : [{ bullets }];
  }

  // No pre-extracted bullets - simpler parsing
  const entries: SectionEntry[] = [];
  let currentEntry: SectionEntry | null = null;
  let hasContentInEntry = false;
  let prevWasBlank = true;

  for (const line of contentLines) {
    // Check if a bullet-formatted line is actually an entry header
    if (isBulletLine(line) && isBulletActuallyEntryHeader(line)) {
      // This bullet is actually a new entry - start new entry
      if (currentEntry && (currentEntry.title || currentEntry.bullets.length > 0)) {
        entries.push(currentEntry);
      }
      const content = getBulletContent(line);
      const date = extractDate(content);
      currentEntry = { bullets: [] };
      hasContentInEntry = false;
      if (date) {
        currentEntry.date = date;
        currentEntry.title = content.replace(date, '').replace(/\s*[-–—|,]\s*$/, '').trim();
      } else {
        currentEntry.title = content;
      }
      prevWasBlank = false;
      continue;
    }

    const date = extractDate(line);
    const lineWithoutDate = date ? line.replace(date, '').replace(/\s*[-–—|,]\s*$/, '').trim() : null;

    if (isBulletLine(line)) {
      const bulletText = getBulletContent(line);
      if (currentEntry) {
        currentEntry.bullets.push(bulletText);
        hasContentInEntry = true;
      } else {
        currentEntry = { bullets: [bulletText] };
        hasContentInEntry = true;
      }
      prevWasBlank = false;
    } else if (currentEntry && shouldStartNewEntry(line, currentEntry, hasContentInEntry, prevWasBlank)) {
      entries.push(currentEntry);
      currentEntry = { bullets: [] };
      hasContentInEntry = false;

      if (date) {
        currentEntry.date = date;
        currentEntry.title = lineWithoutDate || '';
      } else {
        currentEntry.title = line;
      }
      prevWasBlank = false;
    } else if (!currentEntry) {
      currentEntry = { bullets: [] };
      hasContentInEntry = false;
      if (date) {
        currentEntry.date = date;
        currentEntry.title = lineWithoutDate || '';
      } else {
        currentEntry.title = line;
      }
      prevWasBlank = false;
    } else if (date && !currentEntry.date) {
      currentEntry.date = date;
      if (lineWithoutDate && lineWithoutDate.length > 0) {
        if (!currentEntry.subtitle && !hasContentInEntry) {
          currentEntry.subtitle = lineWithoutDate;
        } else {
          currentEntry.bullets.push(lineWithoutDate);
          hasContentInEntry = true;
        }
      }
      prevWasBlank = false;
    } else if (!currentEntry.subtitle && !hasContentInEntry && line.length < 60) {
      currentEntry.subtitle = line;
      prevWasBlank = false;
    } else {
      currentEntry.bullets.push(line);
      hasContentInEntry = true;
      prevWasBlank = false;
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
