import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { parseResume } from '@/lib/parser';
import { parseJobDescription } from '@/lib/nlp';
import { calculateATSScore } from '@/lib/scoring';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, FREE_SCAN_LIMIT } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        scans: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)),
            },
          },
        },
      },
    });

    if (!dbUser) {
      // Check if user exists with same email (might have old clerkId from dev mode)
      const userEmail = user.emailAddresses[0]?.emailAddress || '';
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (existingUserByEmail) {
        // Update the clerkId to the new production one
        dbUser = await prisma.user.update({
          where: { email: userEmail },
          data: { clerkId: userId },
          include: {
            scans: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setDate(1)),
                },
              },
            },
          },
        });
      } else {
        // Create new user
        dbUser = await prisma.user.create({
          data: {
            clerkId: userId,
            email: userEmail,
          },
          include: {
            scans: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setDate(1)),
                },
              },
            },
          },
        });
      }
    }

    if (dbUser.subscriptionTier === 'FREE' && dbUser.scans.length >= FREE_SCAN_LIMIT) {
      return NextResponse.json(
        {
          error: 'Scan limit reached',
          message: 'You have reached your monthly scan limit. Upgrade to Pro for unlimited scans.',
          scansUsed: dbUser.scans.length,
          scansLimit: FREE_SCAN_LIMIT,
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File | null;
    const jobDescription = formData.get('jobDescription') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: 'Job description is required and must be at least 50 characters' },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parsedResume = await parseResume(buffer, file.type, file.size);

    const parsedJobDescription = parseJobDescription(jobDescription);

    const scanResult = calculateATSScore(parsedResume, parsedJobDescription);

    const scan = await prisma.scan.create({
      data: {
        userId: dbUser.id,
        fileName: file.name,
        fileType: file.type,
        resumeText: parsedResume.normalizedText,
        jobDescription: jobDescription,
        overallScore: scanResult.score.overall,
        keywordScore: scanResult.score.keyword,
        formattingScore: scanResult.score.formatting,
        sectionScore: scanResult.score.section,
        similarityScore: scanResult.score.similarity,
        missingKeywords: scanResult.missingKeywords,
        foundKeywords: scanResult.foundKeywords,
        formattingIssues: scanResult.formattingIssues as unknown as [],
        sectionAnalysis: scanResult.sectionAnalysis as unknown as object,
        bulletAnalysis: scanResult.bulletAnalysis as unknown as [],
        suggestions: scanResult.suggestions as unknown as [],
      },
    });

    return NextResponse.json({
      id: scan.id,
      score: scanResult.score,
      keywordMatches: scanResult.keywordMatches,
      missingKeywords: scanResult.missingKeywords,
      foundKeywords: scanResult.foundKeywords,
      formattingIssues: scanResult.formattingIssues,
      sectionAnalysis: scanResult.sectionAnalysis,
      bulletAnalysis: scanResult.bulletAnalysis,
      suggestions: scanResult.suggestions,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process resume. Please try again.' },
      { status: 500 }
    );
  }
}
