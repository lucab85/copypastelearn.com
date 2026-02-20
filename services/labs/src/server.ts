import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { randomUUID } from "node:crypto";
import { logger, createRequestLogger } from "./logger.js";
import { getConfig } from "./config.js";
import { sessionRoutes, sessions } from "./api/sessions.js";
import { eventRoutes } from "./api/events.js";
import { terminalRoutes } from "./api/terminal.js";
import { validateRoutes } from "./api/validate.js";
import { startCleanupProcess } from "./orchestrator/cleanup.js";

export async function buildServer(): Promise<FastifyInstance> {
  const config = getConfig();

  const app = Fastify({
    logger: false, // We use our own Pino logger
    genReqId: () => randomUUID(),
  });

  // ─── Plugins ────────────────────────────────────────
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(websocket);

  // ─── Request Logging ────────────────────────────────
  app.addHook("onRequest", async (request, _reply) => {
    const reqLogger = createRequestLogger({
      requestId: request.id as string,
      userId: (request.headers["x-user-id"] as string) ?? undefined,
    });
    (request as FastifyRequest & { log: typeof reqLogger }).log = reqLogger;
    reqLogger.info(
      { method: request.method, url: request.url },
      "incoming request"
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    logger.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      "request completed"
    );
  });

  // ─── API Key Auth Hook (skip health) ────────────────
  app.addHook("onRequest", async (request, reply) => {
    // Skip auth for health check
    if (request.url === "/health" || request.url === "/api/health") {
      return;
    }

    // Accept API key from header or query param (EventSource/WebSocket can't set headers)
    const headerKey = request.headers["x-api-key"] as string | undefined;
    const queryKey = (request.query as Record<string, string>)?.apiKey;
    const apiKey = headerKey || queryKey;

    if (!apiKey || apiKey !== config.LAB_SERVICE_API_KEY) {
      reply.code(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or missing API key",
        },
      });
    }
  });

  // ─── Health Endpoint ────────────────────────────────
  const healthPayload = () => {
    const activeCount = [...sessions.values()].filter(
      (s) => !["COMPLETED", "EXPIRED", "FAILED", "DESTROYED"].includes(s.status)
    ).length;
    return {
      status: "ok" as const,
      docker: "connected" as const,
      uptime: process.uptime(),
      activeSessions: activeCount,
    };
  };

  app.get("/health", async () => healthPayload());
  app.get("/api/health", async () => healthPayload());

  // ─── Route Registration ─────────────────────────────
  await app.register(sessionRoutes, { prefix: "/api" });
  await app.register(eventRoutes, { prefix: "/api" });
  await app.register(terminalRoutes, { prefix: "/api" });
  await app.register(validateRoutes, { prefix: "/api" });

  // ─── Cleanup Process ────────────────────────────────
  const cleanupTimer = startCleanupProcess();
  app.addHook("onClose", async () => {
    clearInterval(cleanupTimer);
  });

  return app;
}
