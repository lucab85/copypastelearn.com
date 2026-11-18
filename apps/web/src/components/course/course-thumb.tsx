import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseThumbProps {
  src: string | null | undefined;
  /** Empty when the title is printed next to the picture (the usual case). */
  alt?: string;
  /** `sizes` of the rendered box, for raster covers. */
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * A course cover in a 16:9 box with an 8px radius. Raster covers go through
 * next/image; the generated SVG covers are served as they are (the optimizer
 * does not handle SVG).
 */
export function CourseThumb({
  src,
  alt = "",
  sizes,
  className,
  priority = false,
}: CourseThumbProps) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-muted",
        className
      )}
    >
      {!src ? (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
        </div>
      ) : src.endsWith(".svg") ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          width={800}
          height={450}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      )}
    </div>
  );
}
