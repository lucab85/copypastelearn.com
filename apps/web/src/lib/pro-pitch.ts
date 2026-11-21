import { LAUNCH_OFFER } from "@/lib/launch-offer";
import { priceFor, type ProPlan } from "@/lib/pricing";

/**
 * What Pro costs, in the two lines shown wherever a visitor meets a locked
 * lesson (the lesson itself, the end of the free lesson, the course page).
 * Same amounts as /pricing: both come from the Clerk Billing plan.
 */
export interface ProPitch {
  /** "$25 a month billed yearly, or $29 month to month" */
  price: string;
  /** The launch offer with its amounts, while the code can be redeemed. */
  offer: string | null;
}

export function proPitch(plan: ProPlan, offerActive: boolean): ProPitch {
  const { code, annualPercent, monthlyPercent, until } = LAUNCH_OFFER;
  const month = priceFor(plan, "month", monthlyPercent);
  if (plan.annualCents === null) {
    return {
      price: `${month.perMonth} a month`,
      offer: offerActive ? `Until ${until}: ${month.offer} with code ${code}.` : null,
    };
  }
  const year = priceFor(plan, "annual", annualPercent);
  return {
    price: `${year.perMonth} a month billed yearly, or ${month.perMonth} month to month`,
    offer: offerActive ? `Until ${until}: ${year.offer}, or ${month.offer}, with code ${code}.` : null,
  };
}
