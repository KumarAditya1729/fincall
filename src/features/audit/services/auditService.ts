import { supabase } from "@/integrations/supabase/client";
import type { AuditAction } from "@/constants";

interface LogInput {
  action: AuditAction | string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  userId: string;
  branchId?: string | null;
}

/**
 * Records a human-readable activity entry (the in-app activity feed).
 *
 * The compliance audit trail in `audit_logs` is NOT written from here: database
 * triggers record every insert/update/delete on borrowers, loans, payments, calls,
 * follow-ups and remarks, so it cannot be skipped or forged by a client. This
 * function only adds business context (sign-ins, screen-level actions) and must
 * never be treated as the source of truth. Failures never break the user flow.
 */
export async function recordAudit(input: LogInput): Promise<void> {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: input.userId,
    branch_id: input.branchId ?? null,
    activity: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: (input.metadata ?? {}) as never,
  });

  if (error) console.warn("activity log failed", error.message);
}

export async function fetchRecentActivity(limit = 8) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, activity, entity_type, created_at, user_id, metadata")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
