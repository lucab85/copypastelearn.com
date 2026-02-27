export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { DiscountLinkGenerator } from "@/components/admin/discount-link-generator";

export const metadata: Metadata = {
  title: "Discount Links — Admin",
  robots: { index: false },
};

export default function AdminDiscountsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Discount Links</h1>
      <p className="mb-8 text-muted-foreground">
        Generate shareable links with Stripe promotion codes pre-applied.
        Create promotion codes in your{" "}
        <a
          href="https://dashboard.stripe.com/coupons"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Stripe Dashboard
        </a>{" "}
        first, then paste the code here to generate a shareable URL.
      </p>
      <DiscountLinkGenerator />
    </div>
  );
}
