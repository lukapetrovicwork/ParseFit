import { tokenize, removeStopWords, extractPhrases } from '@/lib/parser/text-normalizer';
import { KeywordMatch } from '@/types';

const HARD_SKILLS: Set<string> = new Set([
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'golang',
  'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'matlab', 'perl', 'sql', 'nosql',
  'html', 'css', 'sass', 'less', 'react', 'reactjs', 'react.js', 'angular', 'angularjs',
  'vue', 'vuejs', 'vue.js', 'svelte', 'nextjs', 'next.js', 'nuxt', 'gatsby',
  'node', 'nodejs', 'node.js', 'express', 'expressjs', 'fastify', 'nest', 'nestjs',
  'django', 'flask', 'fastapi', 'spring', 'springboot', 'rails', 'laravel',
  'asp.net', '.net', 'dotnet', 'entity framework',
  'aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'cloud computing',
  'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'circleci',
  'github actions', 'gitlab ci', 'ci/cd', 'devops', 'sre',
  'mongodb', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch', 'cassandra',
  'dynamodb', 'firebase', 'supabase', 'prisma', 'sequelize', 'typeorm',
  'graphql', 'rest', 'restful', 'api', 'microservices', 'serverless',
  'machine learning', 'ml', 'deep learning', 'dl', 'artificial intelligence', 'ai',
  'neural networks', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
  'data science', 'data analysis', 'data engineering', 'etl', 'data pipeline',
  'tableau', 'power bi', 'looker', 'metabase',
  'git', 'github', 'gitlab', 'bitbucket', 'svn',
  'linux', 'unix', 'bash', 'shell', 'powershell',
  'agile', 'scrum', 'kanban', 'jira', 'confluence', 'trello',
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
  'seo', 'sem', 'google analytics', 'marketing automation',
  'salesforce', 'hubspot', 'zendesk', 'intercom',
  'blockchain', 'web3', 'solidity', 'smart contracts',
  'unity', 'unreal engine', 'game development',
  'ios', 'android', 'react native', 'flutter', 'xamarin',
  'testing', 'unit testing', 'integration testing', 'e2e', 'jest', 'mocha', 'cypress',
  'selenium', 'puppeteer', 'playwright',
  'webpack', 'vite', 'rollup', 'parcel', 'babel', 'esbuild',
  'oauth', 'jwt', 'authentication', 'authorization', 'security',
  'networking', 'tcp/ip', 'http', 'https', 'ssl', 'tls',
  'load balancing', 'nginx', 'apache', 'cdn',
]);

const SOFT_SKILLS: Set<string> = new Set([
  'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving',
  'problem-solving', 'critical thinking', 'analytical', 'creativity', 'creative',
  'adaptability', 'flexibility', 'time management', 'organization', 'organized',
  'attention to detail', 'detail oriented', 'detail-oriented', 'self motivated',
  'self-motivated', 'initiative', 'proactive', 'work ethic', 'reliability',
  'dependability', 'interpersonal', 'presentation', 'public speaking',
  'written communication', 'verbal communication', 'negotiation', 'persuasion',
  'conflict resolution', 'decision making', 'decision-making', 'strategic thinking',
  'mentoring', 'coaching', 'empathy', 'emotional intelligence', 'patience',
  'stress management', 'resilience', 'positive attitude', 'enthusiasm',
  'customer service', 'client relations', 'stakeholder management',
  'cross-functional', 'multitasking', 'prioritization', 'deadline driven',
  'results oriented', 'results-oriented', 'goal oriented', 'goal-oriented',
  'innovative', 'resourceful', 'independent', 'autonomous',
]);

const TOOLS: Set<string> = new Set([
  'jira', 'confluence', 'trello', 'asana', 'monday', 'notion', 'slack', 'teams',
  'microsoft teams', 'zoom', 'google meet', 'skype',
  'excel', 'word', 'powerpoint', 'google sheets', 'google docs', 'google slides',
  'outlook', 'gmail', 'calendar',
  'vs code', 'visual studio', 'intellij', 'pycharm', 'webstorm', 'eclipse', 'xcode',
  'android studio', 'sublime', 'atom', 'vim', 'emacs',
  'postman', 'insomnia', 'swagger', 'charles', 'fiddler',
  'datadog', 'new relic', 'splunk', 'grafana', 'prometheus', 'sentry',
  'aws console', 'azure portal', 'gcp console',
  's3', 'ec2', 'lambda', 'cloudfront', 'route53', 'rds', 'ecs', 'eks',
  'heroku', 'vercel', 'netlify', 'digitalocean', 'linode',
  'npm', 'yarn', 'pnpm', 'pip', 'conda', 'maven', 'gradle', 'cargo',
  'homebrew', 'apt', 'yum', 'docker compose', 'docker hub',
]);

