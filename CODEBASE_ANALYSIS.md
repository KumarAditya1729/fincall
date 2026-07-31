# Codebase Analysis

Based on the documentation and project constitution, here is an analysis of the current state of the repository.

## 1. Missing Features

*(Primarily drawn from `KNOWN_LIMITATIONS.md` and `PRODUCT_READINESS_REPORT.md`)*

- **Outbound Notifications:** The system has templates for notifications (SMS/Email/WhatsApp) but no implementation or background worker to actually dispatch them.
- **Telephony Integration (CTI):** No native dialer, call recording, or automatic outcome sync. Click-to-call currently relies on the device's native dialer.
- **Automated Reporting:** All reports are on-screen. No PDF export or scheduled email report delivery.
- **Borrower Portal / Payment Gateway:** Collections are manually recorded by executives. Borrowers cannot log in or pay directly via a gateway.
- **Offline / Field Mode:** The application requires a constant network connection; there is no offline sync functionality.
- **Large Imports:** Imports run synchronously in the browser and are capped at 2,000 rows / 5MB to avoid freezing the UI.
- **Multi-tenant Isolation:** The application is built for a single organization. It uses `branch_id` for scoping but lacks a true organization/tenant layer.
- **Localization:** Assumes a single currency (INR) and timezone (Asia/Kolkata).

## 2. Security Issues

*(The platform has strong RLS and trigger-based security, but holds some risks)*

- **`SECURITY DEFINER` Exposure:** There are 7 self-authorizing RPCs (e.g., `record_payment`, `import_customers`) that bypass RLS because they must perform multi-table writes. Although they internally re-validate `auth.uid()`, a flaw in their logic could lead to privilege escalation.
- **Missing Penetration Test:** The application lacks a formal external security audit / penetration test.
- **No Data Retention/Purge Policy:** `audit_logs` and `activity_logs` will grow infinitely, which could become a compliance and performance issue over time.

## 3. Technical Debt

- **No Automated Tests:** The repository lacks unit tests, integration tests, or E2E tests (Cypress/Playwright). Verification relies entirely on TypeScript type-checking and manual QA.
- **Synchronous Browser Imports:** Parsing spreadsheets via `xlsx` happens in the browser's main thread. While dynamically loaded to save bundle size, this is a suboptimal pattern for larger files.
- **Observability:** No application performance monitoring (APM), error tracking (like Sentry), or custom uptime alerting outside of default hosting metrics.
- **Disaster Recovery:** A backup restoration has not been rehearsed on the current schema.

## 4. Bugs

*(Most pre-GA bugs were fixed in the quality audit, but the following areas are prone to bugs based on architecture)*

- **Browser Parsing Quirks:** Since imports rely on browser-side Excel parsing, edge cases in date formats or corrupted files could fail silently or parse incorrectly if not strictly handled by Zod.
- **Network Flakiness on Actionable RPCs:** Although React Query mutation retries were disabled to prevent duplicate payments, if a network timeout occurs *after* the server commits but *before* the client receives the response, the UI might show an error while the DB succeeded.

## 5. Improvements (Pre-GA & Future Backlog)

- **Test Automation (Highest Priority):** Implement a test suite covering critical paths: the recovery queue, payment recording, and import workflows (e.g., using Vitest for services and Playwright for E2E).
- **Asynchronous Processing:** Move spreadsheet parsing and imports to an asynchronous backend worker (via Edge Functions or a queue) to support larger files and prevent browser lock-up.
- **Notification Service:** Implement the missing outbound notification delivery mechanism (e.g., integrating Twilio for SMS / WhatsApp).
- **Archival Jobs:** Establish a data lifecycle policy and implement cron jobs (via pg_cron or Supabase edge functions) to archive old `audit_logs` and `activity_logs`.
- **Accessibility Validation:** Conduct an independent accessibility audit with real screen-reader users, moving beyond simple WCAG code reviews.
- **Disaster Recovery Drill:** Perform a full backup-restore rehearsal to document exact RTO/RPO metrics.
