"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * A row that scrolls sideways with CSS scroll-snap on small screens and is
 * laid out by `listClassName` (a grid) from the `lg` breakpoint, where the
 * dots disappear. No library: the browser does the scrolling, this component
 * only tracks which slide is in view and moves to a slide when a dot is used.
 * Every slide must hold a link or a button: focusing it scrolls the slide into
 * view, which is how the row is reached from the keyboard.
 */
export function SnapCarousel({
  label,
  children,
  listClassName,
  itemClassName,
  dotsClassName,
}: {
  /** Accessible name of the carousel, e.g. "Featured". */
  label: string;
  children: ReactNode;
  listClassName?: string;
  /** One class per slide, or the same class for all. */
  itemClassName?: string | string[];
  dotsClassName?: string;
}) {
  const slides = Children.toArray(children);
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const center = list.scrollLeft + list.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    Array.from(list.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (d < distance) {
        distance = d;
        nearest = index;
      }
    });
    setActive(nearest);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const handler = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(onScroll);
    };
    list.addEventListener("scroll", handler, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("scroll", handler);
    };
  }, [onScroll]);

  function goTo(index: number) {
    const list = listRef.current;
    const slide = list?.children[index] as HTMLElement | undefined;
    if (!list || !slide) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({
      left: slide.offsetLeft - (list.clientWidth - slide.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={listRef}
        className={cn(
          "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4",
          listClassName
        )}
      >
        {slides.map((slide, index) => (
          <li
            key={index}
            className={cn(
              "shrink-0 snap-center",
              Array.isArray(itemClassName) ? itemClassName[index] : itemClassName
            )}
          >
            {slide}
          </li>
        ))}
      </ul>
      {slides.length > 1 && (
        <div className={cn("mt-4 flex justify-center gap-1", dotsClassName)}>
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show card ${index + 1} of ${slides.length}`}
              aria-current={index === active ? "true" : undefined}
              className="group flex h-6 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === active
                    ? "w-5 bg-foreground"
                    : "w-2 bg-foreground/50 group-hover:bg-foreground/80"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
