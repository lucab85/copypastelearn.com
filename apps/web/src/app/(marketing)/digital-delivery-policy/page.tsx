import type { Metadata } from "next";
import Link from "next/link";
import { EmailLink } from "@/components/ui/email-link";

export const metadata: Metadata = {
  title: "Digital Delivery Policy",
  description:
    "CopyPasteLearn digital delivery policy — how and when Open Empower B.V. delivers ebooks, templates, courses, and labs after purchase.",
  alternates: { canonical: "/digital-delivery-policy" },
  openGraph: {
    title: "Digital Delivery Policy — CopyPasteLearn",
    description:
      "How and when Open Empower B.V. delivers ebooks, templates, courses, and labs after purchase.",
    url: "/digital-delivery-policy",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

export default function DigitalDeliveryPolicyPage() {
  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Digital Delivery Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: May 2026 · Version 2026-05
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <p>
            This Digital Delivery Policy describes how and when you receive
            the digital products and services you buy from{" "}
            <strong>Open Empower B.V.</strong>, operator of CopyPasteLearn,
            with registered office at De Boelelaan 471, 1082 RK Amsterdam,
            The Netherlands (VAT NL866954958B01), on{" "}
            <a href="https://www.copypastelearn.com">www.copypastelearn.com</a>.
          </p>

          <h2>1. Products covered</h2>
          <ul>
            <li>
              <strong>Ebooks, templates, and playbooks</strong> — delivered as
              downloadable files (PDF or archives of source files).
            </li>
            <li>
              <strong>Video courses</strong> — streamed on demand inside your{" "}
              <Link href="/library">/library</Link> dashboard.
            </li>
            <li>
              <strong>Interactive labs</strong> — ephemeral, browser-accessible
              sandbox environments.
            </li>
            <li>
              <strong>Subscriptions</strong> — recurring access to a curated
              catalog of courses and labs.
            </li>
          </ul>

          <h2>2. When delivery happens</h2>
          <p>
            Delivery is <strong>immediate</strong>. As soon as Stripe confirms
            a successful payment (typically within seconds), our webhook
            provisions your entitlement. You will receive:
          </p>
          <ol>
            <li>an order confirmation email with your invoice attached, and</li>
            <li>
              a separate email with a time-limited access link for each file
              in the order.
            </li>
          </ol>
          <p>
            Your purchases also appear instantly in{" "}
            <Link href="/library">/library</Link> once you sign in with the
            email used at checkout.
          </p>

          <h2>3. Time-limited access links</h2>
          <p>
            Files are delivered through signed, time-limited URLs to protect
            both you and us against abuse:
          </p>
          <ul>
            <li>
              <strong>Validity:</strong> each link expires{" "}
              <strong>24 hours</strong> after it is generated.
            </li>
            <li>
              <strong>Download cap:</strong> each link allows up to{" "}
              <strong>3 successful downloads</strong>.
            </li>
            <li>
              <strong>Re-issuing:</strong> you can mint a fresh link at any
              time from <Link href="/library">/library</Link>. The number of
              fresh links you can mint is not artificially limited; we monitor
              only for sharing patterns that suggest the link is being
              redistributed.
            </li>
          </ul>
          <p>
            If a link expires before you finish downloading, simply visit{" "}
            <Link href="/library">/library</Link> and request a new one.
          </p>

          <h2>4. Streaming access (courses and labs)</h2>
          <p>
            Course videos are streamed through Mux and are tied to your
            authenticated account. They cannot be downloaded; we provide
            unlimited replays for as long as your entitlement or subscription
            remains active.
          </p>
          <p>
            Lab environments are ephemeral. When you launch a lab, we
            provision a sandboxed container or virtual machine for a limited
            duration (see the course page for per-lab caps). Anything you
            write inside the lab is destroyed at session end.{" "}
            <strong>
              Do not store personal data, secrets, or production credentials
              inside a lab.
            </strong>
          </p>

          <h2>5. Lifetime updates</h2>
          <p>
            Products marketed with &quot;lifetime updates&quot; entitle you to
            all future revisions of the same product for as long as we
            continue to maintain it. Updates appear in{" "}
            <Link href="/library">/library</Link> and we email you when a new
            version is published.
          </p>
          <p>
            &quot;Lifetime&quot; refers to the lifetime of the product, not
            the buyer; we may discontinue an individual product, but if we do
            we will give 90 days&apos; notice and let you download the final
            version before access ends.
          </p>

          <h2>6. Compatibility and system requirements</h2>
          <ul>
            <li>
              <strong>Ebooks:</strong> PDF (any modern PDF reader).
            </li>
            <li>
              <strong>Templates / playbooks:</strong> require the tool
              documented on the product page (Ansible, Terraform, Kubernetes,
              etc.).
            </li>
            <li>
              <strong>Video:</strong> any modern browser; mobile browsers are
              supported.
            </li>
            <li>
              <strong>Labs:</strong> desktop browser recommended; minimum 1
              Mbps connection.
            </li>
          </ul>
          <p>
            We do not refund purchases for incompatibility that was disclosed
            on the product page before checkout. If you are unsure whether a
            product fits your environment, contact us <strong>before</strong>{" "}
            buying.
          </p>

          <h2>7. Failed or missing delivery</h2>
          <p>
            If you have not received your order confirmation within 30
            minutes:
          </p>
          <ol>
            <li>check your spam / promotions folder;</li>
            <li>
              sign in to <Link href="/library">/library</Link> using the
              email used at checkout (entitlements provision in real-time);
            </li>
            <li>
              if the order is still missing, email{" "}
              <EmailLink user="support" domain="copypastelearn.com" /> with
              your order ID.
            </li>
          </ol>
          <p>
            We will deliver or fully refund any undelivered order reported
            within <strong>30 days</strong> of the original charge.
          </p>

          <h2>8. Restrictions and license</h2>
          <p>
            All deliveries are licensed for personal or single-organization
            use. Resale, sublicensing, or republication of the original files
            is not permitted; using the included code, templates, and snippets
            inside your own projects (including paid client work) is
            permitted. The full license terms are in our{" "}
            <Link href="/terms">Terms of Service</Link>.
          </p>

          <h2>9. Customer responsibilities</h2>
          <ul>
            <li>
              Keep your account email up to date so delivery and renewal
              notices reach you.
            </li>
            <li>Do not share access links or account credentials.</li>
            <li>
              Back up the files you download; we keep them available in{" "}
              <Link href="/library">/library</Link>, but you are responsible
              for your local copies.
            </li>
          </ul>

          <h2>10. Contact</h2>
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
