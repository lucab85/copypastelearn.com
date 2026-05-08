"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { processRefund, RefundError } from "@/lib/fulfillment/refund";
import { mintDownloadToken } from "@/lib/delivery/tokens";
import { sendDownloadLinkEmail } from "@/lib/fulfillment/email";
import { logAdminAction } from "@/lib/commerce/audit";
import { serverLogger } from "@/lib/logger";

/**
 * T072 [US4] — Admin order operations: refund + reissue access.
 *
 * All actions require Clerk role=ADMIN (via requireAdmin) and audit-log.
 */

const RefundSchema = z.object({
  orderId: z.string().min(1),
  amountMinor: z.number().int().positive().optional(),
  reason: z.string().max(1_000).optional(),
  revokeAccess: z.boolean().optional(),
});

export interface AdminActionError {
  ok: false;
  code: string;
  message: string;
}

export type AdminRefundResult =
  | { ok: true; refundId: string; amountMinor: number; status: string }
  | AdminActionError;

export async function refundOrder(input: unknown): Promise<AdminRefundResult> {
  const admin = await requireAdmin();
  const parsed = RefundSchema.parse(input);

  try {
    const result = await processRefund({
      orderId: parsed.orderId,
      actorId: admin.id,
      amountMinor: parsed.amountMinor,
      reason: parsed.reason,
      revokeAccess: parsed.revokeAccess,
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed.orderId}`);
    return {
      ok: true,
      refundId: result.refundId,
      amountMinor: result.amountMinor,
      status: result.status,
    };
  } catch (err) {
    if (err instanceof RefundError) {
      return { ok: false, code: err.code, message: err.message };
    }
    serverLogger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "admin.refund.failed",
    );
    return {
      ok: false,
      code: "internal",
      message: "Refund failed. Check server logs.",
    };
  }
}

const ReissueSchema = z.object({
  entitlementId: z.string().min(1),
});

export type AdminReissueResult =
  | { ok: true; downloadUrl: string; expiresAt: string }
  | AdminActionError;

export async function reissueAccess(
  input: unknown,
): Promise<AdminReissueResult> {
  const admin = await requireAdmin();
  const { entitlementId } = ReissueSchema.parse(input);

  const ent = await db.entitlement.findUnique({
    where: { id: entitlementId },
    include: { customer: true, product: true, pinnedFile: true },
  });
  if (!ent) {
    return { ok: false, code: "not_found", message: "Entitlement not found" };
  }
  if (ent.status !== "ACTIVE") {
    return {
      ok: false,
      code: "entitlement_inactive",
      message: "Entitlement is not active — un-revoke it first if intended.",
    };
  }

  // Revoke prior live tokens, mint a fresh one.
  await db.downloadToken.updateMany({
    where: { entitlementId: ent.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const minted = await mintDownloadToken({ entitlementId: ent.id });
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com";
  const downloadUrl = `${appUrl}/api/download/${minted.rawToken}`;

  try {
    await sendDownloadLinkEmail({
      to: ent.customer.email,
      productTitle: ent.product.title,
      downloadUrl,
      appUrl,
    });
  } catch (err) {
    serverLogger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "admin.reissue.email_failed",
    );
  }

  await logAdminAction({
    actorId: admin.id,
    action: "entitlement.reissue",
    targetType: "Entitlement",
    targetId: ent.id,
    payload: { tokenId: minted.tokenId, productId: ent.productId },
  });

  revalidatePath("/admin/orders");
  return {
    ok: true,
    downloadUrl,
    expiresAt: minted.expiresAt.toISOString(),
  };
}
