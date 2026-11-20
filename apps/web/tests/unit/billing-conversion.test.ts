import { describe, expect, it } from "vitest";
import { FRESH_PURCHASE_MS, purchaseFromSubscriptionItems, type PaidItemInput } from "../../src/lib/billing-conversion";

const NOW = 1_800_000_000_000;
const usd = (amount: number) => ({ amount, currency: "usd" });
const pro = { slug: "pro", hasBaseFee: true, fee: usd(2900), annualFee: usd(30000) };
const item = (over: Partial<PaidItemInput>): PaidItemInput => ({
  id: "csubi_1", status: "active", planPeriod: "annual", createdAt: NOW - 60_000, plan: pro, ...over,
});

describe("purchaseFromSubscriptionItems", () => {
  it("reports what was actually paid when Clerk gives it", () => {
    expect(purchaseFromSubscriptionItems([item({ lifetimePaid: usd(30000), amount: usd(2500) })], NOW))
      .toEqual({ transactionId: "csubi_1", value: 300, currency: "USD" });
  });
  it("uses the annual price for an annual plan without a paid total", () => {
    expect(purchaseFromSubscriptionItems([item({ amount: usd(2500) })], NOW)?.value).toBe(300);
  });
  it("uses the item amount for a monthly plan", () => {
    expect(purchaseFromSubscriptionItems([item({ planPeriod: "month", amount: usd(2900) })], NOW)?.value).toBe(29);
  });
  it("reports nothing for the free plan", () => {
    const free = { slug: "free_user", hasBaseFee: false, fee: usd(0), annualFee: null };
    expect(purchaseFromSubscriptionItems([item({ plan: free, amount: usd(0) })], NOW)).toBeNull();
  });
  it("reports nothing for a free trial, a cancelled item or an old subscription", () => {
    expect(purchaseFromSubscriptionItems([item({ isFreeTrial: true, lifetimePaid: usd(30000) })], NOW)).toBeNull();
    expect(purchaseFromSubscriptionItems([item({ status: "ended", lifetimePaid: usd(30000) })], NOW)).toBeNull();
    expect(purchaseFromSubscriptionItems([item({ createdAt: NOW - FRESH_PURCHASE_MS - 1, lifetimePaid: usd(30000) })], NOW)).toBeNull();
  });
  it("picks the newest paid item", () => {
    const out = purchaseFromSubscriptionItems([
      item({ id: "old", createdAt: NOW - 600_000, lifetimePaid: usd(2900) }),
      item({ id: "new", createdAt: NOW - 30_000, lifetimePaid: usd(30000) }),
    ], NOW);
    expect(out?.transactionId).toBe("new");
  });
});
