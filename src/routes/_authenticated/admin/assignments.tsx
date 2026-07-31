import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { RecoveryStatusBadge } from "@/components/common/RecoveryStatusBadge";
import { SearchInput } from "@/components/common/SearchInput";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import {
  assignCustomers,
  transferCustomersBranch,
} from "@/features/admin/services/assignmentService";
import { fetchAssignableEmployees } from "@/features/admin/services/employeeService";
import {
  fetchBranches,
  fetchCustomers,
  type CustomerListItem,
} from "@/features/customers/services/customerService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useTableState } from "@/hooks/useTableState";
import { toastError } from "@/lib/errors";
import type { CustomerFilters } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/assignments")({
  head: () => ({
    meta: [
      { title: "Bulk Transfers — Recovera" },
      {
        name: "description",
        content: "Reassign borrowers between recovery executives and branches in bulk.",
      },
      { property: "og:title", content: "Bulk Transfers — Recovera" },
      {
        property: "og:description",
        content: "Move recovery portfolios between staff and branches with a full audit trail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [status, setStatus] = useState<CustomerFilters["status"]>("all");
  const [targetEmployee, setTargetEmployee] = useState("unassigned");
  const [targetBranch, setTargetBranch] = useState("");
  const [confirm, setConfirm] = useState<null | "assign" | "transfer">(null);
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();
  const selection = useRowSelection();

  const branches = useQuery({ queryKey: QUERY_KEYS.branches, queryFn: fetchBranches });
  const employees = useQuery({
    queryKey: [...QUERY_KEYS.employees, branchId],
    queryFn: () => fetchAssignableEmployees(branchId === "all" ? null : branchId),
  });

  const filters: CustomerFilters = {
    search: useDebouncedValue(search),
    status,
    branchId,
  };
  const customers = useQuery({
    queryKey: [...QUERY_KEYS.customers, "assignments", filters, page, pageSize],
    queryFn: () => fetchCustomers(filters, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const action = useMutation({
    mutationFn: async (kind: "assign" | "transfer") => {
      if (kind === "assign") {
        return assignCustomers(
          selection.selectedIds,
          targetEmployee === "unassigned" ? null : targetEmployee,
        );
      }
      return transferCustomersBranch(selection.selectedIds, targetBranch);
    },
    onSuccess: async (count) => {
      toast.success(`${count} borrower${count === 1 ? "" : "s"} updated`);
      selection.clear();
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recoveryQueue });
    },
    onError: (error) => toastError(error, "Could not transfer the selected borrowers"),
  });

  const columns = useMemo<DataTableColumn<CustomerListItem>[]>(
    () => [
      {
        id: "borrower",
        header: "Borrower",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.customer_code}</p>
          </div>
        ),
      },
      { id: "phone", header: "Phone", cell: (row) => row.phone },
      { id: "branch", header: "Branch", cell: (row) => row.branch?.name ?? "—" },
      {
        id: "status",
        header: "Status",
        cell: (row) => <RecoveryStatusBadge status={row.recovery_status} />,
      },
    ],
    [],
  );

  return (
    <AppShell>
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Bulk transfers"
            description="Select borrowers, then reassign them to another executive or branch."
          />
          <AdminTabs />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                resetPage();
              }}
              placeholder="Search by name, phone or code"
              label="Search borrowers"
              className="flex-1"
            />
            <FilterSelect
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                selection.clear();
                resetPage();
              }}
              options={[
                { value: "all", label: "All branches" },
                ...(branches.data ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ]}
              label="Filter borrowers by branch"
              className="lg:w-[200px]"
            />
            <FilterSelect
              value={status}
              onChange={(value) => {
                setStatus(value as CustomerFilters["status"]);
                resetPage();
              }}
              options={[
                { value: "all", label: "All statuses" },
                { value: "new", label: "New" },
                { value: "in_progress", label: "In progress" },
                { value: "ptp", label: "Promise to pay" },
                { value: "partially_paid", label: "Partially paid" },
                { value: "paid", label: "Paid" },
              ]}
              label="Filter borrowers by recovery status"
              className="lg:w-[190px]"
            />
          </div>

          {selection.count > 0 ? (
            <div
              role="status"
              className="space-y-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"
            >
              <p className="font-medium">{selection.count} borrower(s) selected</p>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <FilterSelect
                  value={targetEmployee}
                  onChange={setTargetEmployee}
                  options={[
                    { value: "unassigned", label: "Unassign" },
                    ...(employees.data ?? []).map((employee) => ({
                      value: employee.id,
                      label: employee.full_name || "Unnamed",
                    })),
                  ]}
                  label="Reassign to employee"
                  className="md:w-[240px]"
                />
                <Button size="sm" onClick={() => setConfirm("assign")}>
                  Reassign owner
                </Button>

                <FilterSelect
                  value={targetBranch}
                  onChange={setTargetBranch}
                  options={(branches.data ?? []).map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                  label="Transfer to branch"
                  placeholder="Select branch"
                  className="md:w-[240px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!targetBranch}
                  onClick={() => setConfirm("transfer")}
                >
                  Transfer branch
                </Button>
                <Button size="sm" variant="ghost" onClick={selection.clear}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}

          <DataTable
            caption="Borrowers available for transfer"
            columns={columns}
            rows={customers.data?.rows ?? []}
            rowKey={(row) => row.id}
            isLoading={customers.isLoading}
            error={customers.error}
            onRetry={() => void customers.refetch()}
            selection={{
              selectedIds: selection.selectedIds,
              onToggle: selection.toggle,
              onToggleAll: selection.toggleAll,
              label: "borrowers",
            }}
            emptyState={
              <EmptyState
                icon={Users}
                title="No borrowers match these filters"
                description="Adjust the search or branch filter to find the portfolio you want to move."
              />
            }
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={customers.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        <ConfirmDialog
          open={confirm !== null}
          onOpenChange={(open) => setConfirm(open ? confirm : null)}
          title="Transfer selected borrowers?"
          description="The change is applied atomically and recorded in the audit trail."
          isPending={action.isPending}
          onConfirm={() => confirm && action.mutate(confirm)}
        />
      </AdminGuard>
    </AppShell>
  );
}
