"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminDestroyLabSession } from "@/server/actions/admin";
import { Trash2, Loader2, Clock } from "lucide-react";

interface Session {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  labTitle: string;
  status: string;
  expiresAt: string;
  startedAt: string;
}

interface LabSessionsTableProps {
  sessions: Session[];
}

export function LabSessionsTable({ sessions }: LabSessionsTableProps) {
  const router = useRouter();
  const [destroyingId, setDestroyingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDestroy = (sessionId: string) => {
    setDestroyingId(sessionId);
    startTransition(async () => {
      await adminDestroyLabSession(sessionId);
      setDestroyingId(null);
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Session</th>
            <th className="pb-2 font-medium">User</th>
            <th className="pb-2 font-medium">Lab</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Expires</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const remaining = Math.max(
              0,
              Math.floor(
                (new Date(session.expiresAt).getTime() - Date.now()) / 60_000
              )
            );

            return (
              <tr key={session.id} className="border-b">
                <td className="py-3">
                  <code className="text-xs">{session.id.slice(0, 16)}...</code>
                </td>
                <td className="py-3">
                  <span className="block">{session.userName ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {session.userEmail}
                  </span>
                </td>
                <td className="py-3">{session.labTitle}</td>
                <td className="py-3">
                  <Badge variant="outline">{session.status}</Badge>
                </td>
                <td className="py-3">
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {remaining}m
                  </span>
                </td>
                <td className="py-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDestroy(session.id)}
                    disabled={isPending && destroyingId === session.id}
                  >
                    {isPending && destroyingId === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
