import { NextResponse } from "next/server";
import { Sandbox } from "@vercel/sandbox";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/sandbox/exec — Execute a command in a running sandbox.
 *
 * Body: { sessionId: string, command: string }
 * Returns: { exitCode, stdout, stderr }
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { sessionId, command } = await request.json();

    if (!sessionId || !command) {
      return NextResponse.json(
        { error: "sessionId and command are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const session = await db.labSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });

    if (!session?.sandboxId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Reconnect to sandbox
    const sandbox = await Sandbox.get(session.sandboxId);

    if (sandbox.status !== "running") {
      return NextResponse.json(
        { error: "Sandbox is not running" },
        { status: 409 }
      );
    }

    // Execute command
    const result = await sandbox.runCommand("bash", ["-c", command], {
      timeout: 30_000, // 30s max per command
    });

    return NextResponse.json({
      exitCode: result.exitCode,
      stdout: await result.stdout(),
      stderr: await result.stderr(),
    });
  } catch (error) {
    console.error("Sandbox exec failed:", error);
    return NextResponse.json(
      { error: "Command execution failed" },
      { status: 500 }
    );
  }
}
