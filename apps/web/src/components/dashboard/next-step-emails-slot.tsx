import { requireAuth } from "@/lib/auth";
import { nextStepEmailState } from "@/lib/onboarding-emails/state";
import { NextStepEmailsCard } from "./next-step-emails";

/** The opt-in card, for a learner who has neither asked for the emails nor stopped them. */
export async function NextStepEmailsSlot() {
  const user = await requireAuth();
  if (!user.email || (await nextStepEmailState(user.id)) !== "never") return null;
  return <NextStepEmailsCard email={user.email} />;
}
