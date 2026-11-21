export const dynamic = "force-dynamic";

import { UserProfile } from "@clerk/nextjs";
import { requireAuth } from "@/lib/auth";
import { hasLegacySubscription } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { NextStepEmailsSetting } from "@/components/dashboard/next-step-emails";
import { nextStepEmailState } from "@/lib/onboarding-emails/state";

export const metadata = {
  title: "Account Settings",
  robots: { index: false, follow: true },
};

export default async function SettingsPage() {
  const user = await requireAuth();
  const hasLegacyPlan = await hasLegacySubscription(user.id);
  const emailState = user.email ? await nextStepEmailState(user.id) : "unavailable";

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold">Account Settings</h1>
      {hasLegacyPlan && (
        <section className="space-y-3 rounded-lg border p-5">
          <h2 className="font-semibold">Existing subscription</h2>
          <Button variant="outline" asChild>
            <a href="/api/billing/portal">Manage existing subscription</a>
          </Button>
        </section>
      )}
      <NextStepEmailsSetting state={emailState} email={user.email} />
      <UserProfile routing="hash" />
    </div>
  );
}
