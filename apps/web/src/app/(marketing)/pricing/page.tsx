import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { SUBSCRIPTION_PRICE_EUR } from "@copypastelearn/shared";
import { getSubscriptionStatus } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for CopyPasteLearn. One plan, everything included — courses, labs, and certificates.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — CopyPasteLearn",
    description:
      "One plan. Everything included. No hidden fees. Start learning IT automation today.",
  },
};

const benefits = [
  "Unlimited access to all video lessons",
  "Interactive hands-on labs with real containers",
  "Copy-pasteable code snippets for every lesson",
  "Downloadable resources & cheat sheets",
  "Progress tracking & completion certificates",
  "New content added regularly",
];

export default async function PricingPage() {
  const { userId } = await auth();
  const subscription = userId ? await getSubscriptionStatus() : null;
  const isSubscribed = subscription?.isSubscribed ?? false;

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CopyPasteLearn Pro Monthly",
    description:
      "Unlimited access to all video lessons, interactive hands-on labs, code snippets, and progress tracking.",
    url: `${siteUrl}/pricing`,
    brand: {
      "@type": "Organization",
      name: "CopyPasteLearn",
    },
    offers: {
      "@type": "Offer",
      price: SUBSCRIPTION_PRICE_EUR,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`,
      priceValidUntil: "2026-12-31",
      seller: {
        "@type": "Organization",
        name: "CopyPasteLearn",
      },
    },
  };

  const pricingFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much does CopyPasteLearn cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `CopyPasteLearn Pro costs €${SUBSCRIPTION_PRICE_EUR}/month. This includes unlimited access to all courses, interactive labs, code snippets, and progress tracking.`,
        },
      },
      {
        "@type": "Question",
        name: "Can I try CopyPasteLearn for free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! The first lesson of every course is completely free. No credit card required to get started.",
        },
      },
      {
        "@type": "Question",
        name: "Can I cancel my subscription anytime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. There are no long-term commitments. You can cancel your subscription at any time from your settings page.",
        },
      },
      {
        "@type": "Question",
        name: "What's included in the Pro plan?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Pro plan includes unlimited access to all video lessons, interactive hands-on labs with real containers, copy-pasteable code snippets, downloadable resources, progress tracking, and completion certificates.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.",
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
      />
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          One plan. Everything included. No hidden fees.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="mx-auto mt-12 max-w-md">
        <Card className="relative overflow-hidden border-primary/50">
          <div className="absolute right-4 top-4">
            <Badge>Most Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro Monthly</CardTitle>
            <CardDescription>
              Everything you need to learn by doing
            </CardDescription>
            <div className="mt-4">
              <span className="text-5xl font-bold">€{SUBSCRIPTION_PRICE_EUR}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {isSubscribed ? (
              <Button asChild size="lg" className="w-full" variant="outline">
                <Link href="/settings">You&apos;re subscribed — Manage</Link>
              </Button>
            ) : userId ? (
              <CheckoutButton size="lg" className="w-full">
                Subscribe Now — €{SUBSCRIPTION_PRICE_EUR}/mo
              </CheckoutButton>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

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
              a: "All major credit and debit cards (Visa, Mastercard, American Express) via Stripe.",
            },
            {
              q: "Do I get access to new courses?",
              a: "Yes. Your subscription includes all current and future courses and labs.",
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-lg border p-5">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust signals */}
      <div className="mx-auto mt-16 max-w-2xl text-center">
        <p className="text-sm text-muted-foreground">
          Cancel anytime. No long-term commitment. First lesson of every course
          is always free.
        </p>
      </div>
    </div>
  );
}
