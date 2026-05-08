import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";

/**
 * Link a Clerk user to an existing commerce `Customer` row by email match.
 *
 * Implements FR-029: when a buyer signs into Clerk with an email matching
 * a `Customer.email` (case-insensitive), set `Customer.userId` so the
 * /library page can resolve their entitlements without a support contact.
 *
 * Idempotent. Safe to call on every sign-in / library page visit.
 *
 * Returns the linked `Customer` row, or `null` if no match exists.
 */
export async function linkClerkUserToCustomer(args: {
  clerkUserId: string;
  email: string;
}): Promise<{ id: string; userId: string | null } | null> {
  const email = args.email.trim().toLowerCase();
  if (!email) return null;

  // 1. If a Customer is already linked to this Clerk user, we're done.
  const alreadyLinked = await db.customer.findUnique({
    where: { userId: args.clerkUserId },
    select: { id: true, userId: true },
  });
  if (alreadyLinked) return alreadyLinked;

  // 2. Find an unlinked Customer by email (case-insensitive).
  const candidate = await db.customer.findFirst({
    where: {
      userId: null,
      email: { equals: email, mode: "insensitive" },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true },
  });
  if (!candidate) return null;

  try {
    const updated = await db.customer.update({
      where: { id: candidate.id },
      data: { userId: args.clerkUserId },
      select: { id: true, userId: true },
    });
    return updated;
  } catch (err) {
    // Race: another concurrent sign-in linked first. Re-read.
    serverLogger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "commerce.identity.link_race",
    );
    return db.customer.findUnique({
      where: { userId: args.clerkUserId },
      select: { id: true, userId: true },
    });
  }
}
