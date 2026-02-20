"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLabSession } from "@/server/actions/labs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Terminal, Loader2 } from "lucide-react";

interface LabLauncherProps {
  labDefinitionId: string;
  courseSlug: string;
  lessonSlug: string;
}

export function LabLauncher({
  labDefinitionId,
  courseSlug,
  lessonSlug,
}: LabLauncherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = () => {
    setError(null);
    startTransition(async () => {
      const result = await createLabSession(labDefinitionId);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        router.push(`/labs/${result.data.sessionId}`);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Terminal className="h-4 w-4" />
          Interactive Lab
        </CardTitle>
        <CardDescription>
          Practice what you&apos;ve learned in a live environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleLaunch}
          disabled={isPending}
          className="w-full"
          size="sm"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Lab...
            </>
          ) : (
            <>
              <Terminal className="mr-2 h-4 w-4" />
              Start Lab
            </>
          )}
        </Button>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
