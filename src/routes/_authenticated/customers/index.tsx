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
import { QUERY_KEYS, RECOVERY_STATUS_LABELS, ROLES } from "@/constants";
import { hasRole, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  fetchBranches,
  fetchCustomers,
  type CustomerListItem,
} from "@/features/customers/services/customerService";
import { CallButton } from "@/features/recovery/components/CallButton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTableState } from "@/hooks/useTableState";
import { formatDate } from "@/lib/format";
import type { RecoveryStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — Recovera" },
      {
        name: "description",
        content:
          "Search, filter and review borrower accounts with recovery status, overdue amounts and branch allocation.",
      },
      { property: "og:title", content: "Customers — Recovera" },
      {
        property: "og:description",
        content: "Borrower directory with recovery status and branch-scoped access controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RecoveryStatus | "all">("all");
  const [branchId, setBranchId] = useState<string>("all");
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();

  const isSuperAdmin = hasRole(user, ROLES.SUPER_ADMIN);

  const branches = useQuery({
    queryKey: QUERY_KEYS.branches,
    queryFn: fetchBranches,
    enabled: isSuperAdmin,
  });

  // Debounced so typing a name issues one query instead of one per keystroke.
  const filters = { search: useDebouncedValue(search), status, branchId };
  const customers = useQuery({
    queryKey: [...QUERY_KEYS.customers, filters, page, pageSize],
    queryFn: () => fetchCustomers(filters, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<DataTableColumn<CustomerListItem>[]>(
    () => [
      {
        id: "customer",
        header: "Customer",
        cell: (row) => (
          <div className="min-w-0">
            <Link
              to="/customers/$customerId"
              params={{ customerId: row.id }}
              className="truncate font-medium text-brand underline-offset-4 hover:underline"
            >
              {row.full_name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{row.customer_code}</p>
          </div>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <span>{row.phone ?? "—"}</span>
            <CallButton
              phone={row.phone}
              variant="secondary"
              afterCallClose={() => {
                window.location.href = `/customers/${row.id}`;
              }}
            />
          </div>
        ),
      },
      { id: "branch", header: "Branch", cell: (row) => row.branch?.name ?? "—" },
      {
        id: "status",
        header: "Recovery status",
        cell: (row) => <RecoveryStatusBadge status={row.recovery_status} />,
      },
      { id: "city", header: "City", cell: (row) => row.city ?? "—" },
      {
        id: "added",
        header: "Added",
        cell: (row) => formatDate(row.created_at),
      },
    ],
    [],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Borrower accounts visible to you, scoped by your role and branch."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              resetPage();
            }}
            placeholder="Search by name, phone or customer code"
            label="Search customers"
            className="flex-1"
          />
          <FilterSelect
            value={status}
            onChange={(value) => {
              setStatus(value as RecoveryStatus | "all");
              resetPage();
            }}
            options={optionsFromLabels(RECOVERY_STATUS_LABELS, "All statuses")}
            label="Filter by recovery status"
            className="sm:w-[190px]"
          />
          {isSuperAdmin ? (
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
              label="Filter by branch"
              className="sm:w-[180px]"
            />
          ) : null}
        </div>

        <DataTable
          caption="Customer accounts"
          columns={columns}
          rows={customers.data?.rows ?? []}
          rowKey={(row) => row.id}
          isLoading={customers.isLoading}
          error={customers.error}
          onRetry={() => void customers.refetch()}
          emptyState={
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Adjust your filters, or import borrower accounts to get started."
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
    </AppShell>
  );
}
