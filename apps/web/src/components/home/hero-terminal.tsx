"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Play } from "lucide-react";

/**
 * The home page hero: the product in one gesture. Pick a course, copy the
 * command, run it, read what it prints. The commands and their outputs are
 * recordings of real runs of the course labs, not mock-ups.
 */

export interface HeroDemo {
  id: string;
  tab: string;
  command: string;
  /** Recorded output, one entry per printed line. */
  output: string[];
  /** One sentence: what the learner just saw. */
  explain: string;
  courseTitle: string;
  /** Course page; null while the course is not published. */
  href: string | null;
}

const LINE_MS = 260;
const CHAR_MS = 14;

export function HeroTerminal({ demos }: { demos: HeroDemo[] }) {
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(0);
  const [lines, setLines] = useState(0);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demo = demos[active];
  const done = !running && lines === demo.output.length && typed === demo.command.length;

  function clear() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function run(index: number) {
    clear();
    const d = demos[index];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setActive(index);
    if (reduced) {
      setTyped(d.command.length);
      setLines(d.output.length);
      setRunning(false);
      return;
    }
    setTyped(0);
    setLines(0);
    setRunning(true);
    for (let i = 1; i <= d.command.length; i++) {
      timers.current.push(setTimeout(() => setTyped(i), i * CHAR_MS));
    }
    const start = d.command.length * CHAR_MS + 350;
    d.output.forEach((_, i) => {
      timers.current.push(setTimeout(() => setLines(i + 1), start + (i + 1) * LINE_MS));
    });
    timers.current.push(
      setTimeout(() => setRunning(false), start + d.output.length * LINE_MS + 50)
    );
  }

  // Run the first demo once on arrival: the page opens on something happening.
  useEffect(() => {
    run(0);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(demo.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard not available (http, old browser): the command stays selectable */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/15 bg-[#060b17] text-left">
      <div role="tablist" aria-label="Try a command from a course" className="flex border-b border-white/10">
        {demos.map((d, i) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={i === active}
            onClick={() => run(i)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              i === active
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {d.tab}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <pre className="min-h-[4.5rem] flex-1 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-100 sm:min-h-[3.25rem] sm:text-[15px]">
            <span className="select-none text-emerald-400">$ </span>
            {demo.command.slice(0, typed)}
          </pre>
          <button
            onClick={copy}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <pre
          aria-live="polite"
          className="mt-3 min-h-[11.5rem] overflow-x-auto border-t border-white/10 pt-3 font-mono text-xs leading-relaxed text-slate-300 sm:text-[13px]"
        >
          {demo.output.slice(0, lines).join("\n")}
        </pre>

        <div className="mt-3 flex min-h-[6.5rem] flex-col justify-between gap-3 border-t border-white/10 pt-3 sm:min-h-[4.5rem] sm:flex-row sm:items-center">
          <p className={`text-sm text-slate-300 transition-opacity ${done ? "opacity-100" : "opacity-0"}`}>
            {demo.explain}
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => run(active)}
              disabled={running}
              className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {running ? "Running" : "Run again"}
            </button>
            {demo.href && (
              <Link
                href={demo.href}
                className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:underline"
              >
                See the course
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
