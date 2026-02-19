import type { FastifyPluginAsync } from "fastify";
import { sessions } from "./sessions.js";
import { SSE_HEARTBEAT_INTERVAL_MS, LAB_TERMINAL_STATUSES } from "@copypastelearn/shared";

export const eventRoutes: FastifyPluginAsync = async (app) => {
  // GET /sessions/:sessionId/events — SSE event stream
  app.get<{ Params: { sessionId: string } }>(
    "/sessions/:sessionId/events",
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

      // Set SSE headers
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const sendEvent = (event: string, data: Record<string, unknown>) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial status
      sendEvent("status", {
        status: session.status,
        message: `Session is ${session.status.toLowerCase()}`,
        timestamp: new Date().toISOString(),
      });

      // Heartbeat interval
      const heartbeat = setInterval(() => {
        sendEvent("heartbeat", { timestamp: new Date().toISOString() });
      }, SSE_HEARTBEAT_INTERVAL_MS);

      // Poll session status for changes
      let lastStatus = session.status;
      let lastStepIndex = session.currentStepIndex;

      const statusPoll = setInterval(() => {
        const current = sessions.get(sessionId);
        if (!current) {
          clearInterval(statusPoll);
          clearInterval(heartbeat);
          reply.raw.end();
          return;
        }

        // Status change
        if (current.status !== lastStatus) {
          lastStatus = current.status;
          sendEvent("status", {
            status: current.status,
            message: `Session is ${current.status.toLowerCase()}`,
            timestamp: new Date().toISOString(),
            currentStepIndex: current.currentStepIndex,
          });

          // Check for terminal state
          if (
            LAB_TERMINAL_STATUSES.includes(
              current.status as (typeof LAB_TERMINAL_STATUSES)[number]
            )
          ) {
            if (current.status === "COMPLETED") {
              sendEvent("completed", {
                timestamp: new Date().toISOString(),
                totalAttempts: 0,
              });
            } else if (current.status === "EXPIRED") {
              sendEvent("expired", {
                timestamp: new Date().toISOString(),
                reason: "ttl_exceeded",
              });
            }

            clearInterval(statusPoll);
            clearInterval(heartbeat);
            reply.raw.end();
            return;
          }
        }

        // Step change
        if (current.currentStepIndex !== lastStepIndex) {
          lastStepIndex = current.currentStepIndex;
          sendEvent("step", {
            currentStepIndex: current.currentStepIndex,
            title: `Step ${current.currentStepIndex + 1}`,
            instructions: "",
          });
        }
      }, 1000);

      // Clean up on client disconnect
      request.raw.on("close", () => {
        clearInterval(heartbeat);
        clearInterval(statusPoll);
      });
    }
  );
};
