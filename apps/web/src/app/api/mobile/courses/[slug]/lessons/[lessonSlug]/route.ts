import { NextResponse, type NextRequest } from "next/server";
import { getLesson } from "@/server/queries/lessons";
import { withErrorHandling } from "../../../../_lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonSlug: string }> }
) {
  return withErrorHandling(async () => {
    const { slug, lessonSlug } = await params;
    const lesson = await getLesson(slug, lessonSlug);
    return NextResponse.json({ success: true, data: lesson });
  });
}
