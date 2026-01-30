import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from 'docx';
import { BulletAnalysis, SectionType } from '@/types';

interface OptimizedResumeData {
  resumeText: string;
  bulletAnalysis: BulletAnalysis[];
  missingKeywords: string[];
  foundKeywords: string[];
  fileName: string;
}

interface ResumeSection {
  name: string;
  content: string[];
}

// Section name mapping for display
const SECTION_DISPLAY_NAMES: Record<string, string> = {
  summary: 'Professional Summary',
  experience: 'Professional Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards & Achievements',
  publications: 'Publications',
  languages: 'Languages',
  interests: 'Interests',
  references: 'References',
};

// Parse resume text into sections
function parseResumeIntoSections(resumeText: string): ResumeSection[] {
  const lines = resumeText.split('\n').filter((line) => line.trim());
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  const sectionPatterns = [
    /^(professional\s+)?summary/i,
    /^(work\s+)?experience/i,
    /^education/i,
    /^skills/i,
    /^(technical\s+)?projects/i,
    /^certifications?/i,
    /^awards?/i,
    /^publications?/i,
    /^languages?/i,
    /^interests?/i,
    /^references?/i,
  ];

  const sectionNames = [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'awards',
    'publications',
    'languages',
    'interests',
    'references',
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    let foundSection = false;

    for (let i = 0; i < sectionPatterns.length; i++) {
      if (sectionPatterns[i].test(trimmedLine)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          name: sectionNames[i],
          content: [],
        };
        foundSection = true;
        break;
      }
    }

    if (!foundSection && currentSection) {
      currentSection.content.push(trimmedLine);
    } else if (!foundSection && !currentSection && trimmedLine) {
      // Content before first section (usually contact info)
      if (!sections.find((s) => s.name === 'header')) {
        currentSection = { name: 'header', content: [trimmedLine] };
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// Apply bullet optimizations
function applyBulletOptimizations(
  sections: ResumeSection[],
  bulletAnalysis: BulletAnalysis[]
): ResumeSection[] {
  // Create a map of original bullets to their rewrites
  const bulletRewrites = new Map<string, string>();

  for (const bullet of bulletAnalysis) {
    if (bullet.rewriteSuggestion && bullet.score < 80) {
      // Normalize the bullet text for matching
      const normalizedOriginal = bullet.text.trim().toLowerCase();
      bulletRewrites.set(normalizedOriginal, bullet.rewriteSuggestion);
    }
  }

  return sections.map((section) => ({
    ...section,
    content: section.content.map((line) => {
      const normalizedLine = line.trim().toLowerCase();
      // Check if this line matches any bullet that needs rewriting
      for (const [original, rewrite] of bulletRewrites) {
        if (normalizedLine.includes(original.substring(0, 50)) ||
            original.includes(normalizedLine.substring(0, 50))) {
          return rewrite;
        }
      }
      return line;
    }),
  }));
}

// Inject missing keywords into skills section
function injectKeywords(
  sections: ResumeSection[],
  missingKeywords: string[],
  foundKeywords: string[]
): ResumeSection[] {
  if (missingKeywords.length === 0) return sections;

  const skillsIndex = sections.findIndex((s) => s.name === 'skills');

  if (skillsIndex !== -1) {
    // Add missing keywords to existing skills section
    const existingSkills = sections[skillsIndex].content.join(' ');
    const keywordsToAdd = missingKeywords.filter(
      (kw) => !existingSkills.toLowerCase().includes(kw.toLowerCase())
    );

    if (keywordsToAdd.length > 0) {
      sections[skillsIndex].content.push(
        `Additional Skills: ${keywordsToAdd.slice(0, 10).join(', ')}`
      );
    }
  } else {
    // Create a new skills section
    sections.push({
      name: 'skills',
      content: [missingKeywords.slice(0, 15).join(', ')],
    });
  }

  return sections;
}

// Generate DOCX document
export async function generateOptimizedResume(
  data: OptimizedResumeData
): Promise<Buffer> {
  // Parse resume into sections
  let sections = parseResumeIntoSections(data.resumeText);

  // Apply bullet optimizations
  sections = applyBulletOptimizations(sections, data.bulletAnalysis);

  // Inject missing keywords
  sections = injectKeywords(sections, data.missingKeywords, data.foundKeywords);

  // Build document paragraphs
  const paragraphs: Paragraph[] = [];

  // Add title (filename without extension)
  const title = data.fileName.replace(/\.(pdf|docx)$/i, '');
  paragraphs.push(
    new Paragraph({
      text: 'Optimized Resume',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated from: ${data.fileName}`,
          italics: true,
          size: 20,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Add each section
  for (const section of sections) {
    if (section.name === 'header') {
      // Header content (contact info) - no heading
      for (const line of section.content) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );
      }
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    } else {
      // Section heading
      const displayName =
        SECTION_DISPLAY_NAMES[section.name] ||
        section.name.charAt(0).toUpperCase() + section.name.slice(1);

      paragraphs.push(
        new Paragraph({
          text: displayName.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
          border: {
            bottom: { color: '000000', space: 1, size: 6, style: 'single' },
          },
        })
      );

      // Section content
      for (const line of section.content) {
        const isBullet = /^[•\-\*\d+\.\)]/.test(line.trim());

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: isBullet ? line.replace(/^[•\-\*]\s*/, '• ') : line,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
            indent: isBullet ? { left: 360 } : undefined,
          })
        );
      }
    }
  }

  // Add optimization notes at the end
  paragraphs.push(new Paragraph({ text: '', spacing: { before: 400 } }));
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '--- Optimization Notes ---',
          bold: true,
          size: 20,
          color: '2563eb',
        }),
      ],
      spacing: { before: 400, after: 100 },
    })
  );

  const optimizedBulletCount = data.bulletAnalysis.filter(
    (b) => b.rewriteSuggestion && b.score < 80
  ).length;

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `• ${optimizedBulletCount} bullet points were optimized for ATS compatibility`,
          size: 18,
          color: '666666',
        }),
      ],
      spacing: { after: 50 },
    })
  );

  if (data.missingKeywords.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${Math.min(data.missingKeywords.length, 10)} missing keywords were added to the Skills section`,
            size: 18,
            color: '666666',
          }),
        ],
        spacing: { after: 50 },
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '• Review the document and customize placeholder values marked with [Add: ...]',
          size: 18,
          color: '666666',
        }),
      ],
      spacing: { after: 50 },
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
    },
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// Get optimization preview data
export function getOptimizationPreview(
  bulletAnalysis: BulletAnalysis[],
  missingKeywords: string[]
): {
  optimizedBullets: Array<{ original: string; optimized: string; section: SectionType }>;
  keywordsToAdd: string[];
  totalImprovements: number;
} {
  const optimizedBullets = bulletAnalysis
    .filter((b) => b.rewriteSuggestion && b.score < 80)
    .map((b) => ({
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
