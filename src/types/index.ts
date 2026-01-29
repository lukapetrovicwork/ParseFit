export interface ParsedResume {
  rawText: string;
  normalizedText: string;
  sections: ResumeSection[];
  metadata: ResumeMetadata;
}

export interface ResumeSection {
  name: SectionType;
  content: string;
  startIndex: number;
  endIndex: number;
  bullets: string[];
}

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'languages'
  | 'interests'
  | 'references'
  | 'unknown';

export interface ResumeMetadata {
  wordCount: number;
  lineCount: number;
  hasImages: boolean;
  hasTables: boolean;
  hasColumns: boolean;
  hasHeadersFooters: boolean;
  estimatedPages: number;
  fileSize: number;
  fileType: string;
}

export interface ParsedJobDescription {
  rawText: string;
  normalizedText: string;
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  technologies: string[];
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  allKeywords: string[];
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  category: 'hard_skill' | 'soft_skill' | 'tool' | 'technology' | 'other';
  frequency: number;
}

export interface ATSScore {
  overall: number;
  keyword: number;
  formatting: number;
  section: number;
  similarity: number;
}

export interface FormattingIssue {
  type: FormattingIssueType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

export type FormattingIssueType =
  | 'has_images'
  | 'has_tables'
  | 'has_columns'
  | 'has_headers_footers'
  | 'too_long'
  | 'too_short'
  | 'missing_contact'
  | 'inconsistent_formatting'
  | 'non_standard_fonts'
  | 'special_characters';

export interface SectionAnalysis {
  name: SectionType;
  found: boolean;
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface BulletAnalysis {
  text: string;
  section: SectionType;
  score: number;
  issues: BulletIssue[];
  suggestions: string[];
  rewriteSuggestion?: string;
}

export interface BulletIssue {
  type: BulletIssueType;
  message: string;
}

export type BulletIssueType =
  | 'weak_action_verb'
  | 'no_metrics'
  | 'too_long'
  | 'too_short'
  | 'passive_voice'
  | 'first_person'
  | 'buzzwords'
  | 'vague_language';

export interface Suggestion {
  type: SuggestionType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

export type SuggestionType =
  | 'add_keywords'
  | 'improve_bullets'
  | 'add_section'
  | 'fix_formatting'
  | 'add_metrics'
  | 'strengthen_verbs'
  | 'tailor_content';

export interface ScanResult {
  id: string;
  score: ATSScore;
  keywordMatches: KeywordMatch[];
  missingKeywords: string[];
  foundKeywords: string[];
  formattingIssues: FormattingIssue[];
  sectionAnalysis: SectionAnalysis[];
  bulletAnalysis: BulletAnalysis[];
  suggestions: Suggestion[];
  parsedResume: ParsedResume;
  parsedJobDescription: ParsedJobDescription;
}

export interface UserSubscription {
  tier: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE';
  scansUsed: number;
  scansLimit: number;
}
