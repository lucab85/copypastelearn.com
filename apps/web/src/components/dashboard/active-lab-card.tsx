"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Terminal, Clock, ArrowRight } from "lucide-react";

interface ActiveLabCardProps {
  sessionId: string;
  labTitle: string;
  status: string;
  expiresAt: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  PROVISIONING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  READY: "bg-green-500/10 text-green-600 border-green-500/30",
  RUNNING: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  VALIDATING: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};

export function ActiveLabCard({
  sessionId,
  labTitle,
  status,
  expiresAt,
  className,
}: ActiveLabCardProps) {
  const remaining = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60_000)
  );
  const isUrgent = remaining <= 10;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-blue-200 transition-all duration-300 hover:shadow-lg dark:border-blue-800",
        className
      )}
    >
      {/* Subtle background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5" />

      <CardContent className="relative flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4 min-w-0">
          {/* Pulsing icon */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse-glow" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60">
              <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{labTitle}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  statusColors[status] ?? "bg-muted text-muted-foreground"
                )}
              >
                {status}
              </Badge>
              <span
                className={cn(
                  "flex items-center gap-1",
                  isUrgent
                    ? "font-semibold text-red-500"
                    : "text-muted-foreground"
                )}
              >
                <Clock className={cn("h-3 w-3", isUrgent && "animate-pulse")} />
                {remaining}m remaining
              </span>
            </div>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 shadow-sm" asChild>
          <Link href={`/labs/${sessionId}`}>
            Resume Lab
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
