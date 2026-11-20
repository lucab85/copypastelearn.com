import { clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import type { ProPlan } from "@/lib/pricing";

/** The Clerk Billing plan key that unlocks every course (see lib/billing.ts). */
const PRO_PLAN_SLUG = "pro";

const fetchProPlan = unstable_cache(
  async (): Promise<ProPlan> => {
    const client = await clerkClient();
    const { data } = await client.billing.getPlanList({ payerType: "user" });
    const pro = data.find((p) => p.slug === PRO_PLAN_SLUG);
    if (!pro) throw new Error(`no "${PRO_PLAN_SLUG}" plan in Clerk Billing`);
    return {
      id: pro.id,
      name: pro.name,
      currencySymbol: pro.fee.currencySymbol,
      monthlyCents: pro.fee.amount,
      annualCents: pro.annualFee?.amount ?? null,
    };
  },
  ["clerk-pro-plan"],
  { revalidate: 3600 },
);

/**
 * The Pro plan and its prices, cached for an hour so the pricing page renders
 * them on the server instead of waiting for Clerk's client script. Null when
 * Clerk cannot be read; the page then falls back to Clerk's <PricingTable />.
 * Errors are not cached, so the next request tries again.
 */
export async function getProPlan(): Promise<ProPlan | null> {
  try {
    return await fetchProPlan();
  } catch (err) {
    console.error("[pricing] could not read the Pro plan from Clerk Billing:", err);
    return null;
  }
}
