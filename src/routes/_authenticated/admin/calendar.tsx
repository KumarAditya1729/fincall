import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterSelect } from "@/components/common/FilterSelect";
import { PageHeader } from "@/components/common/PageHeader";
import { TablePagination } from "@/components/common/TablePagination";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { QUERY_KEYS, WEEKDAYS } from "@/constants";
import { AdminGuard } from "@/features/admin/components/AdminGuard";
import { AdminTabs } from "@/features/admin/components/AdminTabs";
import {
  createHoliday,
  deleteHolidays,
  fetchHolidays,
  fetchWorkingHours,
  holidaySchema,
  saveWorkingHours,
  type Holiday,
  type HolidayInput,
  type WorkingHourInput,
} from "@/features/admin/services/orgSettingsService";
import { fetchBranches } from "@/features/customers/services/customerService";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useTableState } from "@/hooks/useTableState";
import { toastError } from "@/lib/errors";
import { formatDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar & Working Hours — Recovera" },
      {
        name: "description",
        content: "Define collection holidays and calling windows for every branch.",
      },
      { property: "og:title", content: "Calendar & Working Hours — Recovera" },
      {
        property: "og:description",
        content: "Holiday calendar and branch calling hours for compliant field collections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});

const DEFAULT_HOURS: WorkingHourInput[] = WEEKDAYS.map((day) => ({
  weekday: day.value,
  is_working_day: day.value !== 0,
  opens_at: "09:30",
  closes_at: "18:30",
}));

function CalendarPage() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [branchFilter, setBranchFilter] = useState("all");
  const [hoursBranch, setHoursBranch] = useState("global");
  const [holiday, setHoliday] = useState<HolidayInput>({
    name: "",
    holiday_date: todayISO(),
    branch_id: null,
    is_recurring: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hours, setHours] = useState<WorkingHourInput[]>(DEFAULT_HOURS);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { page, pageSize, setPage, setPageSize, resetPage } = useTableState();
  const selection = useRowSelection();

  const branches = useQuery({ queryKey: QUERY_KEYS.branches, queryFn: fetchBranches });

  const holidays = useQuery({
    queryKey: [...QUERY_KEYS.adminHolidays, year, branchFilter, page, pageSize],
    queryFn: () => fetchHolidays({ year, branchId: branchFilter }, { page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const workingHours = useQuery({
    queryKey: [...QUERY_KEYS.adminWorkingHours, hoursBranch],
    queryFn: () => fetchWorkingHours(hoursBranch === "global" ? null : hoursBranch),
  });

  useEffect(() => {
    const rows = workingHours.data;
    if (!rows) return;
    setHours(
      DEFAULT_HOURS.map((fallback) => {
        const match = rows.find((row) => row.weekday === fallback.weekday);
        return match
          ? {
              weekday: match.weekday,
              is_working_day: match.is_working_day,
              opens_at: match.opens_at ?? fallback.opens_at,
              closes_at: match.closes_at ?? fallback.closes_at,
            }
          : fallback;
      }),
    );
  }, [workingHours.data]);

  const addHoliday = useMutation({
    mutationFn: async () => {
      const parsed = holidaySchema.safeParse(holiday);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
          ),
        );
        throw new Error("Fix the highlighted fields and try again.");
      }
      setErrors({});
      await createHoliday(parsed.data);
    },
    onSuccess: async () => {
      toast.success("Holiday added");
      setHoliday({ name: "", holiday_date: todayISO(), branch_id: null, is_recurring: false });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminHolidays });
    },
    onError: (error) => toastError(error, "Could not add the holiday"),
  });

  const removeHolidays = useMutation({
    mutationFn: () => deleteHolidays(selection.selectedIds),
    onSuccess: async () => {
      toast.success("Holidays removed");
      selection.clear();
      setConfirmDelete(false);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminHolidays });
    },
    onError: (error) => toastError(error, "Could not remove the selected holidays"),
  });

  const saveHours = useMutation({
    mutationFn: () => saveWorkingHours(hoursBranch === "global" ? null : hoursBranch, hours),
    onSuccess: async () => {
      toast.success("Working hours saved");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminWorkingHours });
    },
    onError: (error) => toastError(error, "Could not save the working hours"),
  });

  const columns = useMemo<DataTableColumn<Holiday>[]>(
    () => [
      { id: "name", header: "Holiday", cell: (row) => row.name },
      { id: "date", header: "Date", cell: (row) => formatDate(row.holiday_date) },
      { id: "branch", header: "Branch", cell: (row) => row.branch?.name ?? "All branches" },
      {
        id: "recurring",
        header: "Recurring",
        cell: (row) =>
          row.is_recurring ? <Badge variant="secondary">Yearly</Badge> : <span>One-off</span>,
      },
    ],
    [],
  );

  const years = Array.from({ length: 5 }, (_, index) =>
    String(new Date().getFullYear() - 1 + index),
  );

  return (
    <AppShell>
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Calendar & working hours"
            description="Holidays and calling windows keep field activity within compliant hours."
          />
          <AdminTabs />

          <section
            aria-labelledby="holiday-form"
            className="space-y-4 rounded-xl border border-border bg-card p-5"
          >
            <h2 id="holiday-form" className="text-sm font-semibold">
              Add a holiday
            </h2>
            <form
              className="grid gap-4 md:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                addHoliday.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="holiday-name">Name</Label>
                <Input
                  id="holiday-name"
                  value={holiday.name}
                  maxLength={120}
                  onChange={(event) => setHoliday({ ...holiday, name: event.target.value })}
                  aria-invalid={errors["name"] ? true : undefined}
                />
                {errors["name"] ? <p className="text-xs text-danger">{errors["name"]}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="holiday-date">Date</Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={holiday.holiday_date}
                  onChange={(event) => setHoliday({ ...holiday, holiday_date: event.target.value })}
                />
              </div>
              <FilterSelect
                value={holiday.branch_id ?? "all"}
                onChange={(value) =>
                  setHoliday({ ...holiday, branch_id: value === "all" ? null : value })
                }
                options={[
                  { value: "all", label: "All branches" },
                  ...(branches.data ?? []).map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  })),
                ]}
                label="Holiday applies to"
              />
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={holiday.is_recurring}
                    onCheckedChange={(checked) => setHoliday({ ...holiday, is_recurring: checked })}
                    aria-label="Repeats every year"
                  />
                  Yearly
                </label>
                <Button type="submit" disabled={addHoliday.isPending}>
                  {addHoliday.isPending ? "Adding…" : "Add"}
                </Button>
              </div>
            </form>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FilterSelect
              value={year}
              onChange={(value) => {
                setYear(value);
                resetPage();
              }}
              options={years.map((value) => ({ value, label: value }))}
              label="Filter holidays by year"
              className="sm:w-[140px]"
            />
            <FilterSelect
              value={branchFilter}
              onChange={(value) => {
                setBranchFilter(value);
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
              label="Filter holidays by branch"
              className="sm:w-[220px]"
            />
            {selection.count > 0 ? (
              <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                Remove {selection.count} selected
              </Button>
            ) : null}
          </div>

          <DataTable
            caption="Holiday calendar"
            columns={columns}
            rows={holidays.data?.rows ?? []}
            rowKey={(row) => row.id}
            isLoading={holidays.isLoading}
            error={holidays.error}
            onRetry={() => void holidays.refetch()}
            selection={{
              selectedIds: selection.selectedIds,
              onToggle: selection.toggle,
              onToggleAll: selection.toggleAll,
              label: "holidays",
            }}
            emptyState={
              <EmptyState
                icon={CalendarDays}
                title="No holidays for this year"
                description="Add the days when collection activity should pause."
              />
            }
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={holidays.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

          <section
            aria-labelledby="working-hours"
            className="space-y-4 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="working-hours" className="text-sm font-semibold">
                Calling hours
              </h2>
              <FilterSelect
                value={hoursBranch}
                onChange={setHoursBranch}
                options={[
                  { value: "global", label: "Organisation default" },
                  ...(branches.data ?? []).map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  })),
                ]}
                label="Working hours scope"
                className="sm:w-[240px]"
              />
            </div>

            <ul className="space-y-2">
              {hours.map((row, index) => (
                <li
                  key={row.weekday}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="w-24 font-medium">
                    {WEEKDAYS.find((day) => day.value === row.weekday)?.label}
                  </span>
                  <Switch
                    checked={row.is_working_day}
                    aria-label={`Working day toggle for ${row.weekday}`}
                    onCheckedChange={(checked) =>
                      setHours((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, is_working_day: checked } : item,
                        ),
                      )
                    }
                  />
                  <Input
                    type="time"
                    className="w-32"
                    aria-label="Opens at"
                    value={row.opens_at}
                    disabled={!row.is_working_day}
                    onChange={(event) =>
                      setHours((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, opens_at: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Input
                    type="time"
                    className="w-32"
                    aria-label="Closes at"
                    value={row.closes_at}
                    disabled={!row.is_working_day}
                    onChange={(event) =>
                      setHours((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, closes_at: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </li>
              ))}
            </ul>

            <Button onClick={() => saveHours.mutate()} disabled={saveHours.isPending}>
              {saveHours.isPending ? "Saving…" : "Save calling hours"}
            </Button>
          </section>
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Remove selected holidays?"
          description="Removed holidays no longer pause collection activity on those dates."
          destructive
          isPending={removeHolidays.isPending}
          onConfirm={() => removeHolidays.mutate()}
        />
      </AdminGuard>
    </AppShell>
  );
}
