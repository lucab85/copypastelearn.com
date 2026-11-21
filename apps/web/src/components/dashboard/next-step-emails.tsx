"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NextStepEmailState } from "@/lib/onboarding-emails/state";
import { setNextStepEmails } from "@/server/actions/onboarding-emails";

const WHAT = "Four short emails over two weeks: where to continue, and one about what Pro adds.";
const DISMISSED_KEY = "cpl_next_step_emails_dismissed";

/** Dashboard card for a learner who has never been asked. Sends nothing until "Send them". */
export function NextStepEmailsCard({ email }: { email: string }) {
  const [hidden, setHidden] = useState(true);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  const optIn = () =>
    startTransition(async () => {
      try {
        const { ok } = await setNextStepEmails(true, "dashboard");
        setDone(ok);
        setFailed(!ok);
      } catch {
        setFailed(true);
      }
    });

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage blocked: the card comes back on the next visit.
    }
    setHidden(true);
  };

  return (
    <section
      aria-labelledby="next-step-emails"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Mail className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 id="next-step-emails" className="text-lg font-semibold">
            Get your next steps by email
          </h2>
          {done ? (
            <p role="status" className="mt-1 text-sm text-muted-foreground">
              Done. The first email reaches {email} within 15 minutes. You can stop them in Settings.
            </p>
          ) : (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {WHAT} Sent to {email}, only if you ask. Every email has a link to stop them.
            </p>
          )}
          {failed && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              That did not work. Try again in a moment.
            </p>
          )}
        </div>
      </div>
      {!done && (
        <div className="flex shrink-0 gap-2">
          <Button onClick={optIn} disabled={pending}>
            {pending ? "Saving…" : "Send them"}
          </Button>
          <Button variant="ghost" onClick={dismiss} disabled={pending}>
            Not now
          </Button>
        </div>
      )}
    </section>
  );
}

/** Settings section: shows whether the emails are on, and switches them. */
export function NextStepEmailsSetting({ state, email }: { state: NextStepEmailState; email: string }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  if (state === "unavailable") return null;
  const on = state === "on";

  const toggle = () =>
    startTransition(async () => {
      try {
        const { ok } = await setNextStepEmails(!on, "settings");
        setFailed(!ok);
        if (ok) router.refresh();
      } catch {
        setFailed(true);
      }
    });

  return (
    <section className="space-y-3 rounded-lg border p-5">
      <h2 className="font-semibold">Next-step emails</h2>
      <p className="text-sm text-muted-foreground">
        {state === "on" && `On. The emails go to ${email}.`}
        {state === "done" && `All four emails were sent to ${email}. There are no more to come.`}
        {state === "off" && "Off. You stopped these emails."}
        {state === "never" && `Off. ${WHAT} Sent to ${email}, only if you turn them on.`}
      </p>
      {state !== "done" && (
        <Button variant="outline" onClick={toggle} disabled={pending}>
          {pending ? "Saving…" : on ? "Stop the emails" : "Send me the emails"}
        </Button>
      )}
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          That did not work. Try again in a moment.
        </p>
      )}
    </section>
  );
}
