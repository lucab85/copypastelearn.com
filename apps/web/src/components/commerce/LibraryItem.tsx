"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { regenerateDownloadToken } from "@/server/actions/regenerate-token";
import type { LibraryEntry } from "@/server/queries/library";

const BRAND_LABELS: Record<string, string> = {
  AnsiblePilot: "AnsiblePilot",
  TerraformPilot: "TerraformPilot",
  CopyPasteLearn: "CopyPasteLearn",
};

function formatBytes(n: number | null | undefined): string {
  if (!n || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function LibraryItem({ entry }: { entry: LibraryEntry }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  function handleRegenerate() {
    setError(null);
    setLink(null);
    startTransition(async () => {
      const res = await regenerateDownloadToken({
        entitlementId: entry.entitlementId,
      });
      if (res.ok) {
        setLink({ url: res.downloadUrl, expiresAt: res.expiresAt });
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            <Link
              href={`/products/${entry.productSlug}`}
              className="hover:underline"
            >
              {entry.productTitle}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {BRAND_LABELS[entry.brand] ?? entry.brand} ·{" "}
            {entry.productType.toLowerCase()} ·{" "}
            {entry.pinnedFileVersion
              ? `v${entry.pinnedFileVersion}`
              : "current version"}{" "}
            · {formatBytes(entry.fileSizeBytes)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Purchased {entry.grantedAt.toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Generating…" : "Get fresh download link"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {link ? (
        <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
          <p className="font-medium text-emerald-900 dark:text-emerald-200">
            Your download link is ready (expires{" "}
            {new Date(link.expiresAt).toLocaleString()}).
          </p>
          <a
            href={link.url}
            className="mt-2 inline-block break-all text-emerald-700 underline hover:no-underline dark:text-emerald-300"
          >
            {link.url}
          </a>
          <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/80">
            Up to 3 downloads, valid for 24 hours.
          </p>
        </div>
      ) : null}
    </article>
  );
}
