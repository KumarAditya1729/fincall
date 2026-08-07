import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect, optionsFromLabels } from "@/components/common/FilterSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { RecoveryStatusBadge } from "@/components/common/RecoveryStatusBadge";
import { SearchInput } from "@/components/common/SearchInput";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { QUERY_KEYS, RECOVERY_STATUS_LABELS, ROLES } from "@/constants";
import { hasRole, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LogCallDialog } from "@/features/calls/components/LogCallDialog";
import { fetchBranches } from "@/features/customers/services/customerService";
import { BrokenPromiseDialog } from "@/features/recovery/components/BrokenPromiseDialog";
import { CallButton } from "@/features/recovery/components/CallButton";
import { FollowupSchedulerDialog } from "@/features/recovery/components/FollowupSchedulerDialog";
import { RecordPaymentDialog } from "@/features/recovery/components/RecordPaymentDialog";
import {
  fetchEmployees,
  fetchRecoveryQueue,
  RECOVERY_BUCKET_LABELS,
  type RecoveryQueueFilters,
  type RecoveryQueueRow,
} from "@/features/recovery/services/recoveryService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTableState } from "@/hooks/useTableState";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { RecoveryStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery queue — Recovera" },
      {
        name: "description",
        content:
          "Work the recovery queue: overdue borrowers, promises to pay, broken promises and uncontacted accounts.",
      },
      { property: "og:title", content: "Recovery queue — Recovera" },
      {
        property: "og:description",
        content: "Prioritised borrower queue with click-to-call, payments and follow-ups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecoveryQueuePage,
});

function RecoveryQueuePage() {
  const { data: user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [loanSearch, setLoanSearch] = useState("");
  const [status, setStatus] = useState<RecoveryStatus | "all">("all");
  const [branchId, setBranchId] = useState<string>("all");
  const [assignedTo, setAssignedTo] = useState<string>("all");
  const [bucket, setBucket] = useState<RecoveryQueueFilters["bucket"]>("all");
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();

  const canFilterBranch = hasRole(user, ROLES.SUPER_ADMIN);
  const canFilterEmployee = hasRole(user, ROLES.SUPER_ADMIN, ROLES.BRANCH_MANAGER);

  const branches = useQuery({
    queryKey: QUERY_KEYS.branches,
    queryFn: fetchBranches,
    enabled: canFilterBranch,
  });
  const employees = useQuery({
    queryKey: [...QUERY_KEYS.employees, branchId],
    queryFn: () => fetchEmployees(branchId === "all" ? null : branchId),
    enabled: canFilterEmployee,
  });

  // Debounced so typing a name issues one query instead of one per keystroke.
  const filters: RecoveryQueueFilters = {
    search: useDebouncedValue(search),
    loanSearch: useDebouncedValue(loanSearch),
    status,
    branchId,
    assignedTo,
    bucket,
  };
  const queue = useQuery({
    queryKey: [...QUERY_KEYS.recoveryQueue, filters, page, pageSize],
    queryFn: () => fetchRecoveryQueue(filters, page, pageSize),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<DataTableColumn<RecoveryQueueRow>[]>(
    () => [
      {
        id: "customer",
        header: "Borrower",
        cell: (row) => (
          <div className="min-w-0">
            <Link
              to="/customers/$customerId"
              params={{ customerId: row.id }}
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              {row.full_name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {row.customer_code} · {row.phone}
            </p>
          </div>
        ),
      },
      {
        id: "exposure",
        header: "Exposure",
        className: "tabular-nums",
        cell: (row) => (
          <div>
            <p className="text-sm font-medium text-foreground">{formatCurrency(row.outstanding)}</p>
            <p className="text-xs text-danger">
              {formatCurrency(row.overdue)} overdue · {row.maxDpd} DPD
            </p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <RecoveryStatusBadge status={row.recovery_status} />
            {row.isBrokenPromise ? (
              <Badge variant="secondary" className="border-0 bg-danger/15 text-danger">
                Broken PTP
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "ptp",
        header: "Promise",
        cell: (row) =>
          row.ptpAmount ? `${formatCurrency(row.ptpAmount)} · ${formatDate(row.ptpDate)}` : "—",
      },
      {
        id: "lastCall",
        header: "Last call",
        cell: (row) => (row.lastCallAt ? formatDateTime(row.lastCallAt) : "Never"),
      },
      {
        id: "assignee",
        header: "Executive",
        cell: (row) => row.assignee?.full_name ?? "Unassigned",
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        cell: (row) =>
          user ? (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <CallButton
                phone={row.phone}
                afterCallClose={() => {
                  window.location.href = `/customers/${row.id}`;
                }}
              />
              <LogCallDialog
                customerId={row.id}
                branchId={row.branch?.id ?? user.branchId}
                user={user}
              />
              <FollowupSchedulerDialog
                customerId={row.id}
                branchId={row.branch?.id ?? user.branchId}
                user={user}
              />
              <RecordPaymentDialog
                customerId={row.id}
                branchId={row.branch?.id ?? user.branchId}
                user={user}
              />
              {row.recovery_status === "ptp" ? <BrokenPromiseDialog customerId={row.id} /> : null}
            </div>
          ) : null,
      },
    ],
    [user],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Recovery queue"
          description="Prioritised borrower worklist with click-to-call, outcomes, payments and follow-ups."
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              resetPage();
            }}
            placeholder="Search name, phone or customer code"
            label="Search borrowers"
          />
          <SearchInput
            value={loanSearch}
            onChange={(value) => {
              setLoanSearch(value);
              resetPage();
            }}
            placeholder="Search loan number"
            label="Search by loan number"
            maxLength={50}
          />
          <FilterSelect
            value={bucket}
            onChange={(value) => {
              setBucket(value as RecoveryQueueFilters["bucket"]);
              resetPage();
            }}
            options={Object.entries(RECOVERY_BUCKET_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            label="Filter by queue bucket"
          />
          <FilterSelect
            value={status}
            onChange={(value) => {
              setStatus(value as RecoveryStatus | "all");
              resetPage();
            }}
            options={optionsFromLabels(RECOVERY_STATUS_LABELS, "All statuses")}
            label="Filter by recovery status"
          />
          {canFilterBranch ? (
            <FilterSelect
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setAssignedTo("all");
                resetPage();
              }}
              options={[
                { value: "all", label: "All branches" },
                ...(branches.data ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ]}
              label="Filter by branch"
            />
          ) : null}
          {canFilterEmployee ? (
            <FilterSelect
              value={assignedTo}
              onChange={(value) => {
                setAssignedTo(value);
                resetPage();
              }}
              options={[
                { value: "all", label: "All executives" },
                ...(employees.data ?? []).map((employee) => ({
                  value: employee.id,
                  label: employee.full_name || "Unnamed",
                })),
              ]}
              label="Filter by employee"
            />
          ) : null}
        </div>

        <DataTable
          caption="Recovery queue"
          columns={columns}
          rows={queue.data?.rows ?? []}
          rowKey={(row) => row.id}
          isLoading={queue.isLoading}
          error={queue.error}
          onRetry={() => void queue.refetch()}
          emptyState={
            <EmptyState
              icon={Users}
              title="Queue is clear"
              description="No borrowers match these filters right now."
            />
          }
        />

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={queue.data?.total ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </AppShell>
  );
}
