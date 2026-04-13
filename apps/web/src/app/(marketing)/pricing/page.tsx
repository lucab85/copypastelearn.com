export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { PricingCheckoutButton } from "@/components/pricing-checkout-button";
import { DiscountBanner } from "@/components/discount-banner";
import { CouponInput } from "@/components/coupon-input";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building2, Star, Quote } from "lucide-react";
import { SUBSCRIPTION_PRICE_EUR } from "@copypastelearn/shared";
import { getSubscriptionStatus } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing Plans & Subscriptions",
  description:
    "Simple, transparent pricing for CopyPasteLearn. One plan, everything included — all courses, hands-on labs, and certificates of completion.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    url: "/pricing",
    type: "website",
    title: "Pricing — CopyPasteLearn",
    description:
      "One plan. Everything included. No hidden fees. Start learning IT automation today.",
  },
};

const ANNUAL_PRICE_EUR = 290; // Save €58/year (2 months free)
const MONTHLY_EQUIVALENT = Math.round(ANNUAL_PRICE_EUR / 12);

const benefits = [
  "Unlimited access to all video lessons",
  "Interactive hands-on labs with real containers",
  "Copy-pasteable code snippets for every lesson",
  "Downloadable resources & cheat sheets",
  "Progress tracking & completion certificates",
  "New content added regularly",
];

const businessBenefits = [
  "Everything in Pro, plus:",
  "SSO / SAML integration",
  "Centralized team management dashboard",
  "Usage analytics & reporting per seat",
  "Priority support with SLA",
  "Custom invoicing & procurement-friendly billing",
  "Volume discounts for 10+ seats",
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
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
    image: `${siteUrl}/opengraph-image`,
    brand: {
      "@type": "Brand",
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
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "EUR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "EARTH",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "d",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "EARTH",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnNotPermitted",
        merchantReturnDays: 0,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "24",
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Marco R." },
        datePublished: "2026-01-15",
        reviewBody:
          "The hands-on labs are a game-changer. I finally understand Docker after years of copy-pasting commands without knowing why.",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Sarah K." },
        datePublished: "2026-02-03",
        reviewBody:
          "Great value for the price. The Ansible course alone saved me hours of trial and error at work.",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "James T." },
        datePublished: "2026-01-28",
        reviewBody:
          "Clean explanations and real-world examples. The interactive labs make it easy to practice without setting up anything locally.",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "4",
          bestRating: "5",
        },
      },
    ],
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

      {/* Discount Banner */}
      <PageEventTracker event="view_pricing" />
      <Suspense>
        <DiscountBanner />
      </Suspense>

      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          One plan. Everything included. No hidden fees.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
        {/* Pro Monthly */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl">Pro Monthly</CardTitle>
            <CardDescription>
              Flexible month-to-month access
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
              <Suspense>
                <PricingCheckoutButton size="lg" className="w-full">
                  Subscribe — €{SUBSCRIPTION_PRICE_EUR}/mo
                </PricingCheckoutButton>
              </Suspense>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href={code ? `/sign-up?redirect_url=/pricing?code=${encodeURIComponent(code)}` : "/sign-up"}>Get Started</Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Pro Annual — Best Value */}
        <Card className="relative overflow-hidden border-primary/50">
          <div className="absolute right-4 top-4">
            <Badge>Best Value</Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro Annual</CardTitle>
            <CardDescription>
              Save 2 months — pay once per year
            </CardDescription>
            <div className="mt-4">
              <span className="text-5xl font-bold">€{ANNUAL_PRICE_EUR}</span>
              <span className="text-muted-foreground">/year</span>
            </div>
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              €{MONTHLY_EQUIVALENT}/mo — Save €{SUBSCRIPTION_PRICE_EUR * 12 - ANNUAL_PRICE_EUR}/year
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[...benefits, "2 months free vs monthly"].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className={`text-sm ${i === benefits.length ? "font-semibold text-green-700 dark:text-green-400" : ""}`}>{benefit}</span>
                </li>
              ))}
            </ul>
            {/* Value framing */}
            <div className="mt-6 rounded-lg bg-primary/5 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                💡 Real sandboxes + video lessons + certificates + all future courses for less than the price of a coffee per day.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            {isSubscribed ? (
              <Button asChild size="lg" className="w-full" variant="outline">
                <Link href="/settings">You&apos;re subscribed — Manage</Link>
              </Button>
            ) : userId ? (
              <Suspense>
                <PricingCheckoutButton size="lg" className="w-full" plan="annual">
                  Subscribe — €{ANNUAL_PRICE_EUR}/yr (Save €{SUBSCRIPTION_PRICE_EUR * 12 - ANNUAL_PRICE_EUR})
                </PricingCheckoutButton>
              </Suspense>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href={code ? `/sign-up?redirect_url=/pricing?code=${encodeURIComponent(code)}` : "/sign-up"}>Get Started — Save €{SUBSCRIPTION_PRICE_EUR * 12 - ANNUAL_PRICE_EUR}</Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Business Plan */}
        <Card className="relative overflow-hidden">
          <div className="absolute right-4 top-4">
            <Badge variant="secondary">Enterprise</Badge>
          </div>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-2xl">Business</CardTitle>
            </div>
            <CardDescription>
              SSO integration &amp; team management for your company
            </CardDescription>
            <div className="mt-4">
              <span className="text-5xl font-bold">Custom</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {businessBenefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full" variant="outline">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Who this is for */}
      <div className="mx-auto mt-16 grid max-w-3xl gap-8 sm:grid-cols-2">
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-6">
          <h3 className="mb-4 font-semibold text-green-700 dark:text-green-400">✓ Great fit if you&hellip;</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Want hands-on practice, not just theory</li>
            <li>• Are a developer moving into DevOps or SRE</li>
            <li>• Need to automate infrastructure at work</li>
            <li>• Learn best by doing in real environments</li>
            <li>• Want one subscription for all topics</li>
          </ul>
        </div>
        <div className="rounded-lg border border-muted p-6">
          <h3 className="mb-4 font-semibold text-muted-foreground">✗ Probably not for you if&hellip;</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• You only need certification exam prep</li>
            <li>• You prefer instructor-led classroom training</li>
            <li>• You need enterprise SSO or team management</li>
            <li>• You&apos;re looking for front-end/UI courses</li>
          </ul>
        </div>
      </div>

      {/* Learner outcomes */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">What learners achieve</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              name: "Marco R.",
              role: "DevOps Engineer",
              text: "The hands-on labs made Ansible click for me in a way video-only courses never could.",
              outcome: "Automated server provisioning in 1 week",
            },
            {
              name: "Sarah K.",
              role: "Backend Developer",
              text: "Finally a platform that lets me practice Docker commands in a real environment.",
              outcome: "Containerized first app in 3 days",
            },
            {
              name: "James L.",
              role: "SRE",
              text: "I went from zero to deploying containerized services in production.",
              outcome: "Production deployment in 2 weeks",
            },
          ].map((t) => (
            <div key={t.name} className="rounded-lg border p-5">
              <div className="mb-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <Quote className="mb-1 h-4 w-4 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t.text}</p>
              <div className="mt-3 rounded-md bg-primary/5 px-3 py-1.5">
                <p className="text-xs font-semibold text-primary">{t.outcome}</p>
              </div>
              <div className="mt-3 text-xs">
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground"> · {t.role}</span>
              </div>
            </div>
          ))}
        </div>
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

      {/* Coupon Code Input */}
      <Suspense>
        <CouponInput />
      </Suspense>

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
