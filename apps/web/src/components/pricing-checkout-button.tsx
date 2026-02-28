"use client";

import { useSearchParams } from "next/navigation";
import { CheckoutButton } from "@/components/checkout-button";
import { SUBSCRIPTION_PRICE_EUR } from "@copypastelearn/shared";
import type { ButtonProps } from "@/components/ui/button";

interface PricingCheckoutButtonProps extends Omit<ButtonProps, "onClick"> {
  children?: React.ReactNode;
  plan?: "monthly" | "annual";
}

export function PricingCheckoutButton({
  children,
  plan = "monthly",
  ...props
}: PricingCheckoutButtonProps) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? undefined;

  return (
    <CheckoutButton promoCode={code} plan={plan} {...props}>
      {children ?? `Subscribe Now — €${SUBSCRIPTION_PRICE_EUR}/mo`}
    </CheckoutButton>
  );
}
