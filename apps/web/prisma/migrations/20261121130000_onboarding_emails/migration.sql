-- OnboardingSequence: one row per learner who asked for the next-step emails
-- (lib/onboarding-emails). The row is the consent record: no row, no email.
--
-- Safe to run once in production (prisma migrate deploy, Vercel production build):
--   * it only creates a new, empty table with its two indexes and one foreign
--     key to "User";
--   * no existing table, column or row is read or changed, and an empty table
--     means no email is sent because of it.

-- CreateTable
CREATE TABLE "OnboardingSequence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 0,
    "nextSendAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "failures" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OnboardingSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSequence_userId_key" ON "OnboardingSequence"("userId");

-- CreateIndex
CREATE INDEX "OnboardingSequence_nextSendAt_idx" ON "OnboardingSequence"("nextSendAt");

-- AddForeignKey
ALTER TABLE "OnboardingSequence" ADD CONSTRAINT "OnboardingSequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
