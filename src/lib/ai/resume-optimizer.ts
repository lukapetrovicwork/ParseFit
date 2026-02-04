import Anthropic from '@anthropic-ai/sdk';
import { BulletAnalysis, ResumeSection } from '@/types';

// Initialize Anthropic client (optional - only if API key is configured)
function getAnthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log('[AI] Checking for ANTHROPIC_API_KEY:', key ? 'Found' : 'Not found');
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export interface OptimizedBullet {
  original: string;
  optimized: string;
  section: string;
}

// Structure returned by AI for full resume restructuring
export interface AIResumeEntry {
  title?: string;
  subtitle?: string;
  date?: string;
  bullets: string[];
}

export interface AIResumeSection {
  type: string;
  title: string;
  entries: AIResumeEntry[];
}

export interface AIResumeStructure {
  contact: {
    name: string;
    lines: string[];
  };
  sections: AIResumeSection[];
}

export interface AIOptimizationResult {
  optimizedBullets: OptimizedBullet[];
  optimizedSummary?: string;
  success: boolean;
  error?: string;
}

/**
 * Rewrites resume bullets using Claude AI with STAR method
 * Incorporates missing keywords naturally
 */
export async function optimizeBulletsWithAI(
  bullets: BulletAnalysis[],
  missingKeywords: string[],
  jobDescription: string
): Promise<AIOptimizationResult> {
  const anthropic = getAnthropicClient();

  if (!anthropic) {
    console.log('[AI] Anthropic client not available - skipping AI optimization');
    return {
      optimizedBullets: [],
      success: false,
      error: 'AI optimization not configured',
    };
  }

  console.log('[AI] Starting bullet optimization with Claude');
  console.log('[AI] Total bullets received:', bullets.length);
  console.log('[AI] Bullet scores:', bullets.map(b => b.score).join(', '));

  // Filter bullets that need improvement (score < 80)
  const bulletsToOptimize = bullets.filter(b => b.score < 80).slice(0, 10);
  console.log('[AI] Bullets needing optimization (score < 80):', bulletsToOptimize.length);

  if (bulletsToOptimize.length === 0) {
    console.log('[AI] All bullets scored 80+, no AI optimization needed');
    return {
      optimizedBullets: [],
      success: true,
    };
  }

  const keywordsToInclude = missingKeywords.slice(0, 8).join(', ');

  const prompt = `You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization.

TASK: Rewrite the following resume bullet points to be more impactful and ATS-friendly.

JOB DESCRIPTION CONTEXT:
${jobDescription.substring(0, 1500)}

KEYWORDS TO NATURALLY INCORPORATE (where relevant):
${keywordsToInclude}

BULLET POINTS TO REWRITE:
${bulletsToOptimize.map((b, i) => `${i + 1}. [${b.section}] "${b.text}"`).join('\n')}

REQUIREMENTS:
1. Start each bullet with a strong action verb (Led, Developed, Implemented, Achieved, etc.)
2. Use the STAR method: Situation, Task, Action, Result
3. Include quantifiable metrics where possible (%, $, numbers)
4. Keep each bullet under 150 characters
5. Naturally incorporate relevant keywords - don't force them
6. Maintain the original meaning and truthfulness
7. Make it sound professional but natural, not AI-generated

OUTPUT FORMAT:
Return ONLY a JSON array with objects containing "index" (1-based), "original", and "optimized" fields.
Example: [{"index": 1, "original": "...", "optimized": "..."}]

No additional text or explanation - just the JSON array.`;

  try {
    console.log('[AI] Calling Anthropic API...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    console.log('[AI] API response received');

    const content = response.content[0];
    if (content.type !== 'text') {
      console.log('[AI] Unexpected content type:', content.type);
      throw new Error('Unexpected response type');
    }

    console.log('[AI] Parsing response text...');
    // Parse JSON response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('[AI] Could not find JSON in response:', content.text.substring(0, 200));
      throw new Error('Could not parse AI response');
    }

    const optimizedArray = JSON.parse(jsonMatch[0]) as Array<{
      index: number;
      original: string;
      optimized: string;
    }>;

    const optimizedBullets: OptimizedBullet[] = optimizedArray.map(item => ({
      original: bulletsToOptimize[item.index - 1]?.text || item.original,
      optimized: item.optimized,
      section: bulletsToOptimize[item.index - 1]?.section || 'experience',
    }));

    console.log('[AI] Successfully optimized', optimizedBullets.length, 'bullets');

    return {
      optimizedBullets,
      success: true,
    };
  } catch (error: unknown) {
    console.error('[AI] Optimization error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AI] Error message:', errorMessage);
    console.error('[AI] Full error:', JSON.stringify(error, null, 2));
    return {
      optimizedBullets: [],
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generates a tailored professional summary using Claude AI
 */
export async function generateOptimizedSummary(
  currentSummary: string | undefined,
  sections: ResumeSection[],
  missingKeywords: string[],
  jobDescription: string
): Promise<string | null> {
  const anthropic = getAnthropicClient();

  if (!anthropic) {
    console.log('[AI] Anthropic client not available - skipping summary generation');
    return null;
  }

  console.log('[AI] Starting summary generation with Claude');

  // Extract key info from experience section
  const experienceSection = sections.find(s => s.name === 'experience');
  const skillsSection = sections.find(s => s.name === 'skills');

  const experienceContext = experienceSection?.bullets.slice(0, 5).join('\n') || '';
  const skillsContext = skillsSection?.content.substring(0, 300) || '';

  const prompt = `You are an expert resume writer. Generate a professional summary for a resume.

JOB DESCRIPTION:
${jobDescription.substring(0, 1000)}

${currentSummary ? `CURRENT SUMMARY:\n${currentSummary}\n` : ''}
KEY EXPERIENCE:
${experienceContext}

SKILLS:
${skillsContext}

KEYWORDS TO INCORPORATE:
${missingKeywords.slice(0, 6).join(', ')}

REQUIREMENTS:
1. Write 2-3 sentences (50-80 words total)
2. Highlight relevant experience and skills for this specific role
3. Include 2-3 of the missing keywords naturally
4. Start with job title/years of experience
5. Sound professional and confident, not generic
6. No first-person pronouns (I, my, me)

OUTPUT: Return ONLY the summary text, nothing else.`;

  try {
    console.log('[AI] Calling Anthropic API for summary...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    console.log('[AI] Summary API response received');

    const content = response.content[0];
    if (content.type !== 'text') {
      console.log('[AI] Unexpected summary content type:', content.type);
      return null;
    }

    console.log('[AI] Summary generated successfully');
    return content.text.trim();
  } catch (error) {
    console.error('Summary generation error:', error);
    return null;
  }
}

/**
 * Check if AI optimization is available
 */
export function isAIEnabled(): boolean {
  const enabled = !!process.env.ANTHROPIC_API_KEY;
  console.log('[AI] isAIEnabled check:', enabled);
  return enabled;
}

/**
 * Restructures entire resume using Claude AI
 * Sends full resume text and gets back properly structured JSON
 * This bypasses problematic programmatic parsing
 */
export async function restructureResumeWithAI(
  resumeText: string,
  missingKeywords: string[],
  jobDescription: string,
  bulletAnalysis: BulletAnalysis[]
): Promise<AIResumeStructure | null> {
  const anthropic = getAnthropicClient();

  if (!anthropic) {
    console.log('[AI] Anthropic client not available - cannot restructure resume');
    return null;
  }

  console.log('[AI] Starting full resume restructuring with Claude Sonnet');

  // Get bullets that need improvement
  const weakBullets = bulletAnalysis
    .filter(b => b.score < 80)
    .map(b => ({ text: b.text, section: b.section }))
    .slice(0, 15);

  const keywordsToInclude = missingKeywords.slice(0, 10).join(', ');

  const prompt = `You are an expert resume writer and ATS (Applicant Tracking System) optimization specialist.

TASK: Parse and optimize the following resume. Return a properly structured JSON object.

RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

MISSING KEYWORDS TO INCORPORATE (where naturally relevant):
${keywordsToInclude}

WEAK BULLETS TO REWRITE (improve these with STAR method and metrics):
${weakBullets.map(b => `- [${b.section}] "${b.text}"`).join('\n')}

INSTRUCTIONS:
1. Parse the resume into proper sections (Summary, Experience, Education, Skills, Projects, etc.)
2. For each experience/project entry, identify the title, company/subtitle, date, and bullets
3. REWRITE weak bullets using strong action verbs and STAR method (Situation, Task, Action, Result)
4. Add quantifiable metrics where possible (%, $, numbers)
5. Naturally incorporate missing keywords into relevant bullets
6. Keep all other content exactly as-is (especially contact info, education details, skills)
7. Preserve ALL text - do not truncate or delete any information
8. Keep bullets under 150 characters each

OUTPUT FORMAT - Return ONLY valid JSON matching this exact structure:
{
  "contact": {
    "name": "Full Name",
    "lines": ["email@example.com", "phone", "location", "linkedin", "other contact info"]
  },
  "sections": [
    {
      "type": "summary",
      "title": "SUMMARY",
      "entries": [{"bullets": ["Professional summary text here..."]}]
    },
    {
      "type": "experience",
      "title": "EXPERIENCE",
      "entries": [
        {
          "title": "Company Name",
          "subtitle": "Job Title",
          "date": "Jan 2023 - Present",
          "bullets": ["Bullet 1", "Bullet 2"]
        }
      ]
    },
    {
      "type": "education",
      "title": "EDUCATION",
      "entries": [
        {
          "title": "University Name",
          "subtitle": "Degree and Major",
          "date": "Expected May 2026",
          "bullets": ["GPA: 3.8", "Relevant coursework or honors"]
        }
      ]
    },
    {
      "type": "skills",
      "title": "SKILLS",
      "entries": [{"bullets": ["Skill 1, Skill 2, Skill 3"]}]
    },
    {
      "type": "projects",
      "title": "PROJECTS",
      "entries": [
        {
          "title": "Project Name",
          "subtitle": "Technologies Used",
          "date": "Date if available",
          "bullets": ["Description bullet 1", "Description bullet 2"]
        }
      ]
    }
  ]
}

CRITICAL RULES:
- Return ONLY the JSON object, no markdown code blocks, no explanation
- Preserve all original information - do not remove or truncate anything
- For education: combine "Expected Graduation: May 2026" into just "Expected May 2026" as the date
- For skills: keep as comma-separated list in a single bullet
- Section types must be lowercase: summary, experience, education, skills, projects, certifications, etc.`;

  try {
    console.log('[AI] Calling Anthropic API for full resume restructuring...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    console.log('[AI] Resume restructuring API response received');

    const content = response.content[0];
    if (content.type !== 'text') {
      console.log('[AI] Unexpected content type:', content.type);
      throw new Error('Unexpected response type');
    }

    console.log('[AI] Parsing structured resume response...');

    // Try to extract JSON from the response
    let jsonText = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const structuredResume = JSON.parse(jsonText) as AIResumeStructure;

    // Validate the structure
    if (!structuredResume.contact || !structuredResume.sections) {
      throw new Error('Invalid resume structure returned by AI');
    }

    console.log('[AI] Successfully restructured resume with', structuredResume.sections.length, 'sections');

    // Log section details
    for (const section of structuredResume.sections) {
      console.log(`[AI] Section: ${section.type} - ${section.entries.length} entries`);
    }

    return structuredResume;
  } catch (error: unknown) {
    console.error('[AI] Resume restructuring error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AI] Error message:', errorMessage);
    return null;
  }
}
