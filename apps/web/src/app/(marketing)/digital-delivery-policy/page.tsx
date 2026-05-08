import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCurrentPolicy, POLICY_SLUGS } from "@/lib/commerce/policies";

export const metadata: Metadata = {
  title: "Digital Delivery Policy",
  description:
    "How CopyPasteLearn delivers digital products — instant delivery, access link expiry, and download caps.",
  alternates: { canonical: "/digital-delivery-policy" },
  robots: { index: true, follow: true },
};

export const revalidate = 600;

export default async function DigitalDeliveryPolicyPage() {
  const policy = await loadCurrentPolicy(POLICY_SLUGS.digitalDelivery);
  if (!policy) notFound();

  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Digital Delivery Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Version {policy.version} · Published{" "}
            {policy.publishedAt.toISOString().slice(0, 10)}
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert whitespace-pre-wrap">
          {policy.bodyMd}
        </article>
      </div>
    </div>
  );
}
