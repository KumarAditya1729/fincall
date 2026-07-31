# Project Constitution

Binding rules for this platform (enterprise SaaS for NBFC / Microfinance loan recovery).
Read this file before designing or generating any new module. It overrides convenience.

## 0. Non-negotiables

- No MVP shortcuts, no demo/mock/placeholder code, no seeded-on-load data.
- Review the existing codebase before writing anything new. Extend, never re-create.
- Never break existing functionality. Additive changes by default.
- Think as a Principal Architect first: data model -> access control -> service -> UI.

## 1. Architecture

Feature-first. Each domain lives in `src/features/<feature>/`:

```
src/features/<feature>/
  services/     data access (Supabase queries, Zod validation, audit writes)
  components/   feature-specific UI
  hooks/        feature-specific hooks
```

Cross-cutting code has exactly one home:

| Concern | Location | Canonical modules |
| --- | --- | --- |
| Shared UI primitives | `src/components/common` | `DataTable`, `TablePagination`, `SearchInput`, `FilterSelect`, `EmptyState`, `ErrorState`, `StatCard`, `PageHeader`, `RecoveryStatusBadge` |
| Layout | `src/components/layout` | `AppShell` |
| Shared hooks | `src/hooks` | `useTableState`, `useDebouncedValue`, `use-mobile` |
| Formatting | `src/lib/format.ts` | currency (INR), date, datetime |
| Error mapping / toasts | `src/lib/errors.ts` | `toastError`, code -> message map |
| Query sanitization | `src/lib/supabase-filters.ts` | strips PostgREST grammar and LIKE wildcards |
| Constants, query keys, roles, labels | `src/constants` | `QUERY_KEYS`, `ROLES`, `AUDIT_ACTIONS`, `*_LABELS` |
| Domain types | `src/types` + `src/integrations/supabase/types.ts` (generated) | |

Duplication bans (hard): no duplicate components, hooks, API/service logic, or
database queries. If two screens need the same read, the read lives in one
service function with parameters. If a UI pattern repeats twice, it is promoted
into `src/components/common` in the same change.

## 2. Data access rules

- All reads/writes go through a feature service. Routes and components never call
  `supabase.from(...)` directly.
- One TanStack Query key per read, composed from `QUERY_KEYS`; filters/page/pageSize
  are part of the key. `placeholderData: keepPreviousData` for paged lists.
- Pagination is server-side (`range` + exact `count`). Never fetch-all-then-slice.
- Filtering and searching are server-side, with debounced input (`useDebouncedValue`).
- No N+1: use a single joined `select` (embedded resources) or a set-returning SQL
  function; never loop queries per row.
- Multi-table writes that must be consistent (money, status transitions) run inside a
  `SECURITY DEFINER` SQL function that re-validates authorization internally
  (see `record_payment`).
- Every user input is validated with Zod in the service layer before it reaches the
  database, and again by database constraints/policies. Frontend validation is UX only.

## 3. Database standard

Every new table in `public`:

```sql
id          uuid primary key default gen_random_uuid()
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()   -- set_updated_at() trigger
created_by  uuid references public.profiles(id)  -- ownership
branch_id   uuid references public.branches(id)  -- tenant/branch scope
deleted_at  timestamptz                          -- soft delete; queries filter IS NULL
```

Migration order is fixed: `CREATE TABLE` -> `GRANT` -> `ENABLE ROW LEVEL SECURITY`
-> `CREATE POLICY` -> indexes -> triggers. Grant `authenticated` only what a policy
allows; grant `service_role` when server code touches the table; never grant `anon`
for borrower data.

Indexes are mandatory on: `branch_id`, every foreign key used in filters, `created_at`
(for feeds), `deleted_at` partial predicates, and any column used for ordering or
search (`pg_trgm` for fuzzy name/phone lookup).

Never expose internal sequential IDs. UUID everywhere, in URLs and in payloads.

## 4. Access control

Three roles, stored only in `public.user_roles`: `super_admin`, `branch_manager`,
`recovery_executive`. Roles are never stored on `profiles`.

