import { describe, it, expect, vi, beforeEach } from "vitest";

const findManyMock = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    product: { findMany: (a: unknown) => findManyMock(a) },
  },
}));

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://copypastelearn.com";
  findManyMock.mockReset();
});

function makeProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "prod_1",
    slug: "terraform-aws-cookbook",
    title: "Terraform AWS Cookbook",
    subtitle: "Recipes for VPCs, IAM, and ECS",
    description: "A complete reference for shipping Terraform on AWS.",
    brand: "TerraformPilot",
    productType: "EBOOK",
    formats: ["pdf"],
    categories: ["devops", "iac"],
    tags: ["terraform", "aws"],
    priceAmount: 3900,
    currency: "eur",
    status: "PUBLISHED",
    updatedAt: new Date(),
    imageUrl: null,
    ...overrides,
  };
}

describe("recommendProducts (T085, US6)", () => {
  it("returns only PUBLISHED products with authoritative price + url", async () => {
    findManyMock.mockResolvedValue([makeProduct()]);
    const { recommendProducts } = await import("@/lib/commerce/assistant");
    const recs = await recommendProducts("terraform aws book");

    // Filter passed to Prisma forces PUBLISHED-only.
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED" }) }),
    );
    expect(recs).toHaveLength(1);
    expect(recs[0].priceFormatted).toBe("39.00");
    expect(recs[0].currency).toBe("EUR");
    expect(recs[0].url).toBe(
      "https://copypastelearn.com/products/terraform-aws-cookbook",
    );
  });

  it("ranks by keyword/title hits and drops zero-score items", async () => {
    findManyMock.mockResolvedValue([
      makeProduct({
        id: "prod_unrelated",
        slug: "ansible-x",
        title: "Ansible X",
        subtitle: "",
        description: "",
        categories: [],
        tags: [],
      }),
      makeProduct(), // matches "terraform" + "aws"
    ]);
    const { recommendProducts } = await import("@/lib/commerce/assistant");
    const recs = await recommendProducts("terraform aws");

    expect(recs).toHaveLength(1);
    expect(recs[0].productId).toBe("prod_1");
    expect(recs[0].matchScore).toBeGreaterThan(0);
  });

  it("never returns more than `limit` items (and caps at 10)", async () => {
    findManyMock.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) =>
        makeProduct({ id: `prod_${i}`, slug: `slug-${i}` }),
      ),
    );
    const { recommendProducts } = await import("@/lib/commerce/assistant");
    const r1 = await recommendProducts("recipes", { limit: 3 });
    expect(r1).toHaveLength(3);

    const r2 = await recommendProducts("recipes", { limit: 999 });
    expect(r2.length).toBeLessThanOrEqual(10);
  });

  it("returns recent published items when query has no usable tokens", async () => {
    findManyMock.mockResolvedValue([makeProduct()]);
    const { recommendProducts } = await import("@/lib/commerce/assistant");
    const recs = await recommendProducts("the and of");
    expect(recs).toHaveLength(1);
  });
});
