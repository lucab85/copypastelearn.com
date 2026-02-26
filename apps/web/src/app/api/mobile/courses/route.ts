import { NextResponse } from "next/server";
import { getCourses } from "@/server/queries/courses";
import { withErrorHandling } from "../_lib/auth";

export async function GET() {
  return withErrorHandling(async () => {
    const courses = await getCourses();
    return NextResponse.json({ success: true, data: courses });
  });
}
