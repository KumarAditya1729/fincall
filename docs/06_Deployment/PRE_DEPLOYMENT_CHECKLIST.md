# PRE-DEPLOYMENT CHECKLIST
## REC-DOC-009

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-009
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
1. [Purpose](#1-purpose)
2. [Code Quality & Linting](#2-code-quality--linting)
3. [Database Security & RLS Policy Audits](#3-database-security--rls-policy-audits)
4. [Environmental Variables & Secrets Audit](#4-environmental-variables--secrets-audit)
5. [Operational Validation](#5-operational-validation)

---

### 1. Purpose
This checklist must be executed and fully verified prior to declaring any target environment ready for production launch.

---

### 2. Code Quality & Linting
* [ ] **Compilation**: Run `npm run build` locally. Verify that the output builds with zero TypeScript compilation errors.
* [ ] **Lint Checks**: Run ESLint checks. Ensure no unused imports or deprecated APIs exist in the staging tree.
* [ ] **Optimizations**: Confirm that large modules (specifically the `xlsx` parsing engine) load dynamically and do not increase the primary bundle size.

---

### 3. Database Security & RLS Policy Audits
* [ ] **Table RLS Status**: Execute the following query in the database console. Confirm that all 21 user-accessible tables return true for `rowsecurity`:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
* [ ] **Function Privileges**: Verify that the execution permissions for helper functions (`has_role`, `can_access_branch`, `has_permission`) are revoked from PUBLIC, anon, and authenticated. Only database triggers and SECURITY DEFINER RPCs should execute them.
* [ ] **Mutations Audit**: Verify that the audit trigger (`audit_row_change()`) is assigned to all transactional tables (`customers`, `loans`, `payments`, `call_logs`, `remarks`, `followups`).

---

### 4. Environmental Variables & Secrets Audit
* [ ] **Frontend Variables**: Ensure production build settings point strictly to the production Supabase instance and NOT local development instances.
* [ ] **Service Keys**: Ensure that the database service role key (`SUPABASE_SERVICE_ROLE_KEY`) is stored strictly within the background worker environment configuration and never exposed in the client frontend bundle.
* [ ] **API Keys**: Ensure third-party secrets (Twilio account SIDs, SMTP passwords, MSG91 keys) are stored in the server VM `.env` file or KMS, not committed to the Git repository.

---

### 5. Operational Validation
* [ ] **Worker Verification**: Confirm that PM2 manages the `recovera-worker` script and restarts it on failure.
* [ ] **Archival Cron**: Verify the `archive-old-audit-logs-job` exists in the pg_cron schedule list.
* [ ] **UAT Verification**: Complete UAT checks (REC-DOC-014) on the staging environment.
