import { describe, expect, it } from "vitest";
import { money, priceFor, type ProPlan } from "../../src/lib/pricing";

const pro: ProPlan = { id: "cplan_x", name: "Pro", currencySymbol: "$", monthlyCents: 2900, annualCents: 30000 };

describe("pricing", () => {
  it("formats whole and fractional amounts", () => {
    expect(money(2900, "$")).toBe("$29");
    expect(money(1450, "$")).toBe("$14.50");
  });
  it("shows the annual plan per month, billed yearly, with the saving", () => {
    expect(priceFor(pro, "annual")).toEqual({
      perMonth: "$25",
      billed: "Billed $300 once a year",
      saving: "Save $48 a year",
      offer: null,
    });
  });
  it("shows the monthly plan", () => {
    expect(priceFor(pro, "month")).toEqual({ perMonth: "$29", billed: "Billed monthly", saving: null, offer: null });
  });
  it("applies the launch discounts to the first period", () => {
    expect(priceFor(pro, "annual", 30).offer).toBe("$210 for the first year");
    expect(priceFor(pro, "month", 50).offer).toBe("$14.50 for the first month");
  });
  it("falls back to monthly when there is no annual price", () => {
    expect(priceFor({ ...pro, annualCents: null }, "annual").perMonth).toBe("$29");
  });
});
