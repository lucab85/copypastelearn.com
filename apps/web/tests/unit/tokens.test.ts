import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory DownloadToken store keyed by id.
interface Row {
  id: string;
  entitlementId: string;
  tokenHash: string;
  expiresAt: Date;
  maxDownloads: number;
  downloadCount: number;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  entitlement?: { status: string; firstAccessedAt: Date | null };
}

const tokens = new Map<string, Row>();
const entitlements = new Map<
  string,
  { status: string; firstAccessedAt: Date | null }
>();

let idSeq = 0;

const downloadToken = {
  create: vi.fn(async (args: { data: Omit<Row, "id" | "createdAt" | "downloadCount" | "revokedAt" | "lastUsedAt"> }) => {
    const id = `t_${++idSeq}`;
    const row: Row = {
      id,
      ...args.data,
      downloadCount: 0,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
    };
    tokens.set(id, row);
    return row;
  }),
  findUnique: vi.fn(
    async (args: { where: { tokenHash: string }; include?: unknown }) => {
      for (const r of tokens.values()) {
        if (r.tokenHash === args.where.tokenHash) {
          return {
            ...r,
            entitlement:
              entitlements.get(r.entitlementId) ?? {
                status: "ACTIVE",
                firstAccessedAt: null,
              },
          };
        }
      }
      return null;
    },
  ),
  update: vi.fn(
    async (args: {
      where: { id: string };
      data: Partial<Row> & { downloadCount?: { increment: number } };
    }) => {
      const r = tokens.get(args.where.id);
      if (!r) throw new Error("not found");
      if (args.data.downloadCount && "increment" in args.data.downloadCount) {
        r.downloadCount += args.data.downloadCount.increment;
      }
      if (args.data.lastUsedAt) r.lastUsedAt = args.data.lastUsedAt as Date;
      if (args.data.revokedAt) r.revokedAt = args.data.revokedAt as Date;
      return r;
    },
  ),
};

const entitlement = {
  update: vi.fn(async (args: { where: { id: string }; data: { firstAccessedAt: Date } }) => {
    const e = entitlements.get(args.where.id);
    if (e) e.firstAccessedAt = args.data.firstAccessedAt;
    return e;
  }),
};

vi.mock("@/lib/db", () => ({ db: { downloadToken, entitlement } }));

import {
  mintDownloadToken,
  verifyAndConsumeToken,
} from "@/lib/delivery/tokens";

beforeEach(() => {
  tokens.clear();
  entitlements.clear();
  idSeq = 0;
  downloadToken.create.mockClear();
  downloadToken.findUnique.mockClear();
  downloadToken.update.mockClear();
  entitlement.update.mockClear();
});

describe("DownloadToken (T031 / FR-024..026)", () => {
  it("mints a base64url token, stores its SHA-256 hash, defaults to 24h + 3 downloads", async () => {
    entitlements.set("e1", { status: "ACTIVE", firstAccessedAt: null });
    const m = await mintDownloadToken({ entitlementId: "e1" });
    expect(m.rawToken).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    const stored = Array.from(tokens.values())[0];
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.tokenHash).not.toEqual(m.rawToken);
    expect(stored.maxDownloads).toBe(3);
    const ttlMs = stored.expiresAt.getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ttlMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 5_000);
  });

  it("verify+consume increments count and stamps firstAccessedAt", async () => {
    entitlements.set("e1", { status: "ACTIVE", firstAccessedAt: null });
    const m = await mintDownloadToken({ entitlementId: "e1" });
    const r = await verifyAndConsumeToken(m.rawToken);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.token.downloadCount).toBe(1);
    expect(entitlements.get("e1")!.firstAccessedAt).toBeInstanceOf(Date);
  });

  it("rejects an unknown token", async () => {
    const r = await verifyAndConsumeToken("nope_nope_nope_nope_nope_nope");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not_found");
  });

  it("rejects an expired token", async () => {
    entitlements.set("e1", { status: "ACTIVE", firstAccessedAt: null });
    const m = await mintDownloadToken({ entitlementId: "e1", ttlMs: 5 });
    await new Promise((r) => setTimeout(r, 20));
    const r = await verifyAndConsumeToken(m.rawToken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("expired");
  });

  it("rejects after max downloads consumed", async () => {
    entitlements.set("e1", { status: "ACTIVE", firstAccessedAt: null });
    const m = await mintDownloadToken({ entitlementId: "e1", maxDownloads: 2 });
    await verifyAndConsumeToken(m.rawToken);
    await verifyAndConsumeToken(m.rawToken);
    const r = await verifyAndConsumeToken(m.rawToken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("consumed");
  });

  it("rejects when the entitlement is not ACTIVE", async () => {
    entitlements.set("e1", { status: "REVOKED", firstAccessedAt: null });
    const m = await mintDownloadToken({ entitlementId: "e1" });
    const r = await verifyAndConsumeToken(m.rawToken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("entitlement_inactive");
  });
});
