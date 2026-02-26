import { NextResponse, type NextRequest } from "next/server";
import { markLessonComplete } from "@/server/actions/progress";
import { withErrorHandling } from "../../_lib/auth";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "lessonId is required" } },
        { status: 400 }
      );
    }

    const result = await markLessonComplete(lessonId);
    return NextResponse.json({ success: true, data: result });
  });
}
