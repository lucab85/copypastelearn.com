import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="container mx-auto px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
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
            <Button asChild size="lg" className="w-full">
              {userId ? (
                <Link href="/dashboard">Go to Dashboard</Link>
              ) : (
                <Link href="/sign-up">Get Started</Link>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* FAQ / Trust signals */}
      <div className="mx-auto mt-16 max-w-2xl text-center">
        <p className="text-sm text-muted-foreground">
          Cancel anytime. No long-term commitment. First lesson of every course
          is always free.
        </p>
      </div>
    </div>
  );
}
