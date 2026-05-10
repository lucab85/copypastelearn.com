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
 * Format minor-units price into the schema-required "12.34" string.
 */
export function formatMoneyAmount(minorUnits: number): string {
  const major = Math.floor(minorUnits / 100);
  const minor = String(minorUnits % 100).padStart(2, "0");
  return `${major}.${minor}`;
}
