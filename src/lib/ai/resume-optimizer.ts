import Anthropic from '@anthropic-ai/sdk';
import { BulletAnalysis, ResumeSection } from '@/types';

// Initialize Anthropic client (optional - only if API key is configured)
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

export interface OptimizedBullet {
  original: string;
  optimized: string;
  section: string;
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
  if (!anthropic) {
    return {
      optimizedBullets: [],
      success: false,
      error: 'AI optimization not configured',
    };
  }

  // Filter bullets that need improvement (score < 80)
  const bulletsToOptimize = bullets.filter(b => b.score < 80).slice(0, 10);

  if (bulletsToOptimize.length === 0) {
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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
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

    return {
      optimizedBullets,
      success: true,
    };
  } catch (error) {
    console.error('AI optimization error:', error);
    return {
      optimizedBullets: [],
      success: false,
      error: error instanceof Error ? error.message : 'AI optimization failed',
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
  if (!anthropic) {
    return null;
  }

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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return null;
    }

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
  return anthropic !== null;
}
