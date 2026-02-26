import { NextResponse } from "next/server";
import { getDashboard } from "@/server/queries/dashboard";
import { withErrorHandling } from "../_lib/auth";

export async function GET() {
  return withErrorHandling(async () => {
    const dashboard = await getDashboard();
    return NextResponse.json({ success: true, data: dashboard });
  });
}
