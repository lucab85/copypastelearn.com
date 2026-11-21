import { clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { hasLegacySubscription } from "@/lib/billing";
import { db } from "@/lib/db";
import { launchOfferActive } from "@/lib/launch-offer";
import { serverLogger } from "@/lib/logger";
import { proPitch } from "@/lib/pro-pitch";
import { lessonPath } from "@/lib/resume-lesson";
import { getProPlan } from "@/server/queries/pro-plan";
import { onboardingEmailConfig, type OnboardingEmailConfig } from "./config";
import { unsubscribeUrl } from "./links";
import { buildOnboardingEmail, nextSendAfter, STEP_COUNT, type NextLesson, type OnboardingContext } from "./sequence";

/** A row being sent is put aside for this long; a failed send is retried after it. */
const LEASE_MS = 60 * 60 * 1000;
/** Failed sends after which a sequence is stopped. */
const MAX_FAILURES = 5;
/** Step of the email about Pro (see sequence.ts). */
const PRO_STEP = 2;

export interface SendSummary {
  due: number;
  sent: number;
  skipped: number;
  failed: number;
}

interface Recipient {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string | null;
}

/** Next unfinished lesson of the course this learner started last. */
async function nextLesson(userId: string): Promise<NextLesson | null> {
  const progress = await db.courseProgress.findFirst({
    where: { userId, completedAt: null, course: { status: "PUBLISHED" } },
    orderBy: { startedAt: "desc" },
    select: {
      course: {
        select: {
          title: true,
          slug: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sortOrder: "asc" },
            select: {
              title: true,
              slug: true,
              lessonProgress: { where: { userId }, select: { completed: true } },
            },
          },
        },
      },
    },
  });
  if (!progress) return null;
  const lesson = progress.course.lessons.find((l) => !l.lessonProgress[0]?.completed);
  if (!lesson) return null;
  return {
    courseTitle: progress.course.title,
    lessonTitle: lesson.title,
    path: lessonPath(progress.course.slug, lesson.slug),
  };
}

/** Pro through Clerk Billing or an older Stripe subscription. Unknown counts as Pro. */
async function isProMember(user: Recipient): Promise<boolean> {
  try {
    if (await hasLegacySubscription(user.id)) return true;
    const client = await clerkClient();
    const subscription = await client.billing.getUserBillingSubscription(user.clerkUserId);
    return subscription.subscriptionItems.some((item) => item.status === "active" && item.plan?.slug === "pro");
  } catch (err) {
    serverLogger.warn(
      { userId: user.id, err: err instanceof Error ? err.message : String(err) },
      "onboarding-emails.membership-unknown",
    );
    return true;
  }
}

async function contextFor(
  sequenceId: string,
  step: number,
  user: Recipient,
  cfg: OnboardingEmailConfig,
  now: Date,
): Promise<OnboardingContext> {
  const [next, lessonsCompleted] = await Promise.all([
    nextLesson(user.id),
    db.lessonProgress.count({ where: { userId: user.id, completed: true } }),
  ]);
  let isPro = false;
  let price: string | null = null;
  let offer: string | null = null;
  if (step === PRO_STEP) {
    isPro = await isProMember(user);
    const plan = isPro ? null : await getProPlan();
    if (plan) ({ price, offer } = proPitch(plan, launchOfferActive(now.getTime())));
  }
  return {
    firstName: user.displayName?.trim().split(/\s+/)[0] || null,
    appUrl: cfg.appUrl,
    next,
    lessonsCompleted,
    isPro,
    price,
    offer,
    unsubscribeUrl: unsubscribeUrl(cfg.appUrl, sequenceId, cfg.linkSecret),
    footer: cfg.footer,
  };
}

/**
 * Send the next-step emails that are due. Called by the cron route.
 *
 * Each row is first put aside for an hour (so two overlapping runs cannot both
 * send it), then sent, then moved to its next step. Resend also gets an
 * idempotency key per learner and step.
 */
export async function sendDueOnboardingEmails(now: Date = new Date(), limit = 20): Promise<SendSummary> {
  const summary: SendSummary = { due: 0, sent: 0, skipped: 0, failed: 0 };
  const cfg = onboardingEmailConfig();
  if (!cfg) return summary;

  const rows = await db.onboardingSequence.findMany({
    where: { nextSendAt: { lte: now }, unsubscribedAt: null },
    orderBy: { nextSendAt: "asc" },
    take: limit,
    select: {
      id: true,
      step: true,
      nextSendAt: true,
      failures: true,
      user: { select: { id: true, clerkUserId: true, email: true, displayName: true } },
    },
  });
  summary.due = rows.length;
  const resend = new Resend(cfg.apiKey);

  for (const row of rows) {
    const leased = await db.onboardingSequence.updateMany({
      where: { id: row.id, step: row.step, nextSendAt: row.nextSendAt, unsubscribedAt: null },
      data: { nextSendAt: new Date(now.getTime() + LEASE_MS) },
    });
    if (leased.count === 0) continue;

    const advance = () =>
      db.onboardingSequence.updateMany({
        // Not when the learner unsubscribed while this email was being sent.
        where: { id: row.id, unsubscribedAt: null },
        data: { step: row.step + 1, nextSendAt: nextSendAfter(row.step, now), failures: 0 },
      });

    try {
      const email =
        row.step < STEP_COUNT && row.user.email
          ? buildOnboardingEmail(row.step, await contextFor(row.id, row.step, row.user, cfg, now))
          : null;
      if (!email) {
        await advance();
        summary.skipped += 1;
        continue;
      }

      const url = unsubscribeUrl(cfg.appUrl, row.id, cfg.linkSecret);
      const { error } = await resend.emails.send(
        {
          from: cfg.from,
          to: row.user.email,
          replyTo: cfg.replyTo,
          subject: email.subject,
          text: email.text,
          headers: {
            "List-Unsubscribe": `<${url}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        },
        { idempotencyKey: `cpl-onboarding-v1/${row.id}/${row.step}` },
      );
      if (error) throw new Error(`${error.name}: ${error.message}`);

      await advance();
      await db.emailJob.create({
        data: {
          to: row.user.email,
          template: `onboarding-${row.step}`,
          payload: { userId: row.user.id, sequenceId: row.id },
          status: "sent",
          sentAt: now,
        },
      });
      summary.sent += 1;
    } catch (err) {
      summary.failed += 1;
      const failures = row.failures + 1;
      const message = err instanceof Error ? err.message : String(err);
      serverLogger.error({ sequenceId: row.id, step: row.step, failures, err: message }, "onboarding-emails.send-failed");
      await db.onboardingSequence
        .updateMany({
          where: { id: row.id },
          data: failures >= MAX_FAILURES ? { failures, nextSendAt: null } : { failures },
        })
        .catch(() => undefined);
    }
  }

  serverLogger.info({ summary }, "onboarding-emails.run");
  return summary;
}
