# USER ACCEPTANCE TESTING (UAT) CHECKLIST
## REC-DOC-014

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-014
* **Prepared By**: SoftTech Verse
* **Prepared For**: ACFL Patna
* **Date**: 01 August 2026
* **Classification**: Confidential

---

### CONFIDENTIALITY NOTICE
> [!IMPORTANT]
> **CONFIDENTIAL**
> This document contains proprietary information of SoftTech Verse and is intended solely for ACFL Patna.
> Distribution or duplication without express written permission is strictly prohibited.

---

### REVISION HISTORY

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | 01 Aug 2026 | SoftTech Verse | Initial Release for Client Review |

---

### TABLE OF CONTENTS
1. [Overview](#1-overview)
2. [UAT Test Cases (1 to 100)](#2-uat-test-cases-1-to-100)

---

### 1. Overview
This document contains the complete test suite of 100 detailed test cases for the User Acceptance Testing (UAT) of the **Recovera** platform. Tests must be performed across three primary roles: `super_admin`, `branch_manager`, and `recovery_executive`.

---

### 2. UAT Test Cases (1 to 100)

| Test ID | Module | Scenario | Expected Result | Status | Tester | Remarks |
| --- | --- | --- | --- | --- | --- | --- |
| **TC-001** | Authentication | Login with valid credentials | Redirects to Dashboard, registers user session cookie. | Pending | | |
| **TC-002** | Authentication | Login with invalid email format | Front-end validation blocks submit; shows email error. | Pending | | |
| **TC-003** | Authentication | Login with incorrect password | Shows error message "Invalid login credentials". | Pending | | |
| **TC-004** | Authentication | Password reset request with valid email | Sends reset email; shows confirmation toast. | Pending | | |
| **TC-005** | Authentication | Session timeout after inactivity | System logs user out automatically; redirects to login. | Pending | | |
| **TC-006** | Authentication | Sign out execution | Destroys session token; blocks backward navigation. | Pending | | |
| **TC-007** | Dashboard | Super Admin view of total branches | Displays aggregated metric cards for all branches. | Pending | | |
| **TC-008** | Dashboard | Branch Manager view of branch metrics | Displays metric cards filtered strictly to manager's branch. | Pending | | |
| **TC-009** | Dashboard | Executive view of metrics | Displays dashboard stats restricted strictly to assigned cases. | Pending | | |
| **TC-010** | Dashboard | Chart rendering (Collections trend) | Interactive line chart displays monthly/daily values in INR. | Pending | | |
| **TC-011** | Dashboard | Refresh button operational | Re-triggers React Query key invalidation; refreshes values. | Pending | | |
| **TC-012** | Recovery Queue | Filter queue by "Overdue" status | Lists only loans where current status is overdue. | Pending | | |
| **TC-013** | Recovery Queue | Filter queue by "PTP Today" status | Lists only loans where PTP date matches today's date. | Pending | | |
| **TC-014** | Recovery Queue | Filter queue by "Broken Promises" | Lists cases where PTP date has passed but outstanding > 0. | Pending | | |
| **TC-015** | Recovery Queue | Filter queue by "Uncontacted" | Lists borrowers with zero call logs. | Pending | | |
| **TC-016** | Recovery Queue | Text Search by customer code | Matches exact code; returns matching record in < 1 second. | Pending | | |
| **TC-017** | Recovery Queue | Text Search by customer phone | Matches phone number digits; handles fuzzy matching. | Pending | | |
| **TC-018** | Recovery Queue | Table pagination (Next Page) | Increments query offset; loads next page without full reload. | Pending | | |
| **TC-019** | Recovery Queue | Table sorting by Overdue Amount | Sorts values ascending/descending; maintains page boundaries. | Pending | | |
| **TC-020** | Recovery Queue | Empty state display | Shows custom EmptyState illustration when filters yield no rows. | Pending | | |
| **TC-021** | Today's Work | Queue filtering for scheduled tasks | Lists cases scheduled for call action today. | Pending | | |
| **TC-022** | Today's Work | Marking task as cancelled | Followup row status transitions to "cancelled"; logs activity. | Pending | | |
| **TC-023** | Today's Work | View completed tasks | Displays completed follow-ups list. | Pending | | |
| **TC-024** | Today's Work | DPD Range filters | Dynamically narrows list by DPD buckets (e.g. 1-30, 31-60). | Pending | | |
| **TC-025** | Customer Profile | Retrieve 360-degree borrower detail | Shows name, phone, alternate contact, address, branch. | Pending | | |
| **TC-026** | Customer Profile | Display of loan histories | Lists all loans linked to the customer UUID. | Pending | | |
| **TC-027** | Customer Profile | Render call history timeline | Displays timeline cards of previous call notes chronologically. | Pending | | |
| **TC-028** | Customer Profile | Display of payment collections | Shows a table of all recorded payments for the customer. | Pending | | |
| **TC-029** | Call Logging | Log connected call outcome | Inserts row in call_logs table with is_connected = true. | Pending | | |
| **TC-030** | Call Logging | Log non-connected call (switch off) | Inserts row with is_connected = false; keeps status unchanged. | Pending | | |
| **TC-031** | Call Logging | Select "purpose" from master options | Maps purpose to master list codes (e.g., payment_reminder). | Pending | | |
| **TC-032** | Call Logging | Verify call duration validation | Blocks negative integer entry; Zod throws range error. | Pending | | |
| **TC-033** | Call Logging | Text area character limit | Allows up to 1000 characters in remarks; truncates extra. | Pending | | |
| **TC-034** | Call Logging | Create PTP task during call logging | Checks PTP parameters; sets next follow-up automatically. | Pending | | |
| **TC-035** | PTP Management | Set PTP date to past date | Validation blocks submit; displays "Date must be today or future". | Pending | | |
| **TC-036** | PTP Management | Set PTP date on holiday | Validation reads holiday table; prompts alert window. | Pending | | |
| **TC-037** | PTP Management | Set PTP amount > outstanding | Blocks submit; error says "PTP amount exceeds balance". | Pending | | |
| **TC-038** | PTP Management | Transition of customer status to "ptp"| Customer status immediately changes to "ptp" on submission. | Pending | | |
| **TC-039** | Payment Collection | Record payment with cash mode | Inserts payment record; marks collected_by as auth.uid(). | Pending | | |
| **TC-040** | Payment Collection | Record payment with UPI/Digital mode | Requires reference number string input. | Pending | | |
| **TC-041** | Payment Collection | Execute SECURE DEFINE record_payment | Runs atomic Postgres transaction; reduces outstanding_amount. | Pending | | |
| **TC-042** | Payment Collection | Overpaying loan outstanding | Transaction blocks; rolls back; returns credit limit error. | Pending | | |
| **TC-043** | Payment Collection | Status transition on full payment | Automatically sets loan_status to 'closed' and customer to 'paid'. | Pending | | |
| **TC-044** | Payment Collection | Status transition on partial payment | Automatically sets customer status to 'partially_paid'. | Pending | | |
| **TC-045** | Payment Collection | Verify audit row creation | Trigger inserts a row into audit_logs on payment insert. | Pending | | |
| **TC-046** | Admin - Branches | Create a new branch | Inserts record in branches table; requires unique code. | Pending | | |
| **TC-047** | Admin - Branches | Deactivate an active branch | Sets is_active = false; prevents login for branch employees. | Pending | | |
| **TC-048** | Admin - Branches | Soft-delete a branch | Sets deleted_at = now(); branch disappears from directories. | Pending | | |
| **TC-049** | Admin - Employees | Create new profile record | Adds row in profiles; requires unique email and employee code. | Pending | | |
| **TC-050** | Admin - Employees | Assign role to employee | Executes `admin_set_user_roles`; inserts into user_roles. | Pending | | |
| **TC-051** | Admin - Employees | Remove sole super_admin role | Function blocks; raises "At least one super admin must remain". | Pending | | |
| **TC-052** | Admin - Employees | Self-demotion block | Super admin cannot remove their own admin role. | Pending | | |
| **TC-053** | Admin - Employees | Deactivate employee profile | Sets profiles.is_active = false; blocks Supabase login. | Pending | | |
| **TC-054** | Admin - Employees | Transfer branch for employee | Updates branch_id in profiles; checks RLS scope changes. | Pending | | |
| **TC-055** | Admin - Imports | Download Excel Template for Customer | Downloads a clean .xlsx workbook with correct headers. | Pending | | |
| **TC-056** | Admin - Imports | Ingest valid Customer sheet (10 rows)| Enqueues background job; updates import_batches statistics. | Pending | | |
| **TC-057** | Admin - Imports | Ingest sheet with invalid columns | Validation fails immediately; shows error layout. | Pending | | |
| **TC-058** | Admin - Imports | Ingest sheet exceeding 2000 rows | Frontend blocks upload; prompts size constraint warning. | Pending | | |
| **TC-059** | Admin - Imports | Check background worker processing | Worker daemon pulls, parses file, and inserts records. | Pending | | |
| **TC-060** | Admin - Imports | Handled duplicate customer codes | Database upserts or skips depending on code conflict. | Pending | | |
| **TC-061** | Admin - Imports | Ingest valid Loan sheet | Links loans to customers based on customer_code. | Pending | | |
| **TC-062** | Admin - Imports | Ingest Loan sheet with missing customers | Rows fail; error messages logged in import_batches.errors. | Pending | | |
| **TC-063** | Admin - Settings | Add Holiday to Calendar | Inserts row in holidays table. | Pending | | |
| **TC-064** | Admin - Settings | Update working hours per branch | Modifies working_hours table for target branch_id. | Pending | | |
| **TC-065** | Admin - Settings | Create WhatsApp notification template | Inserts record into notification_templates; channel='whatsapp'. | Pending | | |
| **TC-066** | Admin - Settings | Validate template code pattern | Blocks non-alphanumeric codes; checks regex schema. | Pending | | |
| **TC-067** | Admin - Settings | Deactivate notification template | Sets is_active = false; blocks campaign runner triggers. | Pending | | |
| **TC-068** | Audit Trail | Super Admin accesses global audit logs | Shows all inserts, updates, and deletes with actor detail. | Pending | | |
| **TC-069** | Audit Trail | Audit metadata inspection | Verifies changed field names are logged but values are omitted. | Pending | | |
| **TC-070** | Audit Trail | Non-admin tries to read audit logs | RLS blocks access; query returns empty set or permission denied. | Pending | | |
| **TC-071** | Audit Trail | Attempt to modify audit logs | PostgreSQL throws exception; updates/deletes are revoked. | Pending | | |
| **TC-072** | Audit Trail | Check pg_cron archival job execution | Calls `archive_old_audit_logs()`; moves old rows to archive. | Pending | | |
| **TC-073** | Background Workers | Worker boot registration | Worker registers UUID, pid, and host in workers table. | Pending | | |
| **TC-074** | Background Workers | Worker heartbeat updates | heartbeat column updates every 30 seconds. | Pending | | |
| **TC-075** | Background Workers | Atomic dequeue executing | Calls `dequeue_job(worker_id)`; locks row via SELECT FOR UPDATE. | Pending | | |
| **TC-076** | Background Workers | Job failure logging (DLQ) | Failed job increments attempts; writes error to job_failures. | Pending | | |
| **TC-077** | Background Workers | Heartbeat loss recovery | Recovery runner re-queues jobs from offline workers (> 2 mins). | Pending | | |
| **TC-078** | Security & RLS | Branch isolation verification (Manager) | Manager query to customers only yields matching branch_id. | Pending | | |
| **TC-079** | Security & RLS | Executive isolation verification | Executive query only yields cases where assigned_to matches ID. | Pending | | |
| **TC-080** | Security & RLS | Direct API bypass prevention | Direct POST to `public.customers` via terminal gets blocked by RLS. | Pending | | |
| **TC-081** | Security & RLS | Revoked function execution checks | Invoking `has_permission` as authenticated/anon returns error. | Pending | | |
| **TC-082** | Accessibility | Keyboard navigation on menu links | Tab key highlights menu links chronologically; Enter activates. | Pending | | |
| **TC-083** | Accessibility | Skip Link operability | Pressing tab at page load reveals "Skip to main content" button. | Pending | | |
| **TC-084** | Accessibility | Screen reader announcement on Toast | Success/error toasts include role="alert" or aria-live="polite". | Pending | | |
| **TC-085** | Accessibility | Color contrast validation | Semantic tokens maintain 4.5:1 ratio in light/dark themes. | Pending | | |
| **TC-086** | UI Responsiveness | Narrow mobile viewport test (360px) | Sidebar collapses; table turns into a swipe-scroll container. | Pending | | |
| **TC-087** | Performance | Intent-based route preloading | Hovering a nav item triggers TanStack Router preload query. | Pending | | |
| **TC-088** | Performance | Search debouncing validation | Query triggers 500ms after final keystroke, saving DB IO. | Pending | | |
| **TC-089** | Performance | Query cache hit check | Back button load relies on React Query cache; instantly loads. | Pending | | |
| **TC-090** | Campaign Manager | Create new SMS campaign | Inserts row into comm_campaigns; target_audience matches specs. | Pending | | |
| **TC-091** | Campaign Manager | Schedule a future campaign | Campaign status shifts to 'scheduled'; next_run_at is computed. | Pending | | |
| **TC-092** | Campaign Manager | Campaign progress metric update | As worker runs, stats columns ("sent", "failed") increment. | Pending | | |
| **TC-093** | Communication | Auto-provider resolution fallback | If primary SMS provider fails, worker falls back to secondary. | Pending | | |
| **TC-094** | Communication | Idempotency key duplication check | Attempting to dispatch duplicate key triggers database block. | Pending | | |
| **TC-095** | Operations | Database reset test | Running `supabase db reset` builds clean local database. | Pending | | |
| **TC-096** | Operations | Database dump file backup | Executes `pg_dump`; outputs valid SQL configuration file. | Pending | | |
| **TC-097** | Operations | Database restore execution | Executes schema build on blank target; builds tables without error. | Pending | | |
| **TC-098** | Operations | Environment variables verification | Missing VITE_SUPABASE_URL triggers build failure on compile. | Pending | | |
| **TC-099** | Operations | Production build verification | Executing `npm run build` compiles with zero TS/ESLint warnings. | Pending | | |
| **TC-100** | Operations | Verification of soft-delete filter | SQL queries filter `deleted_at IS NULL` globally; rows excluded. | Pending | | |
