"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";

interface ProgressCardProps {
  title: string;
  slug: string;
  percentComplete: number;
  nextLesson?: { slug: string; title: string } | null;
  thumbnailUrl?: string | null;
  className?: string;
}

function ProgressRing({
  percent,
  size = 56,
  strokeWidth = 4,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const isComplete = percent >= 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "animate-progress-ring transition-all",
            isComplete ? "text-green-500" : "text-primary"
          )}
          style={
            {
              "--progress-circumference": circumference,
              "--progress-offset": offset,
            } as React.CSSProperties
          }
        />
      </svg>
      <span
        className={cn(
          "absolute text-xs font-bold tabular-nums",
          isComplete ? "text-green-500" : "text-foreground"
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          `${Math.round(percent)}%`
        )}
      </span>
    </div>
  );
}

export function ProgressCard({
  title,
  slug,
  percentComplete,
  nextLesson,
  thumbnailUrl,
  className,
}: ProgressCardProps) {
  const isComplete = percentComplete >= 100;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        isComplete && "border-green-200 dark:border-green-900/40",
        className
      )}
    >
      {/* Thumbnail */}
      {thumbnailUrl && (
        <Link href={`/courses/${slug}`} className="block">
          <div className="relative h-32 w-full overflow-hidden bg-muted">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {/* Progress ring overlay */}
            <div className="absolute bottom-2 right-2 rounded-full bg-background/90 p-1 backdrop-blur-sm">
              <ProgressRing percent={percentComplete} size={40} strokeWidth={3} />
            </div>
          </div>
        </Link>
      )}

      <CardContent className={cn("space-y-3", thumbnailUrl ? "p-4" : "p-5")}>
        {/* Title + inline ring (when no thumbnail) */}
        <div className="flex items-center gap-3">
          {!thumbnailUrl && (
            <ProgressRing percent={percentComplete} size={48} strokeWidth={3.5} />
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={`/courses/${slug}`}
              className="text-sm font-semibold leading-tight hover:underline line-clamp-2"
            >
              {title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {isComplete ? "Completed ✓" : `${Math.round(percentComplete)}% complete`}
            </p>
          </div>
        </div>

        {/* Progress bar (compact, below title) */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={Math.round(percentComplete)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${title} progress: ${Math.round(percentComplete)}%`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isComplete
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-primary/80 to-primary"
            )}
            style={{ width: `${Math.min(percentComplete, 100)}%` }}
          />
        </div>

        {/* Next lesson CTA */}
        {nextLesson && !isComplete && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs group/btn hover:bg-primary/5"
            asChild
          >
            <Link href={`/courses/${slug}/lessons/${nextLesson.slug}`}>
              <span className="flex items-center gap-2 truncate">
                <BookOpen className="h-3 w-3 shrink-0 text-primary" />
                <span className="truncate">{nextLesson.title}</span>
              </span>
              <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
