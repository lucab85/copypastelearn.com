"use client";

import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Clock, Play, FlaskConical } from "lucide-react";

type LabStatus =
  | "PROVISIONING"
  | "READY"
  | "RUNNING"
  | "VALIDATING"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED"
  | "DESTROYED";

interface LabStatusIndicatorProps {
  status: LabStatus;
  className?: string;
}

const statusConfig: Record<
  LabStatus,
  { icon: React.ElementType; label: string; color: string; animate?: boolean }
> = {
  PROVISIONING: {
    icon: Loader2,
    label: "Provisioning...",
    color: "text-yellow-500",
    animate: true,
  },
  READY: {
    icon: Play,
    label: "Ready",
    color: "text-blue-500",
  },
  RUNNING: {
    icon: Play,
    label: "Running",
    color: "text-green-500",
  },
  VALIDATING: {
    icon: FlaskConical,
    label: "Validating...",
    color: "text-purple-500",
    animate: true,
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-600",
  },
  EXPIRED: {
    icon: Clock,
    label: "Expired",
    color: "text-orange-500",
  },
  FAILED: {
    icon: XCircle,
    label: "Failed",
    color: "text-red-500",
  },
  DESTROYED: {
    icon: XCircle,
    label: "Destroyed",
    color: "text-muted-foreground",
  },
};

export function LabStatusIndicator({
  status,
  className,
}: LabStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          config.animate && "animate-spin"
        )}
      />
      <span
        className={cn("text-sm font-medium", config.color)}
      >
        {config.label}
      </span>
    </div>
  );
}
