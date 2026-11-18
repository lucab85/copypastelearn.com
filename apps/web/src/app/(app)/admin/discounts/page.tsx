export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Discounts — Admin",
  robots: { index: false },
};

export default function AdminDiscountsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Subscription Discounts</h1>
      <p className="mb-8 text-muted-foreground">
        Manage subscription discounts in the{" "}
        <a
          href="https://dashboard.clerk.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Clerk Dashboard
        </a>.
      </p>
    </div>
  );
}
