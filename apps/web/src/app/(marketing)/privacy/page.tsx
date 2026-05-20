import type { Metadata } from "next";
import { EmailLink } from "@/components/ui/email-link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "CopyPasteLearn privacy policy — how Open Empower B.V. collects, uses, retains, and protects your personal data under the GDPR.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — CopyPasteLearn",
    description:
      "How Open Empower B.V. collects, uses, retains, and protects your personal data under the GDPR.",
    url: "/privacy",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: May 2026 · Version 2026-05
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <p>
            This policy explains how <strong>Open Empower B.V.</strong>{" "}
            (&quot;CopyPasteLearn&quot;, &quot;we&quot;, &quot;us&quot;) processes
            personal data of visitors, customers, and registered users of{" "}
            <a href="https://www.copypastelearn.com">www.copypastelearn.com</a>{" "}
            (the &quot;Service&quot;). We comply with the EU General Data
            Protection Regulation (Regulation (EU) 2016/679, &quot;GDPR&quot;)
            and applicable national data-protection laws.
          </p>

          <h2>1. Data controller</h2>
          <p>
            The data controller is <strong>Open Empower B.V.</strong>, a
            private limited company incorporated in the Netherlands.
          </p>
          <ul>
            <li>Registered office: De Boelelaan 471, 1082 RK Amsterdam, The Netherlands</li>
            <li>VAT (BTW) number: NL866954958B01</li>
            <li>Phone: +31 612255399</li>
            <li>
              Email: <EmailLink user="privacy" domain="copypastelearn.com" />
            </li>
          </ul>
          <p>
            For any privacy-related request, contact{" "}
            <EmailLink user="privacy" domain="copypastelearn.com" />. We do not
            currently have a statutory obligation to appoint a Data Protection
            Officer; the same address reaches the person responsible for
            privacy matters.
          </p>

          <h2>2. Categories of personal data we collect</h2>
          <ul>
            <li>
              <strong>Account data:</strong> name, email address, password
              hash, and authentication metadata, managed through our identity
              provider Clerk.
            </li>
            <li>
              <strong>Billing &amp; tax data:</strong> billing name, address,
              country, VAT/Tax ID (optional, for B2B invoicing), and payment
              method tokens — processed by Stripe; we never receive your full
              card number.
            </li>
            <li>
              <strong>Order &amp; entitlement data:</strong> products purchased,
              order IDs, invoices, refund history, downloaded files, and
              access entitlements.
            </li>
            <li>
              <strong>Learning &amp; usage data:</strong> courses viewed,
              lessons completed, video playback positions, lab launches, and
              progress timestamps.
            </li>
            <li>
              <strong>Lab session data:</strong> ephemeral container metadata
              (start/stop time, resource usage). The lab&apos;s internal state
              is destroyed when the session ends and is not retained.
            </li>
            <li>
              <strong>Support correspondence:</strong> messages you send us by
              email or via the contact form.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, user agent, language
              preference, timestamps, and crash diagnostics, collected via
              server logs and limited first-party analytics.
            </li>
          </ul>

          <h2>3. Legal bases for processing (Art. 6 GDPR)</h2>
          <ul>
            <li>
              <strong>Performance of a contract</strong> (Art. 6(1)(b)) — to
              create your account, deliver purchases, run lab sessions, track
              progress, and provide support.
            </li>
            <li>
              <strong>Legal obligation</strong> (Art. 6(1)(c)) — to keep
              invoices and tax records for the period required by Dutch and EU
              VAT law.
            </li>
            <li>
              <strong>Legitimate interests</strong> (Art. 6(1)(f)) — to secure
              the Service against abuse and fraud, debug failures, prevent
              cryptocurrency mining or credential-stuffing in lab environments,
              and produce aggregate, anonymized product metrics.
            </li>
            <li>
              <strong>Consent</strong> (Art. 6(1)(a)) — for optional marketing
              emails, newsletters, or any non-essential cookies. You can
              withdraw consent at any time.
            </li>
          </ul>

          <h2>4. How we use your data</h2>
          <ul>
            <li>Provide, maintain, and improve the Service.</li>
            <li>Authenticate you and protect your account.</li>
            <li>
              Process payments, deliver digital products, issue invoices, and
              comply with tax/VAT obligations.
            </li>
            <li>Track learning progress and surface course recommendations.</li>
            <li>
              Detect and block abuse of lab environments (mining, scanning,
              malware execution, network abuse).
            </li>
            <li>
              Respond to your support requests and send transactional emails
              about your account or purchases.
            </li>
            <li>
              Send marketing emails only if you have opted in; every marketing
              message includes an unsubscribe link.
            </li>
          </ul>

          <h2>5. Sub-processors</h2>
          <p>
            We rely on the following sub-processors. Each is bound by a Data
            Processing Agreement (DPA) and operates either inside the EU/EEA
            or under EU-approved Standard Contractual Clauses (SCCs).
          </p>
          <ul>
            <li>
              <strong>Clerk</strong> — identity &amp; authentication (USA, SCCs).
            </li>
            <li>
              <strong>Stripe Payments Europe Ltd</strong> — payment processing
              (Ireland).
            </li>
            <li>
              <strong>Mux, Inc.</strong> — video encoding and streaming (USA,
              SCCs).
            </li>
            <li>
              <strong>Amazon Web Services EMEA SARL</strong> — file storage and
              digital delivery (EU regions).
            </li>
            <li>
              <strong>Vercel Inc.</strong> — application hosting and edge
              delivery (USA, SCCs).
            </li>
            <li>
              <strong>Cloudflare, Inc.</strong> — DNS, DDoS protection, and
              caching (USA/EU, SCCs).
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery (USA, SCCs).
            </li>
            <li>
              <strong>Plausible Analytics</strong> — privacy-friendly,
              cookieless website analytics (EU).
            </li>
          </ul>
          <p>
            A current list of sub-processors is available on request from{" "}
            <EmailLink user="privacy" domain="copypastelearn.com" />.
          </p>

          <h2>6. International data transfers</h2>
          <p>
            Where personal data is transferred outside the EU/EEA, we rely on
            the European Commission&apos;s Standard Contractual Clauses and,
            where appropriate, supplementary measures such as encryption in
            transit and at rest. You can request a copy of the transfer
            safeguards in place by contacting us.
          </p>

          <h2>7. Retention</h2>
          <ul>
            <li>
              <strong>Account data:</strong> retained while your account is
              active; deleted within 30 days after you close your account,
              except where retention is required by law.
            </li>
            <li>
              <strong>Invoices &amp; tax records:</strong> retained for 7 years
              as required by Dutch tax law (Algemene wet inzake
              rijksbelastingen, art. 52).
            </li>
            <li>
              <strong>Server &amp; security logs:</strong> retained for up to
              90 days, then deleted or anonymized.
            </li>
            <li>
              <strong>Lab session data:</strong> ephemeral; runtime state is
              destroyed at session end. Metadata is retained for up to 90 days
              for fraud/abuse review.
            </li>
            <li>
              <strong>Support correspondence:</strong> retained for up to 24
              months after the case is closed.
            </li>
          </ul>

          <h2>8. Your rights under the GDPR</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data (Art. 15).</li>
            <li>Request correction of inaccurate data (Art. 16).</li>
            <li>Request erasure of your data (Art. 17).</li>
            <li>Restrict or object to processing (Art. 18, 21).</li>
            <li>Receive your data in a portable format (Art. 20).</li>
            <li>
              Withdraw consent at any time, without affecting prior lawful
              processing (Art. 7(3)).
            </li>
            <li>
              Lodge a complaint with the Dutch Data Protection Authority
              (Autoriteit Persoonsgegevens,{" "}
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener"
              >
                autoriteitpersoonsgegevens.nl
              </a>
              ) or the supervisory authority in your country of residence.
            </li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <EmailLink user="privacy" domain="copypastelearn.com" />. We respond
            within one month, in accordance with Art. 12(3) GDPR.
          </p>

          <h2>9. Automated decision-making</h2>
          <p>
            We do not use your personal data for automated decision-making or
            profiling that produces legal or similarly significant effects on
            you.
          </p>

          <h2>10. Children</h2>
          <p>
            The Service is not directed at children under 16. We do not
            knowingly collect personal data from anyone under 16. If you
            believe a child has provided us with personal data, contact us and
            we will delete it.
          </p>

          <h2>11. Security</h2>
          <p>
            We apply industry-standard technical and organizational measures,
            including TLS 1.2+ for all traffic, encryption at rest for storage
            and database backups, the principle of least privilege for
            administrative access, regular dependency updates, and isolated,
            non-privileged lab sandboxes. No system is 100% secure; if you
            discover a vulnerability, please report it responsibly to{" "}
            <EmailLink user="security" domain="copypastelearn.com" />.
          </p>

          <h2>12. Cookies and similar technologies</h2>
          <p>
            We use a small number of strictly-necessary first-party cookies for
            authentication and session integrity. We do not use third-party
            advertising or cross-site tracking cookies. Our analytics provider
            (Plausible) is cookieless and does not fingerprint visitors.
          </p>

          <h2>13. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Material changes will
            be announced on this page and, where you have an account, by email
            at least 14 days before they take effect. The &quot;Last
            updated&quot; date at the top of this page indicates the current
            version.
          </p>

          <h2>14. Contact</h2>
          <p>
            Open Empower B.V. — Privacy
            <br />
            De Boelelaan 471, 1082 RK Amsterdam, The Netherlands
            <br />
            VAT: NL866954958B01
            <br />
            Phone: +31 612255399
            <br />
            Email: <EmailLink user="privacy" domain="copypastelearn.com" />
            <br />
            General contact:{" "}
            <EmailLink user="hello" domain="copypastelearn.com" />
          </p>
        </article>
      </div>
    </div>
  );
}
