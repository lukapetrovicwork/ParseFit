import {
  ParsedResume,
  ParsedJobDescription,
  ATSScore,
  FormattingIssue,
  ScanResult,
  KeywordMatch,
  BulletAnalysis,
  SectionAnalysis,
  Suggestion,
} from '@/types';
import {
  extractKeywords,
  matchKeywords,
  computeWeightedSimilarity,
  getSectionScore,
  analyzeBullets,
  analyzeSections,
  generateSuggestions,
} from '@/lib/nlp';

export function calculateATSScore(
  resume: ParsedResume,
  jobDescription: ParsedJobDescription
): ScanResult {
  const resumeKeywords = extractKeywords(resume.normalizedText);
  const keywordMatchResult = matchKeywords(resumeKeywords.allKeywords, jobDescription.allKeywords);

  const similarity = computeWeightedSimilarity(
    resume.normalizedText,
    jobDescription.normalizedText,
    resumeKeywords.allKeywords,
    jobDescription.allKeywords
  );

  const formattingIssues = analyzeFormatting(resume);

  const sectionScoreResult = getSectionScore(resume.sections);

  const bulletAnalyses = analyzeBullets(resume.sections);

  const sectionAnalyses = analyzeSections(resume.sections, keywordMatchResult.missingKeywords);

  const suggestions = generateSuggestions(
    resume,
    jobDescription,
    keywordMatchResult.missingKeywords,
    bulletAnalyses,
    formattingIssues
  );

  const keywordScore = calculateKeywordScore(keywordMatchResult.matchPercentage);
  const formattingScore = calculateFormattingScore(formattingIssues, resume.metadata);
  const sectionScore = sectionScoreResult.score;
  const similarityScore = Math.round(similarity * 100);

  const overallScore = calculateOverallScore(
    keywordScore,
    formattingScore,
    sectionScore,
    similarityScore
  );

  const score: ATSScore = {
    overall: overallScore,
    keyword: keywordScore,
    formatting: formattingScore,
    section: sectionScore,
    similarity: similarityScore,
  };

  return {
    id: generateId(),
    score,
    keywordMatches: keywordMatchResult.matches,
    missingKeywords: keywordMatchResult.missingKeywords,
    foundKeywords: keywordMatchResult.matchedKeywords,
    formattingIssues,
    sectionAnalysis: sectionAnalyses,
    bulletAnalysis: bulletAnalyses,
    suggestions,
    parsedResume: resume,
    parsedJobDescription: jobDescription,
  };
}

function calculateKeywordScore(matchPercentage: number): number {
  if (matchPercentage >= 80) return Math.round(90 + (matchPercentage - 80) * 0.5);
  if (matchPercentage >= 60) return Math.round(70 + (matchPercentage - 60) * 1);
  if (matchPercentage >= 40) return Math.round(50 + (matchPercentage - 40) * 1);
  if (matchPercentage >= 20) return Math.round(30 + (matchPercentage - 20) * 1);
  return Math.round(matchPercentage * 1.5);
}

function calculateFormattingScore(issues: FormattingIssue[], metadata: ParsedResume['metadata']): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'error':
        score -= 15;
        break;
      case 'warning':
        score -= 8;
        break;
      case 'info':
        score -= 3;
        break;
    }
  }

  if (metadata.hasImages) score -= 10;
  if (metadata.hasTables) score -= 10;
  if (metadata.hasColumns) score -= 15;
  if (metadata.hasHeadersFooters) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function calculateOverallScore(
  keyword: number,
  formatting: number,
  section: number,
  similarity: number
): number {
  const weights = {
    keyword: 0.35,
    formatting: 0.20,
    section: 0.25,
    similarity: 0.20,
  };

  const weightedScore =
    keyword * weights.keyword +
    formatting * weights.formatting +
    section * weights.section +
    similarity * weights.similarity;

  return Math.round(weightedScore);
}

function analyzeFormatting(resume: ParsedResume): FormattingIssue[] {
  const issues: FormattingIssue[] = [];
  const { metadata, normalizedText } = resume;

  if (metadata.hasImages) {
    issues.push({
      type: 'has_images',
      severity: 'error',
      message: 'Resume contains images that ATS systems cannot parse.',
      suggestion: 'Remove all images, logos, and graphics from your resume.',
    });
  }

  if (metadata.hasTables) {
    issues.push({
      type: 'has_tables',
      severity: 'error',
      message: 'Resume contains tables that may confuse ATS parsing.',
      suggestion: 'Convert table content to standard text with bullet points.',
    });
  }

  if (metadata.hasColumns) {
    issues.push({
      type: 'has_columns',
      severity: 'error',
      message: 'Resume uses multiple columns which ATS cannot read correctly.',
      suggestion: 'Use a single-column layout for better ATS compatibility.',
    });
  }

  if (metadata.hasHeadersFooters) {
    issues.push({
      type: 'has_headers_footers',
      severity: 'warning',
      message: 'Headers/footers detected. Content may be missed by ATS.',
      suggestion: 'Move important information from headers/footers to the main body.',
    });
  }

  if (metadata.estimatedPages > 2) {
    issues.push({
      type: 'too_long',
      severity: 'warning',
      message: `Resume is ${metadata.estimatedPages} pages. Most positions prefer 1-2 pages.`,
      suggestion: 'Condense your resume to 1-2 pages focusing on recent, relevant experience.',
    });
  }

  if (metadata.wordCount < 200) {
    issues.push({
      type: 'too_short',
      severity: 'warning',
      message: 'Resume appears too brief with limited content.',
      suggestion: 'Expand your resume with more detail about your experience and achievements.',
    });
  }

  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(normalizedText);
  const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(normalizedText);

  if (!hasEmail || !hasPhone) {
    issues.push({
      type: 'missing_contact',
      severity: 'error',
      message: 'Missing contact information (email or phone).',
      suggestion: 'Add your email address and phone number at the top of your resume.',
    });
  }

  const specialChars = normalizedText.match(/[^\x00-\x7F]/g) || [];
  const uniqueSpecialChars = [...new Set(specialChars)];
  if (uniqueSpecialChars.length > 5) {
    issues.push({
      type: 'special_characters',
      severity: 'warning',
      message: 'Resume contains special characters that may not parse correctly.',
      suggestion: 'Replace special characters with standard ASCII equivalents.',
    });
  }

  return issues;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
