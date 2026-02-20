# API Contract: Lab Service# API Contract: Lab Service

































































































































































































































































































Rate limit headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.- All other endpoints: 60 requests per minute per API key.- Validation: 30 requests per session per minute.- Session creation: 5 requests per user per hour.## Rate Limiting```}  }    "message": "No session found with ID sess_abc123"    "code": "SESSION_NOT_FOUND",  "error": {{```jsonAll error responses follow this structure:## Common Error Response Format---- If the WebSocket is opened on a session not in `ready` or `running` status, the server sends an `error` message and closes.- Connection closes when session is destroyed or expires.- Output is truncated after 64 KB per message to prevent client memory issues.- Server sanitizes output (strips internal IPs, Docker paths, secrets).- Attaches to the container's default shell (e.g., `/bin/bash`).**Behavior**```{ "type": "error", "message": "Session expired" }{ "type": "exit", "code": 0 }{ "type": "output", "data": "total 4\ndrwxr-xr-x  2 user user 4096 ...\n" }```json**Server → Client Messages**```{ "type": "resize", "cols": 120, "rows": 40 }{ "type": "input", "data": "ls -la\n" }```json**Client → Server Messages**```  x-api-key: LAB_SERVICE_API_KEYHeaders:ws://LAB_SERVICE_URL/sessions/:sessionId/terminal```text**Connection**Full-duplex WebSocket connection for xterm.js terminal I/O.### `WS /sessions/:sessionId/terminal` — Interactive Terminal## WebSocket Terminal---- Connection closes when session reaches a terminal state (`completed`, `expired`, `failed`, `destroyed`).- Server sends `heartbeat` every 30 seconds to keep the connection alive.- Client should handle reconnection (EventSource spec handles this automatically).**Connection Notes**```data: {"timestamp":"2026-02-19T14:03:00.000Z"}event: heartbeatdata: {"message":"Container crashed unexpectedly","code":"SANDBOX_ERROR"}event: errordata: {"timestamp":"2026-02-19T15:00:00.000Z","reason":"ttl_exceeded"}event: expireddata: {"timestamp":"2026-02-19T14:10:00.000Z","totalAttempts":3}event: completeddata: {"stepIndex":1,"passed":true,"timestamp":"2026-02-19T14:05:00.000Z"}event: validationdata: {"stepIndex":1,"action":"started","timestamp":"2026-02-19T14:02:00.000Z"}event: stepdata: {"status":"running","timestamp":"2026-02-19T14:00:06.000Z"}event: statusdata: {"status":"ready","timestamp":"2026-02-19T14:00:05.000Z"}event: status```text**Event Types**Long-lived SSE connection that emits session lifecycle events.### `GET /sessions/:sessionId/events` — Stream Session Events## Server-Sent Events (SSE)---| 422 | `INVALID_STEP` | Requested step index out of range || 409 | `SESSION_NOT_RUNNING` | Session is not in `running` status || 404 | `SESSION_NOT_FOUND` | Session does not exist ||--------|------|-----------|| Status | Code | Condition |**Error Responses**```}  "labCompleted": false  "nextStepIndex": null,  ],    }      "hint": "Create the file using: touch /app/index.js"      "message": "File /app/index.js not found",      "passed": false,      "checkName": "file_exists",    {  "results": [  "stepIndex": 1,  "passed": false,{```json**Failure Response 200** (validation ran but checks failed)When the final step passes, `labCompleted` is `true` and session status transitions to `completed`.```}  "labCompleted": false  "nextStepIndex": 2,  ],    }      "hint": null      "message": "File contains expected output",      "passed": true,      "checkName": "content_matches",    {    },      "hint": null      "message": "File /app/index.js exists",      "passed": true,      "checkName": "file_exists",    {  "results": [  "stepIndex": 1,  "passed": true,{```json**Response 200**If `stepIndex` is omitted, validates the session's `currentStepIndex`.```}  "stepIndex": 1{```json**Request Body** (optional)Runs the validation checks for the current step of the lab.### `POST /sessions/:sessionId/validate` — Validate Current Step## Validation---| 409 | `ALREADY_DESTROYED` | Session was already destroyed || 404 | `SESSION_NOT_FOUND` | Session does not exist ||--------|------|-----------|| Status | Code | Condition |**Error Responses**```}  "destroyedAt": "2026-02-19T14:30:00.000Z"  "status": "destroyed",  "id": "sess_abc123",{```json**Response 200**Stops and removes the container. Safe to call on any non-destroyed session.### `DELETE /sessions/:sessionId` — Destroy Session---| 404 | `SESSION_NOT_FOUND` | Session does not exist ||--------|------|-----------|| Status | Code | Condition |**Error Responses****Status Values**: `provisioning` | `ready` | `running` | `validating` | `completed` | `expired` | `failed` | `destroyed````}  "createdAt": "2026-02-19T14:00:00.000Z"  "expiresAt": "2026-02-19T15:00:00.000Z",  "sandboxId": "container_xyz",  "totalSteps": 5,  "currentStepIndex": 1,  "status": "running",  "id": "sess_abc123",{```json**Response 200**### `GET /sessions/:sessionId` — Get Session Status---| 500 | `PROVISIONING_FAILED` | Container creation failed || 404 | `LAB_NOT_FOUND` | Lab definition does not exist || 409 | `SESSION_LIMIT_REACHED` | User already has an active session || 400 | `INVALID_INPUT` | Missing/invalid fields ||--------|------|-----------|| Status | Code | Condition |**Error Responses**```}  "createdAt": "2026-02-19T14:00:00.000Z"  "expiresAt": "2026-02-19T15:00:00.000Z",  "sandboxId": "container_xyz",  "status": "provisioning",  "id": "sess_abc123",{```json**Response 201**- User must not have an active session (server enforces `MAX_CONCURRENT_SESSIONS_PER_USER=1`)- `ttlMinutes` optional, defaults to lab definition's `ttlMinutes` (max: 120)- `labDefinitionId` required, must reference a valid lab definition- `userId` required, non-empty string**Validation Rules**```}  "ttlMinutes": 60  "labDefinitionId": "clxyz...",  "userId": "user_abc123",{```json**Request Body**Creates a new isolated container for the given lab definition.### `POST /sessions` — Create Lab Session## Sessions---```{ "status": "ok", "uptime": 12345 }```json**Response 200**No authentication required.### `GET /health`## Health Check---Authentication: All endpoints require `x-api-key` header matching `LAB_SERVICE_API_KEY`.Base URL: `LAB_SERVICE_URL` (default `http://localhost:4000`)**Branch**: `001-mvp-platform` | **Date**: 2026-02-19
**Branch**: `001-mvp-platform` | **Date**: 2026-02-19

