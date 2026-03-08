"use client";

import { useState } from "react";
import { Share2, Twitter, Linkedin, Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  description: string;
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const encoded = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    desc: encodeURIComponent(description),
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: description, url });
      } catch { /* user cancelled */ }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encoded.title}&url=${encoded.url}`}
        target="_blank"
        rel="noopener"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url}`}
        target="_blank"
        rel="noopener"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <button
        onClick={copyLink}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
      </button>
      {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
        <button
          onClick={share}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
