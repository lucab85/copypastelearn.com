"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/commerce/audit";

/**
 * T073 [US4] — Policy document CRUD (FR-047).
 *
 * `publishPolicy` bumps `isCurrent` atomically: previous current
 * versions for the same slug are demoted in the same transaction.
 * Past versions remain queryable for legal recordkeeping.
 */

const PolicyInput = z.object({
  /** e.g. "terms", "privacy", "refund-policy", "digital-delivery-policy". */
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  /** Free-form, e.g. "2026-01" or "1.4.0". */
  version: z.string().min(1).max(40),
  bodyMd: z.string().min(10).max(200_000),
});

export type PolicyResult =
  | { ok: true; id: string; slug: string; version: string }
  | { ok: false; code: string; message: string };

export async function upsertPolicyDraft(input: unknown): Promise<PolicyResult> {
  const admin = await requireAdmin();
  const data = PolicyInput.parse(input);

  const row = await db.policyDocument.upsert({
    where: { slug_version: { slug: data.slug, version: data.version } },
    create: {
      slug: data.slug,
      version: data.version,
      bodyMd: data.bodyMd,
      isCurrent: false,
    },
    update: { bodyMd: data.bodyMd },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "policy.draft",
    targetType: "PolicyDocument",
    targetId: row.id,
    payload: { slug: data.slug, version: data.version },
  });

  revalidatePath("/admin/policies");
  return { ok: true, id: row.id, slug: row.slug, version: row.version };
}

const PublishInput = z.object({
  slug: z.string().min(2).max(80),
  version: z.string().min(1).max(40),
});

export async function publishPolicy(input: unknown): Promise<PolicyResult> {
  const admin = await requireAdmin();
  const { slug, version } = PublishInput.parse(input);

  const result = await db.$transaction(async (tx) => {
    const target = await tx.policyDocument.findUnique({
      where: { slug_version: { slug, version } },
    });
    if (!target) return null;

    await tx.policyDocument.updateMany({
      where: { slug, isCurrent: true, NOT: { id: target.id } },
      data: { isCurrent: false },
    });
    return tx.policyDocument.update({
      where: { id: target.id },
      data: { isCurrent: true, publishedAt: new Date() },
    });
  });

  if (!result) {
    return {
      ok: false,
      code: "not_found",
      message: `Policy ${slug}@${version} not found.`,
    };
  }

  await logAdminAction({
    actorId: admin.id,
    action: "policy.publish",
    targetType: "PolicyDocument",
    targetId: result.id,
    payload: { slug, version },
  });

  revalidatePath("/admin/policies");
  revalidatePath(`/${slug}`);
  return { ok: true, id: result.id, slug: result.slug, version: result.version };
}

export async function listPolicyVersions(slug?: string) {
  await requireAdmin();
  return db.policyDocument.findMany({
    where: slug ? { slug } : undefined,
    orderBy: [{ slug: "asc" }, { publishedAt: "desc" }],
  });
}
