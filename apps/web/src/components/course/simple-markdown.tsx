import { Fragment, type ReactNode } from "react";

/**
 * Small, safe Markdown renderer for course documents (Hands-On Lab): headings,
 * paragraphs, lists (one level of nesting), fenced code, **bold**, `code`.
 * It builds React elements and never injects HTML.
 */

/** Inline `code` and **bold** only, for one-line texts (quiz questions). */
export function InlineMarkdown({ text }: { text: string }) {
  return <>{inline(text)}</>;
}

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; code: string; indent: number }
  | { type: "list"; ordered: boolean; items: { text: string; indent: number }[] };

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^(\s*)```/);
    if (fence) {
      const indent = fence[1].length;
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        code.push(lines[i].slice(Math.min(indent, lines[i].search(/\S|$/))));
        i++;
      }
      i++;
      blocks.push({ type: "code", code: code.join("\n"), indent });
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }
    const item = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (item) {
      const ordered = /\d/.test(item[2]);
      const items: { text: string; indent: number }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
        if (m) {
          items.push({ text: m[3], indent: m[1].length });
          i++;
        } else if (lines[i].trim() && /^\s+\S/.test(lines[i]) && !/^\s*```/.test(lines[i]) && items.length) {
          items[items.length - 1].text += " " + lines[i].trim();
          i++;
        } else if (!lines[i].trim() && /^(\s*)([-*]|\d+\.)\s+/.test(lines[i + 1] ?? "")) {
          i++;
        } else break;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s|^\s*```|^\s*([-*]|\d+\.)\s+/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }
  return blocks;
}

export function SimpleMarkdown({ source }: { source: string }) {
  return (
    <div className="space-y-4 leading-relaxed">
      {parse(source).map((b, i) => {
        if (b.type === "heading") {
          if (b.level === 1) return <h1 key={i} className="text-3xl font-bold tracking-tight">{inline(b.text)}</h1>;
          if (b.level === 2) return <h2 key={i} className="border-b pb-2 pt-6 text-2xl font-semibold">{inline(b.text)}</h2>;
          if (b.level === 3) return <h3 key={i} className="pt-3 text-lg font-semibold">{inline(b.text)}</h3>;
          return <h4 key={i} className="pt-2 font-semibold">{inline(b.text)}</h4>;
        }
        if (b.type === "code") {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-100"
              style={{ marginLeft: b.indent ? "1.5rem" : undefined }}
            >
              <code>{b.code}</code>
            </pre>
          );
        }
        if (b.type === "list") {
          const List = b.ordered ? "ol" : "ul";
          const base = Math.min(...b.items.map((it) => it.indent));
          return (
            <List key={i} className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-1.5 pl-6`}>
              {b.items.map((it, j) => (
                <li key={j} style={{ marginLeft: it.indent > base ? "1.5rem" : undefined }}>
                  {inline(it.text)}
                </li>
              ))}
            </List>
          );
        }
        return <p key={i}>{inline(b.text)}</p>;
      })}
    </div>
  );
}
