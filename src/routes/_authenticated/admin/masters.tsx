import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListTree } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MASTER_KIND_LABELS, QUERY_KEYS } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import {
  createMasterRow,
  fetchMasterRows,
  MASTER_KINDS,
  masterSchema,
  setMasterRowsDeleted,
  updateMasterRow,
  type MasterInput,
  type MasterKind,
  type MasterRow,
} from "@/features/admin/services/masterService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useTableState } from "@/hooks/useTableState";
import { toastError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/admin/masters")({
  head: () => ({
    meta: [
      { title: "Master Data — Recovera" },
      {
        name: "description",
        content: "Maintain call outcomes, purposes and other dropdown lists used by recovery teams.",
      },
      { property: "og:title", content: "Master Data — Recovera" },
      {
        property: "og:description",
        content: "Central master data lists that keep recovery reporting consistent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MastersPage,
});

const EMPTY: MasterInput = { label: "", code: "", sortOrder: 0, isActive: true, isConnected: true };

function MastersPage() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<MasterKind>("purpose");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "deleted">("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [values, setValues] = useState<MasterInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<null | "archive" | "restore">(null);
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();
  const selection = useRowSelection();

  const filters = { search: useDebouncedValue(search), status };
  const rows = useQuery({
    queryKey: [...QUERY_KEYS.adminMasters, kind, filters, page, pageSize],
    queryFn: () => fetchMasterRows(kind, filters, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!formOpen) return;
    setErrors({});
    setValues(
      editing
        ? {
            label: editing.label,
            code: editing.code ?? "",
            sortOrder: editing.sortOrder,
            isActive: editing.isActive,
            isConnected: editing.isConnected ?? true,
          }
        : EMPTY,
    );
  }, [formOpen, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = masterSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
        throw new Error("Fix the highlighted fields and try again.");
      }
      setErrors({});
      if (editing) await updateMasterRow(kind, editing.id, parsed.data);
      else await createMasterRow(kind, parsed.data);
    },
    onSuccess: async () => {
      toast.success(editing ? "Entry updated" : "Entry created");
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMasters });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.callStatuses });
    },
    onError: (error) => toastError(error, "Could not save the entry"),
  });

  const bulk = useMutation({
    mutationFn: (action: "archive" | "restore") =>
      setMasterRowsDeleted(kind, selection.selectedIds, action === "archive"),
    onSuccess: async () => {
      toast.success("Master data updated");
      selection.clear();
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMasters });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.callStatuses });
    },
    onError: (error) => toastError(error, "Could not update the selected entries"),
  });

  const columns = useMemo<DataTableColumn<MasterRow>[]>(
    () => [
      { id: "label", header: "Label", cell: (row) => row.label },
      { id: "code", header: "Code", cell: (row) => row.code ?? "—" },
      { id: "order", header: "Order", cell: (row) => row.sortOrder },
      {
        id: "status",
        header: "Status",
        cell: (row) =>
          row.deletedAt ? (
            <Badge variant="outline">Archived</Badge>
          ) : row.isActive ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <Button
            size="sm"
            variant="ghost"
            disabled={row.isSystem}
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
            title="Master data"
            description="Dropdown lists shared across calling, recovery and reporting."
            actions={
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                New entry
              </Button>
            }
          />
          <AdminTabs />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <FilterSelect
              value={kind}
              onChange={(value) => {
                setKind(value as MasterKind);
                selection.clear();
                resetPage();
              }}
              options={MASTER_KINDS.map((value) => ({
                value,
                label: MASTER_KIND_LABELS[value] ?? value,
              }))}
              label="Master data list"
              className="lg:w-[220px]"
            />
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                resetPage();
              }}
              placeholder="Search entries"
              label="Search master data"
              className="flex-1"
            />
            <FilterSelect
              value={status}
              onChange={(value) => {
                setStatus(value as typeof status);
                selection.clear();
                resetPage();
              }}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "deleted", label: "Archived" },
              ]}
              label="Filter master data by status"
              className="lg:w-[150px]"
            />
          </div>

          {selection.count > 0 ? (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"
            >
              <span className="font-medium">{selection.count} selected</span>
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
            caption={MASTER_KIND_LABELS[kind] ?? "Master data"}
            columns={columns}
            rows={rows.data?.rows ?? []}
            rowKey={(row) => row.id}
            isLoading={rows.isLoading}
            error={rows.error}
            onRetry={() => void rows.refetch()}
            selection={{
              selectedIds: selection.selectedIds,
              onToggle: selection.toggle,
              onToggleAll: selection.toggleAll,
              label: "entries",
            }}
            emptyState={
              <EmptyState
                icon={ListTree}
                title="No entries yet"
                description="Add the options your teams should see in this dropdown."
              />
            }
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={rows.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit entry" : "New entry"}</DialogTitle>
              <DialogDescription>
                Entries in {MASTER_KIND_LABELS[kind] ?? kind} appear wherever this list is used.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="master-label">Label</Label>
                <Input
                  id="master-label"
                  value={values.label}
                  maxLength={120}
                  onChange={(event) => setValues({ ...values, label: event.target.value })}
                  aria-invalid={errors["label"] ? true : undefined}
                />
                {errors["label"] ? <p className="text-xs text-danger">{errors["label"]}</p> : null}
              </div>

              {kind !== "call_outcome" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="master-code">Code (optional)</Label>
                  <Input
                    id="master-code"
                    value={values.code ?? ""}
                    maxLength={60}
                    onChange={(event) => setValues({ ...values, code: event.target.value })}
                    aria-invalid={errors["code"] ? true : undefined}
                  />
                  {errors["code"] ? <p className="text-xs text-danger">{errors["code"]}</p> : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="master-order">Sort order</Label>
                <Input
                  id="master-order"
                  type="number"
                  min={0}
                  max={9999}
                  value={values.sortOrder}
                  onChange={(event) =>
                    setValues({ ...values, sortOrder: Number(event.target.value) })
                  }
                />
              </div>

              {kind === "call_outcome" ? (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <Label htmlFor="master-connected" className="text-sm font-medium">
                    Counts as a connected call
                  </Label>
                  <Switch
                    id="master-connected"
                    checked={values.isConnected}
                    onCheckedChange={(checked) => setValues({ ...values, isConnected: checked })}
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label htmlFor="master-active" className="text-sm font-medium">
                  Active
                </Label>
                <Switch
                  id="master-active"
                  checked={values.isActive}
                  onCheckedChange={(checked) => setValues({ ...values, isActive: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={confirm !== null}
          onOpenChange={(open) => setConfirm(open ? confirm : null)}
          title="Update selected entries?"
          description="Archived entries stay in historical records but disappear from dropdowns."
          destructive={confirm === "archive"}
          isPending={bulk.isPending}
          onConfirm={() => confirm && bulk.mutate(confirm)}
        />
      </AdminGuard>
    </AppShell>
  );
}
