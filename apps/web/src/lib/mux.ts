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
 */
function getPrivateKey(): string {
  const decoded = Buffer.from(MUX_TOKEN_SECRET, "base64").toString("utf-8");
  // If it already looks like a PEM, return as-is
  if (decoded.includes("-----BEGIN")) return decoded;
  // Otherwise wrap it
  return `-----BEGIN RSA PRIVATE KEY-----\n${MUX_TOKEN_SECRET}\n-----END RSA PRIVATE KEY-----`;
}

interface MuxTokens {
  video: string;
  thumbnail: string;
  storyboard: string;
}

/**
 * Generate signed playback tokens for a Mux playback ID.
 * Returns undefined if signing keys are not configured (public playback).
 */
export function generateMuxTokens(playbackId: string): MuxTokens | undefined {
  if (!isMuxSigningConfigured()) return undefined;

  const privateKey = getPrivateKey();
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

  return { video: videoToken, thumbnail: thumbnailToken, storyboard: storyboardToken };
}
