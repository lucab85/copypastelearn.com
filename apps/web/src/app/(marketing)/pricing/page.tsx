export const dynamic = "force-dynamic";

import { PricingTable } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";
import { Button } from "@/components/ui/button";
import { labsAvailable } from "@/lib/labs-availability";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { hasLegacySubscription } from "@/lib/billing";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { getProPlan } from "@/server/queries/pro-plan";
import { getPublicCourses } from "@/server/queries/public-courses";
import { ACADEMY_COURSES } from "@/lib/academy";
import { LAUNCH_OFFER, launchOfferActive } from "@/lib/launch-offer";

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

export default async function PricingPage() {
  const user = await getCurrentUser();
  const hasLegacyPlan = user ? await hasLegacySubscription(user.id) : false;
  const isPro = user ? (await auth()).has({ plan: "pro" }) : false;
  const [plan, courses] = await Promise.all([getProPlan(), getPublicCourses()]);
  const lessonCount = courses.reduce((sum, c) => sum + c.lessonCount, 0);
  const academyCount = ACADEMY_COURSES.filter((a) => courses.some((c) => c.slug === a.slug)).length;
  const offer = launchOfferActive()
    ? { code: LAUNCH_OFFER.code, annualPercent: LAUNCH_OFFER.annualPercent, monthlyPercent: LAUNCH_OFFER.monthlyPercent }
    : null;

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
      ) : plan ? (
        <PricingCards
          plan={plan}
          courseCount={courses.length}
          lessonCount={lessonCount}
          academyCount={academyCount}
          offer={offer}
          isPro={isPro}
        />
      ) : (
        // Clerk Billing could not be read on the server: Clerk's own table.
        <PricingTable for="user" newSubscriptionRedirectUrl="/dashboard?checkout=success" />
      )}
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
        Cancel anytime from your account settings. The first payment can be refunded within 14 days, under the
        conditions of the <Link href="/refund-policy" className="underline underline-offset-2">refund policy</Link>.
        Payments are handled by Clerk Billing.
      </p>
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
