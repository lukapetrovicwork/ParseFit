import { ParsedJobDescription } from '@/types';
import { normalizeText } from '@/lib/parser/text-normalizer';
import { extractKeywords } from './keyword-extractor';

export function parseJobDescription(text: string): ParsedJobDescription {
  const normalizedText = normalizeText(text);

  const keywords = extractKeywords(normalizedText);

  const requirements = extractRequirements(normalizedText);
  const responsibilities = extractResponsibilities(normalizedText);
  const qualifications = extractQualifications(normalizedText);

  return {
    rawText: text,
    normalizedText,
    hardSkills: keywords.hardSkills,
    softSkills: keywords.softSkills,
    tools: keywords.tools,
    technologies: keywords.technologies,
    requirements,
    responsibilities,
    qualifications,
    allKeywords: keywords.allKeywords,
  };
}

function extractRequirements(text: string): string[] {
  const requirements: string[] = [];
  const lines = text.split('\n');

  let inRequirementsSection = false;
  const sectionHeaders = [
    /requirements?:?/i,
    /what you('ll)? need/i,
    /must have/i,
    /required skills?/i,
    /minimum requirements?/i,
  ];

  const endSectionPatterns = [
    /responsibilities?:?/i,
    /what you('ll)? do/i,
    /benefits?:?/i,
    /about (us|the company)/i,
    /nice to have/i,
    /preferred/i,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (sectionHeaders.some(pattern => pattern.test(trimmedLine))) {
      inRequirementsSection = true;
      continue;
    }

    if (endSectionPatterns.some(pattern => pattern.test(trimmedLine))) {
      inRequirementsSection = false;
      continue;
    }

    if (inRequirementsSection && isBulletPoint(trimmedLine)) {
      const cleaned = cleanBulletPoint(trimmedLine);
      if (cleaned.length > 10) {
        requirements.push(cleaned);
      }
    }
  }

  const yearsExperience = text.match(/\d+\+?\s*years?\s*(of\s+)?experience/gi) || [];
  for (const match of yearsExperience) {
    if (!requirements.some(r => r.toLowerCase().includes(match.toLowerCase()))) {
      requirements.push(match);
    }
  }

  const degreeRequirements = text.match(/(bachelor'?s?|master'?s?|phd|doctorate)\s*(degree)?\s*(in\s+[\w\s,]+)?/gi) || [];
  for (const match of degreeRequirements) {
    if (!requirements.some(r => r.toLowerCase().includes(match.toLowerCase()))) {
      requirements.push(match.trim());
    }
  }

  return [...new Set(requirements)];
}

function extractResponsibilities(text: string): string[] {
  const responsibilities: string[] = [];
  const lines = text.split('\n');

  let inResponsibilitiesSection = false;
  const sectionHeaders = [
    /responsibilities?:?/i,
    /what you('ll)? do/i,
    /duties:?/i,
    /role:?/i,
    /job description:?/i,
    /key responsibilities?:?/i,
    /you will:?/i,
  ];

  const endSectionPatterns = [
    /requirements?:?/i,
    /qualifications?:?/i,
    /what you('ll)? need/i,
    /benefits?:?/i,
    /about (us|the company)/i,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (sectionHeaders.some(pattern => pattern.test(trimmedLine))) {
      inResponsibilitiesSection = true;
      continue;
    }

    if (endSectionPatterns.some(pattern => pattern.test(trimmedLine))) {
      inResponsibilitiesSection = false;
      continue;
    }

    if (inResponsibilitiesSection && isBulletPoint(trimmedLine)) {
      const cleaned = cleanBulletPoint(trimmedLine);
      if (cleaned.length > 10) {
        responsibilities.push(cleaned);
      }
    }
  }

  return [...new Set(responsibilities)];
}

function extractQualifications(text: string): string[] {
  const qualifications: string[] = [];
  const lines = text.split('\n');

  let inQualificationsSection = false;
  const sectionHeaders = [
    /qualifications?:?/i,
    /preferred qualifications?:?/i,
    /nice to have:?/i,
    /bonus points?:?/i,
    /preferred skills?:?/i,
    /preferred experience:?/i,
  ];

  const endSectionPatterns = [
    /responsibilities?:?/i,
    /benefits?:?/i,
    /about (us|the company)/i,
    /how to apply/i,
    /compensation/i,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (sectionHeaders.some(pattern => pattern.test(trimmedLine))) {
      inQualificationsSection = true;
      continue;
    }

    if (endSectionPatterns.some(pattern => pattern.test(trimmedLine))) {
      inQualificationsSection = false;
      continue;
    }

    if (inQualificationsSection && isBulletPoint(trimmedLine)) {
      const cleaned = cleanBulletPoint(trimmedLine);
      if (cleaned.length > 10) {
        qualifications.push(cleaned);
      }
    }
  }

  return [...new Set(qualifications)];
}

function isBulletPoint(line: string): boolean {
  const bulletPatterns = [
    /^[\u2022•\-\*\+]\s*/,
    /^[a-z]\)\s*/i,
    /^\d+[.)]\s*/,
    /^[ivxIVX]+[.)]\s*/,
    /^○\s*/,
  ];

  return bulletPatterns.some(pattern => pattern.test(line)) || (line.length > 20 && !line.endsWith(':'));
}

function cleanBulletPoint(line: string): string {
  return line
    .replace(/^[\u2022•\-\*\+]\s*/, '')
    .replace(/^[a-z]\)\s*/i, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^[ivxIVX]+[.)]\s*/i, '')
    .replace(/^○\s*/, '')
    .trim();
}
