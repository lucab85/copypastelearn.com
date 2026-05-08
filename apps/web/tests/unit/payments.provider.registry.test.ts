import { describe, it, expect, beforeEach } from "vitest";
import {
  registerProvider,
  getProvider,
  listProviders,
  __resetProviderRegistryForTests,
  type PaymentProvider,
} from "@/lib/payments/provider";

function fakeProvider(method: PaymentProvider["method"]): PaymentProvider {
  return {
    method,
    async createCheckout() {
      return { kind: "redirect", checkoutUrl: "x", checkoutSessionId: "s" };
    },
    verifyWebhook() {
      throw new Error("not implemented");
    },
    async refund() {
      return { providerRefundId: "r", status: "succeeded" };
    },
  };
}

beforeEach(() => __resetProviderRegistryForTests());

describe("PaymentProvider registry", () => {
  it("returns the registered provider for a method", () => {
    const p = fakeProvider("stripe_checkout");
    registerProvider(p);
    expect(getProvider("stripe_checkout")).toBe(p);
  });

  it("throws when the requested method has no provider", () => {
    expect(() => getProvider("stripe_shared_payment_token")).toThrow(/No PaymentProvider/);
  });

  it("listProviders enumerates registered methods", () => {
    registerProvider(fakeProvider("stripe_checkout"));
    registerProvider(fakeProvider("stripe_shared_payment_token"));
    expect(new Set(listProviders())).toEqual(
      new Set(["stripe_checkout", "stripe_shared_payment_token"]),
    );
  });
});
