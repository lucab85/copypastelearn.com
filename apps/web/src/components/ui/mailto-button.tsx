"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Client-rendered mailto button. The email is assembled only on the client
 * so server-rendered HTML never contains a plain `mailto:` href that
 * Cloudflare/CDN email obfuscation can rewrite into a broken
 * `/cdn-cgi/l/email-protection` URL.
 */
export function MailtoButton({
  user,
  domain,
  subject,
  children,
  ...props
}: {
  user: string;
  domain: string;
  subject?: string;
  children: React.ReactNode;
} & Omit<ButtonProps, "onClick">) {
  function handleClick() {
    const email = `${user}@${domain}`;
    const params = subject ? `?subject=${encodeURIComponent(subject)}` : "";
    window.location.href = `mailto:${email}${params}`;
  }

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}
