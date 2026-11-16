"use server";

import Stripe from "stripe";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  attributionToStripeMetadata,
  parseAttributionFromCookieStore,
} from "@/lib/commerce/attribution";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
}

// ─── Create Checkout Session ────────────────────────────

export async function createCheckoutSession(
  promoCode?: string,
  plan: "monthly" | "annual" = "monthly"
): Promise<{ url: string }> {
  const user = await requireAuth();
  const stripe = getStripe();
  const appUrl = getAppUrl();

  const priceId = plan === "annual"
    ? process.env.STRIPE_ANNUAL_PRICE_ID
    : process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error(`STRIPE_${plan === "annual" ? "ANNUAL_" : ""}PRICE_ID is not set`);

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

  // Look up Stripe promotion code if provided
  const discounts: Stripe.Checkout.SessionCreateParams["discounts"] = [];
  if (promoCode) {
    try {
      const promoCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });
      if (promoCodes.data.length > 0) {
        discounts.push({ promotion_code: promoCodes.data[0].id });
      }
    } catch {
      // Invalid promo code — continue without discount
    }
  }

  // First-party campaign attribution (UTM + ad click ids), for reporting
  // in the Stripe dashboard. Only metadata; the webhook does not read it.
  const attribution = attributionToStripeMetadata(
    parseAttributionFromCookieStore(await cookies()),
  );

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // session_id lets the dashboard report the real amount as the
    // purchase conversion (see getCheckoutConversion below).
    success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    metadata: {
      ...attribution,
      clerkUserId: user.clerkUserId,
      userId: user.id,
    },
    subscription_data: {
      metadata: {
        clerkUserId: user.clerkUserId,
        userId: user.id,
      },
    },
    ...(discounts.length > 0
      ? { discounts }
      : { allow_promotion_codes: true }),
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return { url: session.url };
}

// ─── Checkout conversion (purchase event value) ─────────

export interface CheckoutConversion {
  transactionId: string;
  /** Amount charged, in major units (e.g. 29 for €29.00). */
  value: number;
  /** ISO 4217 code, upper case. */
  currency: string;
}

/**
 * Amount and currency of the signed-in user's completed Checkout Session,
 * for the client-side purchase event. Returns null if the session is not
 * theirs, not complete, or cannot be read; the caller then falls back to
 * the default value.
 */
export async function getCheckoutConversion(
  sessionId: string
): Promise<CheckoutConversion | null> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const user = await requireAuth();
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== user.id) return null;
    if (session.status !== "complete") return null;
    if (session.amount_total == null || !session.currency) return null;
    return {
      transactionId: session.id,
      value: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
    };
  } catch {
    return null;
  }
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
