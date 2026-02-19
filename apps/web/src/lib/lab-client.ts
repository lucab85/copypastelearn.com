import type {
  CreateLabSessionRequest,
  CreateLabSessionResponse,
  DestroyLabSessionResponse,
  ValidateStepRequest,
  ValidateStepResponse,
  LabServiceHealth,
} from "@copypastelearn/shared";

const LAB_SERVICE_URL =
  process.env.LAB_SERVICE_URL ?? "http://localhost:4100";
const LAB_SERVICE_API_KEY = process.env.LAB_SERVICE_API_KEY ?? "";

type FetchOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

async function labFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const res = await fetch(`${LAB_SERVICE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": LAB_SERVICE_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      error: { code: "UNKNOWN", message: res.statusText },
    }));
    throw new LabServiceError(
      error.error?.message ?? res.statusText,
      error.error?.code ?? "UNKNOWN",
      res.status
    );
  }

  return res.json() as Promise<T>;
}

export class LabServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "LabServiceError";
  }
}

// ─── API Methods ──────────────────────────────────────

export async function createSession(
  data: CreateLabSessionRequest
): Promise<CreateLabSessionResponse> {
  return labFetch<CreateLabSessionResponse>("/api/sessions", {
    method: "POST",
    body: data,
  });
}

export async function getSession(
  sessionId: string
): Promise<{
  sessionId: string;
  userId: string;
  labDefinitionId: string;
  status: string;
  currentStepIndex: number;
  sandboxId: string | null;
  expiresAt: string;
  startedAt: string;
  completedAt: string | null;
}> {
  return labFetch(`/api/sessions/${sessionId}`);
}

export async function destroySession(
  sessionId: string
): Promise<DestroyLabSessionResponse> {
  return labFetch<DestroyLabSessionResponse>(`/api/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function validateStep(
  sessionId: string,
  data?: ValidateStepRequest
): Promise<ValidateStepResponse> {
  return labFetch<ValidateStepResponse>(
    `/api/sessions/${sessionId}/validate`,
    {
      method: "POST",
      body: data ?? {},
    }
  );
}

export async function getHealth(): Promise<LabServiceHealth> {
  return labFetch<LabServiceHealth>("/api/health");
}

// ─── URL Builders ─────────────────────────────────────

export function sseUrl(sessionId: string): string {
  return `${LAB_SERVICE_URL}/api/sessions/${sessionId}/events`;
}

export function terminalWsUrl(sessionId: string): string {
  const wsBase = LAB_SERVICE_URL.replace(/^http/, "ws");
  return `${wsBase}/api/sessions/${sessionId}/terminal`;
}
