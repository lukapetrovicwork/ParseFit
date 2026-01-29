import {
  Suggestion,
  BulletAnalysis,
  BulletIssue,
  ResumeSection,
  SectionType,
  SectionAnalysis,
  FormattingIssue,
  ParsedResume,
  ParsedJobDescription,
} from '@/types';

const STRONG_ACTION_VERBS = new Set([
  'achieved', 'accelerated', 'accomplished', 'acquired', 'advanced', 'amplified',
  'analyzed', 'architected', 'automated', 'boosted', 'built', 'captured',
  'championed', 'consolidated', 'converted', 'created', 'decreased', 'delivered',
  'designed', 'developed', 'directed', 'doubled', 'drove', 'eliminated',
  'enabled', 'engineered', 'established', 'exceeded', 'executed', 'expanded',
  'generated', 'grew', 'headed', 'identified', 'implemented', 'improved',
  'increased', 'influenced', 'initiated', 'innovated', 'integrated', 'introduced',
  'launched', 'led', 'leveraged', 'managed', 'maximized', 'mentored',
  'modernized', 'negotiated', 'optimized', 'orchestrated', 'overhauled', 'partnered',
  'pioneered', 'planned', 'produced', 'propelled', 'quadrupled', 'raised',
  'rebranded', 'rebuilt', 'recaptured', 'redesigned', 'reduced', 'reengineered',
  'refactored', 'refined', 'reformed', 'reinvented', 'relaunched', 'remediated',
  'reorganized', 'replaced', 'resolved', 'restructured', 'revamped', 'reversed',
  'revolutionized', 'scaled', 'secured', 'shaped', 'simplified', 'slashed',
  'solved', 'spearheaded', 'standardized', 'steered', 'streamlined', 'strengthened',
  'surpassed', 'synchronized', 'systematized', 'targeted', 'trained', 'transformed',
  'tripled', 'troubleshot', 'turned around', 'unified', 'upgraded', 'utilized',
]);

const WEAK_VERBS = new Set([
  'assisted', 'helped', 'worked', 'was responsible', 'responsible for',
  'duties included', 'handled', 'participated', 'contributed', 'involved',
  'supported', 'aided', 'tasked with', 'assigned to', 'served as',
]);

const BUZZWORDS = new Set([
  'synergy', 'leverage', 'proactive', 'paradigm', 'holistic', 'ecosystem',
  'bandwidth', 'circle back', 'deep dive', 'drill down', 'move the needle',
  'low-hanging fruit', 'best practices', 'value-add', 'thought leader',
  'game changer', 'disruptive', 'ninja', 'rockstar', 'guru', 'wizard',
]);

export function analyzeBullets(sections: ResumeSection[]): BulletAnalysis[] {
  const analyses: BulletAnalysis[] = [];

  for (const section of sections) {
    if (!['experience', 'projects'].includes(section.name)) continue;

    for (const bullet of section.bullets) {
      const analysis = analyzeSingleBullet(bullet, section.name);
      analyses.push(analysis);
    }
  }

  return analyses;
}

