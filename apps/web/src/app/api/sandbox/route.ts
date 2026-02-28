import { NextResponse } from "next/server";
import { Sandbox } from "@vercel/sandbox";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/sandbox — Create a Vercel Sandbox for a lab session.
 *
 * This is the prototype endpoint for running labs directly on
 * Vercel Sandbox instead of the separate Docker-based lab service.
 *
 * Body: { labDefinitionId: string }
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Check subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (subscription?.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Active subscription required" },
        { status: 403 }
      );
    }

    const { labDefinitionId } = await request.json();

    // Fetch lab definition
    const labDef = await db.labDefinition.findUnique({
      where: { id: labDefinitionId },
      include: {
        lesson: {
          select: {
            slug: true,
            course: { select: { slug: true } },
          },
        },
      },
    });

    if (!labDef) {
      return NextResponse.json(
        { error: "Lab definition not found" },
        { status: 404 }
      );
    }

    const courseSlug = labDef.lesson.course.slug;
    const ttlMs = (labDef.ttlMinutes ?? 30) * 60 * 1000;

    // Create Vercel Sandbox
    const sandbox = await Sandbox.create({
      runtime: "node24",
      timeout: Math.min(ttlMs, 30 * 60 * 1000), // Cap at 30 min for prototype
    });

    // Run setup commands based on course
    const setupCmds = getSetupCommands(courseSlug);
    for (const cmd of setupCmds) {
      await sandbox.runCommand("bash", ["-c", cmd]);
    }

    // Record session in DB
    const session = await db.labSession.create({
      data: {
        userId: user.id,
        labDefinitionId: labDef.id,
        status: "READY",
        sandboxId: sandbox.sandboxId,
        expiresAt: new Date(Date.now() + ttlMs),
        currentStepIndex: 0,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      sandboxId: sandbox.sandboxId,
      status: "ready",
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Sandbox creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create sandbox" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sandbox?sessionId=xxx — Get sandbox status
 */
export async function GET(request: Request) {
  const user = await requireAuth();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId required" },
      { status: 400 }
    );
  }

  const session = await db.labSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session?.sandboxId) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  try {
    const sandbox = await Sandbox.get(session.sandboxId);
    return NextResponse.json({
      sessionId: session.id,
      sandboxId: sandbox.sandboxId,
      status: sandbox.status,
      timeout: sandbox.timeout,
    });
  } catch {
    return NextResponse.json({
      sessionId: session.id,
      sandboxId: session.sandboxId,
      status: "stopped",
    });
  }
}

// ─── Setup commands per course ──────────────────────

function getSetupCommands(courseSlug: string): string[] {
  const base = ["sudo dnf install -y git curl wget 2>/dev/null || true"];

  switch (courseSlug) {
    case "ansible-quickstart":
      return [
        ...base,
        "sudo dnf install -y python3-pip 2>/dev/null || true",
        "pip3 install --quiet ansible",
      ];
    case "docker-fundamentals":
      return [
        ...base,
        "sudo dnf install -y podman 2>/dev/null || true",
        'echo "alias docker=podman" >> ~/.bashrc',
      ];
    case "terraform-beginners":
      return [
        ...base,
        "sudo dnf install -y unzip 2>/dev/null || true",
        "curl -fsSL https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip -o /tmp/tf.zip && sudo unzip -o /tmp/tf.zip -d /usr/local/bin/",
      ];
    case "nodejs-rest-apis":
      return base; // Node.js already in runtime
    case "mlflow-kubernetes-mlops":
      return [
        ...base,
        "sudo dnf install -y python3-pip 2>/dev/null || true",
        "pip3 install --quiet mlflow",
      ];
    case "openclaw-agent":
      return base; // Node.js + npm available
    default:
      return base;
  }
}
