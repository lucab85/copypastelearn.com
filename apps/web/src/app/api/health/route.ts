import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check critical env vars (existence only, no values)
  const requiredEnvVars = [
    "DATABASE_URL",
    "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_ID",
  ];

  for (const key of requiredEnvVars) {
    checks[key] = process.env[key] ? "✓ set" : "✗ MISSING";
  }

  // Test database connection
  try {
    await db.$queryRaw`SELECT 1`;
    checks["db_connection"] = "✓ connected";
  } catch (e: unknown) {
    checks["db_connection"] =
      `✗ FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  const allOk = Object.values(checks).every((v) => v.startsWith("✓"));

  return NextResponse.json(
    { status: allOk ? "healthy" : "unhealthy", checks },
    { status: allOk ? 200 : 503 }
  );
}
