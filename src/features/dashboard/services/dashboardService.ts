import { supabase } from "@/integrations/supabase/client";
import { startOfTodayISO, todayISO } from "@/lib/format";
import type {
  AdminDashboardMetrics,
  BranchPerformance,
  ExecutiveDashboardMetrics,
  ExecutivePerformance,
  TrendPoint,
} from "@/types";

type Filters = Record<string, string | boolean>;

async function countRows(
  table: "customers" | "loans" | "call_logs" | "followups",
  filters: Filters = {},
  ranges: { column: string; op: "gte" | "gt" | "lte"; value: string }[] = [],
): Promise<number> {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  for (const range of ranges) {
    query = query[range.op](range.column, range.value);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAdminMetrics(branchId: string | null): Promise<AdminDashboardMetrics> {
  const since = startOfTodayISO();
  const today = todayISO();
  const branchFilter: Filters = branchId ? { branch_id: branchId } : {};

  let paymentsQuery = supabase
    .from("payments")
    .select("amount")
    .is("deleted_at", null)
    .gte("paid_on", today);
  let loanQuery = supabase
    .from("loans")
    .select("outstanding_amount, overdue_amount")
    .is("deleted_at", null);
  if (branchId) {
    paymentsQuery = paymentsQuery.eq("branch_id", branchId);
    loanQuery = loanQuery.eq("branch_id", branchId);
  }

  const [customers, loans, calls, connected, payments, loanTotals] = await Promise.all([
    countRows("customers", branchFilter),
    countRows("loans", branchFilter),
    countRows("call_logs", branchFilter, [{ column: "called_at", op: "gte", value: since }]),
    countRows("call_logs", { ...branchFilter, is_connected: true }, [
      { column: "called_at", op: "gte", value: since },
    ]),
    paymentsQuery,
    loanQuery,
  ]);

  if (payments.error) throw payments.error;
  if (loanTotals.error) throw loanTotals.error;

  const todaysCollection = (payments.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const outstandingAmount = (loanTotals.data ?? []).reduce(
    (sum, row) => sum + Number(row.outstanding_amount ?? 0),
    0,
  );
  const overdueAmount = (loanTotals.data ?? []).reduce(
    (sum, row) => sum + Number(row.overdue_amount ?? 0),
    0,
  );

  return {
    totalCustomers: customers,
    totalLoans: loans,
    outstandingAmount,
    todaysCalls: calls,
    connectedCalls: connected,
    pendingCalls: Math.max(customers - calls, 0),
    todaysCollection,
    recoveryRate: overdueAmount > 0 ? Math.min((todaysCollection / overdueAmount) * 100, 100) : 0,
  };
}

export async function fetchExecutiveMetrics(userId: string): Promise<ExecutiveDashboardMetrics> {
  const since = startOfTodayISO();
  const today = todayISO();

  const [assigned, calls, connected, pending, upcoming] = await Promise.all([
    countRows("customers", { assigned_to: userId }),
    countRows("call_logs", { called_by: userId }, [
      { column: "called_at", op: "gte", value: since },
    ]),
    countRows("call_logs", { called_by: userId, is_connected: true }, [
      { column: "called_at", op: "gte", value: since },
    ]),
    countRows("followups", { assigned_to: userId, status: "pending" }, [
      { column: "scheduled_date", op: "lte", value: today },
    ]),
    countRows("followups", { assigned_to: userId, status: "pending" }, [
      { column: "scheduled_date", op: "gt", value: today },
    ]),
  ]);

  return {
    assignedCustomers: assigned,
    todaysCalls: calls,
    completedCalls: connected,
    pendingFollowups: pending,
    nextFollowups: upcoming,
  };
}

export async function fetchBranchPerformance(): Promise<BranchPerformance[]> {
  const [branches, customers, payments] = await Promise.all([
    supabase.from("branches").select("id, name").is("deleted_at", null),
    supabase.from("customers").select("id, branch_id").is("deleted_at", null),
    supabase.from("payments").select("amount, branch_id").is("deleted_at", null),
  ]);

  if (branches.error) throw branches.error;
  if (customers.error) throw customers.error;
  if (payments.error) throw payments.error;

  return (branches.data ?? []).map((branch) => {
    const branchCustomers = (customers.data ?? []).filter((c) => c.branch_id === branch.id).length;
    const collection = (payments.data ?? [])
      .filter((p) => p.branch_id === branch.id)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    return {
      branchId: branch.id,
      branchName: branch.name,
      customers: branchCustomers,
      calls: 0,
      collection,
      recoveryRate:
        branchCustomers > 0 ? Math.min((collection / (branchCustomers * 1000)) * 100, 100) : 0,
    };
  });
}

export async function fetchCallTrend(days = 7): Promise<TrendPoint[]> {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  const [calls, payments] = await Promise.all([
    supabase.from("call_logs").select("called_at").gte("called_at", from.toISOString()),
    supabase
      .from("payments")
      .select("amount, paid_on")
      .gte("paid_on", from.toISOString().slice(0, 10)),
  ]);

  if (calls.error) throw calls.error;
  if (payments.error) throw payments.error;

  const points: TrendPoint[] = [];
  for (let index = 0; index < days; index += 1) {
    const day = new Date(from);
    day.setDate(from.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    points.push({
      label: day.toLocaleDateString("en-IN", { weekday: "short" }),
      calls: (calls.data ?? []).filter((c) => c.called_at.slice(0, 10) === key).length,
      collection: (payments.data ?? [])
        .filter((p) => p.paid_on === key)
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
    });
  }
  return points;
}
