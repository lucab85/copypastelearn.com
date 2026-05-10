import Link from "next/link";
import type { Product } from "@prisma/client";
import { ArrowRight, Download } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyAmount } from "@/lib/commerce/catalog";
import { ProductCover } from "./ProductCover";

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
  const href = `/products/${product.slug}`;
  const blurb = product.subtitle ?? product.description.slice(0, 160);

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-xl hover:shadow-primary/5">
      <Link href={href} className="absolute inset-0 z-10" aria-label={product.title}>
        <span className="sr-only">{product.title}</span>
      </Link>

      <div className="overflow-hidden">
        <div className="transition-transform duration-500 group-hover:scale-[1.04]">
          <ProductCover
            title={product.title}
            brand={product.brand}
            productType={product.productType}
            imageUrl={product.imageUrl}
            aspect="card"
          />
        </div>
      </div>

      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-lg leading-snug transition-colors group-hover:text-primary">
          {product.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-4 text-sm text-muted-foreground">
        <p className="line-clamp-3">{blurb}</p>
      </CardContent>

      <CardFooter className="flex items-end justify-between border-t bg-muted/20 pt-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            One-time
          </div>
          <div className="text-xl font-bold tracking-tight">
            €{formatMoneyAmount(product.priceAmount)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {product.currency}
            </span>
          </div>
          <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Download className="h-3 w-3" aria-hidden /> Instant download
          </div>
        </div>
        <span className="relative z-20 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          View
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </CardFooter>
    </Card>
  );
}
