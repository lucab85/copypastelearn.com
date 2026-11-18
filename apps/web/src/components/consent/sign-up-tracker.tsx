"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { trackSignUp } from "@/lib/analytics";

const TRACKED_KEY = "cpl_signup_tracked";
/** Accounts created within this window count as a fresh sign-up. */
const FRESH_MS = 30 * 60 * 1000;

/**
 * Fires the `sign_up` event (GA4 + ad conversions) once, the first time a
 * newly created account is seen in this browser. Clerk's <SignUp /> has no
 * completion callback, so we look at `user.createdAt` instead. Must be
 * rendered inside ClerkProvider.
 */
export function SignUpTracker() {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !user?.createdAt) return;
    if (Date.now() - user.createdAt.getTime() > FRESH_MS) return;
    try {
      if (localStorage.getItem(TRACKED_KEY) === user.id) return;
      localStorage.setItem(TRACKED_KEY, user.id);
    } catch {
      return;
    }
    trackSignUp();
  }, [isLoaded, user]);

  return null;
}
