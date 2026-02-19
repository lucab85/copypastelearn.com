// ─── Lab Session Types ──────────────────────────────────

export type LabSessionStatus =
  | "PROVISIONING"
  | "READY"
  | "RUNNING"
  | "VALIDATING"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED"
  | "DESTROYED";

export interface LabSession {
  sessionId: string;
  userId: string;
  labDefinitionId: string;
  status: LabSessionStatus;
  currentStepIndex: number;
  sandboxId: string | null;
  expiresAt: string;
  startedAt: string;
  completedAt: string | null;
}

export interface CreateLabSessionRequest {
  userId: string;
  labDefinitionId: string;
  compiledPlan: Record<string, unknown>;
  envConfig: LabEnvConfig;
}

export interface LabEnvConfig {
  image: string;
  memoryLimit: string;
  cpuLimit: string;
  ttlMinutes: number;
  networkMode: string;
}

export interface CreateLabSessionResponse {
  sessionId: string;
  sandboxId: string;
  status: LabSessionStatus;
  expiresAt: string;
  sseUrl: string;
  terminalUrl: string;
}

export interface DestroyLabSessionResponse {
  sessionId: string;
  status: "DESTROYED";
  destroyedAt: string;
}

// ─── Lab Validation Types ───────────────────────────────

export interface ValidationCheckResult {
  checkName: string;
  passed: boolean;
  message: string;
  hint?: string | null;
}

export interface ValidateStepRequest {
  stepIndex?: number;
}

export interface ValidateStepResponse {
  stepIndex: number;
  passed: boolean;
  results: ValidationCheckResult[];
  advancedToStep: number | null;
}

// ─── SSE Event Types ────────────────────────────────────

export type LabSSEEvent =
  | { event: "status"; data: { status: LabSessionStatus; message?: string; currentStepIndex?: number } }
  | { event: "step"; data: { currentStepIndex: number; title: string; instructions: string } }
  | { event: "validation"; data: { stepIndex: number; passed: boolean; results: ValidationCheckResult[] } }
  | { event: "completed"; data: { timestamp: string; totalAttempts: number } }
  | { event: "expired"; data: { timestamp: string; reason: string } }
  | { event: "error"; data: { code: string; message: string } }
  | { event: "heartbeat"; data: { timestamp: string } };

// ─── WebSocket Terminal Types ───────────────────────────

export type TerminalClientMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number };

export type TerminalServerMessage =
  | { type: "output"; data: string }
  | { type: "error"; message: string }
  | { type: "exit"; code: number };

// ─── Lab Definition Types ───────────────────────────────

export interface LabStep {
  title: string;
  instructions: string;
  checks: LabCheck[];
}

export interface LabCheck {
  name: string;
  command: string;
  expected: string;
  hint?: string;
}

export interface CompiledLabPlan {
  steps: LabStep[];
  environment: LabEnvConfig;
}

// ─── Health Check ───────────────────────────────────────

export interface LabServiceHealth {
  status: "ok";
  docker: string;
  uptime: number;
  activeSessions: number;
}
