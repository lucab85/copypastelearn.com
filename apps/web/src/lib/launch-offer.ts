/**
 * Launch offer, 20 Nov to Cyber Monday 2026: the Clerk Billing promo code LAUNCH on the Pro plan
 * (30% off the first year of an annual plan, 50% off the first month of a
 * monthly plan). The discount itself lives in Clerk; the site only names the
 * code while it can be redeemed.
 *
 * The window ends with the network banner (lucaberton.com promos.json,
 * academy-bf-2026): from local midnight on `start` until the `end` instant.
 * Keep the code's redemption period in Clerk the same.
 */
export const LAUNCH_OFFER = {
  code: "LAUNCH",
  /** The discounts set in Clerk on the code, shown on /pricing. */
  annualPercent: 30,
  monthlyPercent: 50,
  start: "2026-11-20",
  end: "2026-12-01T08:00:00Z",
  message: "Launch offer: 30% off a year of Pro, or 50% off your first month, with code LAUNCH. Until 30 November.",
  linkText: "See plans",
  linkHref: "/pricing",
};

export function inOfferWindow(start: string, end: string, now = Date.now()): boolean {
  const [y, m, d] = start.split("-").map(Number);
  return now >= new Date(y, m - 1, d).getTime() && now < Date.parse(end);
}

export function launchOfferActive(now = Date.now()): boolean {
  return inOfferWindow(LAUNCH_OFFER.start, LAUNCH_OFFER.end, now);
}
