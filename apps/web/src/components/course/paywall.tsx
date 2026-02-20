"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaywallProps {
  title?: string;
  description?: string;
  isSignedIn?: boolean;
  className?: string;
}

export function Paywall({
  title = "Subscribe to unlock",
  description = "Get unlimited access to all lessons, interactive labs, and exclusive content.",
  isSignedIn = false,
  className,
}: PaywallProps) {
  return (
    <Card className={cn("text-center", className)}>
      <CardHeader>
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            All video lessons & tutorials
          </li>
          <li className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Interactive hands-on labs
          </li>
          <li className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Code snippets & downloadable resources
          </li>
        </ul>
        {isSignedIn ? (
          <CheckoutButton className="w-full">
            Subscribe Now — €29/month
          </CheckoutButton>
        ) : (
          <Button asChild className="w-full">
            <Link href="/pricing">
              View Plans — €29/month
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
