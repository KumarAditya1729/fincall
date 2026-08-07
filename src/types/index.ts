import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];

export type AppRole = Enums["app_role"];
export type RecoveryStatus = Enums["recovery_status"];
export type LoanStatus = Enums["loan_status"];
export type FollowupStatus = Enums["followup_status"];

export type Branch = Tables["branches"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Customer = Tables["customers"]["Row"];
export type Loan = Tables["loans"]["Row"];
export type Payment = Tables["payments"]["Row"];
export type CallStatus = Tables["call_status"]["Row"];
export type CallLog = Tables["call_logs"]["Row"];
export type Followup = Tables["followups"]["Row"];
export type Remark = Tables["remarks"]["Row"];

export interface CurrentUser {
  id: string;
  email: string;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  branchId: string | null;
  branch?: { id: string; name: string } | null;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface CustomerFilters {
  search: string;
  status: RecoveryStatus | "all";
  branchId: string | "all";
}

export interface AdminDashboardMetrics {
  totalCustomers: number;
  totalLoans: number;
  outstandingAmount: number;
  todaysCalls: number;
  connectedCalls: number;
  pendingCalls: number;
  todaysCollection: number;
  recoveryRate: number;
}

export interface ExecutiveDashboardMetrics {
  assignedCustomers: number;
  todaysCalls: number;
  completedCalls: number;
  pendingFollowups: number;
  nextFollowups: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  customers: number;
  calls: number;
  collection: number;
  recoveryRate: number;
}

export interface ExecutivePerformance {
  userId: string;
  name: string;
  calls: number;
  connected: number;
  collection: number;
}

export interface TrendPoint {
  label: string;
  calls: number;
  collection: number;
}
