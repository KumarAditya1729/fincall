# Project Understanding

## 1. Folder Structure

The project follows a feature-first architecture, located in `src/features/`.
Cross-cutting concerns are neatly organized in dedicated directories.

- `src/features/`: Contains domain-specific logic. Each feature (e.g., `admin`, `audit`, `auth`, `calls`, `customers`, `dashboard`, `recovery`) has its own `components/`, `services/`, and `hooks/` directories.
- `src/components/common/`: Shared UI primitives (`DataTable`, `TablePagination`, `SearchInput`, `StatCard`, etc.).
- `src/components/layout/`: Application layout components like `AppShell` and `CommandPalette`.
- `src/components/ui/`: shadcn/ui base components (Radix primitives).
- `src/hooks/`: Shared hooks (`useTableState`, `useDebouncedValue`, `use-mobile`).
- `src/lib/`: Utilities for formatting, error mapping, query sanitization, and CSV/Excel exports.
- `src/constants/`: Constants for roles, query keys, audit actions, and labels.
- `src/routes/`: Route definitions using TanStack Router.
- `supabase/migrations/`: Database schema, initial setups, and Row Level Security (RLS) policies.

## 2. Architecture

The application is an enterprise SaaS platform built with React, TypeScript, Vite, and Supabase.

- **Frontend Framework:** React + Vite
- **Routing:** TanStack Router for type-safe routing.
- **State & Data Fetching:** TanStack Query (`react-query`) with caching optimized for operations (30s stale time, single retries).
- **Styling:** Tailwind CSS with semantic OKLCH tokens (defined in `src/styles.css`).
- **Backend:** Supabase (PostgreSQL).
- **Validation:** Zod for validating service inputs before they hit the database.

## 3. Components & Pages

- **Pages:** Modularized via TanStack Router. Major routes include Dashboard, Recovery Queue, Borrower Directory, Today's Work, Audit Logs, and various Admin settings.
- **Shared Components:** Reusable table patterns, debounced search inputs, and loading skeletons (`RoutePending`) to prevent layout shift during navigation.
- **Accessibility:** High focus on WCAG 2.1 AA standards, keyboard navigation, `aria-live` regions, and proper semantic HTML tags (like `<main>`).

## 4. Services & Hooks

- **Services:** All Supabase interactions happen through pure functions in service files (e.g., `recoveryService.ts`, `authService.ts`). Components never call Supabase directly. They rely on server-side pagination, sorting, and filtering.
- **Hooks:** Custom hooks wrap TanStack Query for data fetching and manage table states or debounced inputs.

## 5. Database & Supabase

- **Schema:** Every table uses a `uuid` primary key, `created_at`, `updated_at` (via triggers), `created_by` (for ownership), `branch_id` (for tenant scoping), and `deleted_at` (for soft deletes).
- **Complex Writes:** Multi-table writes (e.g., `record_payment`, `mark_broken_promise`) are wrapped in `SECURITY DEFINER` PostgreSQL functions to guarantee ACID compliance and re-validate authorization inside the database transaction.
- **Indexes:** Heavy use of indexes, including Trigram (`pg_trgm`) for fuzzy text searches and composite indexes optimized for specific view queries.

## 6. Authentication, RBAC, and RLS

- **Authentication:** Handled via Supabase Auth.
- **RBAC (Role-Based Access Control):** Three strict roles: `super_admin`, `branch_manager`, and `recovery_executive`. Roles are stored in `public.user_roles`.
- **RLS (Row Level Security):** Security is enforced in the database. Client-side logic only controls UI visibility. Database policies use helper functions (`has_role`, `can_access_branch`) to filter queries globally at the Postgres level.

## 7. Audit Logs

- **Immutable Trails:** `audit_logs` are written purely by a PostgreSQL trigger (`audit_row_change()`). They record field names changed (not PII values) and are append-only.
- **Activity Feed:** `activity_logs` stores a human-readable feed for events like role changes, assignments, and payments.

## 8. Recovery Module

- **Recovery Queue:** Fetched via a heavily optimized SQL function (`recovery_queue_page`) that handles filtering, search sanitization, and bucketing (Overdue, PTP Today, Broken Promises, Uncontacted) in one round trip.
- **Actions:** Call logging, scheduling follow-ups, and recording payments (with atomic DB constraints).
- **Timeline:** A unified view mapping a borrower's calls, remarks, payments, and follow-ups.

## 9. Admin Module

- Manages branches, employee creation/assignment, role mapping, holiday calendars, and notification templates.
- **Imports:** Handles bulk borrower and loan ingestion from spreadsheets (processed client-side via a dynamically loaded `xlsx` library, up to 2000 rows).
