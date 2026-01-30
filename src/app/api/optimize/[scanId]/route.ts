import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateOptimizedResume, getOptimizationPreview } from '@/lib/document-generator';
import { BulletAnalysis, ResumeSection } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanId } = await params;

    // Get user and verify Pro subscription
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the scan
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Verify scan belongs to user
    if (scan.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse bullet analysis
    const bulletAnalysis = (scan.bulletAnalysis as unknown as BulletAnalysis[]) || [];
    const missingKeywords = (scan.missingKeywords as unknown as string[]) || [];

    // Return preview data (available for all users)
    const preview = getOptimizationPreview(bulletAnalysis, missingKeywords);

    return NextResponse.json({
      preview,
      isPro: dbUser.subscriptionTier === 'PRO',
    });
  } catch (error) {
    console.error('Error getting optimization preview:', error);
    return NextResponse.json(
      { error: 'Failed to get optimization preview' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanId } = await params;

    // Get user and verify Pro subscription
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is Pro
    if (dbUser.subscriptionTier !== 'PRO') {
      return NextResponse.json(
        { error: 'Pro subscription required to download optimized resume' },
        { status: 403 }
      );
    }

    // Get the scan
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Verify scan belongs to user
    if (scan.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse stored data
    const bulletAnalysis = (scan.bulletAnalysis as unknown as BulletAnalysis[]) || [];
    const missingKeywords = (scan.missingKeywords as unknown as string[]) || [];
    const foundKeywords = (scan.foundKeywords as unknown as string[]) || [];
    const parsedSections = (scan.parsedSections as unknown as ResumeSection[]) || undefined;

    // Generate the optimized resume document
    const buffer = await generateOptimizedResume({
      resumeText: scan.resumeText || '',
      bulletAnalysis,
      missingKeywords,
      foundKeywords,
      fileName: scan.fileName,
      parsedSections,
    });

    // Create a safe filename
    const safeFileName = scan.fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars
      .substring(0, 50); // Limit length

    // Return the document as a downloadable PDF
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating optimized resume:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimized resume' },
      { status: 500 }
    );
  }
}