function analyzeSingleBullet(bullet: string, sectionName: SectionType): BulletAnalysis {
  const issues: BulletIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const firstWord = bullet.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');

  if (WEAK_VERBS.has(firstWord) || WEAK_VERBS.has(bullet.toLowerCase().slice(0, 20))) {
    issues.push({
      type: 'weak_action_verb',
      message: `Starts with weak verb "${firstWord}". Use a stronger action verb.`,
    });
    suggestions.push(`Replace "${firstWord}" with a strong action verb like "Led", "Developed", or "Implemented"`);
    score -= 15;
  } else if (!STRONG_ACTION_VERBS.has(firstWord)) {
    if (!/^[a-z]+ed$/i.test(firstWord) && !/^[a-z]+ing$/i.test(firstWord)) {
      issues.push({
        type: 'weak_action_verb',
        message: 'Does not start with a strong action verb.',
      });
      suggestions.push('Start bullet points with a strong past-tense action verb');
      score -= 10;
    }
  }

  const hasMetrics = /\d+%|\$\d+|\d+\s*(k|m|million|billion|thousand)|\d+x|\d+\s*(users?|customers?|clients?|projects?|teams?|members?)/i.test(bullet);
  if (!hasMetrics) {
    issues.push({
      type: 'no_metrics',
      message: 'No quantifiable metrics found.',
    });
    suggestions.push('Add specific numbers, percentages, or dollar amounts to quantify your impact');
    score -= 20;
  }

  if (bullet.length > 200) {
    issues.push({
      type: 'too_long',
      message: `Bullet is too long (${bullet.length} characters). Keep under 150 characters.`,
    });
    suggestions.push('Shorten this bullet point to make it more concise and scannable');
    score -= 10;
  } else if (bullet.length < 30) {
    issues.push({
      type: 'too_short',
      message: 'Bullet is too short. Add more detail about your impact.',
    });
    suggestions.push('Expand this bullet with more context about your responsibilities and results');
    score -= 10;
  }

  const passivePatterns = [
    /\bwas\s+\w+ed\b/i,
    /\bwere\s+\w+ed\b/i,
    /\bbeen\s+\w+ed\b/i,
    /\bbeing\s+\w+ed\b/i,
  ];
  if (passivePatterns.some(pattern => pattern.test(bullet))) {
    issues.push({
      type: 'passive_voice',
      message: 'Uses passive voice. Rewrite in active voice.',
    });
    suggestions.push('Rewrite using active voice to emphasize your direct contributions');
    score -= 10;
  }

  if (/\b(i|my|me)\b/i.test(bullet)) {
    issues.push({
      type: 'first_person',
      message: 'Uses first person pronouns. Resume bullets should not use "I", "my", or "me".',
    });
    suggestions.push('Remove first-person pronouns and start directly with the action verb');
    score -= 5;
  }

  const foundBuzzwords = Array.from(BUZZWORDS).filter(bw => bullet.toLowerCase().includes(bw));
  if (foundBuzzwords.length > 0) {
    issues.push({
      type: 'buzzwords',
      message: `Contains overused buzzwords: ${foundBuzzwords.join(', ')}`,
    });
    suggestions.push('Replace buzzwords with specific, concrete descriptions of your work');
    score -= 5 * foundBuzzwords.length;
  }

  const vagueTerms = ['various', 'several', 'many', 'some', 'numerous', 'multiple'];
  const foundVague = vagueTerms.filter(term => bullet.toLowerCase().includes(term));
  if (foundVague.length > 0) {
    issues.push({
      type: 'vague_language',
      message: `Uses vague quantifiers: ${foundVague.join(', ')}. Be specific.`,
    });
    suggestions.push('Replace vague terms with specific numbers or details');
    score -= 5 * foundVague.length;
  }

  const rewriteSuggestion = generateRewriteSuggestion(bullet, issues);

  return {
    text: bullet,
    section: sectionName,
    score: Math.max(0, score),
    issues,
    suggestions,
    rewriteSuggestion,
  };
}

function generateRewriteSuggestion(bullet: string, issues: BulletIssue[]): string | undefined {
  if (issues.length === 0) return undefined;

  const hasWeakVerb = issues.some(i => i.type === 'weak_action_verb');
  const noMetrics = issues.some(i => i.type === 'no_metrics');

  if (hasWeakVerb || noMetrics) {
    const strongVerbs = ['Developed', 'Implemented', 'Led', 'Designed', 'Optimized', 'Streamlined'];
    const randomVerb = strongVerbs[Math.floor(Math.random() * strongVerbs.length)];

    let suggestion = bullet;

    if (hasWeakVerb) {
      const firstWord = bullet.split(/\s+/)[0];
      suggestion = suggestion.replace(firstWord, randomVerb);
    }

    if (noMetrics) {
      suggestion += ' [Add: resulting in X% improvement / saving $X / impacting X users]';
    }

    return suggestion;
  }

  return undefined;
}

export function analyzeSections(
  sections: ResumeSection[],
  missingKeywords: string[]
): SectionAnalysis[] {
  const requiredSections: SectionType[] = ['summary', 'experience', 'education', 'skills'];
  const analyses: SectionAnalysis[] = [];
  const foundSectionNames = new Set(sections.map(s => s.name));

  for (const sectionType of requiredSections) {
    const section = sections.find(s => s.name === sectionType);

    if (!section) {
      analyses.push({
        name: sectionType,
        found: false,
        score: 0,
        feedback: `Missing ${sectionType} section. This is a critical section for ATS systems.`,
        suggestions: [
          `Add a ${sectionType} section to your resume`,
          getSectionGuidance(sectionType),
        ],
      });
      continue;
    }

    const { score, feedback, suggestions } = evaluateSection(section, missingKeywords);
    analyses.push({
      name: sectionType,
      found: true,
      score,
      feedback,
      suggestions,
    });
  }

  const optionalSections: SectionType[] = ['projects', 'certifications'];
  for (const sectionType of optionalSections) {
    if (foundSectionNames.has(sectionType)) {
      const section = sections.find(s => s.name === sectionType)!;
      const { score, feedback, suggestions } = evaluateSection(section, missingKeywords);
      analyses.push({
        name: sectionType,
        found: true,
        score,
        feedback,
        suggestions,
      });
    }
  }

  return analyses;
}

