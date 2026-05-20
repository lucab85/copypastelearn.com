import type { Metadata } from "next";
import Link from "next/link";
import { EmailLink } from "@/components/ui/email-link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "CopyPasteLearn terms of service — the legal agreement between you and Open Empower B.V. governing accounts, subscriptions, purchases, and lab usage.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service — CopyPasteLearn",
    description:
      "The legal agreement between you and Open Empower B.V. governing accounts, subscriptions, purchases, and lab usage.",
    url: "/terms",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: May 2026 · Version 2026-05
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <p>
            These Terms of Service (&quot;Terms&quot;) form a binding agreement
            between you (&quot;you&quot;, &quot;Customer&quot;) and{" "}
            <strong>Open Empower B.V.</strong>, a private limited company
            incorporated in the Netherlands, with registered office at De
            Boelelaan 471, 1082 RK Amsterdam, VAT number NL866954958B01
            (&quot;CopyPasteLearn&quot;, &quot;we&quot;, &quot;us&quot;),
            governing your access to and use of{" "}
            <a href="https://www.copypastelearn.com">www.copypastelearn.com</a>{" "}
            and the products, courses, and lab environments offered there
            (the &quot;Service&quot;).
          </p>
          <p>
            By creating an account, completing a purchase, or otherwise using
            the Service, you accept these Terms. If you do not accept them, do
            not use the Service.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 16 years old to create an account. If you use
            the Service on behalf of an organization, you represent that you
            are authorized to bind that organization to these Terms.
          </p>

          <h2>2. The Service</h2>
          <p>
            CopyPasteLearn provides:
          </p>
          <ul>
            <li>
              <strong>Digital products</strong> — ebooks, templates, and
              playbooks delivered as downloadable files.
            </li>
            <li>
              <strong>Video courses</strong> — streamed on demand through our
              video provider, with progress tracking.
            </li>
            <li>
              <strong>Interactive lab environments</strong> — short-lived,
              sandboxed virtual machines or containers for hands-on practice.
            </li>
            <li>
              <strong>Subscriptions</strong> — recurring access to course
              libraries and labs at a monthly or annual price.
            </li>
          </ul>
          <p>
            We may add, remove, or change features at any time. Where a change
            materially reduces what you paid for, we will offer a pro-rata
            refund or credit.
          </p>

          <h2>3. Accounts and security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account. Notify us immediately at{" "}
            <EmailLink user="security" domain="copypastelearn.com" /> if you
            suspect unauthorized access. We may suspend an account that
            appears compromised while we investigate.
          </p>

          <h2>4. Pricing, taxes, and invoicing</h2>
          <p>
            Prices are displayed on the Service in the currency indicated
            (typically EUR or USD) and include applicable EU VAT for consumer
            sales. Business customers in the EU who provide a valid VAT ID at
            checkout may receive a reverse-charge invoice. You are responsible
            for any duties or taxes outside our jurisdiction. Stripe Payments
            Europe Ltd processes payments on our behalf; you are bound by
            Stripe&apos;s terms when paying.
          </p>

          <h2>5. Subscriptions, renewals, and cancellation</h2>
          <p>
            Subscriptions renew automatically at the end of each billing
            period at the then-current price unless cancelled. You can cancel
            at any time from your account dashboard; cancellation takes effect
            at the end of the current period and you retain access until then.
            We do not provide pro-rated refunds for unused portions of a
            subscription period, except where required by law.
          </p>

          <h2>6. Right of withdrawal and digital content</h2>
          <p>
            EU consumers normally have a 14-day right of withdrawal under
            Directive 2011/83/EU (the Consumer Rights Directive). For digital
            content delivered immediately, you expressly consent at checkout
            to immediate performance and acknowledge that, once performance
            has begun (e.g. the file has been downloaded or the streaming
            access has been used), you waive your statutory right of
            withdrawal in accordance with Art. 16(m) of the Directive.
          </p>
          <p>
            Refund eligibility outside the statutory withdrawal regime is
            governed by our{" "}
            <Link href="/refund-policy">Refund Policy</Link>.
          </p>

          <h2>7. License to content</h2>
          <p>
            Subject to your compliance with these Terms and timely payment, we
            grant you a non-exclusive, non-transferable, non-sublicensable,
            revocable license to:
          </p>
          <ul>
            <li>
              access and view course videos for personal, non-commercial
              learning;
            </li>
            <li>
              download, copy, modify, and use the source files and templates
              you purchase (ebooks, playbooks, code snippets) inside your own
              projects, including projects you build for paying clients,
              provided you do not redistribute the original files as such;
            </li>
            <li>
              use lab environments for the duration of your subscription or
              entitlement.
            </li>
          </ul>
          <p>
            You may not: resell, sublicense, or republish course content;
            remove copyright notices; train machine-learning models on our
            paid content without our prior written permission; or share your
            account credentials.
          </p>

          <h2>8. Acceptable use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>
              run cryptocurrency miners, DDoS tools, port-scanners, or other
              workloads unrelated to learning;
            </li>
            <li>
              probe, scan, or attack any system you are not explicitly
              authorized to test;
            </li>
            <li>
              upload or execute malware, ransomware, or material that infringes
              third-party rights;
            </li>
            <li>
              attempt to gain unauthorized access to other users&apos;
              accounts, labs, or data;
            </li>
            <li>
              circumvent technical limits (rate limits, session timeouts,
              resource caps);
            </li>
            <li>
              use the Service in a way that violates applicable export-control,
              sanctions, or anti-fraud laws.
            </li>
          </ul>

          <h2>9. Lab environments</h2>
          <p>
            Labs are ephemeral. Any data you write to a lab is destroyed when
            the session ends or expires. Do <strong>not</strong> store
            personal data, secrets, or production credentials in a lab. We
            apply fair-use limits on session duration, CPU, memory, and
            network bandwidth; sustained abuse may result in throttling or
            account suspension.
          </p>

          <h2>10. Third-party services</h2>
          <p>
            The Service relies on third-party providers (e.g. Clerk for
            authentication, Stripe for payments, Mux for video, AWS for
            storage). Their availability is outside our direct control. We
            select reputable providers and monitor their status, but we do
            not warrant uninterrupted operation.
          </p>

          <h2>11. Intellectual property and DMCA</h2>
          <p>
            All course content, branding, logos, and software are owned by
            Open Empower B.V. or its licensors and are protected by copyright,
            trademark, and other intellectual-property laws. If you believe
            content on the Service infringes your rights, send a notice to{" "}
            <EmailLink user="legal" domain="copypastelearn.com" /> including
            the elements required by the DMCA (or equivalent EU procedure):
            identification of the work, the infringing material, your contact
            information, a good-faith statement, and your signature.
          </p>

          <h2>12. Warranty disclaimer</h2>
          <p>
            Except as expressly stated in these Terms or required by
            non-waivable consumer law, the Service is provided &quot;as
            is&quot; and &quot;as available&quot;, without warranties of any
            kind, whether express or implied, including merchantability,
            fitness for a particular purpose, and non-infringement. We do not
            warrant that the Service will be uninterrupted, error-free, or
            free of harmful components.
          </p>

          <h2>13. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, our aggregate liability
            arising out of or relating to these Terms or the Service is
            limited to the amount you paid us in the 12 months immediately
            preceding the event giving rise to the claim. We are not liable
            for indirect, incidental, special, consequential, exemplary, or
            punitive damages, including loss of data, revenue, or business
            opportunity.
          </p>
          <p>
            Nothing in these Terms excludes or limits liability for death or
            personal injury caused by negligence, for fraud or fraudulent
            misrepresentation, or for any other liability that cannot lawfully
            be excluded — in particular the mandatory consumer rights granted
            by EU and Dutch law.
          </p>

          <h2>14. Indemnification</h2>
          <p>
            You will indemnify and hold harmless Open Empower B.V., its
            officers, employees, and agents from any third-party claim arising
            out of (a) your breach of these Terms, (b) your misuse of the
            Service, or (c) your violation of any applicable law or
            third-party right.
          </p>

          <h2>15. Termination</h2>
          <p>
            You may terminate your account at any time from your dashboard or
            by emailing support. We may suspend or terminate your access if
            you materially breach these Terms, fail to pay, or use the
            Service in a way that creates legal or security risk. Upon
            termination, your right to use the Service ends, but provisions
            that by their nature should survive (e.g. IP, liability,
            governing law) remain in effect.
          </p>

          <h2>16. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. We will post the
            updated version on this page and update the &quot;Last updated&quot;
            date. For material changes affecting your rights, we will notify
            registered users by email at least 14 days before the changes
            take effect. Continued use of the Service after that date
            constitutes acceptance of the updated Terms.
          </p>

          <h2>17. Governing law and dispute resolution</h2>
          <p>
            These Terms are governed by the laws of the Netherlands, without
            regard to its conflict-of-laws principles. Mandatory consumer
            protections of the country where you habitually reside continue
            to apply. Disputes will be submitted to the competent court in
            Amsterdam, the Netherlands, except where a different forum is
            required by mandatory law.
          </p>
          <p>
            EU consumers may also use the European Commission&apos;s Online
            Dispute Resolution platform at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>

          <h2>18. Miscellaneous</h2>
          <p>
            These Terms, together with the{" "}
            <Link href="/privacy">Privacy Policy</Link>, the{" "}
            <Link href="/refund-policy">Refund Policy</Link>, and the{" "}
            <Link href="/digital-delivery-policy">Digital Delivery Policy</Link>
            , constitute the entire agreement between you and us regarding
            the Service. If any provision is held unenforceable, the
            remaining provisions remain in effect. Our failure to enforce a
            right is not a waiver of that right. You may not assign these
            Terms without our prior written consent; we may assign them in
            connection with a merger, acquisition, or sale of assets.
          </p>

          <h2>19. Contact</h2>
          <p>
            Open Empower B.V. — Legal
            <br />
            De Boelelaan 471, 1082 RK Amsterdam, The Netherlands
            <br />
            VAT: NL866954958B01
            <br />
            Phone: +31 612255399
            <br />
            Email: <EmailLink user="legal" domain="copypastelearn.com" />
            <br />
            Support: <EmailLink user="support" domain="copypastelearn.com" />
          </p>
        </article>
      </div>
    </div>
  );
}
