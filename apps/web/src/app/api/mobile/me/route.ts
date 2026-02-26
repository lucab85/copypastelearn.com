import { NextResponse } from "next/server";
import { withErrorHandling, requireAuth } from "../_lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  return withErrorHandling(async () => {
    const user = await requireAuth();

    const [subscription, completedCount] = await Promise.all([
      db.subscription.findUnique({
        where: { userId: user.id },
        select: { status: true },
      }),
      db.lessonProgress.count({
        where: { userId: user.id, completed: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isSubscribed: subscription?.status === "ACTIVE",
        totalLessonsCompleted: completedCount,
      },
    });
  });
}
