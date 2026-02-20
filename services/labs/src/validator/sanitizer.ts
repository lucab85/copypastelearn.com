const SANDBOX_MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB

// Patterns to strip from output
const SENSITIVE_PATTERNS = [
  // Internal Docker IPs
  /\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/g,
  // Docker internal hostnames
  /\b[a-f0-9]{12}\.internal\b/gi,
  // Docker socket paths
  /\/var\/run\/docker\.sock/g,
  // Common secret env var patterns (KEY=value)
  /(?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)=[^\s]+/gi,
  // Docker container IDs in paths
  /\/var\/lib\/docker\/[^\s]+/g,
  // Host machine paths that leak info
  /\/home\/[a-zA-Z0-9_-]+\//g,
];

/**
 * Sanitize output from container execution.
 * - Strips internal IPs, Docker paths, and secrets
 * - Truncates output at 64 KB
 */
export function sanitizeOutput(raw: string): string {
  let output = raw;

  // Strip sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    output = output.replace(pattern, "[REDACTED]");
  }

  // Truncate if over limit
  if (Buffer.byteLength(output, "utf-8") > SANDBOX_MAX_OUTPUT_BYTES) {
    const buffer = Buffer.from(output, "utf-8");
    output =
      buffer.subarray(0, SANDBOX_MAX_OUTPUT_BYTES).toString("utf-8") +
      "\n... [output truncated at 64 KB]";
  }

  return output;
}
