import Stripe from "stripe";

/* ================================
   Stripe Initialization (Optional)
================================ */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

/* ================================
   Plans
================================ */

export const PLANS = {
  FREE: {
    name: "Free",
    scansPerMonth: 3,
    price: 0,
    features: [
      "3 resume scans per month",
      "Basic ATS score",
      "Missing keywords list",
      "Formatting check",
    ],
  },
  PRO: {
    name: "Pro",
    scansPerMonth: Infinity,
    price: 2.99,
    priceId: process.env.STRIPE_PRICE_ID || "",
    features: [
      "Unlimited resume scans",
      "Detailed ATS analysis",
      "AI-powered suggestions",
      "Bullet-level feedback",
      "Section-by-section scoring",
      "Download optimized resume (PDF)",
      "AI-powered bullet rewrites",
      "Priority support",
    ],
  },
} as const;

/* ================================
   Stripe Helpers
================================ */

export async function createCustomer(
  email: string,
  clerkId: string
): Promise<Stripe.Customer> {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.customers.create({
    email,
    metadata: {
      clerkId,
    },
  });
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        customerId,
      },
    },
  });
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe.subscriptions.retrieve(subscriptionId);
}
