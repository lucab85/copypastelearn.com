import type { Metadata } from "next";
import Link from "next/link";
import { EmailLink } from "@/components/ui/email-link";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "CopyPasteLearn refund policy — when and how Open Empower B.V. refunds digital products, courses, and subscriptions under EU consumer law.",
  alternates: { canonical: "/refund-policy" },
  openGraph: {
    title: "Refund Policy — CopyPasteLearn",
    description:
      "When and how Open Empower B.V. refunds digital products, courses, and subscriptions under EU consumer law.",
    url: "/refund-policy",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

export default function RefundPolicyPage() {
  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Refund Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: May 2026 · Version 2026-05
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <p>
            This Refund Policy explains when and how{" "}
            <strong>Open Empower B.V.</strong>, operator of CopyPasteLearn,
            with registered office at De Boelelaan 471, 1082 RK Amsterdam,
            The Netherlands (VAT NL866954958B01), issues refunds for
            purchases made on{" "}
            <a href="https://www.copypastelearn.com">www.copypastelearn.com</a>.
            It supplements, and does not override, mandatory
            consumer-protection rights granted to EU consumers under
            Directive 2011/83/EU and applicable national law.
          </p>

          <h2>1. Statutory right of withdrawal (EU consumers)</h2>
          <p>
            If you are an EU consumer (a natural person purchasing for
            non-professional purposes), you normally have{" "}
            <strong>14 days</strong> from the day of purchase to withdraw from
            the contract without giving a reason, under Art. 9 of Directive
            2011/83/EU.
          </p>
          <p>
            <strong>Important — digital content exception.</strong> At
            checkout you expressly consent to the immediate performance of the
            contract and acknowledge that, once performance has begun, you
            lose your right of withdrawal in accordance with Art. 16(m) of the
            Directive. Performance is deemed to have begun when:
          </p>
          <ul>
            <li>you download any file from your order (ebooks, templates, playbooks), or</li>
            <li>you start streaming any video lesson from a course or subscription, or</li>
            <li>you launch any interactive lab session.</li>
          </ul>
          <p>
            If you have not started consuming the product within 14 days, you
            may still withdraw by emailing{" "}
            <EmailLink user="support" domain="copypastelearn.com" /> with your
            order ID and a written withdrawal statement.
          </p>

          <h2>2. One-time digital products (ebooks, templates, playbooks)</h2>
          <ul>
            <li>
              <strong>Full refund</strong> within 14 days if no file from the
              order has been downloaded.
            </li>
            <li>
              <strong>No refund</strong> once any file has been downloaded,
              except where required by mandatory law or if the file is
              materially defective and we are unable to provide a corrected
              version within a reasonable time.
            </li>
          </ul>

          <h2>3. Course bundles and one-time course purchases</h2>
          <ul>
            <li>
              <strong>Full refund</strong> within 14 days if no lesson video
              has been started and no lab has been launched.
            </li>
            <li>
              <strong>Pro-rata refund</strong> at our discretion if a
              documented technical issue prevented you from accessing more
              than 50% of the content during the first 30 days.
            </li>
          </ul>

          <h2>4. Subscriptions</h2>
          <ul>
            <li>
              You can <strong>cancel your subscription at any time</strong>{" "}
              from your account dashboard or by emailing support. Cancellation
              stops the next renewal; you retain access until the end of the
              period you have already paid for.
            </li>
            <li>
              We do <strong>not</strong> provide pro-rated refunds for unused
              portions of a paid period, except where required by law.
            </li>
            <li>
              <strong>First-period refund:</strong> if you cancel within 14
              days of your initial paid period and you have not viewed more
              than the first lesson of any course nor launched any paid lab,
              we will refund the period in full.
            </li>
          </ul>

          <h2>5. Renewals</h2>
          <p>
            Automatic renewals are charged to the payment method on file at
            the price displayed at the time of renewal. If a renewal is
            charged in error (for example, after a cancellation we failed to
            record), contact us within 30 days and we will refund the renewal
            in full.
          </p>

          <h2>6. Defective or undelivered products</h2>
          <p>
            If a product cannot be delivered, is materially defective, or does
            not match its description on the product page, you are entitled to
            repair, replacement, or a full refund regardless of whether you
            have started consuming it. Contact{" "}
            <EmailLink user="support" domain="copypastelearn.com" /> with your
            order ID and a description of the problem.
          </p>

          <h2>7. How to request a refund</h2>
          <p>
            Send an email to{" "}
            <EmailLink user="support" domain="copypastelearn.com" /> including:
          </p>
          <ol>
            <li>
              your order ID (visible in your purchase confirmation email and
              at <Link href="/library">/library</Link>);
            </li>
            <li>the email address associated with the purchase;</li>
            <li>the product or subscription you want refunded;</li>
            <li>a brief reason (optional but helpful).</li>
          </ol>

          <h2>8. Processing time and method</h2>
          <p>
            Approved refunds are issued to the{" "}
            <strong>original payment method</strong> within{" "}
            <strong>14 days</strong> of approval. Stripe usually returns funds
            within 5–10 business days, depending on your bank. We do not issue
            refunds in cash, store credit, or to a different payment method
            unless required by law.
          </p>

          <h2>9. Chargebacks</h2>
          <p>
            If you have a problem with a charge, please contact us first —
            most issues are resolved within a day. Initiating a chargeback
            without first attempting to contact us may result in account
            suspension while the dispute is being investigated.
          </p>

          <h2>10. Online dispute resolution</h2>
          <p>
            EU consumers may use the European Commission&apos;s ODR platform
            at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>

          <h2>11. Contact</h2>
          <p>
            Open Empower B.V. — Customer Support
            <br />
            De Boelelaan 471, 1082 RK Amsterdam, The Netherlands
            <br />
            VAT: NL866954958B01
            <br />
            Phone: +31 612255399
            <br />
            Email: <EmailLink user="support" domain="copypastelearn.com" />
          </p>
        </article>
      </div>
    </div>
  );
}
