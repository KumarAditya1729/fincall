import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { formatCurrency, todayISO } from "@/lib/format";
import { sanitizeSearchTerm } from "@/lib/supabase-filters";
import type { PaginatedResult, RecoveryStatus } from "@/types";

export interface RecoveryQueueFilters {
  search: string;
  loanSearch: string;
  status: RecoveryStatus | "all";
  branchId: string | "all";
  assignedTo: string | "all";
  bucket: "all" | "overdue" | "ptp_today" | "broken_ptp" | "uncontacted";
}

export interface RecoveryQueueRow {
  id: string;
  full_name: string;
  customer_code: string;
  phone: string;
  recovery_status: RecoveryStatus;
  branch: { id: string; name: string } | null;
  assignee: { id: string; full_name: string } | null;
  outstanding: number;
  overdue: number;
  maxDpd: number;
  loanNumbers: string[];
  lastCallAt: string | null;
  ptpAmount: number | null;
  ptpDate: string | null;
  isBrokenPromise: boolean;
}

export const RECOVERY_BUCKET_LABELS: Record<RecoveryQueueFilters["bucket"], string> = {
  all: "All accounts",
  overdue: "Overdue loans",
  ptp_today: "PTP due today",
  broken_ptp: "Broken promises",
  uncontacted: "Never contacted",
};

type QueueArgs = Database["public"]["Functions"]["recovery_queue_page"]["Args"];

/** `all`/empty filter sentinels are omitted so the routine skips the predicate. */
function withFilter(args: QueueArgs, key: keyof QueueArgs, value: string | null | undefined) {
  if (!value || value === "all") return args;
  return { ...args, [key]: value } as QueueArgs;
}

/**
 * Recovery work queue.
 *
 * Filtering, bucket resolution, loan aggregation, last-call lookup, the exact total
 * and the page slice are all computed in a single index-backed SQL round-trip. The
 * routine runs as the caller (SECURITY INVOKER), so branch-scoped RLS still applies.
 */