## Overview

The Lab Service is a standalone Fastify server that manages ephemeral Docker containers for interactive labs. The web app communicates with it over HTTP (REST + SSE) and WebSocket.

**Base URL**: `http://localhost:4000` (dev) / configured via `LAB_SERVICE_URL` env var.

**Authentication**: All endpoints require the `X-API-Key` header matching the shared `LAB_SERVICE_API_KEY`.

---

## Endpoints

### POST /api/sessions

Create a new lab session (provisions a container).

**Request**:
```json
{
  "userId": "user_abc123",
  "labDefinitionId": "cuid_labdef_001",
  "compiledPlan": { /* ... compiled execution plan from DB ... */ },
  "envConfig": {
    "image": "copypastelearn/lab-base:latest",
    "memoryLimit": "512m",
    "cpuLimit": "1.0",
    "ttlMinutes": 60,
    "networkMode": "internal"
  }
}
```

**Response** `201 Created`:
```json
{
  "sessionId": "cuid_session_001",
  "sandboxId": "docker_container_abc",
  "status": "PROVISIONING",
  "expiresAt": "2026-02-19T15:00:00.000Z",
  "sseUrl": "/api/sessions/cuid_session_001/events",
  "terminalUrl": "ws://localhost:4000/api/sessions/cuid_session_001/terminal"
}
```

**Errors**:
| Status | Code | Meaning |
|--------|------|---------|
| 400 | `INVALID_REQUEST` | Missing or invalid fields |
| 409 | `SESSION_LIMIT_REACHED` | User already has an active session (max 1 concurrent) |
| 503 | `PROVISIONING_UNAVAILABLE` | Docker daemon unreachable or host at capacity |

---

### GET /api/sessions/:sessionId

Get current session status and metadata.

**Response** `200 OK`:
```json
{
  "sessionId": "cuid_session_001",
  "userId": "user_abc123",
  "labDefinitionId": "cuid_labdef_001",
  "status": "RUNNING",
  "currentStepIndex": 1,
  "sandboxId": "docker_container_abc",
  "expiresAt": "2026-02-19T15:00:00.000Z",
  "startedAt": "2026-02-19T14:00:00.000Z",
  "completedAt": null
}
```

**Errors**:
| Status | Code | Meaning |
|--------|------|---------|
| 404 | `SESSION_NOT_FOUND` | No session with this ID |

---

### GET /api/sessions/:sessionId/events

