/**
 * Commerce feature flags. All flags default to safe (off) values so
 * unconfigured environments never enable risky features.
 *
 * See spec FR-043, A9: Stripe Shared Payment Tokens MUST be off until
 * the post-MVP enablement decision is made.
 */

function readBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw === "true" || raw === "1";
}

export const commerceFlags = {
  /** FR-043: Stripe Shared Payment Tokens. MUST be false at MVP. */
  enableStripeSpt: readBool("ENABLE_STRIPE_SPT", false),
} as const;

export type CommerceFlags = typeof commerceFlags;
