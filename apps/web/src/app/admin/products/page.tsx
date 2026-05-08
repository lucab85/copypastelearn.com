import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      files: { where: { isCurrent: true }, take: 1 },
      _count: { select: { files: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </div>

      {!products.length ? (
        <p className="text-muted-foreground">
          No products yet. Create your first one or run the commerce seed.
        </p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Brand</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">File</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.title}</div>
                    <code className="text-xs text-muted-foreground">{p.slug}</code>
                  </td>
                  <td className="px-4 py-2">{p.brand}</td>
                  <td className="px-4 py-2">{p.productType}</td>
                  <td className="px-4 py-2 text-right">
                    €{formatMoneyAmount(p.priceAmount)} {p.currency}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={p.status === "PUBLISHED" ? "default" : "secondary"}
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    {p.files[0] ? (
                      <span>v{p.files[0].version}</span>
                    ) : (
                      <span className="text-amber-600">missing</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/products/${p.id}`}>Edit</Link>
                    </Button>
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
