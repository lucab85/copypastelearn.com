/**
 * What the pricing page shows for the Pro plan, from the amounts Clerk Billing
 * returns (in cents). Pure functions, so the numbers are unit-tested.
 */
export type Period = "month" | "annual";

export interface ProPlan {
  id: string;
  name: string;
  currencySymbol: string;
  /** Price of one month on the monthly plan, in cents. */
  monthlyCents: number;
  /** Price of one year on the annual plan, in cents, or null without one. */
  annualCents: number | null;
}

export interface PeriodPrice {
  /** "$25": the price per month for this period. */
  perMonth: string;
  /** "Billed $300 once a year" or "Billed monthly". */
  billed: string;
  /** "Save $48 a year" on the annual plan when it is cheaper, otherwise null. */
  saving: string | null;
  /** "$210 for the first year" with the offer, otherwise null. */
  offer: string | null;
}

export function money(cents: number, symbol: string): string {
  const value = cents / 100;
  return symbol + (Number.isInteger(value) ? String(value) : value.toFixed(2));
}

export function priceFor(plan: ProPlan, period: Period, offerPercent: number | null = null): PeriodPrice {
  const s = plan.currencySymbol;
  const off = (cents: number) => Math.round((cents * (100 - (offerPercent ?? 0))) / 100);
  if (period === "annual" && plan.annualCents !== null) {
    const save = plan.monthlyCents * 12 - plan.annualCents;
    return {
      perMonth: money(Math.round(plan.annualCents / 12), s),
      billed: `Billed ${money(plan.annualCents, s)} once a year`,
      saving: save > 0 ? `Save ${money(save, s)} a year` : null,
      offer: offerPercent ? `${money(off(plan.annualCents), s)} for the first year` : null,
    };
  }
  return {
    perMonth: money(plan.monthlyCents, s),
    billed: "Billed monthly",
    saving: null,
    offer: offerPercent ? `${money(off(plan.monthlyCents), s)} for the first month` : null,
  };
}
