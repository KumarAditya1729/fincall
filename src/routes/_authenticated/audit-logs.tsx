import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { QUERY_KEYS, ROLES } from "@/constants";
import { fetchAuditLogs, type AuditLogRow } from "@/features/audit/services/auditLogService";
import { hasRole, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTableState } from "@/hooks/useTableState";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — Recovera" },
      {
        name: "description",
        content:
          "Immutable record of logins, data access and record changes across the recovery platform.",
      },
      { property: "og:title", content: "Audit Logs — Recovera" },
      {
        property: "og:description",
        content: "Compliance-grade audit trail for every action taken in the platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [search, setSearch] = useState("");
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();
  // Debounced so typing issues one query instead of one per keystroke.
  const debouncedSearch = useDebouncedValue(search);

  const isSuperAdmin = hasRole(user, ROLES.SUPER_ADMIN);

  const logs = useQuery({
    queryKey: [...QUERY_KEYS.auditLogs, debouncedSearch, page, pageSize],
    queryFn: () => fetchAuditLogs(page, pageSize, debouncedSearch),
    enabled: isSuperAdmin,
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<DataTableColumn<AuditLogRow>[]>(
    () => [
      {
        id: "action",
        header: "Action",
        cell: (row) => (
          <Badge variant="secondary" className="border-0 bg-brand/10 font-medium text-brand">
            {row.action}
          </Badge>
        ),
      },
      { id: "entity", header: "Entity", cell: (row) => row.entity_type ?? "—" },
      {
        id: "user",
        header: "User",
        cell: (row) => row.user?.full_name ?? row.user_id?.slice(0, 8) ?? "System",
      },
      { id: "at", header: "Timestamp", cell: (row) => formatDateTime(row.created_at) },
    ],
    [],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Audit logs"
          description="Every login, view and change is recorded and cannot be edited."
        />

        {!userLoading && !isSuperAdmin ? (
          <div className="rounded-xl border border-border bg-card p-10">
            <EmptyState
              icon={ShieldCheck}
              title="Restricted"
              description="Only Super Admins can view the platform audit trail."
            />
          </div>
        ) : (
          <>
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                resetPage();
              }}
              placeholder="Filter by action"
              label="Filter audit logs by action"
              maxLength={60}
              className="max-w-md"
            />

            <DataTable
              caption="Audit trail"
              columns={columns}
              rows={logs.data?.rows ?? []}
              rowKey={(row) => row.id}
              isLoading={logs.isLoading}
              error={logs.error}
              onRetry={() => void logs.refetch()}
              emptyState={
                <EmptyState
                  icon={ShieldCheck}
                  title="No audit entries"
                  description="Activity will appear here as your team uses the platform."
                />
              }
            />

            <TablePagination
              page={page}
              pageSize={pageSize}
              total={logs.data?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