- RLS is enabled on every table; policies use the `SECURITY DEFINER` helpers
  `has_role`, `is_admin`, `can_access_branch`, `current_branch_id` to avoid recursion.
- Branch scope is enforced in the database, not in the client. Client-side branch or
  employee filters are conveniences layered on top of policies that already restrict rows.
- Ownership is derived server-side from `auth.uid()`. Never accept an owner id,
  branch id, or role from the client as the source of truth.
- Append-only tables (`audit_logs`, `activity_logs`, `call_logs`, `remarks`,
  `followups`, `notifications`) deny `DELETE`; corrections are new rows.
- UI role checks use `hasRole(user, ...ROLES)`; they hide affordances only, never
  substitute for a policy.

## 5. Audit logging

Every mutation writes an audit entry through the audit service (or inside the SQL
function performing the mutation), with: actor, branch, action from `AUDIT_ACTIONS`,
entity type, entity id, and a JSON metadata payload. No mutation ships without one.
Audit logs are immutable and readable by super admins (and branch-scoped readers where
the policy allows).

## 6. Every page

Required on every list/detail screen:

- Search (debounced, sanitized, server-side)
- Sorting and filtering (server-side; branch and employee filters where role permits)
- Pagination via `TablePagination` + `useTableState`
- Loading state (`DataTable` skeletons / `aria-busy`)
- Empty state (`EmptyState`)
- Error state with retry (`ErrorState`, wired via `DataTable error`/`onRetry`)
- Responsive layout down to 360px; `min-h-dvh`, no horizontal overflow
- Accessibility: single `h1`, labelled controls, `aria-current` nav, keyboard-operable
  rows, visible focus, skip-to-content
- Route-level `head()` with unique title/description/OG tags

## 7. Design system

Semantic tokens only, defined in `src/styles.css` (OKLCH). Never hardcode
`text-white`, `bg-black`, or hex utilities in components. shadcn variants carry theme
changes.

## 8. Testing posture

Services are pure functions of their inputs plus the Supabase client; components take
data via props. Keep business logic out of JSX so every service and hook is unit-test
ready without a DOM.

## 9. Performance and scale target

500+ concurrent recovery executives:

- Bounded result sets everywhere (default page size, hard caps on id scans).
- Debounced inputs; `keepPreviousData` to avoid layout thrash.
- Aggregations and bucket resolution execute in SQL, not in the browser.
- Query invalidation is targeted to affected keys, never a blanket `invalidateQueries()`
  on token refresh.
- No blocking work in loaders beyond what the first paint requires.

## 10. Change checklist (run before declaring a change done)

1. Reused existing service/hook/component instead of adding a near-duplicate.
2. Migration follows the table standard, RLS, grants, indexes.
3. Mutation validated with Zod and audited.
4. Screen has search/sort/filter/pagination/loading/empty/error/responsive/a11y.
5. `tsgo --noEmit` clean, ESLint clean, production build succeeds, routes return 200.
6. Database linter reviewed; accepted findings recorded in security memory.

## 11. Audit trail ownership (added after the enterprise readiness audit)

`audit_logs` is written **only** by the database trigger `audit_row_change()`. Never write
to `audit_logs` from the client and never add a client-side "audit" call to compensate for a
missing trigger — instead attach the trigger to the new table in the same migration that
creates it.

`recordAudit()` writes to `activity_logs` only: a human-readable in-app feed, explicitly not
the compliance trail.

Multi-table mutations (money, status transitions) are SECURITY DEFINER routines that re-check
`auth.uid()` and branch access internally — never a sequence of client writes.

Business dates use `Asia/Kolkata` on both sides (`todayISO()` / `startOfTodayISO()` in
`src/lib/format.ts`, `now() AT TIME ZONE 'Asia/Kolkata'` in SQL). Never `new Date().toISOString()`
for a business day.

List screens fetch through a single paginated SQL routine when a page needs aggregates from
more than two tables; never resolve id sets in the browser and pass them back in an `.in()` filter.
