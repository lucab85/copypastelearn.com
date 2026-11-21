import { cn } from "@/lib/utils";
import type { ProPitch } from "@/lib/pro-pitch";

/** The price of Pro and, while it runs, the launch offer. */
export function ProPitchLines({ pitch, className }: { pitch: ProPitch; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">{pitch.price}</p>
      {pitch.offer && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm">{pitch.offer}</p>}
    </div>
  );
}
