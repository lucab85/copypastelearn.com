"use client";

import { useState, useTransition } from "react";
import {
  upsertPolicyDraft,
  publishPolicy,
} from "@/server/actions/admin/policies";

const SLUG_OPTIONS = [
  { value: "terms", label: "Terms of service" },
  { value: "privacy", label: "Privacy policy" },
  { value: "refund-policy", label: "Refund policy" },
  { value: "digital-delivery-policy", label: "Digital delivery policy" },
];

export function PolicyEditor() {
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState("refund-policy");
  const [version, setVersion] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function save(publish: boolean) {
    setMsg(null);
    setErr(null);
    if (!version.trim()) {
      setErr("Version is required (e.g. 2026-05).");
      return;
    }
    if (bodyMd.trim().length < 10) {
      setErr("Body is too short.");
      return;
    }
    startTransition(async () => {
      const draft = await upsertPolicyDraft({ slug, version, bodyMd });
      if (!draft.ok) {
        setErr(draft.message);
        return;
      }
      if (publish) {
        const pub = await publishPolicy({ slug, version });
        if (!pub.ok) {
          setErr(pub.message);
          return;
        }
        setMsg(`Published ${slug}@${version}.`);
      } else {
        setMsg(`Saved draft ${slug}@${version}.`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Policy</span>
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {SLUG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Version</span>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="2026-05"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">Markdown body</span>
        <textarea
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          rows={18}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => save(false)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {pending ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => save(true)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Publishing…" : "Save & publish"}
        </button>
      </div>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
    </div>
  );
}
