import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import {
  createCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  PLANS,
} from '@/lib/stripe';
import { FREE_SCAN_LIMIT } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
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
      return NextResponse.json({
        tier: 'FREE',
        status: 'INACTIVE',
        scansUsed: 0,
        scansLimit: FREE_SCAN_LIMIT,
      });
    }

    const scansLimit = dbUser.subscriptionTier === 'PRO' ? Infinity : FREE_SCAN_LIMIT;

    return NextResponse.json({
      tier: dbUser.subscriptionTier,
      status: dbUser.subscriptionStatus,
      scansUsed: dbUser.scans.length,
      scansLimit,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
        },
      });
    }

    if (action === 'checkout') {
      let customerId = dbUser.stripeCustomerId;

      if (!customerId) {
        const customer = await createCustomer(
          user.emailAddresses[0]?.emailAddress || '',
          userId
        );
        customerId = customer.id;

        await prisma.user.update({
          where: { id: dbUser.id },
          data: { stripeCustomerId: customerId },
        });
      }

      const priceId = PLANS.PRO.priceId;
      if (!priceId) {
        return NextResponse.json(
          { error: 'Price ID not configured' },
          { status: 500 }
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const session = await createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/settings?success=true`,
        `${baseUrl}/settings?canceled=true`
      );

      return NextResponse.json({ url: session.url });
    }

    if (action === 'portal') {
      if (!dbUser.stripeCustomerId) {
        return NextResponse.json(
          { error: 'No subscription found' },
          { status: 400 }
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const session = await createBillingPortalSession(
        dbUser.stripeCustomerId,
        `${baseUrl}/settings`
      );

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription request' },
      { status: 500 }
    );
  }
}
