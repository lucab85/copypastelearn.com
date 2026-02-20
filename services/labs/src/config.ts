import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().default(4000),
  HOST: z.string().default("0.0.0.0"),
  LAB_SERVICE_API_KEY: z.string().min(1, "LAB_SERVICE_API_KEY is required"),
  DOCKER_SOCKET: z.string().default("/var/run/docker.sock"),
  DEFAULT_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(60),
  MAX_CONCURRENT_SESSIONS_PER_USER: z.coerce.number().int().min(1).default(1),
  SANDBOX_MEMORY_LIMIT: z.string().default("512m"),
  SANDBOX_CPU_LIMIT: z.string().default("1.0"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): Config {
  if (!_config) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return _config;
}
