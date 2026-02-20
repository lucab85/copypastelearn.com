import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const serverLogger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  ...(isProduction
    ? { timestamp: pino.stdTimeFunctions.isoTime }
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});

/**
 * Create a child logger with correlation IDs for use in server actions.
 */
export function createActionLogger(context: {
  userId?: string;
  sessionId?: string;
  labSessionId?: string;
  action: string;
}) {
  return serverLogger.child({
    ...context,
    component: "server-action",
  });
}
