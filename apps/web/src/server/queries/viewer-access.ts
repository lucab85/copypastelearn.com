import { hasCourseSubscription } from "@/lib/billing";
import { getCurrentUser } from "@/lib/auth";

/** Who is looking at the page: signed in or not, with or without full access. */
export async function getViewerAccess(): Promise<{ signedIn: boolean; hasPro: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, hasPro: false };
  return { signedIn: true, hasPro: await hasCourseSubscription(user.id) };
}
