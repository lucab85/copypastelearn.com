import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with correlation IDs for request tracing.
 */
export function createRequestLogger(correlationIds: {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  labSessionId?: string;
  sandboxId?: string;
}) {
  return logger.child(correlationIds);
}
