import type { FastifyPluginAsync } from "fastify";
import { validateStepSchema } from "@copypastelearn/shared";
import { sessions } from "./sessions.js";
import { DockerProvider } from "../orchestrator/docker.js";
import { runValidation } from "../validator/runner.js";
import type { PlanStep } from "../compiler/types.js";
import { logger } from "../logger.js";

let _provider: DockerProvider | null = null;
function getProvider(): DockerProvider {
  if (!_provider) _provider = new DockerProvider();
  return _provider;
}

export const validateRoutes: FastifyPluginAsync = async (app) => {
  // POST /sessions/:sessionId/validate — Validate current step
  app.post<{ Params: { sessionId: string } }>(
    "/sessions/:sessionId/validate",
    async (request, reply) => {
      const { sessionId } = request.params;
      const session = sessions.get(sessionId);
      const log = logger.child({ sessionId });

      if (!session) {
        return reply.code(404).send({
          error: {
            code: "SESSION_NOT_FOUND",
            message: `No session found with ID ${sessionId}`,
          },
        });
      }

      if (session.status !== "RUNNING") {
        return reply.code(409).send({
          error: {
            code: "SESSION_NOT_RUNNING",
            message: `Session is in ${session.status} state`,
          },
        });
      }

      if (!session.sandboxId) {
        return reply.code(409).send({
          error: {
            code: "SESSION_NOT_RUNNING",
            message: "Container not available",
          },
        });
      }

      const body = validateStepSchema.parse(request.body ?? {});
      const stepIndex = body.stepIndex ?? session.currentStepIndex;

      // Get step from compiled plan
      const plan = session.compiledPlan as { steps?: PlanStep[] };
      const steps = plan.steps ?? [];

      if (stepIndex < 0 || stepIndex >= steps.length) {
        return reply.code(400).send({
          error: {
            code: "INVALID_STEP",
            message: `Step index ${stepIndex} out of range (0-${steps.length - 1})`,
          },
        });
      }

      // Set status to validating
      session.status = "VALIDATING";

      try {
        const step = steps[stepIndex];
        const result = await runValidation(
          getProvider(),
          session.sandboxId,
          stepIndex,
          step.checks,
          steps.length
        );

        // Update session state
        if (result.passed) {
          if (result.advancedToStep !== null) {
            session.currentStepIndex = result.advancedToStep;
            session.status = "RUNNING";
          } else {
            // Last step passed — lab completed
            session.status = "COMPLETED";
            session.completedAt = new Date();
            log.info("Lab completed");
          }
        } else {
          session.status = "RUNNING";
        }

        return result;
      } catch (error) {
        session.status = "RUNNING";
        log.error({ error }, "Validation execution failed");
        return reply.code(500).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation execution failed",
          },
        });
      }
    }
  );
};
