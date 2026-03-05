export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";

export const metadata = {
  title: "Sign In to Your Account — CopyPasteLearn",
  description:
    "Sign in to CopyPasteLearn to access your courses, interactive hands-on labs, and track your learning progress across all devices.",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: true },
};

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <PageEventTracker event="sign_in_start" />
      <h1 className="sr-only">Sign in to CopyPasteLearn</h1>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        Welcome back! Sign in to continue your courses, launch interactive labs,
        and pick up right where you left off.
      </p>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md",
          },
        }}
      />
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a href="/sign-up" className="underline underline-offset-4 hover:text-primary">
          Create one for free
        </a>{" "}
        and start learning IT automation with hands-on labs today.
      </p>
    </div>
  );
}
