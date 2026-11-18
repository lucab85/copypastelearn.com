import Link from "next/link";

export interface PillGroup {
  label: string;
  links: { href: string; label: string }[];
}

/**
 * Pill links to the tracks and the article categories. A group wraps on
 * desktop and scrolls sideways on a phone.
 */
export function ExplorePills({ groups }: { groups: PillGroup[] }) {
  const shown = groups.filter((g) => g.links.length > 0);
  if (shown.length === 0) return null;
  return (
    <nav aria-label="Explore categories" className="py-4 lg:py-6">
      <div className="container mx-auto space-y-3 px-4">
        {shown.map((group) => (
          <div key={group.label} className="flex items-center gap-3">
            <p className="w-16 shrink-0 text-sm font-medium text-muted-foreground">
              {group.label}
            </p>
            <ul className="no-scrollbar -mr-4 flex min-w-0 gap-2 overflow-x-auto py-1 pr-4 md:mr-0 md:flex-wrap md:overflow-visible md:pr-0">
              {group.links.map((link) => (
                <li key={link.href} className="shrink-0">
                  <Link
                    href={link.href}
                    className="inline-flex h-10 items-center whitespace-nowrap rounded-full border bg-background px-4 text-sm font-medium outline-none transition-colors hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
