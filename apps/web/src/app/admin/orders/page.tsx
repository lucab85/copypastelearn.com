import Link from "next/link";
import { listRecentOrders, findOrderByEmail } from "@/server/queries/orders";
import { formatMoneyAmount } from "@/lib/commerce/catalog";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAID: "default",
  PENDING: "secondary",
  REFUNDED: "destructive",
  PARTIALLY_REFUNDED: "destructive",
  FAILED: "outline",
  EXPIRED: "outline",
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const orders =
    q && q.includes("@")
      ? await findOrderByEmail(q)
      : await listRecentOrders(50);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <form className="flex items-center gap-2" action="/admin/orders">
          <input
            type="email"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Look up by buyer email"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            Search
          </button>
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders match.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Buyer</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      {o.id.slice(0, 12)}…
                    </Link>
                  </td>
                  <td className="px-4 py-2">{o.customer?.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    {o.items
                      .map((it) => it.product?.title ?? it.bundle?.title ?? "?")
                      .join(", ")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatMoneyAmount(o.totalAmount)} {o.currency}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[o.status] ?? "outline"}>
                      {o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {o.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
