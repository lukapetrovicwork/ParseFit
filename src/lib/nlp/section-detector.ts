import { ResumeSection, SectionType } from '@/types';

const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  summary: [
    /^(professional\s+)?summary/i,
    /^(career\s+)?objective/i,
    /^(career\s+)?profile/i,
    /^about\s*me/i,
    /^executive\s+summary/i,
    /^personal\s+statement/i,
    /^overview/i,
    /summary$/i,
    /profile$/i,
    /objective$/i,
  ],
  experience: [
    /^(work\s+)?experience/i,
    /^(professional\s+)?experience/i,
    /^employment(\s+history)?/i,
    /^work\s+history/i,
    /^career\s+history/i,
    /^relevant\s+experience/i,
    /^professional\s+background/i,
    /experience$/i,
    /^experience$/i,
    /work\s+experience/i,
    /professional\s+experience/i,
  ],
  education: [
    /^education/i,
    /^academic(\s+background)?/i,
    /^educational\s+background/i,
    /^qualifications/i,
    /^academic\s+qualifications/i,
    /^degrees/i,
    /education$/i,
    /^education$/i,
    /educational\s+background/i,
  ],
  skills: [
    /^(technical\s+)?skills/i,
    /^core\s+competencies/i,
    /^competencies/i,
    /^expertise/i,
    /^areas\s+of\s+expertise/i,
    /^proficiencies/i,
    /^technical\s+proficiencies/i,
    /^key\s+skills/i,
    /^skill\s+set/i,
    /skills$/i,
    /^skills$/i,
    /technical\s+skills/i,
    /core\s+skills/i,
  ],
  projects: [
    /^projects/i,
    /^personal\s+projects/i,
    /^key\s+projects/i,
    /^notable\s+projects/i,
    /^selected\s+projects/i,
    /^portfolio/i,
  ],
  certifications: [
    /^certifications?/i,
    /^licenses?(\s+and\s+certifications?)?/i,
    /^professional\s+certifications?/i,
    /^credentials/i,
    /^accreditations?/i,
  ],
  awards: [
    /^awards?(\s+and\s+honors?)?/i,
    /^honors?(\s+and\s+awards?)?/i,
    /^recognition/i,
    /^achievements?/i,
    /^accomplishments?/i,
  ],
  publications: [
    /^publications?/i,
    /^papers?/i,
    /^research(\s+papers?)?/i,
    /^articles?/i,
  ],
  languages: [
    /^languages?/i,
    /^language\s+skills/i,
    /^linguistic\s+skills/i,
  ],
  interests: [
    /^interests?/i,
    /^hobbies(\s+and\s+interests?)?/i,
    /^personal\s+interests?/i,
    /^activities/i,
    /^extracurricular(\s+activities)?/i,
  ],
  references: [
    /^references?/i,
    /^professional\s+references?/i,
    /^referees?/i,
  ],
  unknown: [],
};

export function detectSections(text: string): ResumeSection[] {
  const lines = text.split('\n');
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let currentContent: string[] = [];
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (currentSection) {
        currentContent.push('');
      }
      lineIndex++;
      continue;
    }

    const sectionType = identifySectionHeader(line);

    if (sectionType !== 'unknown' && isSectionHeader(line, lines, i)) {
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        currentSection.endIndex = lineIndex - 1;
        sections.push(currentSection);
      }

      currentSection = {
        name: sectionType,
        content: '',
        startIndex: lineIndex,
        endIndex: lineIndex,
        bullets: [],
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    } else {
      const contactOrHeader = isContactInfo(line) || isNameHeader(line, i);

      if (!contactOrHeader) {
        if (!currentSection) {
          currentSection = {
            name: 'summary',
            content: '',
            startIndex: lineIndex,
            endIndex: lineIndex,
            bullets: [],
          };
          currentContent = [line];
        }
      }
    }

    lineIndex++;
  }

  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    currentSection.endIndex = lineIndex - 1;
    sections.push(currentSection);
  }

  return mergeDuplicateSections(sections);
}

