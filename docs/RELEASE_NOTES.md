# Release Notes

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
