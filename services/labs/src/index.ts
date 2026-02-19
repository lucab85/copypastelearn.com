import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { buildServer } from "./server.js";
import { loadConfig } from "./config.js";
import { logger } from "./logger.js";

const config = loadConfig();

const server = await buildServer();

try {
  await server.listen({ port: config.PORT, host: config.HOST });
  logger.info(`Lab Service listening on ${config.HOST}:${config.PORT}`);
} catch (err) {
  logger.fatal(err, "Failed to start Lab Service");
  process.exit(1);
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  await server.close();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
