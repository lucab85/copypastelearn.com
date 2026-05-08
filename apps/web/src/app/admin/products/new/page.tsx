"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/server/actions/admin/products";

const BRANDS = [
  "CopyPasteLearn",
  "AnsiblePilot",
  "TerraformPilot",
  "AnsibleByExample",
  "KubernetesRecipes",
] as const;
const TYPES = ["EBOOK", "TEMPLATE", "COURSE", "BUNDLE"] as const;

export default function NewProductPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    summary: "",
    description: "",
    productType: "EBOOK" as (typeof TYPES)[number],
    brand: "AnsiblePilot" as (typeof BRANDS)[number],
    priceAmountMajor: "29.00",
    currency: "EUR",
  });

  function submit() {
    setError(null);
    const major = Number.parseFloat(form.priceAmountMajor);
    if (!Number.isFinite(major) || major <= 0) {
      setError("Enter a valid price");
      return;
    }
    const priceAmount = Math.round(major * 100);

    startTransition(async () => {
      try {
        const r = await createProduct({
          slug: form.slug.trim(),
          title: form.title.trim(),
          summary: form.summary.trim() || undefined,
          description: form.description.trim() || undefined,
          productType: form.productType,
          brand: form.brand,
          priceAmount,
          currency: form.currency,
          categories: [],
        });
        router.push(`/admin/products/${r.productId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">New product</h1>

      <Field label="Slug" hint="lowercase, hyphenated, e.g. ansible-automation-playbook">
        <Input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />
      </Field>
      <Field label="Title">
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </Field>
      <Field label="Summary">
        <Input
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={6}
          className="w-full rounded-md border bg-background p-2 text-sm"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select
            value={form.productType}
            onChange={(e) =>
              setForm({ ...form, productType: e.target.value as (typeof TYPES)[number] })
            }
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Brand">
          <select
            value={form.brand}
            onChange={(e) =>
              setForm({ ...form, brand: e.target.value as (typeof BRANDS)[number] })
            }
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            {BRANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (major units)">
          <Input
            value={form.priceAmountMajor}
            onChange={(e) =>
              setForm({ ...form, priceAmountMajor: e.target.value })
            }
          />
        </Field>
        <Field label="Currency">
          <Input
            value={form.currency}
            onChange={(e) =>
              setForm({ ...form, currency: e.target.value.toUpperCase() })
            }
          />
        </Field>
      </div>

      <Button onClick={submit} disabled={pending}>
        {pending ? "Creating…" : "Create product"}
      </Button>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
