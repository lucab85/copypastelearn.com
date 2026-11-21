/**
 * The four next-step emails a learner can ask for, as plain text. Pure: the
 * sender (send.ts) passes in what it read from the database and from Clerk.
 *
 *   0  right after the opt-in   where to start or continue
 *   1  2 days later             the next lesson
 *   2  3 days later             what Pro adds (never to a Pro member)
 *   3  7 days later             check-in, last email
 */
export interface NextLesson {
  courseTitle: string;
  lessonTitle: string;
  /** "/courses/<course>/lessons/<lesson>" */
  path: string;
}

export interface OnboardingContext {
  firstName: string | null;
  appUrl: string;
  /** Next unfinished lesson of the course started last, if any. */
  next: NextLesson | null;
  lessonsCompleted: number;
  /** True also when the membership could not be read: no sales email on a guess. */
  isPro: boolean;
  /** "$25 a month billed yearly, or $29 month to month"; null when unknown. */
  price: string | null;
  /** The launch offer line while the code can be redeemed, otherwise null. */
  offer: string | null;
  unsubscribeUrl: string;
  /** Optional last line (company name and address). */
  footer?: string;
}

export interface OnboardingEmail {
  subject: string;
  text: string;
}

export const STEP_COUNT = 4;

/** Days between one email and the next: after email 0, after 1, after 2. */
export const GAP_DAYS = [2, 3, 7] as const;

const DAY_MS = 86_400_000;

/** When the email after `step` is due, or null when `step` was the last one. */
export function nextSendAfter(step: number, handledAt: Date): Date | null {
  const gap = GAP_DAYS[step];
  return gap === undefined ? null : new Date(handledAt.getTime() + gap * DAY_MS);
}

function lessons(n: number): string {
  return n === 1 ? "1 lesson" : `${n} lessons`;
}

function wrap(ctx: OnboardingContext, body: string[]): string {
  const lines = [
    ctx.firstName ? `Hi ${ctx.firstName},` : "Hi,",
    "",
    ...body,
    "",
    "Luca Berton",
    "CopyPasteLearn",
    "",
    "--",
    "You get this email because you asked for the next steps on CopyPasteLearn.",
    `Stop these emails: ${ctx.unsubscribeUrl}`,
  ];
  if (ctx.footer) lines.push(ctx.footer);
  return lines.join("\n");
}

function nextLessonLines(ctx: OnboardingContext, next: NextLesson): string[] {
  return [`Your next lesson in "${next.courseTitle}" is "${next.lessonTitle}":`, `${ctx.appUrl}${next.path}`];
}

function catalogLines(ctx: OnboardingContext): string[] {
  return ["The first lesson of every course is free. Pick one course and start there:", `${ctx.appUrl}/courses`];
}

/** The email for `step`, or null when that step is skipped for this learner. */
export function buildOnboardingEmail(step: number, ctx: OnboardingContext): OnboardingEmail | null {
  switch (step) {
    case 0:
      return {
        subject: "Your next step on CopyPasteLearn",
        text: wrap(ctx, [
          "You asked for the next steps by email. This is the first of four.",
          "",
          ...(ctx.next ? nextLessonLines(ctx, ctx.next) : catalogLines(ctx)),
          "",
          "Keep a terminal open while you watch and run the commands yourself: the lessons are made for that.",
          "",
          "If something does not work, reply to this email.",
        ]),
      };

    case 1:
      if (ctx.next) {
        return {
          subject: `Next lesson: ${ctx.next.lessonTitle}`,
          text: wrap(ctx, [
            ctx.lessonsCompleted > 0
              ? `You have finished ${lessons(ctx.lessonsCompleted)} so far.`
              : "You started a course but have not finished a lesson yet.",
            "",
            ...nextLessonLines(ctx, ctx.next),
            "",
            "One lesson at a time is enough.",
          ]),
        };
      }
      return {
        subject: ctx.lessonsCompleted > 0 ? "Pick your next course" : "One lesson to start",
        text: wrap(ctx, [
          ctx.lessonsCompleted > 0
            ? `You have finished ${lessons(ctx.lessonsCompleted)} and have no course in progress.`
            : "You have not started a course yet.",
          "",
          ...catalogLines(ctx),
        ]),
      };

    case 2:
      if (ctx.isPro || !ctx.price) return null;
      return {
        subject: "What Pro adds to your free account",
        text: wrap(ctx, [
          "With a free account you can watch the first lesson of every course.",
          "Pro opens every lesson of every course, including the courses added later.",
          "",
          `Pro costs ${ctx.price}.`,
          ...(ctx.offer ? [ctx.offer] : []),
          "",
          `Plans: ${ctx.appUrl}/pricing`,
          "",
          "You can cancel the plan at any time in Settings.",
        ]),
      };

    case 3:
      return {
        subject: "Last email: how is it going?",
        text: wrap(ctx, [
          "This is the last email of this series.",
          "",
          ctx.lessonsCompleted > 0
            ? `You have finished ${lessons(ctx.lessonsCompleted)} so far.`
            : "You have not finished a lesson yet. If something got in the way, reply and tell me what it was.",
          "",
          ...(ctx.next ? nextLessonLines(ctx, ctx.next) : catalogLines(ctx)),
        ]),
      };

    default:
      return null;
  }
}
