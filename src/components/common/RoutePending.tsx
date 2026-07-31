import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-transition placeholder. Mirrors the page-header + cards + table rhythm
 * used across the app so navigation never flashes an empty screen.
 */
export function RoutePending() {
  return (
    <div className="space-y-6 p-4 sm:p-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading page…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