function evaluateSection(
  section: ResumeSection,
  missingKeywords: string[]
): { score: number; feedback: string; suggestions: string[] } {
  let score = 100;
  const suggestions: string[] = [];
  let feedback = '';

  const wordCount = section.content.split(/\s+/).length;

  switch (section.name) {
    case 'summary':
      if (wordCount < 30) {
        score -= 20;
        feedback = 'Summary is too brief.';
        suggestions.push('Expand your summary to 3-5 sentences highlighting your key qualifications');
      } else if (wordCount > 100) {
        score -= 10;
        feedback = 'Summary is too long.';
        suggestions.push('Condense your summary to focus on your most relevant qualifications');
      } else {
        feedback = 'Summary has good length.';
      }

      const keywordsInSummary = missingKeywords.filter(kw =>
        section.content.toLowerCase().includes(kw.toLowerCase())
      );
      if (keywordsInSummary.length === 0 && missingKeywords.length > 0) {
        score -= 15;
        suggestions.push('Include 2-3 key skills from the job description in your summary');
      }
      break;

    case 'experience':
      if (section.bullets.length < 3) {
        score -= 25;
        feedback = 'Experience section needs more detail.';
        suggestions.push('Add more bullet points describing your accomplishments');
      } else if (section.bullets.length < 6) {
        score -= 10;
        feedback = 'Experience section could use more bullet points.';
        suggestions.push('Consider adding more detail to your recent positions');
      } else {
        feedback = 'Experience section has good detail.';
      }
      break;

    case 'education':
      if (wordCount < 20) {
        score -= 15;
        feedback = 'Education section needs more detail.';
        suggestions.push('Include degree, institution, graduation date, and relevant coursework');
      } else {
        feedback = 'Education section is complete.';
      }
      break;

    case 'skills':
      if (wordCount < 10) {
        score -= 20;
        feedback = 'Skills section is too sparse.';
        suggestions.push('List 10-15 relevant technical and soft skills');
      } else {
        feedback = 'Skills section is present.';
      }

      const missingSkillsCount = missingKeywords.filter(kw => {
        return !section.content.toLowerCase().includes(kw.toLowerCase());
      }).length;

      if (missingSkillsCount > 5) {
        score -= 15;
        suggestions.push(`Add missing skills: ${missingKeywords.slice(0, 5).join(', ')}`);
      }
      break;

    case 'projects':
      if (section.bullets.length < 2) {
        score -= 10;
        feedback = 'Projects section needs more entries.';
        suggestions.push('Add 2-4 relevant projects with descriptions of technologies used');
      } else {
        feedback = 'Projects section is well-populated.';
      }
      break;

    default:
      feedback = 'Section found.';
  }

  return { score: Math.max(0, score), feedback, suggestions };
}

function getSectionGuidance(sectionType: SectionType): string {
  const guidance: Record<SectionType, string> = {
    summary: 'Write 3-5 sentences summarizing your experience, skills, and career goals',
    experience: 'List your work history with company names, titles, dates, and bullet points',
    education: 'Include degrees, institutions, graduation dates, and relevant coursework',
    skills: 'List technical skills, programming languages, tools, and soft skills',
    projects: 'Describe personal or professional projects with technologies used',
    certifications: 'List relevant professional certifications with dates',
    awards: 'Include honors, awards, and recognition',
    publications: 'List published papers, articles, or blog posts',
    languages: 'Include spoken languages with proficiency levels',
    interests: 'List relevant hobbies and interests',
    references: 'Usually "Available upon request" or list references',
    unknown: '',
  };

  return guidance[sectionType] || '';
}

