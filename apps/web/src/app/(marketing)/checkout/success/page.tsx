import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Order received",
  description: "Your CopyPasteLearn purchase is being processed.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;
  const order = session_id
    ? await db.order.findUnique({
        where: { stripeCheckoutSessionId: session_id },
        include: { items: true, customer: true },
      })
    : null;

  return (
    <div className="container mx-auto max-w-xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Thank you!</h1>

      {order ? (
        <>
          <p className="mt-4 text-muted-foreground">
            Order <code className="font-mono">{order.id}</code> is confirmed.
            We&apos;ve sent the access link to{" "}
            <strong>{order.customer.email}</strong>.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/library">Open my library</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Back to homepage</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-muted-foreground">
            Your payment is being processed. We&apos;ll email your access link
            within a few seconds. If it doesn&apos;t arrive, sign in to your
            library to access it.
          </p>
          {/* Lightweight client poll — refreshes the page until order resolves. */}
          <meta httpEquiv="refresh" content="3" />
          <div className="mt-8">
            <Button asChild size="lg" variant="outline">
              <Link href="/library">Open my library</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
