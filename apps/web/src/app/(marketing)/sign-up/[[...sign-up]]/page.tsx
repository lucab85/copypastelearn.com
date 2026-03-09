export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";

export const metadata = {
  title: "Create Your Free Account",
  description:
    "Create a free CopyPasteLearn account and start learning IT automation with expert video courses and interactive hands-on labs today.",
  alternates: { canonical: "/sign-up" },
  openGraph: { url: "/sign-up", type: "website", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  robots: { index: false, follow: true },
};

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <PageEventTracker event="sign_up_start" />
      <h1 className="sr-only">Create your CopyPasteLearn account</h1>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        Create your free account to access video courses, launch interactive
        hands-on labs, and track your learning progress.
      </p>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md",
          },
        }}
      />
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <a href="/sign-in" className="underline underline-offset-4 hover:text-primary">
          Sign in here
        </a>{" "}
        to continue your IT automation learning journey.
      </p>
    </div>
  );
}
