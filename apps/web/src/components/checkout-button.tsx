"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/server/actions/billing";

interface CheckoutButtonProps extends Omit<ButtonProps, "onClick"> {
  children: React.ReactNode;
}

export function CheckoutButton({ children, ...props }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (error) {
      console.error("Checkout failed:", error);
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting to checkout…
        </>
      ) : (
        children
      )}
    </Button>
  );
}
