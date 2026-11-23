import { db } from "@/lib/db";
import { onboardingEmailConfig } from "./config";
import { STEP_COUNT } from "./sequence";

/**
 * Where a learner stands with the next-step emails:
 *   unavailable  the emails are not configured in this environment
 *   never        never asked for them
 *   on           asked, emails still to come
 *   done         asked, all four sent
 *   off          unsubscribed
 */
export type NextStepEmailState = "unavailable" | "never" | "on" | "done" | "off";

export async function nextStepEmailState(userId: string): Promise<NextStepEmailState> {
  if (!onboardingEmailConfig()) return "unavailable";
  const row = await db.onboardingSequence.findUnique({
    where: { userId },
    select: { step: true, unsubscribedAt: true },
  });
  if (!row) return "never";
  if (row.unsubscribedAt) return "off";
  return row.step >= STEP_COUNT ? "done" : "on";
}
