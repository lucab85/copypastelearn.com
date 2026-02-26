import { NextResponse, type NextRequest } from "next/server";
import { getCourse } from "@/server/queries/courses";
import { withErrorHandling } from "../../_lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const course = await getCourse(slug);
    if (!course) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: course });
  });
}