export async function fetchRecoveryQueue(
  filters: RecoveryQueueFilters,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<RecoveryQueueRow>> {
  let args: QueueArgs = { _limit: pageSize, _offset: (page - 1) * pageSize };
  args = withFilter(args, "_search", sanitizeSearchTerm(filters.search));
  args = withFilter(args, "_loan_search", sanitizeSearchTerm(filters.loanSearch));
  args = withFilter(args, "_status", filters.status);
  args = withFilter(args, "_branch_id", filters.branchId);
  args = withFilter(args, "_assigned_to", filters.assignedTo);
  args = withFilter(args, "_bucket", filters.bucket);

  const { data, error } = await supabase.rpc("recovery_queue_page", args);
  if (error) throw error;

  const rows = data ?? [];
  return {
    rows: rows.map((row) => ({
      id: row.id,
      full_name: row.full_name,
      customer_code: row.customer_code,
      phone: row.phone,
      recovery_status: row.recovery_status as RecoveryStatus,
      branch: row.branch_id ? { id: row.branch_id, name: row.branch_name ?? "—" } : null,
      assignee: row.assignee_id
        ? { id: row.assignee_id, full_name: row.assignee_name ?? "—" }
        : null,
      outstanding: Number(row.outstanding ?? 0),
      overdue: Number(row.overdue ?? 0),
      maxDpd: Number(row.max_dpd ?? 0),
      loanNumbers: row.loan_numbers ?? [],
      lastCallAt: row.last_call_at ?? null,
      ptpAmount: row.ptp_amount === null ? null : Number(row.ptp_amount),
      ptpDate: row.ptp_date ?? null,
      isBrokenPromise: Boolean(row.is_broken_promise),
    })),
    total: Number(rows[0]?.total_count ?? 0),
  };
}

export interface TodayFollowup {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  priority: string;
  status: string;
  notes: string | null;
  customer: { id: string; full_name: string; phone: string; customer_code: string } | null;
}

export interface TodayCall {
  id: string;
  called_at: string;
  is_connected: boolean;
  purpose: string | null;
  remark: string | null;
  customer: { id: string; full_name: string } | null;
  status: { name: string } | null;
}

export interface TodaysWork {
  dueFollowups: TodayFollowup[];
  overdueFollowups: TodayFollowup[];
  calls: TodayCall[];
  connectedCount: number;
}

/** Everything an executive must action today: follow-ups due, overdue and calls made. */
export async function fetchTodaysWork(options: {
  onlyMine: boolean;
  userId: string;
}): Promise<TodaysWork> {
  const today = todayISO();

  let followupQuery = supabase
    .from("followups")
    .select(
      "id, scheduled_date, scheduled_time, priority, status, notes, customer:customers(id, full_name, phone, customer_code)",
    )
    .eq("status", "pending")
    .lte("scheduled_date", today)
    .is("deleted_at", null)
    .order("scheduled_date", { ascending: true })
    .limit(200);
  if (options.onlyMine) followupQuery = followupQuery.eq("assigned_to", options.userId);

  let callQuery = supabase
    .from("call_logs")
    .select(
      "id, called_at, is_connected, purpose, remark, customer:customers(id, full_name), status:call_status(name)",
    )
    .gte("called_at", `${today}T00:00:00.000Z`)
    .is("deleted_at", null)
    .order("called_at", { ascending: false })
    .limit(200);
  if (options.onlyMine) callQuery = callQuery.eq("called_by", options.userId);

  const [followupResult, callResult] = await Promise.all([followupQuery, callQuery]);
  if (followupResult.error) throw followupResult.error;
  if (callResult.error) throw callResult.error;

  const followups = (followupResult.data ?? []) as unknown as TodayFollowup[];
  const calls = (callResult.data ?? []) as unknown as TodayCall[];

  return {
    dueFollowups: followups.filter((item) => item.scheduled_date === today),
    overdueFollowups: followups.filter((item) => item.scheduled_date < today),
    calls,
    connectedCount: calls.filter((call) => call.is_connected).length,
  };
}

export async function fetchEmployees(branchId?: string | null) {
  let query = supabase
    .from("profiles")
    .select("id, full_name, branch_id")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name");
  if (branchId) query = query.eq("branch_id", branchId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export interface RecordPaymentInput {
  loanId: string;
  customerId: string;
  branchId: string | null;
  amount: number;
  paidOn: string;
  mode: string;
  referenceNo?: string | null;
  collectedBy: string;
  markPaid: boolean;
}

const paymentSchema = z.object({
  loanId: z.string().uuid("Select a loan"),
  customerId: z.string().uuid(),
  amount: z.number().positive("Amount must be greater than zero").max(100_000_000),
  paidOn: z.string().min(1, "Select a payment date"),
  mode: z.string().trim().min(1, "Select a payment mode").max(40),
  referenceNo: z.string().trim().max(80).nullable().optional(),
  collectedBy: z.string().uuid(),
});

/**
 * Records a collection. The insert, loan balance reduction, borrower status change
 * and audit trail run inside a single database transaction so a partial failure can
 * never leave a borrower's balance out of sync.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<string> {
  paymentSchema.parse(input);

  const { data, error } = await supabase.rpc("record_payment", {
    _loan_id: input.loanId,
    _customer_id: input.customerId,
    // The generated RPC types don't model SQL nullability; the function itself
    // falls back to the loan's own branch when this is null.
    _branch_id: input.branchId as string,
    _amount: input.amount,
    _paid_on: input.paidOn,
    _mode: input.mode,
    _reference_no: input.referenceNo ?? "",
    _mark_paid: input.markPaid,
  });
  if (error) throw error;

  return data as string;
}

const brokenPromiseSchema = z.object({
  customerId: z.string().uuid(),
  note: z.string().trim().min(3, "Describe what happened").max(500),
});

/**
 * Flags a promise-to-pay as broken. The remark and the borrower status change happen
 * inside one database transaction, and the caller's branch access is re-checked
 * server-side, so a partial write can never leave a borrower mislabelled.
 * The audit entry is written by the database trigger on `remarks`/`customers`.
 */
export async function markBrokenPromise(input: {
  customerId: string;
  note: string;
}): Promise<void> {
  const parsed = brokenPromiseSchema.parse(input);

  const { error } = await supabase.rpc("mark_broken_promise", {
    _customer_id: parsed.customerId,
    _note: parsed.note,
  });
  if (error) throw error;
}

export interface ScheduleFollowupInput {
  customerId: string;
  branchId: string | null;
  assignedTo: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string | null;
}

const followupSchema = z.object({
  customerId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  scheduledDate: z.string().min(1, "Pick a date"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  notes: z.string().trim().max(500).nullable().optional(),
});

/** Schedules the next touchpoint. Audited by the `followups` database trigger. */
export async function scheduleFollowup(input: ScheduleFollowupInput): Promise<void> {
  followupSchema.parse(input);

  const { error } = await supabase.from("followups").insert({
    customer_id: input.customerId,
    branch_id: input.branchId,
    assigned_to: input.assignedTo,
    scheduled_date: input.scheduledDate,
    scheduled_time: input.scheduledTime || null,
    priority: input.priority,
    status: "pending",
    notes: input.notes || null,
  });
  if (error) throw error;
}

export type TimelineKind = "call" | "payment" | "remark" | "followup";

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  at: string;
  title: string;
  description: string | null;
  actor: string | null;
  tone: "brand" | "success" | "warning" | "muted";
}

/** Unified borrower timeline: calls, payments, remarks and follow-ups in one stream. */
export async function fetchCustomerTimeline(customerId: string): Promise<TimelineEvent[]> {
  const [calls, payments, remarks, followups] = await Promise.all([
    supabase
      .from("call_logs")
      .select(
        "id, called_at, is_connected, purpose, remark, talked_with, ptp_amount, ptp_date, status:call_status(name), caller:profiles!call_logs_called_by_fkey(full_name)",
      )
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("called_at", { ascending: false })
      .limit(50),
    supabase
      .from("payments")
      .select(
        "id, amount, paid_on, mode, reference_no, created_at, collector:profiles!payments_collected_by_fkey(full_name)",
      )
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("paid_on", { ascending: false })
      .limit(50),
    supabase
      .from("remarks")
      .select("id, body, created_at, author:profiles!remarks_author_id_fkey(full_name)")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("followups")
      .select("id, scheduled_date, scheduled_time, status, priority, notes, created_at")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("scheduled_date", { ascending: false })
      .limit(50),
  ]);

  if (calls.error) throw calls.error;
  if (payments.error) throw payments.error;
  if (remarks.error) throw remarks.error;
  if (followups.error) throw followups.error;

  const events: TimelineEvent[] = [];

  for (const call of (calls.data ?? []) as unknown as Array<{
    id: string;
    called_at: string;
    is_connected: boolean;
    purpose: string | null;
    remark: string | null;
    talked_with: string | null;
    ptp_amount: number | null;
    ptp_date: string | null;
    status: { name: string } | null;
    caller: { full_name: string } | null;
  }>) {
    const parts = [
      call.purpose ? `Purpose: ${call.purpose}` : null,
      call.talked_with ? `Talked with ${call.talked_with}` : null,
      call.remark,
      call.ptp_amount ? `PTP ${formatCurrency(call.ptp_amount)} on ${call.ptp_date ?? "—"}` : null,
    ].filter(Boolean);
    events.push({
      id: `call-${call.id}`,
      kind: "call",
      at: call.called_at,
      title: `Call — ${call.status?.name ?? (call.is_connected ? "Connected" : "Not connected")}`,
      description: parts.length ? parts.join(" · ") : null,
      actor: call.caller?.full_name ?? null,
      tone: call.is_connected ? "brand" : "muted",
    });
  }

  for (const payment of (payments.data ?? []) as unknown as Array<{
    id: string;
    amount: number;
    paid_on: string;
    mode: string | null;
    reference_no: string | null;
    created_at: string;
    collector: { full_name: string } | null;
  }>) {
    events.push({
      id: `payment-${payment.id}`,
      kind: "payment",
      at: payment.created_at ?? payment.paid_on,
      title: `Payment received — ${formatCurrency(payment.amount)}`,
      description: [payment.mode, payment.reference_no].filter(Boolean).join(" · ") || null,
      actor: payment.collector?.full_name ?? null,
      tone: "success",
    });
  }

  for (const remark of (remarks.data ?? []) as unknown as Array<{
    id: string;
    body: string;
    created_at: string;
    author: { full_name: string } | null;
  }>) {
    events.push({
      id: `remark-${remark.id}`,
      kind: "remark",
      at: remark.created_at,
      title: remark.body.startsWith("Broken promise") ? "Broken promise" : "Remark",
      description: remark.body,
      actor: remark.author?.full_name ?? null,
      tone: remark.body.startsWith("Broken promise") ? "warning" : "muted",
    });
  }

  for (const followup of (followups.data ?? []) as unknown as Array<{
    id: string;
    scheduled_date: string;
    scheduled_time: string | null;
    status: string;
    priority: string;
    notes: string | null;
    created_at: string;
  }>) {
    events.push({
      id: `followup-${followup.id}`,
      kind: "followup",
      at: followup.created_at,
      title: `Follow-up ${followup.status} — ${followup.scheduled_date}${followup.scheduled_time ? ` ${followup.scheduled_time}` : ""}`,
      description: followup.notes,
      actor: null,
      tone: followup.status === "completed" ? "success" : "brand",
    });
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
