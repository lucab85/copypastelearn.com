import { NextResponse, type NextRequest } from "next/server";
import { saveVideoPosition } from "@/server/actions/progress";
import { withErrorHandling } from "../../_lib/auth";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const { lessonId, positionSeconds } = body;

    if (!lessonId || typeof positionSeconds !== "number") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "lessonId and positionSeconds are required" } },
        { status: 400 }
      );
    }

    const result = await saveVideoPosition(lessonId, positionSeconds);
    return NextResponse.json({ success: true, data: result });
  });
}