function identifySectionHeader(line: string): SectionType {
  // Remove common prefixes, punctuation, and clean the line
  const cleanLine = line
    .replace(/^[\d\.\)\-\•\*\s]+/, '') // Remove leading numbers, bullets, etc.
    .replace(/[:\-_•|]/g, '')
    .trim()
    .toLowerCase();

  // Direct keyword matching for common section names
  const directMatches: Record<string, SectionType> = {
    'experience': 'experience',
    'work experience': 'experience',
    'professional experience': 'experience',
    'employment': 'experience',
    'employment history': 'experience',
    'education': 'education',
    'educational background': 'education',
    'academic background': 'education',
    'skills': 'skills',
    'technical skills': 'skills',
    'core skills': 'skills',
    'key skills': 'skills',
    'competencies': 'skills',
    'summary': 'summary',
    'professional summary': 'summary',
    'profile': 'summary',
    'objective': 'summary',
    'career objective': 'summary',
    'projects': 'projects',
    'certifications': 'certifications',
    'certificates': 'certifications',
    'awards': 'awards',
    'honors': 'awards',
    'publications': 'publications',
    'languages': 'languages',
    'interests': 'interests',
    'hobbies': 'interests',
    'references': 'references',
  };

  if (directMatches[cleanLine]) {
    return directMatches[cleanLine];
  }

  // Pattern matching for more complex variations
  for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (sectionType === 'unknown') continue;

    for (const pattern of patterns) {
      if (pattern.test(cleanLine)) {
        return sectionType as SectionType;
      }
    }
  }

  return 'unknown';
}

function isSectionHeader(line: string, allLines: string[], index: number): boolean {
  if (line.length > 60) return false;

  const words = line.split(/\s+/);
  if (words.length > 6) return false;

  const cleanLine = line.replace(/[:\-_•|]/g, '').trim();
  const isUpperCase = line === line.toUpperCase() && /[A-Z]/.test(line);
  const isTitleCase = /^[A-Z][a-z]*(\s+[A-Z][a-z]*)*$/.test(cleanLine);
  const hasColon = line.endsWith(':');
  const isShortLine = line.length < 40;
  const isVeryShortLine = line.length < 25;

  const nextLine = allLines[index + 1]?.trim() || '';
  const isSeparator = /^[-=_]{3,}$/.test(nextLine) || nextLine === '';

  const prevLine = allLines[index - 1]?.trim() || '';
  const hasBlankBefore = prevLine === '';

  // If it's a very short line (1-3 words) that matches a section pattern, it's likely a header
  if (words.length <= 3 && isVeryShortLine) {
    return true;
  }

  const score = (isUpperCase ? 2 : 0) +
    (isTitleCase ? 1 : 0) +
    (hasColon ? 1 : 0) +
    (isShortLine ? 1 : 0) +
    (isSeparator ? 1 : 0) +
    (hasBlankBefore ? 1 : 0);

  return score >= 1;
}

function isContactInfo(line: string): boolean {
  const patterns = [
    /\b[\w.-]+@[\w.-]+\.\w{2,}\b/,
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\b\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /linkedin\.com/i,
    /github\.com/i,
    /twitter\.com/i,
    /\b\d+\s+[\w\s]+,\s*[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/,
  ];

  return patterns.some(pattern => pattern.test(line));
}

function isNameHeader(line: string, index: number): boolean {
  if (index > 3) return false;

  const words = line.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;

  const allCapitalized = words.every(word =>
    /^[A-Z][a-z]*$/.test(word) || /^[A-Z]+$/.test(word)
  );

  return allCapitalized && !line.includes('@') && !/\d/.test(line);
}

function mergeDuplicateSections(sections: ResumeSection[]): ResumeSection[] {
  const merged: ResumeSection[] = [];
  const sectionMap = new Map<SectionType, ResumeSection>();

  for (const section of sections) {
    const existing = sectionMap.get(section.name);

    if (existing) {
      existing.content += '\n\n' + section.content;
      existing.endIndex = section.endIndex;
    } else {
      const newSection = { ...section };
      sectionMap.set(section.name, newSection);
      merged.push(newSection);
    }
  }

  return merged;
}

export function getSectionScore(sections: ResumeSection[]): {
  score: number;
  found: SectionType[];
  missing: SectionType[];
} {
  const requiredSections: SectionType[] = ['experience', 'education', 'skills'];
  const importantSections: SectionType[] = ['summary', 'projects'];
  const optionalSections: SectionType[] = ['certifications', 'awards', 'publications', 'languages'];

  const foundTypes = new Set(sections.map(s => s.name));

  const found: SectionType[] = [];
  const missing: SectionType[] = [];

  let score = 0;
  let maxScore = 0;

  for (const section of requiredSections) {
    maxScore += 30;
    if (foundTypes.has(section)) {
      score += 30;
      found.push(section);
    } else {
      missing.push(section);
    }
  }

  for (const section of importantSections) {
    maxScore += 15;
    if (foundTypes.has(section)) {
      score += 15;
      found.push(section);
    } else {
      missing.push(section);
    }
  }

  for (const section of optionalSections) {
    maxScore += 5;
    if (foundTypes.has(section)) {
      score += 5;
      found.push(section);
    }
  }

  const normalizedScore = Math.round((score / maxScore) * 100);

  return {
    score: normalizedScore,
    found,
    missing,
  };
}
