import { sessions } from "../api/sessions.js";
import { DockerProvider } from "./docker.js";
import { logger } from "../logger.js";

let _provider: DockerProvider | null = null;
function getProvider(): DockerProvider {
  if (!_provider) _provider = new DockerProvider();
  return _provider;
}
const CLEANUP_INTERVAL_MS = 30_000; // Check every 30 seconds

/**
 * Janitor process that periodically scans for expired sessions
 * and destroys their containers.
 */
export function startCleanupProcess(): NodeJS.Timeout {
  logger.info("Starting janitor cleanup process");

  return setInterval(async () => {
    const now = new Date();
    const expiredSessions = [...sessions.entries()].filter(
      ([, session]) =>
        !["COMPLETED", "EXPIRED", "DESTROYED"].includes(session.status) &&
        session.expiresAt < now
    );

    if (expiredSessions.length === 0) return;

    logger.info(
      { count: expiredSessions.length },
      "Cleaning up expired sessions"
    );

    for (const [sessionId, session] of expiredSessions) {
      const log = logger.child({ sessionId, sandboxId: session.sandboxId });

      try {
        if (session.sandboxId) {
          try {
            await getProvider().stop(session.sandboxId, 5);
          } catch {
            // Container may already be stopped
          }
          try {
            await getProvider().remove(session.sandboxId, true);
          } catch {
            // Container may already be removed
          }
        }

        session.status = "EXPIRED";
        session.destroyedAt = new Date();
        log.info("Session expired and cleaned up");
      } catch (error) {
        log.error({ error }, "Failed to clean up expired session");
        // Mark as expired anyway to prevent retry loop
        session.status = "EXPIRED";
        session.destroyedAt = new Date();
      }
    }
  }, CLEANUP_INTERVAL_MS);
}
