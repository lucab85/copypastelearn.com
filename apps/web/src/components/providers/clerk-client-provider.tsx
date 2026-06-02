"use client";

import { ClerkProvider } from "@clerk/nextjs";

/**
 * Client-only ClerkProvider wrapper.
 *
 * By isolating ClerkProvider in a "use client" component, the root layout
 * remains a pure Server Component that never calls cookies()/headers().
 * This allows Next.js to statically render (ISR) marketing pages while
 * Clerk auth still hydrates client-side for components like AuthButtons.
 */
export function ClerkClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider clerkJSVersion="5.125.10">{children}</ClerkProvider>
  );
}
