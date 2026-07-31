import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
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
import { QUERY_KEYS } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import { BranchFormDialog } from "@/features/admin/components/BranchFormDialog";
import {
  fetchBranchPage,
  restoreBranches,
  setBranchesActive,
  softDeleteBranches,
  type BranchFilters,
} from "@/features/admin/services/branchService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useTableState } from "@/hooks/useTableState";
import { toastError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { Branch } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/branches")({
  head: () => ({
    meta: [
      { title: "Branch Management — Recovera" },
      {
        name: "description",
        content: "Create, edit and deactivate collection branches with full audit history.",
      },
      { property: "og:title", content: "Branch Management — Recovera" },
      {
        property: "og:description",
        content: "Administer branch master data for your microfinance recovery operation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BranchFilters["status"]>("active");
  const [editing, setEditing] = useState<Branch | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete" | "restore" | "deactivate">(null);
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();
  const selection = useRowSelection();

  const filters: BranchFilters = { search: useDebouncedValue(search), status };
  const branches = useQuery({
    queryKey: [...QUERY_KEYS.adminBranches, filters, page, pageSize],
    queryFn: () => fetchBranchPage(filters, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const bulk = useMutation({
    mutationFn: async (action: "delete" | "restore" | "deactivate") => {
      if (action === "delete") return softDeleteBranches(selection.selectedIds);
      if (action === "restore") return restoreBranches(selection.selectedIds);
      return setBranchesActive(selection.selectedIds, false);
    },
    onSuccess: async (_result, action) => {
      toast.success(
        action === "delete"
          ? "Branches archived"
          : action === "restore"
            ? "Branches restored"
            : "Branches deactivated",
      );
      selection.clear();
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminBranches });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches });
    },
    onError: (error) => toastError(error, "Could not update the selected branches"),
  });

  const columns = useMemo<DataTableColumn<Branch>[]>(
    () => [
      {
        id: "name",
        header: "Branch",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.code}</p>
          </div>
        ),
      },
      { id: "city", header: "City", cell: (row) => row.city ?? "—" },
      { id: "state", header: "State", cell: (row) => row.state ?? "—" },
      { id: "phone", header: "Phone", cell: (row) => row.phone ?? "—" },
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
      { id: "updated", header: "Updated", cell: (row) => formatDate(row.updated_at) },
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
            title="Branch management"
            description="Branches define the access boundary for every borrower, loan and call."
            actions={
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                New branch
              </Button>
            }
          />
          <AdminTabs />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                resetPage();
              }}
              placeholder="Search by name, code or city"
              label="Search branches"
              className="flex-1"
            />
            <FilterSelect
              value={status}
              onChange={(value) => {
                setStatus(value as BranchFilters["status"]);
                selection.clear();
                resetPage();
              }}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "deleted", label: "Archived" },
                { value: "all", label: "All branches" },
              ]}
              label="Filter branches by status"
              className="sm:w-[180px]"
            />
          </div>

          {selection.count > 0 ? (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"
            >
              <span className="font-medium">{selection.count} selected</span>
              <Button size="sm" variant="outline" onClick={() => setConfirm("deactivate")}>
                Deactivate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm("restore")}>
                Restore
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirm("delete")}>
                Archive
              </Button>
              <Button size="sm" variant="ghost" onClick={selection.clear}>
                Clear
              </Button>
            </div>
          ) : null}

          <DataTable
            caption="Branches"
            columns={columns}
            rows={branches.data?.rows ?? []}
            rowKey={(row) => row.id}
            isLoading={branches.isLoading}
            error={branches.error}
            onRetry={() => void branches.refetch()}
            selection={{
              selectedIds: selection.selectedIds,
              onToggle: selection.toggle,
              onToggleAll: selection.toggleAll,
              label: "branches",
            }}
            emptyState={
              <EmptyState
                icon={Building2}
                title="No branches found"
                description="Create your first branch to start allocating borrowers and employees."
              />
            }
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={branches.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        <BranchFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          branch={editing}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminBranches });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches });
          }}
        />

        <ConfirmDialog
          open={confirm !== null}
          onOpenChange={(open) => setConfirm(open ? confirm : null)}
          title={
            confirm === "delete"
              ? "Archive selected branches?"
              : confirm === "restore"
                ? "Restore selected branches?"
                : "Deactivate selected branches?"
          }
          description={
            confirm === "delete"
              ? "Archived branches stay in reports and audit history but can no longer be assigned."
              : confirm === "restore"
                ? "Restored branches become active and assignable again."
                : "Inactive branches remain visible but cannot be selected for new records."
          }
          confirmLabel={confirm === "delete" ? "Archive" : "Continue"}
          destructive={confirm === "delete"}
          isPending={bulk.isPending}
          onConfirm={() => confirm && bulk.mutate(confirm)}
        />
      </AdminGuard>
    </AppShell>
  );
}
