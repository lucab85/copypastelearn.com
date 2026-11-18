import { NextResponse, type NextRequest } from "next/server";
import { ForbiddenError, NotFoundError } from "@/lib/auth";
import { hasCourseSubscription } from "@/lib/billing";
import { db } from "@/lib/db";
import { generateMuxTokens } from "@/lib/mux";
import { withErrorHandling, requireAuth } from "../../../_lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playbackId: string }> }
) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const { playbackId } = await params;
    const lesson = await db.lesson.findFirst({
      where: { videoPlaybackId: playbackId, status: "PUBLISHED", course: { status: "PUBLISHED" } },
      orderBy: { sortOrder: "asc" },
      select: { sortOrder: true },
    });

    if (!lesson) throw new NotFoundError("Lesson video not found");
    if (lesson.sortOrder !== 0 && !(await hasCourseSubscription(user.id))) {
      throw new ForbiddenError("An active subscription is required to access this lesson");
    }

    const tokens = generateMuxTokens(playbackId);
    if (!tokens) {
      // Public playback — no signing required
      return NextResponse.json({
        success: true,
        data: { signed: false, playbackId },
      });
    }

    return NextResponse.json({
      success: true,
      data: { signed: true, playbackId, ...tokens },
    });
  });
}
