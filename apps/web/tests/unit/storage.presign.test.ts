import { describe, it, expect, vi } from "vitest";

const sentCommands: Array<{ Bucket: string; Key: string }> = [];

vi.mock("@aws-sdk/client-s3", () => {
  class GetObjectCommand {
    constructor(public readonly input: { Bucket: string; Key: string }) {
      sentCommands.push(input);
    }
  }
  class S3Client {
    constructor(public readonly opts: unknown) {}
  }
  return { S3Client, GetObjectCommand };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async (_client: unknown, _cmd: unknown, opts: { expiresIn: number }) => {
    return `https://example.s3/object?X-Amz-Expires=${opts.expiresIn}`;
  }),
}));

process.env.COMMERCE_S3_REGION = "eu-west-1";
process.env.COMMERCE_S3_ACCESS_KEY_ID = "AKIATEST";
process.env.COMMERCE_S3_SECRET_ACCESS_KEY = "SECRETTEST";

import { presignDownloadUrl } from "@/lib/delivery/storage";

describe("presignDownloadUrl", () => {
  it("defaults to a 60-second TTL", async () => {
    const url = await presignDownloadUrl({
      bucket: "my-bucket",
      key: "products/p1/v1.0/file.pdf",
    });
    expect(url).toContain("X-Amz-Expires=60");
  });

  it("clamps TTL into the [1, 600] range", async () => {
    const tooLong = await presignDownloadUrl({
      bucket: "b",
      key: "k",
      ttlSeconds: 99_999,
    });
    expect(tooLong).toContain("X-Amz-Expires=600");
    const tooShort = await presignDownloadUrl({
      bucket: "b",
      key: "k",
      ttlSeconds: 0,
    });
    expect(tooShort).toContain("X-Amz-Expires=1");
  });

  it("targets the requested bucket and key (no public ACL leakage in URL)", async () => {
    sentCommands.length = 0;
    const url = await presignDownloadUrl({
      bucket: "private-bucket",
      key: "products/p9/v2/secret.pdf",
    });
    expect(sentCommands.at(-1)).toEqual({
      Bucket: "private-bucket",
      Key: "products/p9/v2/secret.pdf",
    });
    expect(url).not.toMatch(/public-read|x-amz-acl/i);
  });
});
