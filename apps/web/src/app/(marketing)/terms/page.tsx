import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "CopyPasteLearn terms of service — rules and guidelines for using our platform.",
  alternates: { canonical: "/terms" },
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
            Last updated: February 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using CopyPasteLearn (&quot;the Service&quot;), you
            agree to be bound by these Terms of Service. If you do not agree,
            please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            CopyPasteLearn provides online video courses and interactive lab
            environments for learning IT automation. Lab environments are
            ephemeral sandboxes provided for educational purposes only.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You must provide accurate information when creating an
            account.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>
              Use lab environments for any purpose other than course-related
              learning
            </li>
            <li>
              Attempt to access other users&apos; data or lab sessions
            </li>
            <li>
              Use the Service for cryptocurrency mining, malicious software, or
              any illegal activity
            </li>
            <li>
              Share or redistribute course content without written permission
            </li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            All course content, including videos, transcripts, code snippets,
            and lab configurations, is the property of CopyPasteLearn or its
            content creators and is protected by copyright.
          </p>

          <h2>6. Payment and Subscriptions</h2>
          <p>
            Some features require a paid subscription. Payments are processed
            by Stripe. You may cancel your subscription at any time; access
            continues until the end of the current billing period.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            CopyPasteLearn is provided &quot;as is&quot; without warranties of
            any kind. We are not liable for any damages arising from your use
            of the Service, including data loss in lab environments.
          </p>

          <h2>8. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms. You may delete your account at any time by contacting
            support.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the updated terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these terms? Contact us at{" "}
            <a href="mailto:legal@copypastelearn.com">
              legal@copypastelearn.com
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
