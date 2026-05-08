import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductStatusForm, ProductFileUploadForm } from "./forms";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      files: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) notFound();

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <code className="text-sm text-muted-foreground">{product.slug}</code>
        </div>
        <Badge variant={product.status === "PUBLISHED" ? "default" : "secondary"}>
          {product.status}
        </Badge>
      </div>

      <section className="rounded-md border p-4 space-y-2">
        <h2 className="font-semibold">Catalog</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Brand</dt>
          <dd>{product.brand}</dd>
          <dt className="text-muted-foreground">Type</dt>
          <dd>{product.productType}</dd>
          <dt className="text-muted-foreground">Price</dt>
          <dd>
            €{formatMoneyAmount(product.priceAmount)} {product.currency}
          </dd>
          <dt className="text-muted-foreground">Stripe price</dt>
          <dd>
            <code className="text-xs">{product.stripePriceId ?? "—"}</code>
          </dd>
        </dl>
      </section>

      <section className="rounded-md border p-4 space-y-3">
        <h2 className="font-semibold">Status</h2>
        <ProductStatusForm productId={product.id} status={product.status} />
      </section>

      <section className="rounded-md border p-4 space-y-3">
        <h2 className="font-semibold">Files</h2>
        {!product.files.length ? (
          <p className="text-sm text-muted-foreground">
            No files uploaded. The product cannot be published until at least
            one file exists.
          </p>
        ) : (
          <ul className="text-sm space-y-1">
            {product.files.map((f) => (
              <li key={f.id} className="flex items-center justify-between">
                <span>
                  v{f.version}
                  {f.isCurrent ? (
                    <Badge variant="outline" className="ml-2">
                      current
                    </Badge>
                  ) : null}
                </span>
                <span className="text-muted-foreground">
                  {(f.sizeBytes / 1024).toFixed(1)} KB · {f.contentType}
                </span>
              </li>
            ))}
          </ul>
        )}
        <ProductFileUploadForm productId={product.id} />
      </section>

      <Button asChild variant="outline">
        <Link href="/admin/products">← Back to products</Link>
      </Button>
    </div>
  );
}
