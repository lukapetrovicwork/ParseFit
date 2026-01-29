import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.customer) {
          const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer.id;

          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionTier: 'PRO',
              subscriptionStatus: 'ACTIVE',
              stripeSubscriptionId: subscriptionId,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        let status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE' = 'INACTIVE';

        switch (subscription.status) {
          case 'active':
            status = 'ACTIVE';
            break;
          case 'past_due':
            status = 'PAST_DUE';
            break;
          case 'canceled':
            status = 'CANCELED';
            break;
          default:
            status = 'INACTIVE';
        }

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: status,
            subscriptionTier: subscription.status === 'active' ? 'PRO' : 'FREE',
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionTier: 'FREE',
            subscriptionStatus: 'CANCELED',
            stripeSubscriptionId: null,
          },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription && invoice.customer) {
          const customerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer.id;

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: 'ACTIVE',
              subscriptionTier: 'PRO',
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.customer) {
          const customerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer.id;

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: 'PAST_DUE',
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
