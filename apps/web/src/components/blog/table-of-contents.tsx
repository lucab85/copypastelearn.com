"use client";

import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav className="hidden xl:block" aria-label="Table of contents">
      <div className="sticky top-24">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          On this page
        </h4>
        <ul className="space-y-1.5 border-l border-zinc-800">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block border-l-2 py-1 text-sm transition-colors ${
                  item.level === 3 ? "pl-6" : "pl-4"
                } ${
                  activeId === item.id
                    ? "border-blue-500 text-white font-medium"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
