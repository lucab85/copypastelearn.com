import { describe, it, expect, vi, beforeEach } from "vitest";

const productsFindMany = vi.fn();
const bundlesFindMany = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    product: { findMany: (args: unknown) => productsFindMany(args) },
    bundle: { findMany: (args: unknown) => bundlesFindMany(args) },
  },
}));

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://copypastelearn.com";
  process.env.COMMERCE_MERCHANT_COUNTRY = "IT";
  productsFindMany.mockReset();
  bundlesFindMany.mockReset();
});

describe("buildProductFeed (T092, US7)", () => {
  it("emits canonical https URLs and 2-decimal prices", async () => {
    productsFindMany.mockResolvedValue([
      {
        id: "prod_1",
        slug: "ansible-automation-playbook",
        title: "Ansible Playbook",
        subtitle: "60 plays",
        description: "x".repeat(800),
        productType: "EBOOK",
        brand: "AnsiblePilot",
        categories: ["devops"],
        priceAmount: 2900,
        currency: "eur",
        imageUrl: "https://cdn.example.com/cover.png",
        updatedAt: new Date("2026-04-30T10:00:00Z"),
      },
    ]);
    bundlesFindMany.mockResolvedValue([]);

    const { buildProductFeed } = await import("@/lib/commerce/feed");
    const feed = await buildProductFeed();

    expect(feed.feed_version).toBe("1.0");
    expect(feed.merchant.country).toBe("IT");
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].url).toBe(
      "https://copypastelearn.com/products/ansible-automation-playbook",
    );
    expect(feed.items[0].url.startsWith("https://")).toBe(true);
    expect(feed.items[0].price).toEqual({ amount: "29.00", currency: "EUR" });
    expect(feed.items[0].brand).toBe("AnsiblePilot");
    expect(feed.items[0].type).toBe("EBOOK");
    expect(feed.items[0].seller).toBe("CopyPasteLearn");
  });

  it("includes published bundles with type=BUNDLE", async () => {
    productsFindMany.mockResolvedValue([]);
    bundlesFindMany.mockResolvedValue([
      {
        id: "bun_1",
        slug: "devops-copy-paste-bundle",
        title: "DevOps Bundle",
        description: "Both books",
        priceAmount: 5900,
        currency: "EUR",
        imageUrl: null,
        updatedAt: new Date(),
      },
    ]);

    const { buildProductFeed } = await import("@/lib/commerce/feed");
    const feed = await buildProductFeed();

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].type).toBe("BUNDLE");
    expect(feed.items[0].url).toBe(
      "https://copypastelearn.com/bundles/devops-copy-paste-bundle",
    );
    expect(feed.items[0].price.amount).toBe("59.00");
  });

  it("never reads from non-PUBLISHED rows (filter passed to Prisma)", async () => {
    productsFindMany.mockResolvedValue([]);
    bundlesFindMany.mockResolvedValue([]);
    const { buildProductFeed } = await import("@/lib/commerce/feed");
    await buildProductFeed();
    expect(productsFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } }),
    );
    expect(bundlesFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } }),
    );
  });
});
