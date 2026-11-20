/**
 * Which purchase to report after a Clerk Billing checkout, and for how much.
 * Pure: the server action passes in what Clerk returned.
 */

export interface MoneyAmount {
  /** Minor units (cents). */
  amount: number;
  currency: string;
}

export interface PaidItemInput {
  id: string;
  status: string;
  planPeriod: "month" | "annual";
  createdAt: number;
  amount?: MoneyAmount | null;
  lifetimePaid?: MoneyAmount | null;
  isFreeTrial?: boolean | null;
  plan?: {
    slug: string;
    hasBaseFee?: boolean;
    fee?: MoneyAmount | null;
    annualFee?: MoneyAmount | null;
  } | null;
}

export interface PurchaseConversion {
  transactionId: string;
  /** Major units (25 for $25.00). */
  value: number;
  /** ISO 4217, upper case. */
  currency: string;
}

/** A checkout older than this is not "the purchase that just happened". */
export const FRESH_PURCHASE_MS = 30 * 60 * 1000;

function positive(m: MoneyAmount | null | undefined): MoneyAmount | null {
  return m && Number.isFinite(m.amount) && m.amount > 0 && m.currency ? m : null;
}

/**
 * The newest active, paid subscription item started in the last 30 minutes.
 * Value: what was actually paid so far when Clerk reports it, otherwise the
 * price of the chosen period. Free plans, free trials and old subscriptions
 * give null, so opening /dashboard?checkout=success later reports nothing.
 */
export function purchaseFromSubscriptionItems(
  items: readonly PaidItemInput[],
  now: number
): PurchaseConversion | null {
  const fresh = items
    .filter((i) => i.status === "active" && !i.isFreeTrial)
    .filter((i) => now - i.createdAt >= 0 && now - i.createdAt <= FRESH_PURCHASE_MS)
    .sort((a, b) => b.createdAt - a.createdAt);
  for (const item of fresh) {
    const price =
      positive(item.lifetimePaid) ??
      (item.planPeriod === "annual" ? positive(item.plan?.annualFee) : null) ??
      positive(item.amount) ??
      positive(item.plan?.fee);
    if (!price) continue;
    return {
      transactionId: item.id,
      value: Math.round(price.amount) / 100,
      currency: price.currency.toUpperCase(),
    };
  }
  return null;
}
