"use client";

import { useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";

export function DiscountBanner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  if (!code) return null;

  return (
    <div className="mb-8 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
        <Tag className="h-4 w-4" />
        <span>
          Discount code <strong className="font-bold">{code}</strong> will be
          applied at checkout!
        </span>
      </div>
    </div>
  );
}

export function useDiscountCode(): string | null {
  const searchParams = useSearchParams();
  return searchParams.get("code");
}
