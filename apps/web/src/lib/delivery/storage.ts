import { get, put, type PutBlobResult } from "@vercel/blob";

/**
 * Vercel Blob–backed protected file storage for product downloads.
 *
 * Per FR-024 and SC-004, files MUST never be reachable through a
 * permanent or guessable public URL. Blobs are stored with
 * `access: 'private'`; the `/api/download/[token]` route streams them
 * through our function only after a DownloadToken has been verified.
 *
 * Auth comes from `BLOB_READ_WRITE_TOKEN`, automatically injected by
 * Vercel when a Blob store is linked to the project.
 */

export interface UploadOptions {
  /** Logical pathname inside the Blob store (e.g. `products/abc/v1/file.pdf`). */
  pathname: string;
  body: Buffer | Uint8Array | ArrayBuffer | Blob | ReadableStream;
  contentType?: string;
  /** Defaults to false; we control filenames ourselves. */
  addRandomSuffix?: boolean;
}

/** Upload a private blob and return the resulting metadata. */
export async function uploadPrivateBlob(opts: UploadOptions): Promise<PutBlobResult> {
  return put(opts.pathname, opts.body as Blob, {
    access: "private",
    addRandomSuffix: opts.addRandomSuffix ?? false,
    contentType: opts.contentType,
    allowOverwrite: true,
  });
}

export interface FetchedBlob {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  size: number | null;
  etag: string;
}

/**
 * Fetch a private blob's body as a stream so it can be proxied to
 * the user. Returns `null` when not found.
 */
export async function fetchPrivateBlob(pathname: string): Promise<FetchedBlob | null> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return {
    stream: result.stream,
    contentType: result.blob.contentType ?? "application/octet-stream",
    size: result.blob.size,
    etag: result.blob.etag,
  };
}

/** For tests — currently a no-op (no client cache to clear). */
export function __resetStorageClientForTests(): void {
  // no-op
}
