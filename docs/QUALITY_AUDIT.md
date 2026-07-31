# Quality Audit

Detailed findings from the productization audit, grouped by the sixteen review areas.
Status is one of **PASS**, **FIXED** (repaired during this pass) or **OPEN** (tracked
in `KNOWN_LIMITATIONS.md`).

## 1. UX polish — PASS
Consistent page rhythm: `PageHeader` → filters → table → pagination on every list
screen. Destructive actions route through `ConfirmDialog`. Currency renders as INR and
dates in Asia/Kolkata via `src/lib/format.ts`, so business day boundaries match the
lender's operating day.

## 2. UI consistency — PASS
All colour, shadow and radius values come from semantic tokens in `src/styles.css`.
A repository-wide scan found zero hard-coded colour utilities (`text-white`,
`bg-black`, `bg-[#…]`) and zero `h-screen` usages outside the UI primitives.

## 3. Empty states — PASS
Every list renders `EmptyState` with a task-specific message, so an empty recovery
queue reads differently from an empty audit trail.

## 4. Loading states — FIXED
Lists already used table skeletons. Added `RoutePending`, a route-transition skeleton
matching the page-header/stat-card/table layout, wired via `defaultPendingComponent`
with a 200 ms delay so fast navigations do not flash.

## 5. Skeleton loaders — PASS
`DataTable` renders column-accurate skeleton rows and sets `aria-busy` while loading;
stat cards and the borrower timeline have their own skeletons.

## 6. Error handling — PASS
`src/lib/errors.ts` maps Postgres/PostgREST codes to human sentences; `toastError`
is the single failure surface. `ErrorState` gives every list a retry affordance, and
the root route has both an error boundary and a 404 component.

## 7. Success feedback — PASS
Every mutation confirms with a success toast and invalidates the affected queries, so
figures update without a manual refresh.

## 8. Mobile responsiveness — PASS
Sidebar collapses to a labelled sheet below `lg`. Tables scroll horizontally inside a
bordered container. Header rows use the grid + `min-w-0` + `shrink-0` pattern, so long
borrower names truncate instead of pushing controls off-screen.

## 9. Keyboard accessibility — PASS
Skip-to-content link, one `<main>` landmark, `aria-label` on all icon-only buttons,
Enter/Space activation on clickable table rows, Radix primitives for all overlays
(focus trap and Escape handled), and `aria-live` regions for bulk-action results.

## 10. Performance optimization — FIXED
React Query previously ran on library defaults (immediate staleness, focus refetch,
three retries). Now: `staleTime` 30 s, `gcTime` 5 min, `refetchOnWindowFocus` off,
one query retry, **zero** mutation retries — the last of which removes any chance of a
retried payment posting twice. Route preloading set to `intent`.

## 11. Bundle optimization — FIXED
`xlsx` was statically imported into the shared bundle. It is now loaded through a
dynamic `import()` inside `src/lib/excel.ts`, so only the two admin import screens pay
for it. No other dependency is imported outside the screens that need it.

## 12. Database query optimization — FIXED
The service layer already avoided N+1 by using `recovery_queue_page`. Added composite
indexes: `audit_logs(entity_type, entity_id, created_at)`,
`audit_logs(branch_id, created_at)`, the same pair on `activity_logs`,
`followups(status, scheduled_date)` and `payments(branch_id, paid_on)` — the exact
filter shapes used by the audit, activity, follow-up and collection screens.

## 13. Security hardening — PASS
RLS on every public table with explicit GRANTs. Helper functions
(`has_role`, `is_admin`, `can_access_branch`, `current_branch_id`) have `EXECUTE`
revoked from `PUBLIC`/`anon`/`authenticated`. Free-text search is sanitised in
`src/lib/supabase-filters.ts` against PostgREST and LIKE wildcard injection. No
service-role key is reachable from the browser. Click-to-call sanitises the `tel:`
target before dialling.

## 14. Audit log completeness — PASS
Trigger-based auditing covers inserts, updates, soft deletes and deletes on the core
tables, so a client that skips the service layer still gets audited. Role changes,
bulk assignments, branch transfers, imports and payments each additionally write a
readable `activity_logs` entry.

## 15. Documentation — FIXED
`docs/PROJECT_CONSTITUTION.md` existed. Added the product readiness report, this
audit, known limitations, deployment checklist and release notes.

## 16. Deployment readiness — PASS
Clean `tsgo --noEmit`. No server-only module leaks into the client graph. All
environment configuration is provided by the platform; see `DEPLOYMENT_CHECKLIST.md`.

## Bugs found and fixed

| Bug | Impact | Fix |
| --- | --- | --- |
| Import template downloaded without a `.xlsx` extension | Users saw an extension-less file some systems refused to open | Extension appended in `downloadTemplate` |
| Template download failures were swallowed | Silent no-op on error | Rejection routed to `toastError` |
| Mutations retried three times by default | Risk of duplicate payment attempts on flaky networks | `mutations.retry = 0` |
