import { getAdminLabSessions } from "@/server/actions/admin";
import { LabSessionsTable } from "@/components/admin/lab-sessions-table";

export const metadata = { title: "Lab Sessions" };

export default async function AdminLabsPage() {
  const sessions = await getAdminLabSessions();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Active Lab Sessions</h1>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No active lab sessions.</p>
        </div>
      ) : (
        <LabSessionsTable sessions={sessions} />
      )}
    </div>
  );
}
