"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Terminal, Clock } from "lucide-react";

interface ActiveLabCardProps {
  sessionId: string;
  labTitle: string;
  status: string;
  expiresAt: string;
  className?: string;
}

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

  return (
    <Card className={cn("border-blue-200 dark:border-blue-800", className)}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{labTitle}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {status}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {remaining}m remaining
              </span>
            </div>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href={`/labs/${sessionId}`}>Resume Lab</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
