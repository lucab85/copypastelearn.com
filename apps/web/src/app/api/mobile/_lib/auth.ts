import { NextResponse } from "next/server";
import { getCurrentUser, requireAuth, UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/auth";

export { getCurrentUser, requireAuth };

/**
 * Wrap an API handler with standard error handling.
 */
export function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((err: unknown) => {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: err.message } },
        { status: 401 }
      );
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: err.message } },
        { status: 403 }
      );
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: err.message } },
        { status: 404 }
      );
    }
    console.error("[mobile-api]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500 }
    );
  });
}
