"use client";

import { useState, useTransition } from "react";
import { refundOrder, reissueAccess } from "@/server/actions/admin/orders";

export function RefundForm({
  orderId,
  remainingMinor,
  currency,
}: {
  orderId: string;
  remainingMinor: number;
  currency: string;
}) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState((remainingMinor / 100).toFixed(2));
  const [reason, setReason] = useState("");
  const [revoke, setRevoke] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const minor = Math.round(Number(amount) * 100);
    if (!minor || minor <= 0) {
      setErr("Amount must be greater than zero.");
      return;
    }
    startTransition(async () => {
      const res = await refundOrder({
        orderId,
        amountMinor: minor,
        reason: reason || undefined,
        revokeAccess: revoke,
      });
      if (res.ok) {
        setMsg(
          `Refund issued (${(res.amountMinor / 100).toFixed(2)} ${currency}, status: ${res.status}).`,
        );
      } else {
        setErr(res.message);
      }
    });
  }

  if (remainingMinor <= 0) {
    return <p className="text-sm text-zinc-500">Order is already fully refunded.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Amount ({currency})</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Reason (optional)</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="customer_request, duplicate, …"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={revoke}
          onChange={(e) => setRevoke(e.target.checked)}
        />
        <span>
          Revoke access for entitlements that have already been downloaded
          (default: keep access on post-download refunds)
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Refunding…" : "Issue refund"}
      </button>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
    </form>
  );
}

export function ReissueButton({ entitlementId }: { entitlementId: string }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setErr(null);
            setLink(null);
            const res = await reissueAccess({ entitlementId });
            if (res.ok) setLink(res.downloadUrl);
            else setErr(res.message);
          })
        }
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Issuing…" : "Reissue access link"}
      </button>
      {link ? (
        <a
          href={link}
          className="block break-all text-xs text-emerald-700 underline dark:text-emerald-400"
        >
          {link}
        </a>
      ) : null}
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
