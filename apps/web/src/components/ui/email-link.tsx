"use client";

import { useEffect, useState } from "react";

/**
 * Client-rendered email link that bypasses Cloudflare's Email Address
 * Obfuscation. The email is split into parts so the server-rendered HTML
 * never contains a plain `mailto:` href that Cloudflare can rewrite into
 * a broken `/cdn-cgi/l/email-protection` URL.
 */
export function EmailLink({
  user,
  domain,
  className,
}: {
  /** Local part before the @ (e.g. "hello") */
  user: string;
  /** Domain after the @ (e.g. "copypastelearn.com") */
  domain: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // SSR — render parts separately so Cloudflare email obfuscation
    // cannot detect a full email address to rewrite
    return (
      <span className={className}>
        {user}
        <span>{"@"}</span>
        {domain}
      </span>
    );
  }

  const email = `${user}@${domain}`;
  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  );
}
