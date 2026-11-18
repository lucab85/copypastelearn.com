import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function hasLegacySubscription(userId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true },
  });
  return subscription?.status === "ACTIVE";
}

/** Clerk owns new subscriptions. Existing Stripe subscribers retain their access. */
export async function hasCourseSubscription(userId: string): Promise<boolean> {
  const { has } = await auth();
  return has({ plan: "pro" }) || await hasLegacySubscription(userId);
}
