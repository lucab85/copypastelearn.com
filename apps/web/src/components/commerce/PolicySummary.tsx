import Link from "next/link";

/**
 * Inline policy summary shown on product detail and checkout pages
 * (FR-008). Keeps refund and digital-delivery posture explicit so
 * buyers consent before purchase (FR-048).
 */
export function PolicySummary() {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
      <p className="mb-1 font-medium text-foreground">Before you buy</p>
      <ul className="space-y-1 list-disc pl-4">
        <li>
          Instant digital delivery — by completing checkout you consent to
          immediate access. See the{" "}
          <Link href="/digital-delivery-policy" className="underline">
            digital delivery policy
          </Link>
          .
        </li>
        <li>
          Refunds available within 14 days if you have not yet downloaded
          the file. Full terms in the{" "}
          <Link href="/refund-policy" className="underline">
            refund policy
          </Link>
          .
        </li>
        <li>
          Your purchase email becomes your library sign-in. Tax is calculated
          and shown on the next step.
        </li>
      </ul>
    </div>
  );
}
