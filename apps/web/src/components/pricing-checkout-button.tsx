"use client";

import { useSearchParams } from "next/navigation";
import { CheckoutButton } from "@/components/checkout-button";
import { SUBSCRIPTION_PRICE_EUR } from "@copypastelearn/shared";
import type { ButtonProps } from "@/components/ui/button";

interface PricingCheckoutButtonProps extends Omit<ButtonProps, "onClick"> {
  children?: React.ReactNode;
}

export function PricingCheckoutButton({
  children,
  ...props
}: PricingCheckoutButtonProps) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? undefined;

  return (
    <CheckoutButton promoCode={code} {...props}>
      {children ?? `Subscribe Now — €${SUBSCRIPTION_PRICE_EUR}/mo`}
    </CheckoutButton>
  );
}
