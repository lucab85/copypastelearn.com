"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboardingEmailConfig } from "@/lib/onboarding-emails/config";
import { STEP_COUNT } from "@/lib/onboarding-emails/sequence";

const SOURCES = ["dashboard", "settings"] as const;
export type NextStepEmailSource = (typeof SOURCES)[number];

/**
 * Turn the next-step emails on or off for the signed-in learner. Turning them
 * on is the consent: the row records when and where it was given. Nothing
 * else creates a row, so nobody gets these emails without asking for them.
 */
export async function setNextStepEmails(on: boolean, source: NextStepEmailSource): Promise<{ ok: boolean }> {
  const user = await requireAuth();
  const now = new Date();

  if (!on) {
    await db.onboardingSequence.updateMany({
      where: { userId: user.id, unsubscribedAt: null },
      data: { unsubscribedAt: now, nextSendAt: null },
    });
  } else {
    if (!onboardingEmailConfig() || !user.email || !SOURCES.includes(source)) return { ok: false };
    const existing = await db.onboardingSequence.findUnique({
      where: { userId: user.id },
      select: { step: true, unsubscribedAt: true },
    });
    if (!existing) {
      await db.onboardingSequence.create({ data: { userId: user.id, source, nextSendAt: now } });
    } else if (existing.unsubscribedAt) {
      // Asked again after unsubscribing: carry on with the emails not sent yet.
      await db.onboardingSequence.update({
        where: { userId: user.id },
        data: {
          optedInAt: now,
          source,
          unsubscribedAt: null,
          failures: 0,
          nextSendAt: existing.step < STEP_COUNT ? now : null,
        },
      });
    }
  }

  return { ok: true };
}
