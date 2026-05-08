import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listEntitlementsForUser } from "@/server/queries/library";
import { linkClerkUserToCustomer } from "@/lib/commerce/identity";
import { LibraryItem } from "@/components/commerce/LibraryItem";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your library | CopyPasteLearn",
  description: "Your purchased ebooks, templates, and downloadable assets.",
  robots: { index: false, follow: false },
};

export default async function LibraryPage() {
  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/library");
  }

  const clerkUser = await currentUser();
  const verifiedEmails = (clerkUser?.emailAddresses ?? [])
    .filter((e) => !e.verification || e.verification.status === "verified")
    .map((e) => e.emailAddress);

  // Lazy-link Clerk user ↔ Customer (FR-029).
  if (clerkUser?.primaryEmailAddress?.emailAddress) {
    await linkClerkUserToCustomer({
      clerkUserId: userId,
      email: clerkUser.primaryEmailAddress.emailAddress,
    });
  }

  const entries = await listEntitlementsForUser({
    clerkUserId: userId,
    clerkEmails: verifiedEmails,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your library</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Every product you have purchased. Generate a fresh access link any
          time — old links remain valid until they expire or are exhausted.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-zinc-700 dark:text-zinc-300">
            No purchases yet for this account.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            If you bought something with a different email address, sign in
            with that address to see it here.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <LibraryItem key={entry.entitlementId} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}
