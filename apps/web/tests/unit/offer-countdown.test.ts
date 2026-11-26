import { describe, expect, it } from "vitest";
import { timeLeft } from "@/components/academy/offer-countdown";

describe("timeLeft", () => {
  const end = Date.parse("2026-12-01T08:00:00Z");
  const before = (ms: number) => end - ms;
  const min = 60_000;

  it("counts days, hours and minutes", () => {
    expect(timeLeft(end, before(3 * 1440 * min + 4 * 60 * min + 12 * min))).toBe("3 days 4 h 12 min");
    expect(timeLeft(end, before(1440 * min + 30 * min))).toBe("1 day 0 h 30 min");
  });

  it("drops the days in the last 24 hours", () => {
    expect(timeLeft(end, before(5 * 60 * min + 59 * min))).toBe("5 h 59 min");
    expect(timeLeft(end, before(30_000))).toBe("0 h 0 min");
  });

  it("returns null once the offer has ended", () => {
    expect(timeLeft(end, end)).toBeNull();
    expect(timeLeft(end, end + min)).toBeNull();
  });
});
