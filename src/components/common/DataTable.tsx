import type { ReactNode } from "react";

import { ErrorState } from "@/components/common/ErrorState";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableSelection {
  selectedIds: string[];
  /** Toggles a single row; the table never mutates the selection itself. */
  onToggle: (id: string, checked: boolean) => void;
  /** Toggles every row on the current page. */
  onToggleAll: (ids: string[], checked: boolean) => void;
  /** Accessible name for the selection column. */
  label: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  /** Query failure; rendered instead of rows with a retry affordance. */
  error?: unknown;
  onRetry?: (() => void) | undefined;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  caption?: string;
  skeletonRows?: number;
  /** Enables bulk-action checkboxes; omit for read-only tables. */
  selection?: DataTableSelection | undefined;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  error,
  onRetry,
  emptyState,
  onRowClick,
  caption,
  skeletonRows = 6,
  selection,
}: DataTableProps<T>) {
  const showRows = !isLoading && !error;
  const pageIds = rows.map((row) => rowKey(row));
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selection?.selectedIds.includes(id));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto" aria-busy={isLoading}>
        <Table>
          {caption ? <caption className="sr-only">{caption}</caption> : null}

          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {selection ? (
                <TableHead scope="col" className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => selection.onToggleAll(pageIds, checked === true)}
                    aria-label={`Select all ${selection.label}`}
                    disabled={pageIds.length === 0}
                  />
                </TableHead>
              ) : null}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {selection ? (
                      <TableCell>
                        <Skeleton className="size-4" />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : showRows
                ? rows.map((row) => {
                    const id = rowKey(row);
                    return (
                      <TableRow
                        key={id}
                        tabIndex={onRowClick ? 0 : undefined}
                        role={onRowClick ? "button" : undefined}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        onKeyDown={
                          onRowClick
                            ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  onRowClick(row);
                                }
                              }
                            : undefined
                        }
                        className={cn(onRowClick && "cursor-pointer focus-visible:bg-muted/60")}
                      >
                        {selection ? (
                          <TableCell onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={selection.selectedIds.includes(id)}
                              onCheckedChange={(checked) =>
                                selection.onToggle(id, checked === true)
                              }
                              aria-label={`Select row ${id}`}
                            />
                          </TableCell>
                        ) : null}
                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            className={cn("py-3 text-sm", column.className)}
                          >
                            {column.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                : null}
          </TableBody>
        </Table>
      </div>
      {error ? (
        <div className="border-t border-border p-10">
          <ErrorState error={error} onRetry={onRetry} title="Couldn't load this list" />
        </div>
      ) : null}
      {showRows && rows.length === 0 ? (
        <div className="border-t border-border p-10 text-center">{emptyState}</div>
      ) : null}
    </div>
  );
}
