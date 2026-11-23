import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The unsubscribe link of the next-step emails. It works without signing in,
 * so it carries a signature: only a link we sent can stop a sequence.
 */
export function signUnsubscribe(sequenceId: string, secret: string): string {
  return createHmac("sha256", secret).update(`unsubscribe:${sequenceId}`).digest("base64url");
}

export function verifyUnsubscribe(sequenceId: string, signature: string, secret: string): boolean {
  if (!sequenceId || !signature) return false;
  const expected = Buffer.from(signUnsubscribe(sequenceId, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(appUrl: string, sequenceId: string, secret: string): string {
  const query = new URLSearchParams({ s: sequenceId, sig: signUnsubscribe(sequenceId, secret) });
  return `${appUrl}/api/email/unsubscribe?${query}`;
}
