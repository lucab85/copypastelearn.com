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
 * From the keyboard the row is reached through the dots (buttons) and through
 * any link or button inside a slide: focusing it scrolls the slide into view.
 */
export function SnapCarousel({
  label,
  children,
  listClassName,
  itemClassName,
  dotsClassName,
  focusableList = false,
}: {
  /** Accessible name of the carousel, e.g. "Featured". */
  label: string;
  children: ReactNode;
  listClassName?: string;
  /** One class per slide, or the same class for all. */
  itemClassName?: string | string[];
  dotsClassName?: string;
  /**
   * For slides with no link or button inside (quotes): while the row really
   * scrolls, the row itself takes keyboard focus so arrow keys can scroll it.
   */
  focusableList?: boolean;
}) {
  const slides = Children.toArray(children);
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [overflows, setOverflows] = useState(false);

  // Only a row that really scrolls (small screens) is a keyboard stop.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !focusableList) return;
    const measure = () => setOverflows(list.scrollWidth > list.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [focusableList]);

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
        tabIndex={focusableList && overflows ? 0 : undefined}
        aria-label={focusableList && overflows ? label : undefined}
        className={cn(
          "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
              aria-label={`${label}: show card ${index + 1} of ${slides.length}`}
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
