import type { FastifyPluginAsync } from "fastify";
import { createLabSessionSchema } from "@copypastelearn/shared";
import { DockerProvider } from "../orchestrator/docker.js";
import { getConfig } from "../config.js";
import { createRequestLogger } from "../logger.js";
import { randomUUID } from "node:crypto";

// In-memory session store for MVP (replace with DB/Redis in production)
export interface SessionRecord {
  id: string;
  userId: string;
  labDefinitionId: string;
  status: string;
  currentStepIndex: number;
  sandboxId: string | null;
  compiledPlan: Record<string, unknown>;
  expiresAt: Date;
  startedAt: Date;
  completedAt: Date | null;
  destroyedAt: Date | null;
}

export const sessions = new Map<string, SessionRecord>();

let _provider: DockerProvider | null = null;
function getProvider(): DockerProvider {
  if (!_provider) _provider = new DockerProvider();
  return _provider;
}

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  // POST /sessions — Create a new lab session
  app.post("/sessions", async (request, reply) => {
    const config = getConfig();
    const body = createLabSessionSchema.parse(request.body);
    const log = createRequestLogger({
      requestId: request.id as string,
      userId: body.userId,
    });

    // Check concurrent session limit
    const activeSessions = [...sessions.values()].filter(
      (s) =>
        s.userId === body.userId &&
        !["COMPLETED", "EXPIRED", "FAILED", "DESTROYED"].includes(s.status)
    );

    if (activeSessions.length >= config.MAX_CONCURRENT_SESSIONS_PER_USER) {
      return reply.code(409).send({
        error: {
          code: "SESSION_LIMIT_REACHED",
          message: `User already has ${activeSessions.length} active session(s). Maximum: ${config.MAX_CONCURRENT_SESSIONS_PER_USER}`,
        },
      });
    }

    const sessionId = `sess_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const ttl = body.envConfig.ttlMinutes ?? config.DEFAULT_TTL_MINUTES;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    // Create session record
    const session: SessionRecord = {
      id: sessionId,
      userId: body.userId,
      labDefinitionId: body.labDefinitionId,
      status: "PROVISIONING",
      currentStepIndex: 0,
      sandboxId: null,
      compiledPlan: body.compiledPlan,
      expiresAt,
      startedAt: new Date(),
      completedAt: null,
      destroyedAt: null,
    };
    sessions.set(sessionId, session);

    log.info({ sessionId }, "Creating lab session");

    // Provision container asynchronously
    (async () => {
      try {
        const containerInfo = await getProvider().create({
          image: body.envConfig.image,
          name: `lab-${sessionId}`,
          memoryLimit: body.envConfig.memoryLimit,
          cpuLimit: body.envConfig.cpuLimit,
          networkMode: body.envConfig.networkMode,
          labels: {
            "copypastelearn.session": sessionId,
            "copypastelearn.user": body.userId,
          },
        });

        session.sandboxId = containerInfo.containerId;
        session.status = "READY";
        log.info({ sessionId, sandboxId: containerInfo.containerId }, "Container ready");

        // Transition to RUNNING after a brief moment
        setTimeout(() => {
          if (session.status === "READY") {
            session.status = "RUNNING";
          }
        }, 1000);
      } catch (error) {
        session.status = "FAILED";
        log.error({ sessionId, error }, "Container provisioning failed");
      }
    })();

    return reply.code(201).send({
      sessionId,
      sandboxId: null,
      status: "PROVISIONING",
      expiresAt: expiresAt.toISOString(),
      sseUrl: `/api/sessions/${sessionId}/events`,
      terminalUrl: `ws://${request.hostname}/api/sessions/${sessionId}/terminal`,
    });
  });

  // GET /sessions/:sessionId — Get session status
  app.get<{ Params: { sessionId: string } }>(
    "/sessions/:sessionId",
    async (request, reply) => {
      const { sessionId } = request.params;
      const session = sessions.get(sessionId);

      if (!session) {
        return reply.code(404).send({
          error: {
            code: "SESSION_NOT_FOUND",
            message: `No session found with ID ${sessionId}`,
          },
        });
      }

      return {
        sessionId: session.id,
        userId: session.userId,
        labDefinitionId: session.labDefinitionId,
        status: session.status,
        currentStepIndex: session.currentStepIndex,
        sandboxId: session.sandboxId,
        expiresAt: session.expiresAt.toISOString(),
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() ?? null,
      };
    }
  );

  // DELETE /sessions/:sessionId — Destroy a session
  app.delete<{ Params: { sessionId: string } }>(
    "/sessions/:sessionId",
    async (request, reply) => {
      const { sessionId } = request.params;
      const session = sessions.get(sessionId);

      if (!session) {
        return reply.code(404).send({
          error: {
            code: "SESSION_NOT_FOUND",
            message: `No session found with ID ${sessionId}`,
          },
        });
      }

      // Destroy container if running — force-remove skips the graceful stop timeout
      if (session.sandboxId) {
        try {
          await getProvider().remove(session.sandboxId, true);
        } catch {
          // Container might already be gone
        }
      }

      session.status = "DESTROYED";
      session.destroyedAt = new Date();

      return {
        sessionId: session.id,
        status: "DESTROYED",
        destroyedAt: session.destroyedAt.toISOString(),
      };
    }
  );
};
