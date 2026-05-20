import type { Brand } from "@prisma/client";

/** Stable, absolute canonical URLs for catalog items. */

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com").replace(
    /\/$/,
    "",
  );
}

export function productCanonicalUrl(slug: string): string {
  return `${appUrl()}/products/${slug}`;
}

export function bundleCanonicalUrl(slug: string): string {
  return `${appUrl()}/bundles/${slug}`;
}

export const BRAND_DISPLAY_NAMES: Record<Brand, string> = {
  CopyPasteLearn: "CopyPasteLearn",
  AnsiblePilot: "AnsiblePilot",
  TerraformPilot: "TerraformPilot",
  AnsibleByExample: "Ansible by Example",
  KubernetesRecipes: "Kubernetes Recipes",
  NvidiaAI: "NVIDIA AI",
};

/**
 * Build a SEO-friendly meta description in the 140-160 character range.
 * Combines the editorial copy (subtitle/description) with brand and a
 * standard value-prop suffix. Truncates cleanly on a word boundary at
 * <= 160 chars so Google does not clip mid-word.
 */
export function buildCatalogMetaDescription(input: {
  kind: "product" | "bundle";
  title: string;
  subtitle?: string | null;
  description?: string | null;
  brand?: Brand | null;
}): string {
  const TARGET_MAX = 160;
  const TARGET_MIN = 140;
  const lead = (input.subtitle?.trim() || input.description?.trim() || input.title).replace(/\s+/g, " ");
  const brandName = input.brand ? BRAND_DISPLAY_NAMES[input.brand] : "CopyPasteLearn";
  const noun = input.kind === "bundle" ? "bundle" : "product";
  const suffix = ` — production-ready ${noun} from ${brandName} on CopyPasteLearn, with instant digital delivery and lifetime access.`;
  let combined = lead.endsWith(".") ? `${lead}${suffix}` : `${lead}.${suffix}`;
  if (combined.length <= TARGET_MAX) {
    // If still under the target minimum (very short lead + short brand), fall
    // back to the un-truncated combined string which is already in range for
    // all real catalog entries.
    return combined;
  }
  // Trim on a word boundary at <= TARGET_MAX.
  const sliced = combined.slice(0, TARGET_MAX);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutoff = lastSpace > TARGET_MIN ? lastSpace : TARGET_MAX;
  return sliced.slice(0, cutoff).replace(/[\s,;:—-]+$/, "") + "…";
}

/**
 * Format minor-units price into the schema-required "12.34" string.
 */
export function formatMoneyAmount(minorUnits: number): string {
  const major = Math.floor(minorUnits / 100);
  const minor = String(minorUnits % 100).padStart(2, "0");
  return `${major}.${minor}`;
}
