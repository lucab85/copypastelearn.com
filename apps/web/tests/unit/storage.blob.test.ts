import { describe, it, expect, vi } from "vitest";

const putCalls: Array<{ pathname: string; access: string; addRandomSuffix: boolean }> = [];
const getCalls: Array<{ pathname: string; access: string }> = [];

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (pathname: string, _body: unknown, opts: { access: string; addRandomSuffix?: boolean }) => {
    putCalls.push({
      pathname,
      access: opts.access,
      addRandomSuffix: opts.addRandomSuffix ?? false,
    });
    return {
      pathname,
      url: `https://store.private.blob.vercel-storage.com/${pathname}`,
      downloadUrl: `https://store.private.blob.vercel-storage.com/${pathname}?download=1`,
      contentType: "application/pdf",
      contentDisposition: `attachment; filename="${pathname}"`,
      etag: '"abc"',
    };
  }),
  get: vi.fn(async (pathname: string, opts: { access: string }) => {
    getCalls.push({ pathname, access: opts.access });
    return {
      statusCode: 200,
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
      headers: new Headers(),
      blob: {
        url: `https://store.private.blob.vercel-storage.com/${pathname}`,
        downloadUrl: `https://store.private.blob.vercel-storage.com/${pathname}?download=1`,
        pathname,
        contentType: "application/pdf",
        contentDisposition: `attachment; filename="${pathname}"`,
        cacheControl: "private, no-store",
        etag: '"abc"',
        size: 3,
        uploadedAt: new Date(),
      },
    };
  }),
}));

import { uploadPrivateBlob, fetchPrivateBlob } from "@/lib/delivery/storage";

describe("storage (Vercel Blob)", () => {
  it("uploadPrivateBlob writes with access=private and no random suffix", async () => {
    putCalls.length = 0;
    await uploadPrivateBlob({
      pathname: "products/p1/v1.0/file.pdf",
      body: Buffer.from("hello"),
      contentType: "application/pdf",
    });
    expect(putCalls.at(-1)).toEqual({
      pathname: "products/p1/v1.0/file.pdf",
      access: "private",
      addRandomSuffix: false,
    });
  });

  it("fetchPrivateBlob requests private access and returns a stream", async () => {
    getCalls.length = 0;
    const blob = await fetchPrivateBlob("products/p9/v2/secret.pdf");
    expect(getCalls.at(-1)).toEqual({
      pathname: "products/p9/v2/secret.pdf",
      access: "private",
    });
    expect(blob).not.toBeNull();
    expect(blob?.contentType).toBe("application/pdf");
    expect(blob?.size).toBe(3);
    expect(blob?.stream).toBeInstanceOf(ReadableStream);
  });
});
