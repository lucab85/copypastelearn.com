"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setProductStatus } from "@/server/actions/admin/products";
import { uploadProductFile } from "@/server/actions/admin/files";

export function ProductStatusForm({
  productId,
  status,
}: {
  productId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go(next: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    setError(null);
    startTransition(async () => {
      try {
        await setProductStatus({ id: productId, status: next });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={status === "DRAFT" ? "default" : "outline"}
        disabled={pending || status === "DRAFT"}
        onClick={() => go("DRAFT")}
      >
        Draft
      </Button>
      <Button
        size="sm"
        variant={status === "PUBLISHED" ? "default" : "outline"}
        disabled={pending || status === "PUBLISHED"}
        onClick={() => go("PUBLISHED")}
      >
        Publish
      </Button>
      <Button
        size="sm"
        variant={status === "ARCHIVED" ? "default" : "outline"}
        disabled={pending || status === "ARCHIVED"}
        onClick={() => go("ARCHIVED")}
      >
        Archive
      </Button>
      {error ? (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ProductFileUploadForm({ productId }: { productId: string }) {
  const [version, setVersion] = useState("1.0");
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function submit() {
    setError(null);
    setOk(false);
    if (!file) {
      setError("Choose a file");
      return;
    }
    startTransition(async () => {
      try {
        const buf = new Uint8Array(await file.arrayBuffer());
        const contentBase64 = btoa(
          Array.from(buf, (b) => String.fromCharCode(b)).join(""),
        );
        await uploadProductFile({
          productId,
          version,
          contentBase64,
          contentType: file.type || "application/octet-stream",
          filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
        });
        setOk(true);
        setFile(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-medium">Upload new version</p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="1.0"
          className="w-24"
        />
        <input
          type="file"
          aria-label="File"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {ok ? <p className="text-sm text-green-600">Uploaded.</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
