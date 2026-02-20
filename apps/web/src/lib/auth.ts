import { db } from "./db";

function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk || pk.length < 20 || pk.includes("...")) return false;
  try {
    atob(pk.replace(/^pk_(test|live)_/, ""));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current user from the database, matched by Clerk user ID.
 * Returns null if unauthenticated, Clerk not configured, or user not found in DB.
 */
export async function getCurrentUser() {
  if (!isClerkConfigured()) return null;

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  return user;
}

/**
 * Require authentication. Throws if not authenticated.
 * Returns the database user record.
 */
export async function requireAuth() {
  if (!isClerkConfigured()) {
    throw new UnauthorizedError("Authentication not configured");
  }

  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError("Authentication required");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    // User exists in Clerk but not yet synced to DB (webhook delay)
    // Create a minimal record from Clerk data
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new UnauthorizedError("Authentication required");
    }

    const newUser = await db.user.create({
      data: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        displayName:
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName ?? null,
      },
    });

    return newUser;
  }

  return user;
}

/**
 * Require ADMIN role. Throws if not authenticated or not an admin.
 * Returns the database user record.
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }

  return user;
}

// ─── Error Classes ──────────────────────────────────────

export class UnauthorizedError extends Error {
  readonly statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}
