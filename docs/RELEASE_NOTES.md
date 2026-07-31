# Release Notes

## [Unreleased]
### Added
- **Communication Platform**:
  - Implemented generic notification dispatcher supporting SMS, Email, and WhatsApp.
  - Added robust Secrets Management abstraction (`SecretsProvider`) preparing for KMS integration.
  - Implemented Auto-Provider Resolution and Failover (e.g., fallback from Twilio to MSG91).
  - Added Campaign Launcher to fan out bulk messages (e.g., 50k customers) via background jobs.
  - Added idempotency keys to guarantee no duplicate notifications on worker retries.
  - Integrated 100% with the existing Enterprise Background Processing Platform.
  - Added Admin Dashboard (`/admin/communication`) for Campaigns, Templates, Provider Settings, and Delivery Logs.
- **Enterprise Background Processing Platform**:
  - Added generic job queue architecture (`jobs`, `workers`, `job_logs`, `job_failures`).
  - Added dedicated worker daemon using `npm run worker` to process jobs outside the web server.
  - Implemented exponential backoff and dead letter queue (DLQ) for failed jobs.
  - Added Job Dashboard in Admin Panel (`/admin/jobs`) to monitor worker health and job statuses.
  - Added atomic `dequeue_job` RPC for horizontal scaling.
  - Refactored Excel Imports (Customers/Loans) to use chunked background processing.

## 1.0.0 — Commercial release candidate (31 July 2026)

First release positioned as a commercial product for NBFCs and microfinance
institutions. Feature scope is frozen; this release is about quality, performance and
operability.

### Highlights

Recovera now covers the full recovery cycle: portfolio dashboards, a prioritised
recovery queue, structured borrower calling with promise-to-pay tracking, follow-up
scheduling, payment collection, and a compliance-grade audit trail — all scoped by
branch and role in the database.

### Improvements in this release

**Performance**
- Data caching tuned for an operations console: figures stay fresh without the
  background refetch storms that library defaults cause.
- Routes preload on hover/focus intent, so navigation feels instant.
- Added composite indexes for audit filtering, activity feeds, follow-up scheduling
  and branch-wise collection reporting.

**Bundle size**
- The spreadsheet engine — the single largest dependency — now downloads only when an
  administrator opens an import screen, shortening first load for everyone else.

**Experience**
- Page transitions show a layout-matched skeleton instead of a blank screen.
- Import template downloads produce a correctly named `.xlsx` file.
- Failures during a template download now surface as a clear message.

**Safety**
- Failed mutations no longer retry automatically, removing any possibility of a
  retried collection posting twice.

**Documentation**
- Added the product readiness report, quality audit, known limitations and deployment
  checklist alongside the existing project constitution.

### Known limitations

Notification delivery, telephony integration, scheduled reports, offline field mode
and automated tests are not part of this release. See `KNOWN_LIMITATIONS.md`.

### Upgrade notes

Database migrations in this release only add indexes. There is no data migration and
no downtime is expected.
