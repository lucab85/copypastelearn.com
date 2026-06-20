/**
 * Product file provider for the "Claude Code Bootcamp" e-book.
 *
 * Unlike the generated cookbook PDFs, this product ships the finished book as
 * authored by Luca Berton. The bytes live alongside this module under
 * ./assets/claude-code-bootcamp.pdf and are uploaded to Vercel Blob as the
 * current ProductFile by the commerce seed. Re-runnable: the blob put() is
 * overwrite-safe.
 */

import { readFile } from "node:fs/promises";

export async function generateClaudeCodeBootcampPdf(): Promise<Uint8Array> {
  const pdfUrl = new URL("./assets/claude-code-bootcamp.pdf", import.meta.url);
  const bytes = await readFile(pdfUrl);
  return new Uint8Array(bytes);
}