export function generateSuggestions(
  resume: ParsedResume,
  jobDescription: ParsedJobDescription,
  missingKeywords: string[],
  bulletAnalyses: BulletAnalysis[],
  formattingIssues: FormattingIssue[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (missingKeywords.length > 0) {
    const keywordsByCategory = categorizeKeywords(missingKeywords);

    if (keywordsByCategory.hardSkills.length > 0) {
      suggestions.push({
        type: 'add_keywords',
        priority: 'high',
        title: 'Add Missing Technical Skills',
        description: `Your resume is missing ${keywordsByCategory.hardSkills.length} technical skills mentioned in the job description.`,
        actionItems: [
          `Add these skills to your Skills section: ${keywordsByCategory.hardSkills.slice(0, 5).join(', ')}`,
          'Include these skills in your experience bullet points where applicable',
          'Make sure to use the exact terminology from the job posting',
        ],
      });
    }

    if (keywordsByCategory.tools.length > 0) {
      suggestions.push({
        type: 'add_keywords',
        priority: 'high',
        title: 'Add Missing Tools',
        description: `The job requires experience with tools not mentioned in your resume.`,
        actionItems: [
          `Add these tools: ${keywordsByCategory.tools.join(', ')}`,
          'Include specific version numbers or years of experience if applicable',
        ],
      });
    }
  }

  const weakBullets = bulletAnalyses.filter(b => b.score < 70);
  if (weakBullets.length > 0) {
    suggestions.push({
      type: 'improve_bullets',
      priority: 'high',
      title: 'Strengthen Bullet Points',
      description: `${weakBullets.length} bullet points need improvement.`,
      actionItems: [
        'Start each bullet with a strong action verb (Led, Developed, Implemented)',
        'Add quantifiable metrics (percentages, dollar amounts, numbers)',
        'Remove first-person pronouns (I, my, me)',
        'Keep bullets concise (under 150 characters)',
      ],
    });
  }

  const bulletsWithoutMetrics = bulletAnalyses.filter(b =>
    b.issues.some(i => i.type === 'no_metrics')
  );
  if (bulletsWithoutMetrics.length > 3) {
    suggestions.push({
      type: 'add_metrics',
      priority: 'medium',
      title: 'Add Quantifiable Achievements',
      description: `${bulletsWithoutMetrics.length} bullets lack metrics. Numbers make your impact tangible.`,
      actionItems: [
        'Add percentages for improvements (improved efficiency by 25%)',
        'Include dollar amounts for cost savings or revenue ($50K saved)',
        'Mention team sizes or scope (led team of 5, managed 10 projects)',
        'Use specific numbers instead of vague terms (handled 50+ tickets weekly)',
      ],
    });
  }

  const missingSections = ['summary', 'experience', 'education', 'skills'].filter(
    s => !resume.sections.find(section => section.name === s)
  );
  if (missingSections.length > 0) {
    suggestions.push({
      type: 'add_section',
      priority: 'high',
      title: 'Add Missing Sections',
      description: `Your resume is missing essential sections that ATS systems look for.`,
      actionItems: missingSections.map(s => `Add a ${s.charAt(0).toUpperCase() + s.slice(1)} section`),
    });
  }

  if (formattingIssues.length > 0) {
    const criticalIssues = formattingIssues.filter(i => i.severity === 'error');
    if (criticalIssues.length > 0) {
      suggestions.push({
        type: 'fix_formatting',
        priority: 'high',
        title: 'Fix ATS Compatibility Issues',
        description: 'Your resume has formatting that may confuse ATS systems.',
        actionItems: criticalIssues.map(i => i.suggestion),
      });
    }
  }

  const weakVerbBullets = bulletAnalyses.filter(b =>
    b.issues.some(i => i.type === 'weak_action_verb')
  );
  if (weakVerbBullets.length > 2) {
    suggestions.push({
      type: 'strengthen_verbs',
      priority: 'medium',
      title: 'Use Stronger Action Verbs',
      description: `${weakVerbBullets.length} bullets start with weak verbs.`,
      actionItems: [
        'Replace "Responsible for" with "Led" or "Managed"',
        'Replace "Helped" with "Collaborated" or "Partnered"',
        'Replace "Worked on" with "Developed" or "Built"',
        'Use past tense for previous roles, present for current',
      ],
    });
  }

  if (missingKeywords.length > jobDescription.allKeywords.length * 0.3) {
    suggestions.push({
      type: 'tailor_content',
      priority: 'high',
      title: 'Tailor Resume to Job Description',
      description: 'Your resume needs more alignment with this specific job posting.',
      actionItems: [
        'Mirror the language used in the job description',
        'Prioritize experiences most relevant to this role',
        'Add a targeted summary that addresses key requirements',
        'Consider creating a "Relevant Experience" section',
      ],
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function categorizeKeywords(keywords: string[]): {
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
} {
  const hardSkills: string[] = [];
  const softSkills: string[] = [];
  const tools: string[] = [];

  const toolPatterns = /^(jira|confluence|git|docker|kubernetes|aws|azure|gcp|slack|vs code|visual studio)/i;
  const softSkillPatterns = /communication|leadership|teamwork|problem.?solving|analytical|creative/i;

  for (const keyword of keywords) {
    if (toolPatterns.test(keyword)) {
      tools.push(keyword);
    } else if (softSkillPatterns.test(keyword)) {
      softSkills.push(keyword);
    } else {
      hardSkills.push(keyword);
    }
  }

  return { hardSkills, softSkills, tools };
}
