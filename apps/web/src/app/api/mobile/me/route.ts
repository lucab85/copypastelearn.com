import { NextResponse } from "next/server";
import { withErrorHandling, requireAuth } from "../_lib/auth";
import { db } from "@/lib/db";
import { hasCourseSubscription } from "@/lib/billing";

export async function GET() {
  return withErrorHandling(async () => {
    const user = await requireAuth();

    const [isSubscribed, completedCount] = await Promise.all([
      hasCourseSubscription(user.id),
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
        isSubscribed,
        totalLessonsCompleted: completedCount,
      },
    });
  });
}
