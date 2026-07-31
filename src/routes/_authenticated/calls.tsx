import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { QUERY_KEYS } from "@/constants";
import { fetchCallFeed, type CallFeedRow } from "@/features/calls/services/callService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTableState } from "@/hooks/useTableState";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/calls")({
  head: () => ({
    meta: [
      { title: "Calls — Recovera" },
      {
        name: "description",
        content:
          "Review every borrower call: outcome, duration, promise-to-pay and the executive who made it.",
      },
      { property: "og:title", content: "Calls — Recovera" },
      {
        property: "og:description",
        content: "Call activity feed across your branches and recovery executives.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallsPage,
});

function CallsPage() {
  const [search, setSearch] = useState("");
  const [connection, setConnection] = useState<"all" | "connected" | "not_connected">("all");
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();

  // Debounced so typing a name issues one query instead of one per keystroke.
  const filters = { search: useDebouncedValue(search), connection };
  const calls = useQuery({
    queryKey: [...QUERY_KEYS.calls, filters, page, pageSize],
    queryFn: () => fetchCallFeed(filters, page, pageSize),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<DataTableColumn<CallFeedRow>[]>(
    () => [
      {
        id: "customer",
        header: "Customer",
        cell: (row) =>
          row.customer ? (
            <Link
              to="/customers/$customerId"
              params={{ customerId: row.customer.id }}
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              {row.customer.full_name}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "outcome",
        header: "Outcome",
        cell: (row) => (
          <Badge
            variant="secondary"
            className={
              row.is_connected
                ? "border-0 bg-success/15 text-success"
                : "border-0 bg-muted text-muted-foreground"
            }
          >
            {row.status?.name ?? (row.is_connected ? "Connected" : "Not connected")}
          </Badge>
        ),
      },
      { id: "by", header: "Executive", cell: (row) => row.caller?.full_name ?? "—" },
      {
        id: "duration",
        header: "Duration",
        className: "tabular-nums",
        cell: (row) => `${row.duration_seconds}s`,
      },
      {
        id: "ptp",
        header: "PTP",
        cell: (row) =>
          row.ptp_amount ? `${formatCurrency(row.ptp_amount)} · ${formatDate(row.ptp_date)}` : "—",
      },
      { id: "at", header: "Called at", cell: (row) => formatDateTime(row.called_at) },
    ],
    [],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Calls"
          description="Every logged conversation, scoped to the branches you can access."
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              resetPage();
            }}
            placeholder="Search by customer name"
            label="Search calls by customer name"
            maxLength={80}
            className="flex-1"
          />
          <FilterSelect
            value={connection}
            onChange={(value) => {
              setConnection(value as typeof connection);
              resetPage();
            }}
            options={[
              { value: "all", label: "All calls" },
              { value: "connected", label: "Connected" },
              { value: "not_connected", label: "Not connected" },
            ]}
            label="Filter by connection"
            className="sm:w-[190px]"
          />
        </div>

        <DataTable
          caption="Call activity"
          columns={columns}
          rows={calls.data?.rows ?? []}
          rowKey={(row) => row.id}
          isLoading={calls.isLoading}
          error={calls.error}
          onRetry={() => void calls.refetch()}
          emptyState={
            <EmptyState
              icon={PhoneCall}
              title="No calls yet"
              description="Calls logged from a customer profile appear here instantly."
            />
          }
        />

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={calls.data?.total ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </AppShell>
  );
}
