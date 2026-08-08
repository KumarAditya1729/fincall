import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { recordAudit } from "@/features/audit/services/auditService";
import { buildIlikeOr, sanitizeSearchTerm } from "@/lib/supabase-filters";
import { AUDIT_ACTIONS } from "@/constants";
import type { RecoveryStatus } from "@/types";

export interface LogCallInput {
  customerId: string;
  loanId?: string | null;
  branchId: string | null;
  calledBy: string;
  callStatusId: string;
  isConnected: boolean;
  durationSeconds: number;
  purpose?: string | null;
  talkedWith?: string | null;
  remark?: string | null;
  ptpAmount?: number | null;
  ptpDate?: string | null;
  nextFollowupDate?: string | null;
  recoveryStatus?: RecoveryStatus | null;
}

const logCallSchema = z.object({
  customerId: z.string().uuid(),
  calledBy: z.string().uuid(),
  callStatusId: z.string().uuid("Select a call outcome"),
  durationSeconds: z.number().int().min(0).max(86_400),
  purpose: z.string().trim().max(60).nullable().optional(),
  talkedWith: z.string().trim().max(120).nullable().optional(),
  remark: z.string().trim().max(1000).nullable().optional(),
  ptpAmount: z.number().positive().max(100_000_000).nullable().optional(),
});

export async function logCall(input: LogCallInput): Promise<string> {
  logCallSchema.parse(input);

  const { data, error } = await supabase
    .from("call_logs")
    .insert({
      customer_id: input.customerId,
      loan_id: input.loanId ?? null,
      branch_id: input.branchId,
      called_by: input.calledBy,
      call_status_id: input.callStatusId,
      is_connected: input.isConnected,
      duration_seconds: input.durationSeconds,
      purpose: input.purpose ?? null,
      talked_with: input.talkedWith ?? null,
      remark: input.remark ?? null,
      ptp_amount: input.ptpAmount ?? null,
      ptp_date: input.ptpDate ?? null,
      next_followup_date: input.nextFollowupDate ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.nextFollowupDate) {
    const { error: followupError } = await supabase.from("followups").insert({
      customer_id: input.customerId,
      call_log_id: data.id,
      branch_id: input.branchId,
      assigned_to: input.calledBy,
      scheduled_date: input.nextFollowupDate,
      status: "pending",
      priority: input.ptpDate ? "high" : "medium",
      notes: input.remark ?? null,
    });
    if (followupError) throw followupError;
  }

  if (input.recoveryStatus) {
    const { error: statusError } = await supabase
      .from("customers")
      .update({ recovery_status: input.recoveryStatus })
      .eq("id", input.customerId);
    if (statusError) throw statusError;
  }

  await recordAudit({
    action: AUDIT_ACTIONS.CALL_UPDATE,
    entityType: "call_logs",
    entityId: data.id,
    userId: input.calledBy,
    branchId: input.branchId,
    metadata: {
      customerId: input.customerId,
      isConnected: input.isConnected,
      purpose: input.purpose ?? null,
      recoveryStatus: input.recoveryStatus ?? null,
      remark: input.remark ?? null,
    },
  });

  return data.id;
}

const remarkSchema = z.object({
  customerId: z.string().uuid(),
  authorId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a remark first").max(1000, "Remark is too long"),
});

export async function addRemark(input: {
  customerId: string;
  authorId: string;
  branchId: string | null;
  body: string;
}): Promise<void> {
  const parsed = remarkSchema.parse(input);

  const { data, error } = await supabase
    .from("remarks")
    .insert({
      customer_id: input.customerId,
      author_id: input.authorId,
      branch_id: input.branchId,
      body: parsed.body,
    })
    .select("id")
    .single();
  if (error) throw error;

  await recordAudit({
    action: AUDIT_ACTIONS.REMARK_CREATE,
    entityType: "remarks",
    entityId: data.id,
    userId: input.authorId,
    branchId: input.branchId,
    metadata: { customerId: input.customerId, body: parsed.body },
  });
}

export async function completeFollowup(input: {
  followupId: string;
  userId: string;
  branchId: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from("followups")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", input.followupId);
  if (error) throw error;

  await recordAudit({
    action: AUDIT_ACTIONS.FOLLOWUP_COMPLETE,
    entityType: "followups",
    entityId: input.followupId,
    userId: input.userId,
    branchId: input.branchId,
  });
}

export interface CallFeedFilters {
  search: string;
  connection: "all" | "connected" | "not_connected";
}

export async function fetchCallFeed(filters: CallFeedFilters, page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const term = sanitizeSearchTerm(filters.search);
  let query = supabase
    .from("call_logs")
    .select(
      `*, customer:customers!${term ? "inner" : "left"}(id, full_name, customer_code), status:call_status(name), caller:profiles!call_logs_called_by_fkey(full_name)`,
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("called_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.connection !== "all") {
    query = query.eq("is_connected", filters.connection === "connected");
  }
  if (term) {
    query = query.or(buildIlikeOr(["full_name", "customer_code"], term), {
      referencedTable: "customer",
    });
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { rows: (data ?? []) as unknown as CallFeedRow[], total: count ?? 0 };
}

export interface CallFeedRow {
  id: string;
  called_at: string;
  is_connected: boolean;
  duration_seconds: number;
  remark: string | null;
  ptp_amount: number | null;
  ptp_date: string | null;
  customer: { id: string; full_name: string; customer_code: string } | null;
  status: { name: string } | null;
  caller: { full_name: string } | null;
}
