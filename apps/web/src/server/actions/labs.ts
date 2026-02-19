"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  validateStep,
  LabServiceError,
} from "@/lib/lab-client";
import { LAB_MAX_CONCURRENT_SESSIONS_PER_USER } from "@copypastelearn/shared";

export async function createLabSession(labDefinitionId: string) {
  const user = await requireAuth();

  // Fetch lab definition from DB
  const labDef = await db.labDefinition.findUnique({
    where: { id: labDefinitionId },
    select: {
      id: true,
      compiledPlan: true,
      envConfig: true,
      ttlMinutes: true,
    },
  });

  if (!labDef) {
    return { error: "Lab definition not found" };
  }

  // Check for existing active sessions
  const activeSessions = await db.labSession.count({
    where: {
      userId: user.id,
      status: { in: ["PROVISIONING", "READY", "RUNNING", "VALIDATING"] },
    },
  });

  if (activeSessions >= LAB_MAX_CONCURRENT_SESSIONS_PER_USER) {
    return {
      error: `You already have ${activeSessions} active lab session(s). Please complete or close an existing session first.`,
    };
  }

  try {
    const compiledPlan = (labDef.compiledPlan ?? {}) as Record<string, unknown>;
    const envConfig = (labDef.envConfig ?? {}) as Record<string, unknown>;

    const result = await createSession({
      userId: user.id,
      labDefinitionId: labDef.id,
      compiledPlan,
      envConfig: {
        image: (envConfig.image as string) ?? "ubuntu:22.04",
        memoryLimit: (envConfig.memoryLimit as string) ?? "256m",
        cpuLimit: (envConfig.cpuLimit as string) ?? "0.5",
        ttlMinutes: labDef.ttlMinutes ?? 60,
        networkMode: (envConfig.networkMode as string) ?? "none",
      },
    });

    // Record in DB
    await db.labSession.create({
      data: {
        id: result.sessionId,
        userId: user.id,
        labDefinitionId: labDef.id,
        status: "PROVISIONING",
        sandboxId: result.sandboxId,
        expiresAt: new Date(result.expiresAt),
        currentStepIndex: 0,
      },
    });

    return { data: result };
  } catch (error) {
    if (error instanceof LabServiceError) {
      return { error: error.message };
    }
    return { error: "Failed to create lab session" };
  }
}

export async function destroyLabSession(sessionId: string) {
  const user = await requireAuth();

  // Verify ownership
  const session = await db.labSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return { error: "Session not found" };
  }

  try {
    const result = await destroySession(sessionId);

    await db.labSession.update({
      where: { id: sessionId },
      data: {
        status: "DESTROYED",
        destroyedAt: new Date(result.destroyedAt),
      },
    });

    return { data: result };
  } catch (error) {
    if (error instanceof LabServiceError) {
      return { error: error.message };
    }
    return { error: "Failed to destroy lab session" };
  }
}

export async function validateLabStep(
  sessionId: string,
  stepIndex?: number
) {
  const user = await requireAuth();

  // Verify ownership
  const session = await db.labSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return { error: "Session not found" };
  }

  try {
    const result = await validateStep(sessionId, { stepIndex });

    // Update DB with result
    if (result.passed && result.advancedToStep !== null) {
      await db.labSession.update({
        where: { id: sessionId },
        data: { currentStepIndex: result.advancedToStep, status: "RUNNING" },
      });
    } else if (result.passed && result.advancedToStep === null) {
      await db.labSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    // Record attempt
    await db.labAttempt.create({
      data: {
        labSessionId: sessionId,
        stepIndex: stepIndex ?? session.currentStepIndex,
        passed: result.passed,
        results: result.results as unknown as object,
      },
    });

    return { data: result };
  } catch (error) {
    if (error instanceof LabServiceError) {
      return { error: error.message };
    }
    return { error: "Failed to validate step" };
  }
}
