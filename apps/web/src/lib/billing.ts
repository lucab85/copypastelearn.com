"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { SubscriptionInfo } from "@copypastelearn/shared";

/**
 * Get the current user's subscription status.
 * Checks local DB first.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionInfo | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: {
      status: true,
      currentPeriodEnd: true,
      canceledAt: true,
      planId: true,
    },
  });

  if (!subscription) {
    return {
      status: "NONE",
      isSubscribed: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      planId: null,
    };
  }

  // If canceledAt is set but status is still ACTIVE, it means cancel-at-period-end
  const cancelAtPeriodEnd =
    !!subscription.canceledAt && subscription.status === "ACTIVE";

  return {
    status: subscription.status,
    isSubscribed: subscription.status === "ACTIVE",
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd,
    planId: subscription.planId ?? null,
  };
}

/**
 * Simple boolean check for subscription access.
 */
export async function isSubscribed(): Promise<boolean> {
  const info = await getSubscriptionStatus();
  return info?.isSubscribed ?? false;
}
