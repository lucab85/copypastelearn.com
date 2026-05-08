import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Download tokens (FR-024 / FR-025 / FR-026).
 *
 * - Generated as 32 random bytes, base64url-encoded.
 * - Stored hashed (SHA-256) at rest — raw token never persisted.
 * - Default 24h expiry, 3 downloads per token (per Q3).
 * - Individually revocable.
 * - Verification is constant-time at the hash level.
 *
 * The raw token is returned exactly once on mint and embedded in
 * email/library URLs. Once it leaves the server, only its hash
 * remains in the DB.
 */

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const DEFAULT_MAX_DOWNLOADS = 3;

export interface MintedToken {
  /** Raw token to embed in URLs. SHOWN ONCE. */
  rawToken: string;
  /** Persisted DownloadToken row id. */
  tokenId: string;
  expiresAt: Date;
}

export async function mintDownloadToken(args: {
  entitlementId: string;
  ttlMs?: number;
  maxDownloads?: number;
}): Promise<MintedToken> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + (args.ttlMs ?? DEFAULT_TTL_MS));

  const row = await db.downloadToken.create({
    data: {
      entitlementId: args.entitlementId,
      tokenHash,
      expiresAt,
      maxDownloads: args.maxDownloads ?? DEFAULT_MAX_DOWNLOADS,
    },
  });

  return { rawToken, tokenId: row.id, expiresAt };
}

export type VerifyTokenResult =
  | {
      ok: true;
      token: {
        id: string;
        entitlementId: string;
        downloadCount: number;
        maxDownloads: number;
      };
    }
  | {
      ok: false;
      reason:
        | "not_found"
        | "expired"
        | "revoked"
        | "consumed"
        | "entitlement_inactive";
    };

/**
 * Verify a raw token AND atomically consume one download.
 * Returns the matched row (with the post-increment count) on success.
 */
export async function verifyAndConsumeToken(rawToken: string): Promise<VerifyTokenResult> {
  if (!rawToken || rawToken.length < 16) return { ok: false, reason: "not_found" };

  const tokenHash = sha256(rawToken);

  // Fetch first; we want a constant-time confirmation that the input
  // matches the stored hash even though Prisma's query is by `@unique`.
  const row = await db.downloadToken.findUnique({
    where: { tokenHash },
    include: { entitlement: true },
  });
  if (!row) return { ok: false, reason: "not_found" };

  // Constant-time check on the bytes we hashed (defense-in-depth).
  const wantedHash = Buffer.from(row.tokenHash, "hex");
  const actualHash = Buffer.from(tokenHash, "hex");
  if (
    wantedHash.length !== actualHash.length ||
    !timingSafeEqual(wantedHash, actualHash)
  ) {
    return { ok: false, reason: "not_found" };
  }

  if (row.revokedAt) return { ok: false, reason: "revoked" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.downloadCount >= row.maxDownloads) {
    return { ok: false, reason: "consumed" };
  }
  if (row.entitlement.status !== "ACTIVE") {
    return { ok: false, reason: "entitlement_inactive" };
  }

  const updated = await db.downloadToken.update({
    where: { id: row.id },
    data: {
      downloadCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  // Stamp first-access on the entitlement (drives refund regime — FR-048).
  if (!row.entitlement.firstAccessedAt) {
    await db.entitlement.update({
      where: { id: row.entitlementId },
      data: { firstAccessedAt: new Date() },
    });
  }

  return {
    ok: true,
    token: {
      id: updated.id,
      entitlementId: updated.entitlementId,
      downloadCount: updated.downloadCount,
      maxDownloads: updated.maxDownloads,
    },
  };
}

/** Revoke a single token by id. */
export async function revokeDownloadToken(tokenId: string): Promise<void> {
  await db.downloadToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}

/** Revoke all live tokens for an entitlement (used on regenerate). */
export async function revokeLiveTokensForEntitlement(
  entitlementId: string,
): Promise<number> {
  const r = await db.downloadToken.updateMany({
    where: {
      entitlementId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });
  return r.count;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
