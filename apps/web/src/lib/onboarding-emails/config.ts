/**
 * Settings of the opt-in "next steps" emails (lib/onboarding-emails).
 *
 * Nothing is sent, and the opt-in is not offered, unless every part is in
 * place: the switch, the Resend key, the secret that signs the unsubscribe
 * links, and the cron secret (without it the sender never runs).
 */
export interface OnboardingEmailConfig {
  apiKey: string;
  linkSecret: string;
  from: string;
  replyTo: string | undefined;
  /** Optional last line of every email, e.g. the company name and address. */
  footer: string | undefined;
  appUrl: string;
}

/** Shorter secrets are refused: the unsubscribe links are signed with it. */
export const MIN_LINK_SECRET_LENGTH = 32;

type Env = Record<string, string | undefined>;

/**
 * The secret that signs the unsubscribe links. Read apart from the switch, so
 * a link in an email already sent keeps working after the emails are turned off.
 */
export function onboardingLinkSecret(env: Env = process.env): string | null {
  const secret = env.ONBOARDING_LINK_SECRET;
  return secret && secret.length >= MIN_LINK_SECRET_LENGTH ? secret : null;
}

export function onboardingEmailConfig(env: Env = process.env): OnboardingEmailConfig | null {
  if (env.ONBOARDING_EMAILS_ENABLED !== "true") return null;
  const apiKey = env.RESEND_API_KEY;
  const linkSecret = onboardingLinkSecret(env);
  if (!apiKey || !linkSecret || !env.CRON_SECRET) return null;
  return {
    apiKey,
    linkSecret,
    from: env.ONBOARDING_EMAIL_FROM || "Luca Berton <hello@copypastelearn.com>",
    replyTo: env.ONBOARDING_EMAIL_REPLY_TO || env.COMMERCE_SUPPORT_EMAIL || undefined,
    footer: env.ONBOARDING_EMAIL_FOOTER || undefined,
    appUrl: (env.NEXT_PUBLIC_APP_URL || "https://www.copypastelearn.com").replace(/\/+$/, ""),
  };
}
