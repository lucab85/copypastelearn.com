import type { FastifyPluginAsync } from "fastify";
import { sessions } from "./sessions.js";
import { DockerProvider } from "../orchestrator/docker.js";
import { sanitizeOutput } from "../validator/sanitizer.js";
import { logger } from "../logger.js";

const provider = new DockerProvider();

export const terminalRoutes: FastifyPluginAsync = async (app) => {
  // WS /sessions/:sessionId/terminal — Interactive terminal
  app.get<{ Params: { sessionId: string } }>(
    "/sessions/:sessionId/terminal",
    { websocket: true },
    async (socket, request) => {
      const { sessionId } = request.params;
      const session = sessions.get(sessionId);
      const log = logger.child({ sessionId });

      if (!session) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Session not found",
          })
        );
        socket.close();
        return;
      }

      if (!session.sandboxId) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Container not ready",
          })
        );
        socket.close();
        return;
      }

      if (!["READY", "RUNNING"].includes(session.status)) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: `Session is in ${session.status} state, terminal unavailable`,
          })
        );
        socket.close();
        return;
      }

      log.info("Terminal WebSocket connected");

      try {
        const { output, input, resize } = await provider.attach(
          session.sandboxId
        );

        // Stream container output to WebSocket
        output.on("data", (chunk: Buffer) => {
          const sanitized = sanitizeOutput(chunk.toString("utf-8"));
          socket.send(
            JSON.stringify({ type: "output", data: sanitized })
          );
        });

        output.on("end", () => {
          socket.send(JSON.stringify({ type: "exit", code: 0 }));
          socket.close();
        });

        // Handle client messages
        socket.on("message", (data: Buffer | string) => {
          try {
            const message = JSON.parse(
              typeof data === "string" ? data : data.toString()
            );

            switch (message.type) {
              case "input":
                input.write(message.data);
                break;
              case "resize":
                resize(message.cols, message.rows);
                break;
              default:
                log.warn({ type: message.type }, "Unknown terminal message type");
            }
          } catch {
            log.warn("Failed to parse terminal message");
          }
        });

        socket.on("close", () => {
          log.info("Terminal WebSocket closed");
          input.end();
        });

        socket.on("error", (error) => {
          log.error({ error }, "Terminal WebSocket error");
          input.end();
        });
      } catch (error) {
        log.error({ error }, "Failed to attach to container");
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Failed to connect to container terminal",
          })
        );
        socket.close();
      }
    }
  );
};