const TECHNOLOGIES: Set<string> = new Set([
  'html5', 'css3', 'es6', 'ecmascript', 'json', 'xml', 'yaml', 'markdown',
  'websocket', 'webrtc', 'pwa', 'spa', 'ssr', 'ssg', 'jamstack',
  'responsive design', 'mobile first', 'accessibility', 'a11y', 'wcag',
  'seo optimization', 'performance optimization', 'caching', 'memoization',
  'state management', 'redux', 'mobx', 'zustand', 'recoil', 'context api',
  'hooks', 'hoc', 'render props', 'composition',
  'orm', 'query optimization', 'indexing', 'sharding', 'replication',
  'event driven', 'message queue', 'rabbitmq', 'kafka', 'sqs', 'sns',
  'pub/sub', 'webhooks', 'polling', 'long polling', 'server sent events', 'sse',
  'oauth2', 'openid', 'saml', 'sso', 'mfa', '2fa', 'encryption',
  'https', 'cors', 'csrf', 'xss prevention', 'sql injection prevention',
  'containerization', 'orchestration', 'infrastructure as code', 'iac',
  'monitoring', 'logging', 'alerting', 'observability', 'tracing',
  'a/b testing', 'feature flags', 'canary deployment', 'blue-green deployment',
  'continuous integration', 'continuous deployment', 'continuous delivery',
  'version control', 'branching strategy', 'gitflow', 'trunk based development',
]);

// Check if text contains a whole word (not partial match)
function containsWholeWord(text: string, word: string): boolean {
  // Escape special regex characters
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use word boundary matching - handles punctuation and spaces
  const regex = new RegExp(`(?:^|[\\s,;:.!?()\\[\\]{}/"'\\-])${escaped}(?:[\\s,;:.!?()\\[\\]{}/"'\\-]|$)`, 'i');
  return regex.test(text);
}

export function extractKeywords(text: string): {
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  technologies: string[];
  allKeywords: string[];
} {
  const normalizedText = text.toLowerCase();
  const tokens = removeStopWords(tokenize(normalizedText));
  const phrases = extractPhrases(normalizedText, 2, 3);

  const allTerms = [...tokens, ...phrases];

  const foundHardSkills = new Set<string>();
  const foundSoftSkills = new Set<string>();
  const foundTools = new Set<string>();
  const foundTechnologies = new Set<string>();

  for (const term of allTerms) {
    const normalizedTerm = term.toLowerCase().trim();

    if (HARD_SKILLS.has(normalizedTerm)) {
      foundHardSkills.add(normalizedTerm);
    }
    if (SOFT_SKILLS.has(normalizedTerm)) {
      foundSoftSkills.add(normalizedTerm);
    }
    if (TOOLS.has(normalizedTerm)) {
      foundTools.add(normalizedTerm);
    }
    if (TECHNOLOGIES.has(normalizedTerm)) {
      foundTechnologies.add(normalizedTerm);
    }
  }

  for (const skill of HARD_SKILLS) {
    if (containsWholeWord(normalizedText, skill)) {
      foundHardSkills.add(skill);
    }
  }

  for (const skill of SOFT_SKILLS) {
    if (containsWholeWord(normalizedText, skill)) {
      foundSoftSkills.add(skill);
    }
  }

  for (const tool of TOOLS) {
    if (containsWholeWord(normalizedText, tool)) {
      foundTools.add(tool);
    }
  }

  for (const tech of TECHNOLOGIES) {
    if (containsWholeWord(normalizedText, tech)) {
      foundTechnologies.add(tech);
    }
  }

  const hardSkills = Array.from(foundHardSkills);
  const softSkills = Array.from(foundSoftSkills);
  const tools = Array.from(foundTools);
  const technologies = Array.from(foundTechnologies);

  const allKeywords = [...new Set([...hardSkills, ...softSkills, ...tools, ...technologies])];

  return {
    hardSkills,
    softSkills,
    tools,
    technologies,
    allKeywords,
  };
}

export function matchKeywords(
  resumeKeywords: string[],
  jobKeywords: string[]
): {
  matches: KeywordMatch[];
  matchedKeywords: string[];
  missingKeywords: string[];
  matchPercentage: number;
} {
  const resumeKeywordsLower = new Set(resumeKeywords.map(k => k.toLowerCase()));
  const matches: KeywordMatch[] = [];
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of jobKeywords) {
    const keywordLower = keyword.toLowerCase();
    const found = resumeKeywordsLower.has(keywordLower);

    let category: KeywordMatch['category'] = 'other';
    if (HARD_SKILLS.has(keywordLower)) category = 'hard_skill';
    else if (SOFT_SKILLS.has(keywordLower)) category = 'soft_skill';
    else if (TOOLS.has(keywordLower)) category = 'tool';
    else if (TECHNOLOGIES.has(keywordLower)) category = 'technology';

    matches.push({
      keyword,
      found,
      category,
      frequency: found ? 1 : 0,
    });

    if (found) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const matchPercentage = jobKeywords.length > 0
    ? (matchedKeywords.length / jobKeywords.length) * 100
    : 0;

  return {
    matches,
    matchedKeywords,
    missingKeywords,
    matchPercentage,
  };
}

export function getKeywordCategory(keyword: string): KeywordMatch['category'] {
  const keywordLower = keyword.toLowerCase();
  if (HARD_SKILLS.has(keywordLower)) return 'hard_skill';
  if (SOFT_SKILLS.has(keywordLower)) return 'soft_skill';
  if (TOOLS.has(keywordLower)) return 'tool';
  if (TECHNOLOGIES.has(keywordLower)) return 'technology';
  return 'other';
}
