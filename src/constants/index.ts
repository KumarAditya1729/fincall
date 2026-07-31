import type { AppRole, FollowupStatus, LoanStatus, RecoveryStatus } from "@/types";

export const APP_NAME = "Recovera";
export const APP_TAGLINE = "Loan Recovery Management for Microfinance";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  BRANCH_MANAGER: "branch_manager",
  RECOVERY_EXECUTIVE: "recovery_executive",
} as const satisfies Record<string, AppRole>;

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  branch_manager: "Branch Manager",
  recovery_executive: "Recovery Executive",
};

export const ROLE_PRIORITY: AppRole[] = ["super_admin", "branch_manager", "recovery_executive"];

export const RECOVERY_STATUS_LABELS: Record<RecoveryStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  ptp: "Promise to Pay",
  partially_paid: "Partially Paid",
  paid: "Paid",
  non_contactable: "Non Contactable",
  legal: "Legal",
  written_off: "Written Off",
};

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: "Active",
  overdue: "Overdue",
  npa: "NPA",
  closed: "Closed",
  settled: "Settled",
};

export const FOLLOWUP_STATUS_LABELS: Record<FollowupStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  missed: "Missed",
  cancelled: "Cancelled",
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const QUERY_KEYS = {
  currentUser: ["current-user"] as const,
  branches: ["branches"] as const,
  customers: ["customers"] as const,
  customerDetail: (id: string) => ["customers", "detail", id] as const,
  calls: ["calls"] as const,
  callStatuses: ["call-statuses"] as const,
  recoveryQueue: ["recovery", "queue"] as const,
  todaysWork: ["recovery", "today"] as const,
  timeline: (id: string) => ["recovery", "timeline", id] as const,
  employees: ["employees"] as const,
  adminDashboard: ["dashboard", "admin"] as const,
  executiveDashboard: ["dashboard", "executive"] as const,
  branchPerformance: ["dashboard", "branch-performance"] as const,
  callTrend: ["dashboard", "call-trend"] as const,
  recentActivity: ["activity", "recent"] as const,
  auditLogs: ["audit-logs"] as const,
  adminBranches: ["admin", "branches"] as const,
  adminEmployees: ["admin", "employees"] as const,
  adminMasters: ["admin", "masters"] as const,
  adminPermissions: ["admin", "permissions"] as const,
  adminHolidays: ["admin", "holidays"] as const,
  adminWorkingHours: ["admin", "working-hours"] as const,
  adminTemplates: ["admin", "templates"] as const,
  adminCompanySettings: ["admin", "company-settings"] as const,
  adminImportBatches: ["admin", "import-batches"] as const,
} as const;

export const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const TEMPLATE_CHANNEL_LABELS: Record<string, string> = {
  sms: "SMS",
  email: "Email",
  whatsapp: "WhatsApp",
  in_app: "In-app",
};

export const MASTER_KIND_LABELS: Record<string, string> = {
  recovery_status: "Recovery statuses",
  purpose: "Call purposes",
  talked_with: "Talked with",
  call_outcome: "Call outcomes",
};

export const AUDIT_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",
  CUSTOMER_VIEW: "customer.view",
  CUSTOMER_UPDATE: "customer.update",
  CALL_UPDATE: "call.update",
  STATUS_CHANGE: "status.change",
  FOLLOWUP_CREATE: "followup.create",
  FOLLOWUP_COMPLETE: "followup.complete",
  REMARK_CREATE: "remark.create",
  PAYMENT_RECORD: "payment.record",
  DATA_EXPORT: "data.export",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const CALL_PURPOSES = [
  { value: "recovery_followup", label: "Recovery follow-up" },
  { value: "ptp_reminder", label: "PTP reminder" },
  { value: "overdue_notice", label: "Overdue notice" },
  { value: "payment_confirmation", label: "Payment confirmation" },
  { value: "address_verification", label: "Address verification" },
  { value: "legal_warning", label: "Legal warning" },
  { value: "other", label: "Other" },
] as const;
