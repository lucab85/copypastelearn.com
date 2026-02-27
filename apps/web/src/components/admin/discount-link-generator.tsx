"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Share2, Plus, Trash2 } from "lucide-react";

interface GeneratedLink {
  code: string;
  url: string;
}

export function DiscountLinkGenerator() {
  const [code, setCode] = useState("");
  const [links, setLinks] = useState<GeneratedLink[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function handleGenerate() {
    if (!code.trim()) return;
    const trimmed = code.trim().toUpperCase();
    const url = `https://www.copypastelearn.com/pricing?code=${encodeURIComponent(trimmed)}`;
    setLinks((prev) => [{ code: trimmed, url }, ...prev]);
    setCode("");
  }

  async function handleCopy(url: string, idx: number) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  async function handleShare(link: GeneratedLink) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "CopyPasteLearn Discount",
          text: `Use code ${link.code} to get a discount on CopyPasteLearn!`,
          url: link.url,
        });
      } catch {
        // cancelled
      }
    }
  }

  function handleRemove(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate Discount Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Stripe promo code (e.g. SAVE20)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button onClick={handleGenerate} disabled={!code.trim()}>
              <Plus className="mr-1.5 h-4 w-4" />
              Generate
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The code must match a promotion code created in Stripe. The discount
            will be auto-applied at checkout.
          </p>
        </CardContent>
      </Card>

      {/* Generated Links */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Generated Links ({links.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {links.map((link, idx) => (
              <div
                key={`${link.code}-${idx}`}
                className="flex items-center gap-3 rounded-md border bg-muted/30 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{link.code}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {link.url}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(link.url, idx)}
                  >
                    {copiedIdx === idx ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleShare(link)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>1.</strong> Create a promotion code in{" "}
            <a
              href="https://dashboard.stripe.com/coupons"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Stripe Dashboard → Coupons
            </a>
          </p>
          <p>
            <strong>2.</strong> Enter the code above to generate a shareable URL
          </p>
          <p>
            <strong>3.</strong> Share the link — visitors see a discount banner
            and the code auto-applies at checkout
          </p>
          <p>
            <strong>4.</strong> If no code in URL, users can still manually enter
            promo codes at Stripe checkout
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
