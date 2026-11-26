"use client";

import { useEffect, useState } from "react";

/** Days, hours and minutes left until `end`, as "3 days 4 h 12 min". */
export function timeLeft(end: number, now: number): string | null {
  const ms = end - now;
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  const parts = [d > 0 ? `${d} ${d === 1 ? "day" : "days"}` : null, `${h} h`, `${m} min`];
  return parts.filter(Boolean).join(" ");
}

/**
 * Time left on the launch offer, updated every minute. Rendered on the server
 * with the time of the request, so the text is there without JavaScript. It
 * disappears when the offer ends.
 */
export function OfferCountdown({ end, serverNow }: { end: string; serverNow: number }) {
  const endMs = Date.parse(end);
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const left = timeLeft(endMs, now);
  if (!left) return null;
  return (
    <span className="font-semibold tabular-nums" suppressHydrationWarning>
      {left} left
    </span>
  );
}
