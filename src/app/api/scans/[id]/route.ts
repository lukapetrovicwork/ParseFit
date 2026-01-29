import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const scan = await prisma.scan.findFirst({
      where: {
        id: params.id,
        userId: dbUser.id,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: scan.id,
      fileName: scan.fileName,
      fileType: scan.fileType,
      jobDescription: scan.jobDescription,
      score: {
        overall: scan.overallScore,
        keyword: scan.keywordScore,
        formatting: scan.formattingScore,
        section: scan.sectionScore,
        similarity: scan.similarityScore,
      },
      missingKeywords: scan.missingKeywords,
      foundKeywords: scan.foundKeywords,
      formattingIssues: scan.formattingIssues,
      sectionAnalysis: scan.sectionAnalysis,
      bulletAnalysis: scan.bulletAnalysis,
      suggestions: scan.suggestions,
      createdAt: scan.createdAt,
    });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const scan = await prisma.scan.findFirst({
      where: {
        id: params.id,
        userId: dbUser.id,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    await prisma.scan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scan:', error);
    return NextResponse.json(
      { error: 'Failed to delete scan' },
      { status: 500 }
    );
  }
}
