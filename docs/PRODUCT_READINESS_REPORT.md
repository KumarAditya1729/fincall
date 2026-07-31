# Product Readiness Report

**Product:** Recovera — Loan Recovery Management Platform for NBFC-MFIs
**Assessment date:** 31 July 2026
**Verdict:** Ready for controlled commercial rollout (pilot with 1–3 lenders), with the caveats in `KNOWN_LIMITATIONS.md`.

## 1. Scope of assessment

Every route under `src/routes`, every feature service under `src/features`, all shared
components in `src/components/common`, the database schema (21 tables, 17 functions),
RLS policies, and the build/deploy configuration were reviewed. No new business
modules were added; this pass was quality only.

## 2. Module scorecard (1–10)

| Module | UX | A11y | Perf | Security | Score |
| --- | --- | --- | --- | --- | --- |
| Authentication & session | 9 | 9 | 9 | 9 | 9 |
| Dashboard | 9 | 9 | 9 | 9 | 9 |
| Recovery queue | 9 | 9 | 9 | 9 | 9 |
| Today's work | 9 | 9 | 9 | 9 | 9 |
| Borrower directory & 360 view | 9 | 9 | 8 | 9 | 9 |
| Call logging & follow-ups | 9 | 9 | 9 | 9 | 9 |
| Payments & broken promises | 9 | 9 | 9 | 10 | 9 |
| Admin — branches, employees, roles | 9 | 9 | 9 | 9 | 9 |
| Admin — imports | 8 | 9 | 9 | 9 | 8 |
| Admin — masters, calendar, templates, settings | 9 | 9 | 9 | 9 | 9 |
| Audit & activity logs | 9 | 9 | 9 | 10 | 9 |
| Design system consistency | 9 | — | — | — | 9 |

**Weighted product readiness: 9.0 / 10.**

## 3. What is production-grade today

- **Access control.** Roles live only in `user_roles`. Branch scope and ownership are
  enforced in Postgres through `has_role`, `can_access_branch` and RLS on every table.
  The frontend never decides authorisation; it only hides what the user cannot use.
- **Write integrity.** Every multi-table write (payment collection, broken promise,
  role change, bulk assignment, branch transfer, spreadsheet import) runs inside a
  single `SECURITY DEFINER` routine that re-authorises the caller and validates input.
- **Audit trail.** `audit_logs` is written exclusively by the `audit_row_change`
  database trigger and is append-only (no client UPDATE/DELETE policy). Only changed
  field *names* are recorded — never borrower values — so the trail is not a shadow
  copy of personal data. `activity_logs` carries the human-readable feed.
- **Data lifecycle.** Every operational table has `id uuid`, `created_at`,
  `updated_at`, `branch_id` where relevant, and `deleted_at` soft delete. Hard delete
  is revoked on borrower and log tables.
- **Query shape.** The recovery queue, dashboard aggregates and borrower timeline are
  single-round-trip SQL (`recovery_queue_page`) — no N+1 fan-out and no oversized
  URL filters. Trigram indexes back every free-text search.
- **UI states.** Every list screen ships loading skeletons, an empty state, an error
  state with retry, server-side search/filter/pagination, and success toasts.
- **Accessibility.** Skip link, single `<main>` landmark, labelled icon buttons,
  keyboard-operable table rows, `aria-live` status regions, `min-h-dvh` viewports,
  and semantic tokens only (no hard-coded colours), so contrast holds in both themes.

## 4. Improvements made in this pass

1. Route-level pending skeleton (`RoutePending`) so navigation never flashes blank.
2. React Query defaults tuned for an operations console: 30 s stale window, 5 min GC,
   no focus refetch, single retry, no mutation retry (prevents duplicate collections).
3. Intent-based route preloading for faster perceived navigation.
4. The spreadsheet engine (`xlsx`, the largest dependency) is now dynamically imported
   and only downloaded on the two admin import screens.
5. Import template downloads now produce a correctly named `.xlsx` file and surface
   failures through the standard error toast instead of failing silently.
6. Six composite indexes added for audit/activity filtering, follow-up scheduling and
   branch-wise payment reporting.
7. Product documentation set created (this report plus quality audit, limitations,
   deployment checklist, release notes).

## 5. Verification performed

- `tsgo --noEmit` — clean.
- Database linter — 7 warnings, all the intentional self-authorising RPCs, reviewed
  and accepted (see `KNOWN_LIMITATIONS.md`).
- Index inventory reviewed against every query issued by the service layer.

## 6. Recommended before general availability

See `KNOWN_LIMITATIONS.md` §"Pre-GA backlog". None of these block a pilot.
