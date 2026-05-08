import Link from "next/link";
import Image from "next/image";
import type { Product } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

interface ProductCardProps {
  product: Pick<
    Product,
    | "slug"
    | "title"
    | "subtitle"
    | "description"
    | "priceAmount"
    | "currency"
    | "productType"
    | "brand"
    | "imageUrl"
  >;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {product.imageUrl ? (
        <div className="relative h-40 bg-muted">
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{product.productType}</Badge>
          <Badge variant="outline">{product.brand}</Badge>
        </div>
        <CardTitle className="text-lg">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-1">
        {product.subtitle ?? product.description.slice(0, 160)}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="font-semibold">
          €{formatMoneyAmount(product.priceAmount)} {product.currency}
        </span>
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View →
        </Link>
      </CardFooter>
    </Card>
  );
}
