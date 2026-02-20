import { redirect } from "next/navigation";

interface LabSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

// Labs are temporarily unavailable while infrastructure is being configured.
// Redirect all lab session requests to the dashboard.
export default async function LabSessionPage({ params }: LabSessionPageProps) {
  redirect("/dashboard");
}
