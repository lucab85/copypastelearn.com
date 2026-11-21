import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { serverLogger } from "@/lib/logger";
import { sendDueOnboardingEmails } from "@/lib/onboarding-emails/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sends the opt-in next-step emails that are due (lib/onboarding-emails).
 * Runs every 15 minutes; does nothing unless the emails are configured.
 *
 * Authentication:
 * - Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when
 *   `CRON_SECRET` env var is set; we require it.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Cron secret required" } },
      { status: 401 },
    );
  }

  try {
    const summary = await sendDueOnboardingEmails();
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "cron.onboarding-emails.failed",
    );
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
