"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/commerce/audit";
import { uploadPrivateBlob } from "@/lib/delivery/storage";

const UploadSchema = z.object({
  productId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+(?:\.\d+)?$/),
  /** Base64-encoded bytes. Server uploads to S3 — never trust a client URL. */
  contentBase64: z.string().min(1),
  contentType: z.string().min(3).max(100).default("application/pdf"),
  filename: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9._-]+$/, "filename must be safe"),
});

/**
 * Upload a new file version for a product. Sets `isCurrent=true` on
 * the new row and demotes any prior current file. Existing
 * Entitlements keep `pinnedFileId` pointing to their original
 * version (A11), so prior buyers are unaffected by a re-upload.
 */
export async function uploadProductFile(input: unknown) {
  const admin = await requireAdmin();
  const data = UploadSchema.parse(input);

  const product = await db.product.findUnique({
    where: { id: data.productId },
  });
  if (!product) throw new Error("Product not found");

  const buffer = Buffer.from(data.contentBase64, "base64");
  if (!buffer.length) throw new Error("Empty file");
  if (buffer.length > 200 * 1024 * 1024) {
    throw new Error("File exceeds 200 MiB upload cap");
  }

  const storageKey = `products/${product.id}/v${data.version}/${data.filename}`;

  await uploadPrivateBlob({
    pathname: storageKey,
    body: buffer,
    contentType: data.contentType,
  });

  const file = await db.$transaction(async (tx) => {
    await tx.productFile.updateMany({
      where: { productId: product.id, isCurrent: true },
      data: { isCurrent: false },
    });
    return tx.productFile.create({
      data: {
        productId: product.id,
        version: data.version,
        storageKey,
        sizeBytes: buffer.length,
        contentType: data.contentType,
        isCurrent: true,
      },
    });
  });

  await logAdminAction({
    actorId: admin.id,
    action: "product_file.upload",
    targetType: "ProductFile",
    targetId: file.id,
    payload: { productId: product.id, version: data.version, sizeBytes: buffer.length },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}`);
  return { ok: true as const, fileId: file.id, storageKey };
}
