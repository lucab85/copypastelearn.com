"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tag, Check } from "lucide-react";

export function CouponInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const existingCode = searchParams.get("code");
  const [code, setCode] = useState(existingCode ?? "");
  const [applied, setApplied] = useState(!!existingCode);

  function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setApplied(true);
    // Update URL with code param so DiscountBanner + PricingCheckoutButton pick it up
    router.replace(`/pricing?code=${encodeURIComponent(trimmed)}`, {
      scroll: false,
    });
  }

  function handleRemove() {
    setCode("");
    setApplied(false);
    router.replace("/pricing", { scroll: false });
  }

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="rounded-lg border bg-muted/20 p-4">
        <label className="mb-2 block text-sm font-medium">
          Have a coupon code?
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter code (e.g. SAVE20)"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setApplied(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              disabled={applied}
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm uppercase outline-none transition-colors focus:border-primary disabled:opacity-60"
            />
          </div>
          {applied ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="shrink-0"
            >
              Remove
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!code.trim()}
              className="shrink-0"
            >
              Apply
            </Button>
          )}
        </div>
        {applied && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" />
            Code <strong>{code}</strong> will be applied at checkout
          </p>
        )}
      </div>
    </div>
  );
}
