import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUERY_KEYS, ROLES } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import {
  CUSTOMER_IMPORT_COLUMNS,
  LOAN_IMPORT_COLUMNS,
  fetchImportBatches,
  parseImportFile,
  runImport,
  type ImportBatch,
  type ImportEntity,
  type ParsedImport,
} from "@/features/admin/services/importService";
import { fetchBranches } from "@/features/customers/services/customerService";
import { useCurrentUser, hasRole } from "@/features/auth/hooks/useCurrentUser";
import { useTableState } from "@/hooks/useTableState";
import { toastError } from "@/lib/errors";
import { downloadTemplate } from "@/lib/excel";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/imports")({
  head: () => ({
    meta: [
      { title: "Data Import — Recovera" },
      {
        name: "description",
        content: "Import borrowers and loan portfolios from Excel with row-level validation.",
      },
      { property: "og:title", content: "Data Import — Recovera" },
      {
        property: "og:description",
        content: "Validated Excel import pipeline for borrower and loan onboarding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ImportsPage,
});

function ImportsPage() {
  const queryClient = useQueryClient();
  const [entity, setEntity] = useState<ImportEntity>("customers");
  const [branchId, setBranchId] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [historyFilter, setHistoryFilter] = useState<ImportEntity | "all">("all");
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();

  const branches = useQuery({ queryKey: QUERY_KEYS.branches, queryFn: fetchBranches });

  const batches = useQuery({
    queryKey: [...QUERY_KEYS.adminImportBatches, historyFilter, page, pageSize],
    queryFn: () => fetchImportBatches({ entity: historyFilter }, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const { data: user } = useCurrentUser();
  const isSuperAdmin = hasRole(user, ROLES.SUPER_ADMIN);

  const parseMutation = useMutation({
    mutationFn: (f: File) => parseImportFile(entity, f),
    onSuccess: (result) => setParsed(result),
    onError: (error) => {
      setParsed(null);
      toastError(error, "Could not read that spreadsheet");
    },
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Upload a file first");
      return runImport({
        entity,
        fileName: file.name,
        branchId: entity === "customers" ? branchId || null : null,
        file,
      });
    },
    onSuccess: async () => {
      toast.success(`Import job has been queued in the background`);
      setParsed(null);
      setFile(null);
      setFileName("");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminImportBatches });
      await queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onError: (error) => toastError(error, "The import could not be queued"),
  });

  const columns = useMemo<DataTableColumn<ImportBatch>[]>(
    () => [
      { id: "file", header: "File", cell: (row) => row.file_name },
      { id: "entity", header: "Type", cell: (row) => row.entity_type },
      { id: "total", header: "Rows", cell: (row) => row.total_rows },
      { id: "success", header: "Imported", cell: (row) => row.success_rows },
      {
        id: "failed",
        header: "Failed",
        cell: (row) => (
          <span className={row.failed_rows > 0 ? "text-danger" : undefined}>{row.failed_rows}</span>
        ),
      },
      { id: "when", header: "Run at", cell: (row) => formatDateTime(row.created_at) },
    ],
    [],
  );

  const requiredColumns = entity === "customers" ? CUSTOMER_IMPORT_COLUMNS : LOAN_IMPORT_COLUMNS;
  const canImport =
    parsed !== null &&
    parsed.rows.length > 0 &&
    fileName.length > 0 &&
    (entity === "loans" || branchId.length > 0 || isSuperAdmin);

  return (
    <AppShell>
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Data import"
            description="Upload borrower and loan spreadsheets; every row is re-validated in the database."
          />
          <AdminTabs />

          <section
            aria-labelledby="import-upload"
            className="space-y-4 rounded-xl border border-border bg-card p-5"
          >
            <h2 id="import-upload" className="text-sm font-semibold">
              New import
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <FilterSelect
                value={entity}
                onChange={(value) => {
                  setEntity(value as ImportEntity);
                  setParsed(null);
                  setFileName("");
                }}
                options={[
                  { value: "customers", label: "Borrowers" },
                  { value: "loans", label: "Loans" },
                ]}
                label="What are you importing"
              />
              {entity === "customers" ? (
                <div className="space-y-1">
                  <FilterSelect
                    value={branchId}
                    onChange={setBranchId}
                    options={(branches.data ?? []).map((branch) => ({
                      value: branch.id,
                      label: branch.name,
                    }))}
                    label="Destination branch"
                    placeholder={isSuperAdmin ? "Select branch or leave blank" : "Select branch"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isSuperAdmin ? (
                      <>
                        Leave blank to assign borrowers using sheet columns like{' '}
                        <span className="font-mono">branch_code</span> and{' '}
                        <span className="font-mono">branch_name</span>.
                      </>
                    ) : (
                      'Branch selection is required for this import.'
                    )}
                  </p>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="import-file">Excel or CSV file</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(event) => {
                    const f = event.target.files?.[0];
                    if (!f) return;
                    parseMutation.reset();
                    setFile(f);
                    setFileName(f.name);
                    parseMutation.mutate(f);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void downloadTemplate(`${entity}-import-template`, [...requiredColumns]).catch(
                    toastError,
                  );
                }}
              >
                Download template
              </Button>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Required columns: {requiredColumns.join(", ")}
                </p>
                <p className="text-xs text-amber-500 font-medium">
                  अधिकतम सीमा: 2,000 पंक्तियाँ (rows) या 5MB प्रति फ़ाइल। (Max limit: 2,000 rows or
                  5MB per file).
                </p>
              </div>
            </div>

            {parseMutation.isPending ? (
              <p className="text-sm text-muted-foreground">Reading the file…</p>
            ) : null}

            {parseMutation.isError ? (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger space-y-1">
                <p className="font-semibold">फ़ाइल त्रुटि (File Error)</p>
                <p>
                  {parseMutation.error instanceof Error
                    ? parseMutation.error.message
                    : "Could not read the spreadsheet"}
                </p>
              </div>
            ) : null}

            {parsed ? (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p>
                  <span className="font-medium">{parsed.rows.length}</span> rows detected,{" "}
                  <span className={parsed.previewIssues.length > 0 ? "text-danger" : undefined}>
                    {parsed.previewIssues.length}
                  </span>{" "}
                  with missing required values.
                </p>
                {parsed.previewIssues.length > 0 ? (
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                    {parsed.previewIssues.slice(0, 20).map((issue) => (
                      <li key={issue.row}>
                        Row {issue.row}: {issue.reason}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Button
                  type="button"
                  disabled={!canImport || importMutation.isPending}
                  onClick={() => importMutation.mutate()}
                >
                  {importMutation.isPending ? "Importing…" : "Run import"}
                </Button>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="import-history" className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="import-history" className="text-sm font-semibold">
                Import history
              </h2>
              <FilterSelect
                value={historyFilter}
                onChange={(value) => {
                  setHistoryFilter(value as ImportEntity | "all");
                  resetPage();
                }}
                options={[
                  { value: "all", label: "All imports" },
                  { value: "customers", label: "Borrowers" },
                  { value: "loans", label: "Loans" },
                ]}
                label="Filter import history"
                className="sm:w-[180px]"
              />
            </div>

            <DataTable
              caption="Import history"
              columns={columns}
              rows={batches.data?.rows ?? []}
              rowKey={(row) => row.id}
              isLoading={batches.isLoading}
              error={batches.error}
              onRetry={() => void batches.refetch()}
              emptyState={
                <EmptyState
                  icon={FileSpreadsheet}
                  title="No imports yet"
                  description="Uploaded files and their row-level results will appear here."
                />
              }
            />

            <TablePagination
              page={page}
              pageSize={pageSize}
              total={batches.data?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </section>
        </div>
      </AdminGuard>
    </AppShell>
  );
}