Server-Sent Events (SSE) stream for real-time lab status updates.

**Headers**: `Accept: text/event-stream`

**Event types**:

```text
event: status
data: {"status": "PROVISIONING", "message": "Pulling image..."}

event: status
data: {"status": "READY", "message": "Container started, waiting for health check..."}

event: status
data: {"status": "RUNNING", "message": "Lab environment ready.", "currentStepIndex": 0}

event: step
data: {"currentStepIndex": 1, "title": "Create the configuration file", "instructions": "..."}

event: validation
data: {"stepIndex": 0, "passed": true, "results": [{"checkName": "file_exists", "passed": true, "message": "nginx.conf found"}]}

event: validation
data: {"stepIndex": 0, "passed": false, "results": [{"checkName": "file_exists", "passed": false, "message": "nginx.conf not found", "hint": "Create the file at /etc/nginx/nginx.conf"}]}

event: status
data: {"status": "COMPLETED", "message": "All steps passed!"}

event: status
data: {"status": "EXPIRED", "message": "Session TTL exceeded."}

event: error
data: {"code": "CONTAINER_CRASHED", "message": "The lab environment unexpectedly stopped."}

event: heartbeat
data: {"timestamp": "2026-02-19T14:05:00.000Z"}
```

**Connection rules**:
- Heartbeat sent every 30s to keep connection alive.
- Client should reconnect on disconnect with `Last-Event-ID` header.
- Stream closes when session reaches a terminal state (COMPLETED, EXPIRED, FAILED, DESTROYED).

---

### POST /api/sessions/:sessionId/validate

Trigger validation of the current step.

**Request**:
```json
{
  "stepIndex": 0
}
```

**Response** `200 OK`:
```json
{
  "stepIndex": 0,
  "passed": true,
  "results": [
    {
      "checkName": "file_exists",
      "passed": true,
      "message": "nginx.conf found at /etc/nginx/nginx.conf"
    },
    {
      "checkName": "file_content_contains",
      "passed": true,
      "message": "Configuration includes 'worker_processes auto;'"
    }
  ],
  "advancedToStep": 1
}
```

If failed:
```json
{
  "stepIndex": 0,
  "passed": false,
  "results": [
    {
      "checkName": "file_exists",
      "passed": false,
      "message": "nginx.conf not found",
      "hint": "Create the file at /etc/nginx/nginx.conf using 'touch /etc/nginx/nginx.conf'"
    }
  ],
  "advancedToStep": null
}
```

**Errors**:
| Status | Code | Meaning |
|--------|------|---------|
| 400 | `INVALID_STEP` | Step index out of bounds |
| 404 | `SESSION_NOT_FOUND` | No session with this ID |
| 409 | `SESSION_NOT_RUNNING` | Session is not in RUNNING status |
| 409 | `VALIDATION_IN_PROGRESS` | A validation is already running |

---

### DELETE /api/sessions/:sessionId

Destroy a session and its container.

**Response** `200 OK`:
```json
{
  "sessionId": "cuid_session_001",
  "status": "DESTROYED",
  "destroyedAt": "2026-02-19T14:30:00.000Z"
}
```

**Errors**:
| Status | Code | Meaning |
|--------|------|---------|
| 404 | `SESSION_NOT_FOUND` | No session with this ID |

---

### WebSocket /api/sessions/:sessionId/terminal

Bidirectional terminal I/O stream for xterm.js.

**Upgrade**: Standard WebSocket upgrade. API key sent as query parameter: `?apiKey=...`

**Protocol**:

Client → Server (text frames):
```json
{ "type": "input", "data": "ls -la\n" }
{ "type": "resize", "cols": 120, "rows": 40 }
```

Server → Client (text frames):
```json
{ "type": "output", "data": "total 32\ndrwxr-xr-x ..." }
{ "type": "error", "message": "Container exec failed" }
{ "type": "exit", "code": 0 }
```

**Connection rules**:
- Connection closes when session is destroyed, expired, or completed.
- Server sends `exit` frame before closing.
- Client should handle reconnection for transient disconnects.
- Output is sanitized to remove internal hostnames and sensitive paths.

---

### GET /health

Health check endpoint (no authentication required).

**Response** `200 OK`:
```json
{
  "status": "ok",
  "docker": "connected",
  "uptime": 3600,
  "activeSessions": 2
}
```

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {}
  }
}
```

## Correlation Headers

All responses include:
- `X-Request-Id`: Unique request identifier (generated by Lab Service if not provided by caller).
- Logged with Pino using correlation fields: `user_id`, `session_id`, `lab_session_id`, `sandbox_id`.
