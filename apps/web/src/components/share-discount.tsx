"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";

interface ShareDiscountProps {
  code: string;
}

export function ShareDiscount({ code }: ShareDiscountProps) {
  const [copied, setCopied] = useState(false);

  const url = `https://www.copypastelearn.com/pricing?code=${encodeURIComponent(code)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "CopyPasteLearn — Discount Code",
          text: `Use code ${code} to get a discount on CopyPasteLearn!`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Link
          </>
        )}
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="mr-1.5 h-3.5 w-3.5" />
        Share
      </Button>
    </div>
  );
}
