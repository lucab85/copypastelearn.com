"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Show, SignUpButton, useAuth } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackBeginCheckout } from "@/lib/analytics";
import { priceFor, type Period, type ProPlan } from "@/lib/pricing";

interface PricingCardsProps {
  plan: ProPlan;
  courseCount: number;
  lessonCount: number;
  academyCount: number;
  /** The launch code and its discounts while it can be redeemed, else null. */
  offer: { code: string; annualPercent: number; monthlyPercent: number } | null;
  /** The visitor already has the Pro plan. */
  isPro: boolean;
}

const SUBSCRIBE_PARAM = "subscribe";

/**
 * Free, Pro and Business, rendered with the page so nothing waits for Clerk.
 * Clerk is only used for the payment: <CheckoutButton> opens its checkout
 * drawer (where the promo code is entered). A visitor without an account signs
 * up first and comes back with ?subscribe=<period>, which opens the checkout.
 */
export function PricingCards({ plan, courseCount, lessonCount, academyCount, offer, isPro }: PricingCardsProps) {
  const hasAnnual = plan.annualCents !== null;
  const [period, setPeriod] = useState<Period>(hasAnnual ? "annual" : "month");
  const [resume, setResume] = useState<Period | null>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const checkoutRef = useRef<HTMLButtonElement>(null);
  const resumed = useRef(false);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get(SUBSCRIBE_PARAM);
    if (wanted === "month" || (wanted === "annual" && hasAnnual)) {
      setPeriod(wanted);
      setResume(wanted);
    }
  }, [hasAnnual]);

  useEffect(() => {
    if (!resume || resumed.current || !isLoaded || !isSignedIn || isPro) return;
    resumed.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete(SUBSCRIBE_PARAM);
    window.history.replaceState(null, "", url);
    window.setTimeout(() => checkoutRef.current?.click(), 400);
  }, [resume, isLoaded, isSignedIn, isPro]);

  const price = priceFor(plan, period, offer ? (period === "annual" ? offer.annualPercent : offer.monthlyPercent) : null);
  const back = `/pricing?${SUBSCRIBE_PARAM}=${period}`;

  return (
    <div className="space-y-6">
      {hasAnnual && (
        <div className="flex justify-center">
          <div role="group" aria-label="Billing period" className="inline-flex rounded-full border bg-muted p-1 text-sm">
            {(["month", "annual"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-4 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "month" ? "Monthly" : "Annual"}
                {p === "annual" && priceFor(plan, "annual").saving && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {priceFor(plan, "annual").saving?.replace(" a year", "")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Free */}
        <section className="order-2 flex flex-col rounded-xl border bg-card p-6 md:order-1" aria-labelledby="plan-free">
          <h2 id="plan-free" className="text-lg font-semibold">Free</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try any course before you pay.</p>
          <p className="mt-6 text-4xl font-bold tracking-tight">$0</p>
          <p className="mt-1 text-sm text-muted-foreground">No account, no card</p>
          <Features
            items={[
              `The first lesson of all ${courseCount} courses`,
              "Watch it without signing up",
              "Articles and how-to guides",
            ]}
          />
          <Button variant="outline" className="mt-auto w-full" asChild>
            <Link href="/courses">Browse the free lessons</Link>
          </Button>
        </section>

        {/* Pro */}
        <section
          className="order-1 flex flex-col rounded-xl border-2 border-primary bg-card p-6 shadow-lg md:order-2"
          aria-labelledby="plan-pro"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="plan-pro" className="text-lg font-semibold">{plan.name}</h2>
            {isPro ? (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Your plan</span>
            ) : (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Every course</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Every lesson of every course, including new ones.</p>
          <p className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">{price.perMonth}</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{price.billed}</p>
          {offer && price.offer && !isPro && (
            <p className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-sm">
              <strong>{price.offer}</strong> with code{" "}
              <code className="rounded bg-background px-1.5 py-0.5 font-semibold">{offer.code}</code>
            </p>
          )}
          <Features
            items={[
              `All ${courseCount} courses, ${lessonCount} lessons`,
              `The ${academyCount}-course Agentic AI Academy`,
              "Code snippets and downloads",
              "Progress tracking",
              "Final assessments on selected courses",
              "New courses included, cancel anytime",
            ]}
          />
          <div className="mt-auto">
            {isPro ? (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/settings">Manage your subscription</Link>
              </Button>
            ) : (
              <>
                <Show when="signed-in">
                  <div onClickCapture={() => trackBeginCheckout()}>
                    <CheckoutButton planId={plan.id} planPeriod={period} newSubscriptionRedirectUrl="/dashboard?checkout=success">
                      <Button ref={checkoutRef} className="w-full">
                        Subscribe {period === "annual" ? "for a year" : "monthly"}
                      </Button>
                    </CheckoutButton>
                  </div>
                </Show>
                <Show when="signed-out">
                  <SignUpButton mode="modal" forceRedirectUrl={back} signInForceRedirectUrl={back}>
                    <Button className="w-full">Subscribe {period === "annual" ? "for a year" : "monthly"}</Button>
                  </SignUpButton>
                </Show>
              </>
            )}
            {offer && !isPro && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                At checkout, enter {offer.code} in the promo code field and choose Apply.
              </p>
            )}
          </div>
        </section>

        {/* Business */}
        <section className="order-3 flex flex-col rounded-xl border bg-card p-6" aria-labelledby="plan-business">
          <h2 id="plan-business" className="text-lg font-semibold">Business</h2>
          <p className="mt-1 text-sm text-muted-foreground">For teams, with invoicing.</p>
          <p className="mt-6 text-4xl font-bold tracking-tight">Custom</p>
          <p className="mt-1 text-sm text-muted-foreground">Volume discounts from 10 seats</p>
          <Features
            items={[
              "Everything in Pro, per seat",
              "SSO / SAML",
              "Team dashboard and usage reports",
              "Invoices and purchase orders",
              "Priority support",
            ]}
          />
          <Button variant="outline" className="mt-auto w-full" asChild>
            <Link href="/contact">Contact sales</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

function Features({ items }: { items: string[] }) {
  return (
    <ul className="my-6 space-y-2.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
