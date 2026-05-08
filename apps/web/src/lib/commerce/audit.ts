import { db } from "@/lib/db";

/**
 * Persist an admin audit event (FR-031). All admin server actions
 * MUST call this on success so the trail is queryable post-incident.
 */
export async function logAdminAction(args: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db.adminAuditEvent.create({
    data: {
      actorId: args.actorId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      payload: args.payload as object | undefined,
    },
  });
}
