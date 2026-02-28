import { Sandbox } from "@vercel/sandbox";
import { PassThrough } from "node:stream";
import type {
  ContainerProvider,
  CreateContainerOptions,
  ContainerInfo,
  ExecOptions,
  ExecResult,
  AttachResult,
  HealthCheckResult,
} from "./interface.js";
import { logger } from "../logger.js";

/**
 * Vercel Sandbox provider — runs labs in Firecracker microVMs
 * instead of local Docker containers.
 *
 * Maps the ContainerProvider interface to the @vercel/sandbox SDK.
 * "containerId" is the Vercel sandbox ID throughout.
 */
export class VercelSandboxProvider implements ContainerProvider {
  private sandboxes = new Map<string, Sandbox>();

  async create(options: CreateContainerOptions): Promise<ContainerInfo> {
    const log = logger.child({ provider: "vercel-sandbox" });
    log.info("Creating Vercel Sandbox");

    // Map env config to sandbox creation options
    const timeoutMs = parseInt(options.labels?.["ttlMinutes"] ?? "60") * 60 * 1000;

    const sandbox = await Sandbox.create({
      runtime: "node24",
      timeout: timeoutMs,
    });

    // Install any course-specific tooling via setup commands
    const setupCommands = this.getSetupCommands(options.labels?.["courseSlug"]);
    for (const cmd of setupCommands) {
      log.info({ cmd }, "Running setup command");
      const result = await sandbox.runCommand("bash", ["-c", cmd]);
      if (result.exitCode !== 0) {
        log.warn({ cmd, exitCode: result.exitCode }, "Setup command failed");
      }
    }

    this.sandboxes.set(sandbox.sandboxId, sandbox);

    log.info({ sandboxId: sandbox.sandboxId }, "Sandbox created");

    return {
      containerId: sandbox.sandboxId,
      name: `lab-${sandbox.sandboxId}`,
      status: "running",
    };
  }

  async exec(
    containerId: string,
    command: string[],
    options?: ExecOptions
  ): Promise<ExecResult> {
    const sandbox = await this.getSandbox(containerId);

    const cmd = command[0];
    const args = command.slice(1);

    const result = await sandbox.runCommand(cmd, args, {
      timeout: options?.timeout,
      cwd: options?.workingDir,
      env: options?.env,
    });

    return {
      exitCode: result.exitCode,
      stdout: await result.stdout(),
      stderr: await result.stderr(),
    };
  }

  async attach(containerId: string): Promise<AttachResult> {
    // Vercel Sandbox doesn't expose raw TTY attach via SDK.
    // For interactive terminals, use `sandbox connect` CLI or
    // implement a WebSocket proxy via the sandbox's shell commands.
    // For now, provide a basic stdin/stdout pipe via repeated exec.
    const output = new PassThrough();
    const input = new PassThrough();

    // Note: Full interactive terminal requires WebSocket integration.
    // This is a placeholder — the lab-panel UI should use the
    // /api/labs/[sessionId]/terminal WebSocket endpoint instead.
    return {
      output,
      input,
      resize: () => {}, // No-op for now
    };
  }

  async stop(containerId: string): Promise<void> {
    const sandbox = await this.getSandbox(containerId);
    await sandbox.shutdown();
    this.sandboxes.delete(containerId);
  }

  async remove(containerId: string): Promise<void> {
    // Vercel sandboxes are ephemeral — stop === remove
    if (this.sandboxes.has(containerId)) {
      await this.stop(containerId);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const { json } = await Sandbox.list({ limit: 1 });
      return {
        connected: true,
        version: "vercel-sandbox-v1",
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ─── Helpers ────────────────────────────────────────

  private async getSandbox(id: string): Promise<Sandbox> {
    let sandbox = this.sandboxes.get(id);
    if (!sandbox) {
      // Reconnect to existing sandbox
      sandbox = await Sandbox.get(id);
      this.sandboxes.set(id, sandbox);
    }
    return sandbox;
  }

  /**
   * Returns setup commands to install course-specific tools.
   * Vercel Sandbox uses Amazon Linux 2023 with dnf.
   */
  private getSetupCommands(courseSlug?: string): string[] {
    const base = [
      "sudo dnf install -y git curl wget",
    ];

    switch (courseSlug) {
      case "ansible-quickstart":
        return [...base, "sudo dnf install -y python3-pip", "pip3 install ansible"];
      case "docker-fundamentals":
        // Docker can't run inside Firecracker — use podman as alternative
        return [...base, "sudo dnf install -y podman", "alias docker=podman"];
      case "terraform-beginners":
        return [...base, "sudo dnf install -y unzip", "curl -fsSL https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip -o /tmp/tf.zip && sudo unzip /tmp/tf.zip -d /usr/local/bin/"];
      case "nodejs-rest-apis":
        return base; // Node.js already included in runtime
      case "mlflow-kubernetes-mlops":
        return [...base, "sudo dnf install -y python3-pip", "pip3 install mlflow"];
      case "openclaw-agent":
        return base; // Node.js + npm already available
      default:
        return base;
    }
  }
}
