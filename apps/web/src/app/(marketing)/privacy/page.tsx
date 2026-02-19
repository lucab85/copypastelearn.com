import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: February 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <h2>1. Information We Collect</h2>
          <p>
            When you create an account, we collect your name, email address, and
            authentication credentials via our third-party auth provider
            (Clerk). When you use our platform, we collect usage data such as
            courses viewed, lessons completed, and lab sessions.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain the CopyPasteLearn platform</li>
            <li>Track your learning progress across courses and labs</li>
            <li>Send important account and service notifications</li>
            <li>Improve our content and user experience</li>
          </ul>

          <h2>3. Data Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with
            service providers necessary to operate the platform (hosting,
            authentication, payment processing, video delivery).
          </p>

          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures including
            encryption in transit (TLS), secure authentication, and regular
            security reviews. Lab sandbox environments are ephemeral and
            destroyed after each session.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal data at any time by contacting us at{" "}
            <a href="mailto:privacy@copypastelearn.com">
              privacy@copypastelearn.com
            </a>
            .
          </p>

          <h2>6. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management.
            We do not use third-party tracking cookies.
          </p>

          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify
            registered users of any material changes via email.
          </p>

          <h2>8. Contact</h2>
          <p>
            If you have questions about this privacy policy, contact us at{" "}
            <a href="mailto:privacy@copypastelearn.com">
              privacy@copypastelearn.com
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
