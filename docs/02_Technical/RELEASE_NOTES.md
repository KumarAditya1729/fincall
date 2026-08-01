# RELEASE NOTES
## REC-DOC-013

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-013
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
1. [Introduction](#1-introduction)
2. [Release Summary](#2-release-summary)
3. [Key Highlights](#3-key-highlights)
4. [Detailed Feature Log](#4-detailed-feature-log)
5. [Upgrade Instructions](#5-upgrade-instructions)

---

### 1. Introduction
This release document presents the functional changes, performance optimizations, and backend architectural updates for the **Recovera** software platform release **v1.0.0**.

### 2. Release Summary
* **Release Version**: 1.0.0
* **Release Date**: 31 July 2026
* **Environment**: Production Staging
* **Build Status**: Compiles cleanly with zero errors

### 3. Key Highlights
* **Operational console optimizations**: Configured client-side state caching (staleTime 30s) and intention-based route preloading to ensure quick navigation.
* **Row-Level Security (RLS)**: Enforced branch-wise scope in PostgreSQL to restrict data visibility.
* **Asynchronous execution engine**: Implemented background workers (`npm run worker`) locking job rows atomically with `SELECT FOR UPDATE SKIP LOCKED` for scale-out support.

### 4. Detailed Feature Log

#### Added
* **Communication Engine**: Generic notification pipeline (SMS, WhatsApp, Email) backed by secrets management, auto-provider resolution, and campaigns.
* **Queue System**: Jobs database table, workers monitoring dashboard under admin panel, and exponential retry backoff.
* **Audit Triggers**: Database-level auditing of table row changes.

#### Fixed
* **Spreadsheet Parsing Bundle**: Moved `xlsx` library to a dynamic `import()` statement, decreasing primary bundle size by ~800KB.
* **Double-payment Protection**: Disabled automatic mutation retries on flaky network connections.
* **File Extensions**: Fixed extension omission during spreadsheet template downloads.

### 5. Upgrade Instructions
This version relies on fresh migrations. No data transformations or downtimes are required for database migration since it only appends optimized indexes.
`npx supabase db push` must be run on the target database instance.
