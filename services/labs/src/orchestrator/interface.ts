import type { Readable, Writable } from "node:stream";

/**
 * Container provider interface. Docker is the MVP implementation;
 * can be replaced with a Kubernetes provider later.
 */
export interface ContainerProvider {
  /**
   * Create and start a container from an image.
   */
  create(options: CreateContainerOptions): Promise<ContainerInfo>;

  /**
   * Execute a command inside a running container.
   */
  exec(
    containerId: string,
    command: string[],
    options?: ExecOptions
  ): Promise<ExecResult>;

  /**
   * Attach to the container's TTY for interactive terminal I/O.
   * Returns readable output stream and writable input stream.
   */
  attach(containerId: string): Promise<AttachResult>;

  /**
   * Stop a running container.
   */
  stop(containerId: string, timeout?: number): Promise<void>;

  /**
   * Remove a container (must be stopped first).
   */
  remove(containerId: string, force?: boolean): Promise<void>;

  /**
   * Check if the Docker daemon / container runtime is available.
   */
  healthCheck(): Promise<HealthCheckResult>;
}

export interface CreateContainerOptions {
  image: string;
  name?: string;
  memoryLimit: string; // e.g., "512m"
  cpuLimit: string; // e.g., "1.0"
  networkMode: string; // e.g., "internal", "none"
  env?: Record<string, string>;
  labels?: Record<string, string>;
  user?: string; // non-root user, e.g., "1000:1000"
  workingDir?: string;
}

export interface ContainerInfo {
  containerId: string;
  name: string;
  status: "created" | "running" | "stopped" | "removed";
}

export interface ExecOptions {
  timeout?: number; // milliseconds
  workingDir?: string;
  env?: Record<string, string>;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface AttachResult {
  output: Readable;
  input: Writable;
  resize: (cols: number, rows: number) => void;
}

export interface HealthCheckResult {
  connected: boolean;
  version?: string;
  error?: string;
}
