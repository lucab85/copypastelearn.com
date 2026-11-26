"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { trackNewsletterSignup } from "@/lib/analytics";
import { newsletterPopupAllowed, newsletterPopupDelay } from "@/lib/newsletter-popup";

const KIT_FORM_UID = "ce74a48bfa";
const DISMISS_KEY = "cpl-newsletter-dismissed";
const POPUP_DELAY_MS = 30_000; // 30 seconds on the site
const MIN_ON_PAGE_MS = 5_000; // and never right after a navigation
const DISMISS_DAYS = 30;

export function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const pathname = usePathname();
  const allowed = newsletterPopupAllowed(pathname);
  const arrivedAt = useRef(Date.now());

  useEffect(() => {
    if (!allowed) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000) return;
    }
    const wait = newsletterPopupDelay(Date.now() - arrivedAt.current, POPUP_DELAY_MS, MIN_ON_PAGE_MS);
    const timer = setTimeout(() => setShow(true), wait);
    return () => clearTimeout(timer);
  }, [allowed, pathname]);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(
        `https://app.kit.com/forms/${KIT_FORM_UID}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email_address: email }),
        }
      );
      if (res.ok) {
        setStatus("success");
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
        trackNewsletterSignup("popup", KIT_FORM_UID);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!show || !allowed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Close newsletter popup"
        >
          <X className="h-5 w-5" />
        </button>

        {status === "success" ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">You&apos;re in!</h3>
            <p className="text-zinc-400 text-sm">
              Check your inbox for a confirmation email.
            </p>
            <button
              onClick={dismiss}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Continue learning
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 text-sm font-semibold text-blue-500">
              Newsletter
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">
              Level up your IT automation skills
            </h3>
            <p className="mb-6 text-sm text-zinc-400">
              Weekly tips on Docker, Ansible, Terraform, MLOps &amp; more.
              No spam, unsubscribe anytime.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe for free"}
              </button>
              {status === "error" && (
                <p className="text-xs text-red-400 text-center">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>

            <p className="mt-4 text-center text-xs text-zinc-600">
              Join 200+ IT professionals. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
