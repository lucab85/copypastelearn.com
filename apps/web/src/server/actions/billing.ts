"use server";

import Stripe from "stripe";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
}

// ─── Create Checkout Session ────────────────────────────

export async function createCheckoutSession(): Promise<{ url: string }> {
  const user = await requireAuth();
  const stripe = getStripe();
  const appUrl = getAppUrl();

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRICE_ID is not set");

  // Check if the user already has an active subscription
  const existing = await db.subscription.findUnique({
    where: { userId: user.id },
  });

  if (existing?.status === "ACTIVE") {
    return { url: `${appUrl}/settings` };
  }

  // Find or create Stripe customer
  let customerId: string | undefined;

  if (existing?.clerkSubscriptionId) {
    // Try to retrieve the customer from the existing subscription
    try {
      const sub = await stripe.subscriptions.retrieve(
        existing.clerkSubscriptionId
      );
      customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    } catch {
      // Subscription no longer exists in Stripe, continue without customer ID
    }
  }

  if (!customerId) {
    // Search for existing customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName ?? undefined,
        metadata: {
          clerkUserId: user.clerkUserId,
          userId: user.id,
        },
      });
      customerId = customer.id;
    }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    metadata: {
      clerkUserId: user.clerkUserId,
      userId: user.id,
    },
    subscription_data: {
      metadata: {
        clerkUserId: user.clerkUserId,
        userId: user.id,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return { url: session.url };
}

// ─── Create Customer Portal Session ─────────────────────

export async function createPortalSession(): Promise<{ url: string }> {
  const user = await requireAuth();
  const stripe = getStripe();
  const appUrl = getAppUrl();

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription?.clerkSubscriptionId) {
    return { url: `${appUrl}/pricing` };
  }

  // Get the customer ID from the subscription
  let customerId: string;
  try {
    const sub = await stripe.subscriptions.retrieve(
      subscription.clerkSubscriptionId
    );
    customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  } catch {
    // Subscription no longer valid, redirect to pricing
    return { url: `${appUrl}/pricing` };
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings`,
  });

  return { url: portalSession.url };
}
