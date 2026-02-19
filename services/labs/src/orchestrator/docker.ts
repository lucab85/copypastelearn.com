import Docker from "dockerode";
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
import { getConfig } from "../config.js";
import { logger } from "../logger.js";

/**
 * Docker container provider using Dockerode.
 * MVP implementation of ContainerProvider interface.
 */
export class DockerProvider implements ContainerProvider {
  private docker: Docker;

  constructor() {
    const config = getConfig();
    this.docker = new Docker({ socketPath: config.DOCKER_SOCKET });
  }

  async create(options: CreateContainerOptions): Promise<ContainerInfo> {
    const log = logger.child({ provider: "docker", image: options.image });
    log.info("Creating container");

    // Parse memory limit (e.g., "512m" → bytes)
    const memoryBytes = parseMemoryLimit(options.memoryLimit);
    // Parse CPU limit (e.g., "1.0" → nanocpus)
    const nanoCpus = Math.floor(parseFloat(options.cpuLimit) * 1e9);

    const container = await this.docker.createContainer({
      Image: options.image,
      name: options.name,
      Tty: true,
      OpenStdin: true,
      WorkingDir: options.workingDir ?? "/workspace",
      User: options.user ?? "root",
      Env: options.env
        ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
        : undefined,
      Labels: options.labels,
      HostConfig: {
        Memory: memoryBytes,
        NanoCpus: nanoCpus,
        NetworkMode: options.networkMode === "internal" ? "none" : options.networkMode,
        SecurityOpt: ["no-new-privileges"],
        ReadonlyRootfs: false,
        CapDrop: ["ALL"],
        CapAdd: ["CHOWN", "SETUID", "SETGID", "DAC_OVERRIDE", "FOWNER", "NET_RAW"],
      },
    });

    await container.start();

    const info = await container.inspect();
    log.info({ containerId: container.id }, "Container started");

    return {
      containerId: container.id,
      name: info.Name.replace(/^\//, ""),
      status: "running",
    };
  }

  async exec(
    containerId: string,
    command: string[],
    options?: ExecOptions
  ): Promise<ExecResult> {
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: options?.workingDir,
      Env: options?.env
        ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
        : undefined,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise<ExecResult>((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      const timeout = options?.timeout ?? 30000;

      const timer = setTimeout(() => {
        stream.destroy();
        resolve({ exitCode: -1, stdout, stderr: stderr + "\n[timeout]" });
      }, timeout);

      // Docker multiplexes stdout/stderr in a single stream
      // Header: [stream_type(1), 0, 0, 0, size(4)] + payload
      stream.on("data", (chunk: Buffer) => {
        // Simple approach: treat all output as stdout
        const text = chunk.toString("utf-8");
        stdout += text;
      });

      stream.on("end", async () => {
        clearTimeout(timer);
        try {
          const inspection = await exec.inspect();
          resolve({
            exitCode: inspection.ExitCode ?? -1,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
          });
        } catch (err) {
          reject(err);
        }
      });

      stream.on("error", (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async attach(containerId: string): Promise<AttachResult> {
    const container = this.docker.getContainer(containerId);

    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
      hijack: true,
    });

    const output = new PassThrough();
    const input = new PassThrough();

    // Pipe container output to our output stream
    stream.pipe(output);

    // Pipe our input to the container
    input.pipe(stream);

    // Resize handler
    const resize = (cols: number, rows: number) => {
      container.resize({ h: rows, w: cols }).catch(() => {
        // Ignore resize errors
      });
    };

    return { output, input, resize };
  }

  async stop(containerId: string, timeout = 2): Promise<void> {
    const container = this.docker.getContainer(containerId);
    try {
      await container.stop({ t: timeout });
    } catch (error: unknown) {
      // Container might already be stopped
      if (error && typeof error === "object" && "statusCode" in error) {
        const err = error as { statusCode: number };
        if (err.statusCode !== 304) throw error;
      }
    }
  }

  async remove(containerId: string, force = false): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.remove({ force, v: true });
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const info = await this.docker.version();
      return {
        connected: true,
        version: info.Version,
      };
    } catch (error: unknown) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 512 * 1024 * 1024; // default 512MB

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "k":
      return value * 1024;
    case "m":
      return value * 1024 * 1024;
    case "g":
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}
