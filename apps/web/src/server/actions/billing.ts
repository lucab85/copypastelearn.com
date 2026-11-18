"use server";

import Stripe from "stripe";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
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
