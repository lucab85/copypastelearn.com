import { describe, expect, it } from "vitest";
import { firstSentence } from "@/lib/first-sentence";

describe("firstSentence", () => {
  it("returns the first sentence of a longer description", () => {
    expect(
      firstSentence(
        "Agents will call your services, and most of those services are old REST and SOAP APIs that nobody wants to rewrite. Generating one tool per endpoint fails too: agents choose worse."
      )
    ).toBe(
      "Agents will call your services, and most of those services are old REST and SOAP APIs that nobody wants to rewrite."
    );
  });

  it("does not stop at a period inside a name or a version", () => {
    expect(firstSentence("Run Node.js 22 and kagent 1.0 on Kubernetes v1.36. Then clean up.")).toBe(
      "Run Node.js 22 and kagent 1.0 on Kubernetes v1.36."
    );
  });

  it("does not stop at a common abbreviation", () => {
    expect(firstSentence("Compare tools, e.g. Capsule vs. vCluster, on one Mac. Then choose.")).toBe(
      "Compare tools, e.g. Capsule vs. vCluster, on one Mac."
    );
  });

  it("stops at a question or an exclamation mark, and keeps a closing quote", () => {
    expect(firstSentence("What runs your agents? This course shows it.")).toBe("What runs your agents?");
    expect(firstSentence('He said "ship it." Then we did.')).toBe('He said "ship it."');
  });

  it("uses the first paragraph only and returns a text with no sentence end whole", () => {
    expect(firstSentence("One line with no end\n\nSecond paragraph.")).toBe("One line with no end");
    expect(firstSentence("  A single sentence.  ")).toBe("A single sentence.");
    expect(firstSentence("")).toBe("");
  });
});
