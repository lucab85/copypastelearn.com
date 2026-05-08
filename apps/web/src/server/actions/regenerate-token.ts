"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { mintDownloadToken } from "@/lib/delivery/tokens";
import { linkClerkUserToCustomer } from "@/lib/commerce/identity";
import { serverLogger } from "@/lib/logger";

/**
 * T056 — Regenerate a download token for one of the buyer's entitlements (US2).
 *
 * Behaviour:
 *  - Authenticates via Clerk (rejects unauthenticated callers).
 *  - Verifies the entitlement belongs to a `Customer` linked to the caller
 *    (either by `userId` or by verified email match).
 *  - Revokes any prior live tokens for that entitlement (FR-026).
 *  - Mints a fresh 24h / 3-download token (T037).
 *  - Rate-limited: 10 regenerations per 10 minutes per Clerk user.
 *
 * Returns the raw token (shown ONCE) along with the constructed download URL.
 */
export interface RegenerateResult {
  ok: true;
  downloadUrl: string;
  expiresAt: string;
}

export interface RegenerateError {
  ok: false;
  code:
    | "unauthenticated"
    | "rate_limited"
    | "not_found"
    | "entitlement_inactive"
    | "internal";
  message: string;
}

export async function regenerateDownloadToken(args: {
  entitlementId: string;
}): Promise<RegenerateResult | RegenerateError> {
  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "You must be signed in to regenerate download links.",
    };
  }

  const budget = await rateLimit("regenerate:user", userId);
  if (!budget.success) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Too many requests. Please wait a few minutes and try again.",
    };
  }

  const clerkUser = await currentUser();
  const emails = (clerkUser?.emailAddresses ?? [])
    .filter((e) => !e.verification || e.verification.status === "verified")
    .map((e) => e.emailAddress);

  // Lazy-link Clerk user ↔ Customer on first regenerate (FR-029).
  if (clerkUser?.primaryEmailAddress?.emailAddress) {
    await linkClerkUserToCustomer({
      clerkUserId: userId,
      email: clerkUser.primaryEmailAddress.emailAddress,
    });
  }

  // Resolve the entitlement and confirm it belongs to this user.
  const ent = await db.entitlement.findUnique({
    where: { id: args.entitlementId },
    include: { customer: true, product: true },
  });
  if (!ent) {
    return { ok: false, code: "not_found", message: "Entitlement not found." };
  }

  const ownsByUserId = ent.customer.userId === userId;
  const ownsByEmail = emails.some(
    (e) => e.toLowerCase() === ent.customer.email.toLowerCase(),
  );
  if (!ownsByUserId && !ownsByEmail) {
    return { ok: false, code: "not_found", message: "Entitlement not found." };
  }

  if (ent.status !== "ACTIVE") {
    return {
      ok: false,
      code: "entitlement_inactive",
      message: "Access to this product has been revoked.",
    };
  }

  // Revoke prior live tokens, then mint a fresh one.
  try {
    const minted = await db.$transaction(async (tx) => {
      await tx.downloadToken.updateMany({
        where: {
          entitlementId: ent.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      // mintDownloadToken uses the global db client; safe because a new
      // row has its own primary key — no constraint depends on the
      // updateMany above being in the same logical transaction beyond
      // ordering, which we preserve here.
      return null;
    });
    void minted;

    const fresh = await mintDownloadToken({ entitlementId: ent.id });
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com";
    const downloadUrl = `${appUrl}/api/download/${fresh.rawToken}`;

    revalidatePath("/library");

    return {
      ok: true,
      downloadUrl,
      expiresAt: fresh.expiresAt.toISOString(),
    };
  } catch (err) {
    serverLogger.error(
      {
        err: err instanceof Error ? err.message : String(err),
        entitlementId: ent.id,
      },
      "library.regenerate.failed",
    );
    return {
      ok: false,
      code: "internal",
      message: "Could not regenerate the download link. Please try again.",
    };
  }
}
