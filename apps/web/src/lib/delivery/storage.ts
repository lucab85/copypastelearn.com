import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3 (or compatible: R2, MinIO) client + presigned-URL minting for
 * protected product files.
 *
 * Per FR-024 and SC-004, files MUST never be reachable through a
 * permanent or guessable public URL. Presigned URLs are short-lived
 * (60s default) and are produced only after a DownloadToken has been
 * verified by the API route.
 */

let cachedClient: S3Client | undefined;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const region = process.env.COMMERCE_S3_REGION;
  const accessKeyId = process.env.COMMERCE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.COMMERCE_S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.COMMERCE_S3_ENDPOINT || undefined;

  if (!region) {
    throw new Error("COMMERCE_S3_REGION is not configured");
  }
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("COMMERCE_S3 credentials are not configured");
  }

  cachedClient = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: Boolean(endpoint), // MinIO/R2 prefer path-style
  });
  return cachedClient;
}

export interface PresignOptions {
  bucket: string;
  key: string;
  /** Time-to-live in seconds. Defaults to 60. Hard cap 600 for safety. */
  ttlSeconds?: number;
  /** Optional `Content-Disposition` header to control download filename. */
  contentDisposition?: string;
}

export async function presignDownloadUrl(opts: PresignOptions): Promise<string> {
  const ttl = Math.min(Math.max(opts.ttlSeconds ?? 60, 1), 600);
  const command = new GetObjectCommand({
    Bucket: opts.bucket,
    Key: opts.key,
    ResponseContentDisposition: opts.contentDisposition,
  });
  return getSignedUrl(getClient(), command, { expiresIn: ttl });
}

/** For tests — drop the cached client. */
export function __resetStorageClientForTests(): void {
  cachedClient = undefined;
}
