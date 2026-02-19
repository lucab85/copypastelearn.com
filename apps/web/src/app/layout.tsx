import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CopyPasteLearn — Learn IT Automation by Doing",
    template: "%s | CopyPasteLearn",
  },
  description:
    "Master IT automation with video courses and hands-on interactive labs. Learn by doing in real environments.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
};

/**
 * Check whether the Clerk publishable key looks valid (base64-decodable).
 * When missing or placeholder, we skip ClerkProvider so the app still renders.
 */
function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk || pk === "pk_test_...") return false;
  try {
    atob(pk.replace(/^pk_(test|live)_/, ""));
    return true;
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkEnabled = isClerkConfigured();

  let ClerkProvider: React.ComponentType<{ children: React.ReactNode }> | null =
    null;
  if (clerkEnabled) {
    const clerk = await import("@clerk/nextjs");
    ClerkProvider = clerk.ClerkProvider;
  }

  const body = (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {!clerkEnabled && (
          <div className="bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-800">
            Clerk is not configured — auth is disabled. Set valid keys in{" "}
            <code>.env.local</code> to enable.
          </div>
        )}
        {children}
      </body>
    </html>
  );

  if (ClerkProvider) {
    return <ClerkProvider>{body}</ClerkProvider>;
  }

  return body;
}
