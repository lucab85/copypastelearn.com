import jwt from "jsonwebtoken";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID ?? "";
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET ?? "";

/**
 * Check whether Mux signing keys are configured.
 */
function isMuxSigningConfigured(): boolean {
  return MUX_TOKEN_ID.length > 0 && MUX_TOKEN_SECRET.length > 0;
}

/**
 * Decode the base64-encoded private key into a PEM string.
 *
 * Mux signing keys are delivered as a base64-encoded DER blob.
 * jsonwebtoken's RS256 requires a properly formatted PEM with
 * 64-character line breaks.
 */
function getPrivateKey(): string {
  const decoded = Buffer.from(MUX_TOKEN_SECRET, "base64").toString("utf-8");
  // If it already looks like a PEM, return as-is
  if (decoded.includes("-----BEGIN")) return decoded;

  // Wrap the base64 string with proper PEM headers and 64-char line breaks
  const lines = MUX_TOKEN_SECRET.replace(/(.{64})/g, "$1\n").trim();
  return `-----BEGIN RSA PRIVATE KEY-----\n${lines}\n-----END RSA PRIVATE KEY-----\n`;
}

interface MuxTokens {
  playback: string;
  thumbnail: string;
  storyboard: string;
}

/**
 * Generate signed playback tokens for a Mux playback ID.
 * Returns undefined if signing keys are not configured (public playback)
 * or if the signing key is invalid.
 */
export function generateMuxTokens(playbackId: string): MuxTokens | undefined {
  if (!isMuxSigningConfigured()) return undefined;

  const privateKey = getPrivateKey();

  // Sanity-check: an RSA private key in PEM/DER form is at least ~800 bytes
  const keyBody = privateKey
    .replace(/-----[A-Z ]+-----/g, "")
    .replace(/\s/g, "");
  if (keyBody.length < 100) {
    console.warn(
      "[mux] MUX_TOKEN_SECRET appears too short to be a valid RSA private key. " +
        "Falling back to unsigned (public) playback. " +
        "Generate a signing key at https://dashboard.mux.com/settings/signing-keys"
    );
    return undefined;
  }
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + 7200; // 2 hours

  const videoToken = jwt.sign(
    {
      sub: playbackId,
      aud: "v",
      exp: expiration,
      kid: MUX_TOKEN_ID,
    },
    privateKey,
    { algorithm: "RS256", keyid: MUX_TOKEN_ID }
  );

  const thumbnailToken = jwt.sign(
    {
      sub: playbackId,
      aud: "t",
      exp: expiration,
      kid: MUX_TOKEN_ID,
    },
    privateKey,
    { algorithm: "RS256", keyid: MUX_TOKEN_ID }
  );

  const storyboardToken = jwt.sign(
    {
      sub: playbackId,
      aud: "s",
      exp: expiration,
      kid: MUX_TOKEN_ID,
    },
    privateKey,
    { algorithm: "RS256", keyid: MUX_TOKEN_ID }
  );

  return { playback: videoToken, thumbnail: thumbnailToken, storyboard: storyboardToken };
}
