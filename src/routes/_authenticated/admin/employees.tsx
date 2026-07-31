import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS, ROLE_LABELS } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import { EmployeeFormDialog } from "@/features/admin/components/EmployeeFormDialog";
import {
  fetchEmployees,
  restoreEmployees,
  setEmployeesActive,
  softDeleteEmployees,
  type EmployeeFilters,
  type EmployeeRow,
} from "@/features/admin/services/employeeService";
import { fetchBranches } from "@/features/customers/services/customerService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useTableState } from "@/hooks/useTableState";
import { toastError } from "@/lib/errors";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/employees")({
  head: () => ({
    meta: [
      { title: "Employee Management — Recovera" },
      {
        name: "description",
        content: "Manage recovery staff, branch allocation and role assignments.",
      },
      { property: "og:title", content: "Employee Management — Recovera" },
      {
        property: "og:description",
        content: "Administer staff accounts, branches and permissions for loan recovery teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState<string>("all");
  const [role, setRole] = useState<EmployeeFilters["role"]>("all");
  const [status, setStatus] = useState<EmployeeFilters["status"]>("active");
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "deactivate" | "activate" | "archive" | "restore">(
    null,
  );
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();
  const selection = useRowSelection();

  const branches = useQuery({ queryKey: QUERY_KEYS.branches, queryFn: fetchBranches });

  const filters: EmployeeFilters = {
    search: useDebouncedValue(search),
    branchId,
    role,
    status,
  };
  const employees = useQuery({
    queryKey: [...QUERY_KEYS.adminEmployees, filters, page, pageSize],
    queryFn: () => fetchEmployees(filters, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const bulk = useMutation({
    mutationFn: async (action: NonNullable<typeof confirm>) => {
      if (action === "archive") return softDeleteEmployees(selection.selectedIds);
      if (action === "restore") return restoreEmployees(selection.selectedIds);
      return setEmployeesActive(selection.selectedIds, action === "activate");
    },
    onSuccess: async () => {
      toast.success("Employees updated");
      selection.clear();
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminEmployees });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
    },
    onError: (error) => toastError(error, "Could not update the selected employees"),
  });

  const columns = useMemo<DataTableColumn<EmployeeRow>[]>(
    () => [
      {
        id: "employee",
        header: "Employee",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.full_name || "Unnamed"}</p>
            <p className="truncate text-xs text-muted-foreground">{row.email ?? "—"}</p>
          </div>
        ),
      },
      { id: "code", header: "Code", cell: (row) => row.employee_code ?? "—" },
      { id: "branch", header: "Branch", cell: (row) => row.branch?.name ?? "—" },
      {
        id: "roles",
        header: "Roles",
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.roles.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              row.roles.map((value) => (
                <Badge key={value} variant="secondary">
                  {ROLE_LABELS[value]}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) =>
          row.deleted_at ? (
            <Badge variant="outline">Archived</Badge>
          ) : row.is_active ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          ),
      },
      { id: "joined", header: "Added", cell: (row) => formatDate(row.created_at) },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <AppShell>
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Employee management"
            description="Staff accounts are created on first sign-in; assign branch and roles here."
          />
          <AdminTabs />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                resetPage();
              }}
              placeholder="Search by name, email or code"
              label="Search employees"
              className="flex-1"
            />
            <FilterSelect
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                resetPage();
              }}
              options={[
                { value: "all", label: "All branches" },
                ...(branches.data ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ]}
              label="Filter employees by branch"
              className="lg:w-[180px]"
            />
            <FilterSelect
              value={role}
              onChange={(value) => {
                setRole(value as EmployeeFilters["role"]);
                resetPage();
              }}
              options={[
                { value: "all", label: "All roles" },
                ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
              ]}
              label="Filter employees by role"
              className="lg:w-[180px]"
            />
            <FilterSelect
              value={status}
              onChange={(value) => {
                setStatus(value as EmployeeFilters["status"]);
                selection.clear();
                resetPage();
              }}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "deleted", label: "Archived" },
                { value: "all", label: "All" },
              ]}
              label="Filter employees by status"
              className="lg:w-[150px]"
            />
          </div>

          {selection.count > 0 ? (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"
            >
              <span className="font-medium">{selection.count} selected</span>
              <Button size="sm" variant="outline" onClick={() => setConfirm("activate")}>
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm("deactivate")}>
                Deactivate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm("restore")}>
                Restore
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirm("archive")}>
                Archive
              </Button>
              <Button size="sm" variant="ghost" onClick={selection.clear}>
                Clear
              </Button>
            </div>
          ) : null}

          <DataTable
            caption="Employees"
            columns={columns}
            rows={employees.data?.rows ?? []}
            rowKey={(row) => row.id}
            isLoading={employees.isLoading}
            error={employees.error}
            onRetry={() => void employees.refetch()}
            selection={{
              selectedIds: selection.selectedIds,
              onToggle: selection.toggle,
              onToggleAll: selection.toggleAll,
              label: "employees",
            }}
            emptyState={
              <EmptyState
                icon={UserCog}
                title="No employees found"
                description="Employees appear here after they sign in for the first time."
              />
            }
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={employees.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        <EmployeeFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          employee={editing}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminEmployees });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
          }}
        />

        <ConfirmDialog
          open={confirm !== null}
          onOpenChange={(open) => setConfirm(open ? confirm : null)}
          title="Update selected employees?"
          description="Archived or deactivated employees keep their history but lose access to the platform."
          destructive={confirm === "archive"}
          isPending={bulk.isPending}
          onConfirm={() => confirm && bulk.mutate(confirm)}
        />
      </AdminGuard>
    </AppShell>
  );
}
