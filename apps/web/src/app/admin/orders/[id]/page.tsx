import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoneyAmount } from "@/lib/commerce/catalog";
import { Badge } from "@/components/ui/badge";
import { RefundForm, ReissueButton } from "./forms";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetail({ params }: PageProps) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true, bundle: true } },
      entitlements: { include: { product: true } },
      refunds: true,
    },
  });

  if (!order) notFound();

  const refundedSum = order.refunds
    .filter((r) => r.status !== "failed" && r.status !== "canceled")
    .reduce((s, r) => s + r.amount, 0);
  const remaining = order.totalAmount - refundedSum;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/orders"
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Orders
        </Link>
        <h1 className="mt-2 font-mono text-xl">{order.id}</h1>
        <div className="mt-1 flex items-center gap-2">
          <Badge>{order.status}</Badge>
          <span className="text-sm text-zinc-500">
            {order.createdAt.toLocaleString()}
          </span>
        </div>
      </div>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Buyer
          </h2>
          <p className="mt-1">{order.customer.email}</p>
          <p className="text-xs text-zinc-500">
            Country: {order.customer.country ?? "—"}
          </p>
          <p className="text-xs text-zinc-500">
            Stripe customer: {order.customer.stripeCustomerId ?? "—"}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Payment
          </h2>
          <p className="mt-1">
            {formatMoneyAmount(order.totalAmount)} {order.currency}
          </p>
          <p className="text-xs text-zinc-500">
            Tax: {formatMoneyAmount(order.taxAmount)} {order.currency}
          </p>
          <p className="text-xs text-zinc-500">
            Method: {order.paymentMethod}
          </p>
          <p className="text-xs text-zinc-500">
            Stripe session: {order.stripeCheckoutSessionId ?? "—"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Items
        </h2>
        <ul className="mt-2 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between p-3 text-sm">
              <span>
                {it.product?.title ?? it.bundle?.title ?? "?"}{" "}
                <span className="text-zinc-500">× {it.quantity}</span>
              </span>
              <span>
                {formatMoneyAmount(it.unitAmount * it.quantity)} {it.currency}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Entitlements
        </h2>
        <ul className="mt-2 space-y-3">
          {order.entitlements.map((ent) => (
            <li
              key={ent.id}
              className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{ent.product.title}</strong>{" "}
                  <Badge variant="outline">{ent.status}</Badge>
                </span>
                <ReissueButton entitlementId={ent.id} />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Granted {ent.grantedAt.toLocaleString()} ·{" "}
                {ent.firstAccessedAt
                  ? `first accessed ${ent.firstAccessedAt.toLocaleString()}`
                  : "never accessed"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Refunds
        </h2>
        {order.refunds.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">None yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {order.refunds.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  {formatMoneyAmount(r.amount)} {r.currency} ·{" "}
                  <Badge variant="outline">{r.status}</Badge>
                </span>
                <span className="text-xs text-zinc-500">
                  {r.createdAt.toLocaleString()} · {r.reason ?? ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="font-semibold">Issue a refund</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Remaining refundable: {formatMoneyAmount(remaining)} {order.currency}
          </p>
          <div className="mt-3">
            <RefundForm
              orderId={order.id}
              remainingMinor={remaining}
              currency={order.currency}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
