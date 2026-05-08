import { Resend } from "resend";
import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";

/**
 * Transactional email for order confirmation, download links, and
 * refund notifications. Persists an EmailJob row before send so that
 * failed/queued sends are recoverable and visible to ops.
 */

let cachedResend: Resend | undefined;

function getResend(): Resend | undefined {
  if (cachedResend) return cachedResend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return undefined;
  cachedResend = new Resend(key);
  return cachedResend;
}

function getFrom(): string {
  return (
    process.env.COMMERCE_EMAIL_FROM ??
    "CopyPasteLearn <noreply@copypastelearn.com>"
  );
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  template: string;
  payload: Record<string, unknown>;
}

async function sendOrEnqueue(args: SendArgs): Promise<{ id: string; sent: boolean }> {
  const job = await db.emailJob.create({
    data: {
      to: args.to,
      template: args.template,
      payload: args.payload as object,
      status: "queued",
    },
  });

  const resend = getResend();
  if (!resend) {
    serverLogger.warn(
      { jobId: job.id, template: args.template },
      "RESEND_API_KEY not set — email queued but not sent",
    );
    return { id: job.id, sent: false };
  }

  try {
    await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    await db.emailJob.update({
      where: { id: job.id },
      data: { status: "sent", sentAt: new Date() },
    });
    return { id: job.id, sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.emailJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        attempts: { increment: 1 },
        lastError: message,
      },
    });
    serverLogger.error({ jobId: job.id, err: message }, "email.send.failed");
    throw err;
  }
}

export interface OrderConfirmationData {
  to: string;
  orderId: string;
  amount: string;
  currency: string;
  productTitles: string[];
  downloadUrl: string;
  supportEmail: string;
  appUrl: string;
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationData,
): Promise<void> {
  const titles = data.productTitles.map((t) => `<li>${escape(t)}</li>`).join("");
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Thanks for your purchase</h1>
      <p>Order <strong>${escape(data.orderId)}</strong> — ${escape(data.amount)} ${escape(data.currency)}</p>
      <ul>${titles}</ul>
      <p style="margin: 24px 0;">
        <a href="${escape(data.downloadUrl)}" style="display:inline-block; padding:12px 20px; background:#0f172a; color:#fff; text-decoration:none; border-radius:6px;">
          Access your files
        </a>
      </p>
      <p style="color:#64748b; font-size:13px;">
        Your access link is valid for 24 hours and allows up to 3 downloads.
        You can always sign in at <a href="${escape(data.appUrl)}/library">${escape(data.appUrl)}/library</a>
        to generate a fresh link.
      </p>
      <p style="color:#64748b; font-size:13px;">Need help? <a href="mailto:${escape(data.supportEmail)}">${escape(data.supportEmail)}</a></p>
    </div>
  `;
  await sendOrEnqueue({
    to: data.to,
    subject: `Your CopyPasteLearn order ${data.orderId}`,
    html,
    template: "order-confirmation",
    payload: { ...data },
  });
}

export interface DownloadLinkData {
  to: string;
  productTitle: string;
  downloadUrl: string;
  appUrl: string;
}

export async function sendDownloadLinkEmail(data: DownloadLinkData): Promise<void> {
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Fresh download link</h1>
      <p>Here is a new access link for <strong>${escape(data.productTitle)}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${escape(data.downloadUrl)}" style="display:inline-block; padding:12px 20px; background:#0f172a; color:#fff; text-decoration:none; border-radius:6px;">
          Access your file
        </a>
      </p>
    </div>
  `;
  await sendOrEnqueue({
    to: data.to,
    subject: `Your CopyPasteLearn download link`,
    html,
    template: "download-link",
    payload: { ...data },
  });
}

export interface RefundConfirmationData {
  to: string;
  orderId: string;
  amount: string;
  currency: string;
  reason?: string;
  appUrl: string;
}

export async function sendRefundConfirmationEmail(
  data: RefundConfirmationData,
): Promise<void> {
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Your refund has been processed</h1>
      <p>Order <strong>${escape(data.orderId)}</strong> — refund of ${escape(data.amount)} ${escape(data.currency)}.</p>
      ${data.reason ? `<p>Reason: ${escape(data.reason)}</p>` : ""}
      <p style="color:#64748b; font-size:13px;">
        Funds typically appear in 5–10 business days depending on your bank.
      </p>
    </div>
  `;
  await sendOrEnqueue({
    to: data.to,
    subject: `Refund processed — order ${data.orderId}`,
    html,
    template: "refund-confirmation",
    payload: { ...data },
  });
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
