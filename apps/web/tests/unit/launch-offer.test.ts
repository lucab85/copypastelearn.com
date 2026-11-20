import { describe, expect, it } from "vitest";
import { inOfferWindow, launchOfferActive } from "../../src/lib/launch-offer";

describe("launch offer window", () => {
  it("is off before local midnight on the start day", () => {
    expect(launchOfferActive(new Date(2026, 10, 19, 23, 59).getTime())).toBe(false);
  });
  it("is on from local midnight on the start day", () => {
    expect(launchOfferActive(new Date(2026, 10, 20, 0, 0).getTime())).toBe(true);
  });
  it("is on during Cyber Monday", () => {
    expect(launchOfferActive(Date.parse("2026-11-30T20:00:00Z"))).toBe(true);
  });
  it("ends at the end instant", () => {
    expect(launchOfferActive(Date.parse("2026-12-01T07:59:59Z"))).toBe(true);
    expect(launchOfferActive(Date.parse("2026-12-01T08:00:00Z"))).toBe(false);
  });
  it("works for any window", () => {
    expect(inOfferWindow("2026-01-10", "2026-01-11T00:00:00Z", Date.parse("2026-01-10T12:00:00Z"))).toBe(true);
  });
});
