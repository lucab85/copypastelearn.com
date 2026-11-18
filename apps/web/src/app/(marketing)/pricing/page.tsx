export const dynamic = "force-dynamic";

import { PricingTable } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { labsAvailable } from "@/lib/labs-availability";
import { getCurrentUser } from "@/lib/auth";
import { hasLegacySubscription } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing Plans & Subscriptions",
  description:
    "Simple, transparent pricing for CopyPasteLearn. One plan, everything included — all courses and available final assessments.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    url: "/pricing",
    type: "website",
    title: "Pricing — CopyPasteLearn",
    description:
      "One plan. Everything included. No hidden fees. Start learning IT automation today.",
  },
};

const businessBenefits = [
  "Everything in Pro, plus:",
  "SSO / SAML integration",
  "Centralized team management dashboard",
  "Usage analytics & reporting per seat",
  "Priority support with SLA",
  "Custom invoicing & procurement-friendly billing",
  "Volume discounts for 10+ seats",
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const hasLegacyPlan = user ? await hasLegacySubscription(user.id) : false;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <PageEventTracker event="view_pricing" />
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-3 text-muted-foreground">
          The first lesson of every course is free. Subscribe to unlock every lesson and available final assessments.
        </p>
      </header>
      {!labsAvailable && (
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Interactive labs are temporarily unavailable.
        </p>
      )}
      {hasLegacyPlan ? (
        <div className="mx-auto max-w-lg space-y-4 rounded-lg border p-6 text-center">
          <p>Your existing CopyPasteLearn subscription is active.</p>
          <Button asChild><Link href="/settings">Manage subscription</Link></Button>
        </div>
      ) : (
        <PricingTable for="user" newSubscriptionRedirectUrl="/dashboard" />
      )}
      <section className="mx-auto mt-16 max-w-xl rounded-lg border p-6">
        <h2 className="text-2xl font-semibold">Business</h2>
        <p className="mt-2 text-sm text-muted-foreground">Custom pricing for teams.</p>
        <ul className="my-5 space-y-3">
          {businessBenefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>
        <Button variant="outline" asChild><Link href="/contact">Contact sales</Link></Button>
      </section>
      {/* FAQ */}
      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "Can I try CopyPasteLearn for free?",
              a: "Yes! The first lesson of every course is completely free. No credit card required.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Absolutely. No long-term commitment — cancel from your settings page whenever you want.",
            },
            {
              q: "What payment methods do you accept?",
              a: "All major credit and debit cards (Visa, Mastercard, American Express) through Clerk Billing.",
            },
            {
              q: "Do I get access to new courses?",
              a: "Yes. Your subscription includes all current and future courses.",
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-lg border p-5">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
