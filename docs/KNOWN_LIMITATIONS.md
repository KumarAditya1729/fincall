# Known Limitations

Honest disclosure of what the platform does **not** do today. Nothing here blocks a
controlled pilot; each item is a deliberate scope decision, not an unnoticed defect.

## Accepted design decisions

- **Seven `SECURITY DEFINER` routines are callable by any signed-in user.**
  `record_payment`, `mark_broken_promise`, `assign_customers`,
  `transfer_customers_branch`, `admin_set_user_roles`, `import_customers` and
  `import_loans` must be reachable by the app, so the database linter flags them.
  Each one re-checks `auth.uid()`, role and branch scope as its first statements and
  raises on failure. This is the intended pattern: privileged work happens in one
  audited place instead of being spread across client-trusted table writes.
- **Audit entries record changed field names, not values.** Deliberate: the audit
  trail must not become a second, less protected store of borrower personal data.
  Value-level history would need a separate, access-restricted design.
- **Spreadsheet parsing happens in the browser.** Only to turn a file into rows; the
  database routines own duplicate detection, branch scoping and permissions, and will
  reject anything the browser mis-parses.

## Functional gaps

- No outbound SMS/email/WhatsApp delivery. Notification templates can be authored and
  stored, but nothing sends them yet.
- No true telephony integration. Click-to-call hands off to the device dialler; there
  is no call recording, no auto-dialler and no CTI outcome sync.
- Reporting is on-screen only. There is no scheduled report delivery and no PDF export.
- No borrower-facing portal and no payment gateway; collections are recorded, not taken.
- No offline/field mode. Executives need connectivity to log a call.
- Imports are capped at 2,000 rows and 5 MB per file, and run synchronously.
- Single currency (INR) and single timezone (Asia/Kolkata). Both are assumed, not
  configurable per tenant.
- Single-tenant deployment: one lender per instance. There is no cross-organisation
  isolation layer above `branch_id`.

## Operational gaps

- No automated test suite. Verification is typecheck plus manual walkthrough.
- No uptime monitoring, alerting or error-rate dashboard beyond platform defaults.
- Data retention and purge policy is undefined; logs grow without an archival job.
- Backup restore has not been rehearsed against this schema.
- Accessibility is code-reviewed against WCAG 2.1 AA but has not been validated by an
  external audit or with real screen-reader users.

## Pre-GA backlog (recommended order)

1. Automated regression tests for the recovery, payment and import workflows.
2. Notification delivery for at least one channel.
3. Retention/archival policy for `audit_logs` and `activity_logs`.
4. Backup-restore rehearsal and a documented RTO/RPO.
5. Independent penetration test and accessibility audit.
6. Asynchronous, resumable imports for files above the current cap.
