import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemberAccess } from "@/server/queries/course-extras";

/** Shown instead of subscriber-only course material. */
export function MemberGate({
  access,
  what,
  returnTo,
}: {
  access: Exclude<MemberAccess, "ok">;
  what: string;
  returnTo: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
      <Lock className="mb-4 h-8 w-8 text-muted-foreground/60" />
      <p className="text-lg font-semibold">{what} is part of the subscription</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {access === "signed-out"
          ? "Sign in with a subscribed account, or see the plans."
          : "Your account has no active subscription."}
      </p>
      <div className="mt-6 flex gap-3">
        {access === "signed-out" && (
          <Button variant="outline" asChild>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`}>Sign In</Link>
          </Button>
        )}
        <Button asChild>
          <Link href="/pricing">See Plans</Link>
        </Button>
      </div>
    </div>
  );
}
