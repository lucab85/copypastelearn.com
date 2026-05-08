import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Checkout cancelled</h1>
      <p className="mt-4 text-muted-foreground">
        No charge was made. You can resume any time from the product page.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">Back to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
