import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { onboardingLinkSecret } from "@/lib/onboarding-emails/config";
import { verifyUnsubscribe } from "@/lib/onboarding-emails/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The unsubscribe link of the next-step emails. No sign-in: the link is signed.
 *
 * GET shows a page with one button and changes nothing, because mail scanners
 * open every link in a message. POST stops the emails: it is what the button
 * sends, and what a mail app sends for its own "Unsubscribe" (RFC 8058).
 */
function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | CopyPasteLearn</title>
<style>
body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#fafafa;color:#18181b}
main{max-width:30rem;margin:15vh auto 0;padding:0 1.5rem}
h1{font-size:1.5rem;line-height:1.3}
button{font:inherit;font-weight:600;padding:.6rem 1.2rem;border:0;border-radius:.5rem;background:#18181b;color:#fff;cursor:pointer}
a{color:inherit}
</style>
</head>
<body><main><h1>${title}</h1>${body}<p><a href="/">CopyPasteLearn</a></p></main></body>
</html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

const invalid = () =>
  page(
    "This link does not work",
    "<p>The unsubscribe link is incomplete or no longer valid. You can stop the emails in your account settings.</p>",
    400,
  );

/** The sequence id of a correctly signed link, otherwise null. */
function signedSequenceId(req: NextRequest): string | null {
  const secret = onboardingLinkSecret();
  const id = req.nextUrl.searchParams.get("s") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!secret || !/^[a-z0-9]{1,40}$/.test(id) || !verifyUnsubscribe(id, sig, secret)) return null;
  return id;
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!signedSequenceId(req)) return invalid();
  return page(
    "Stop the next-step emails?",
    `<p>You will get no more emails of this series. Your account and your progress stay as they are.</p>
<form method="post"><button type="submit">Stop the emails</button></form>`,
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const id = signedSequenceId(req);
  if (!id) return invalid();
  await db.onboardingSequence.updateMany({
    where: { id, unsubscribedAt: null },
    data: { unsubscribedAt: new Date(), nextSendAt: null },
  });
  return page(
    "The emails are stopped",
    "<p>You will get no more emails of this series. You can turn them on again in your account settings.</p>",
  );
}
