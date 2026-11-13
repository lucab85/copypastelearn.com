"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A short silent cut of a real lesson, looping in the hero. It plays by itself
 * only when the visitor has not asked for reduced motion; otherwise it shows
 * the poster with the browser's controls.
 */
export function LessonClip({
  src,
  poster,
  caption,
}: {
  src: string;
  poster: string;
  caption: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [controls, setControls] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setControls(true);
      return;
    }
    video.play().catch(() => setControls(true)); // autoplay refused: let them press play
  }, []);

  return (
    <figure>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        controls={controls}
        aria-label={caption}
        className="aspect-video w-full rounded-xl border border-white/15 bg-black object-cover"
      >
        <source src={src} type="video/mp4" />
      </video>
      <figcaption className="mt-3 text-sm text-slate-400">{caption}</figcaption>
    </figure>
  );
}
