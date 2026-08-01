# SYSTEM ARCHITECTURE SPECIFICATION
## REC-DOC-012

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-012
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
2. [Architectural Overview](#2-architectural-overview)
3. [Component Breakdown](#3-component-breakdown)
4. [Security, RBAC, and RLS Design](#4-security-rbac-and-rls-design)
5. [Background Worker & Queue Architecture](#5-background-worker--queue-architecture)
6. [Communication Platform Architecture](#6-communication-platform-architecture)
7. [Database Schema & Audit Logging](#7-database-schema--audit-logging)

---

### 1. Purpose
This document details the System Architecture Specification for the **Recovera** software implementation, explaining data paths, component responsibilities, database schemas, Row-Level Security, background workers, and deployment structures.

---

### 2. Architectural Overview
Recovera is built on a decoupled, cloud-native architecture that isolates the presentation layer, the data layer, and the asynchronous execution layer.

```text
  [Browser Client]
         │ (HTTPS / WSS)
         ▼
  [Frontend (React/Vite SPA on Vercel)]
         │
         ├───► [Supabase API Gateway (Auth & PostgREST)]
         │           │
         │           ▼
         │     [PostgreSQL Database (RLS & Triggers)]
         │           ▲
         │           │ (FOR UPDATE SKIP LOCKED)
         │           ▼
         └─────► [Background Worker (Bun/Node.js Daemon via PM2)]
                     │
                     ▼
               [Audit & Job Logs Archive (pg_cron)]
```

---

### 3. Component Breakdown

#### Frontend Web App
* **Tech Stack**: React, Vite, TypeScript, Tailwind CSS (using OKLCH colors).
* **Routing**: TanStack Router (type-safe path routing).
* **State Management**: TanStack Query (caching configured with 30s stale time and 5m garbage collection window to prevent backend load).

#### Backend & Database (Supabase)
* **Tech Stack**: Supabase PostgreSQL, Supabase Storage (`job_files` bucket), Supabase Auth.
* **Service Layer**: Pure client-side functions in features (`src/features/*/services/`) call the database; components never query the database directly.
* **Transactional Operations**: Operations such as payment recording (`record_payment`), assignments (`assign_customers`), and imports are wrapped in PostgreSQL `SECURITY DEFINER` functions to maintain ACID compliance.

---

### 4. Security, RBAC, and RLS Design
Security is enforced at the database level rather than the client UI.
* **User Roles**: Three Roles (`super_admin`, `branch_manager`, `recovery_executive`) are mapped inside the `public.user_roles` table.
* **Row-Level Security (RLS)**: Activated on every table in the `public` schema. Policies utilize helpers like `has_role()`, `can_access_branch()`, and `current_branch_id()` to filter result sets:
  ```sql
  -- Example: Branch manager data policy
  CREATE POLICY "Branch managers can manage their templates" ON public.comm_templates
    FOR ALL USING (public.has_role(auth.uid(), 'branch_manager') AND public.can_access_branch(branch_id));
  ```
* **Privileged RPCs**: Self-authorizing `SECURITY DEFINER` routines bypass default tables RLS restrictions but re-verify the active caller profile and role mapping as the first statement of execution.

---

### 5. Background Worker & Queue Architecture
To support large batch files and notifications, Recovera offloads execution to an asynchronous worker.
* **Ingestion Flow**: The frontend uploads a file to Supabase Storage, registers a metadata row in the `public.jobs` table, and returns immediately.
* **Worker Execution**: The background daemon runs on a VM via `npm run worker`. It executes `SELECT ... FOR UPDATE SKIP LOCKED` atomically through the PostgreSQL `dequeue_job()` RPC to prevent race conditions during scaling.
* **Fault Tolerance**: If a job fails, the attempts counter increments, and a retry is scheduled with exponential backoff. If max attempts are reached, the record moves to the `job_failures` DLQ. An automated heartbeat checks for crashed workers and recovers stuck tasks.

---

### 6. Communication Platform Architecture
The communication platform facilitates batch alerts (SMS, Email, WhatsApp).
* **Provider Matrix**: Configurations are stored in `public.comm_providers` and managed via an admin panel.
* **Dispatch Routing**: Campaigns are parsed, split into individual tasks, and sent via background worker jobs. Each job uses an `idempotency_key` (hash of campaign, customer, and date) to prevent duplicate delivery on retry.
* **Failover Logic**: When a primary SMS provider (e.g., Twilio) fails, the dispatcher falls back to a secondary provider (e.g., MSG91) based on priority settings.

---

### 7. Database Schema & Audit Logging
The database schema contains 21 active tables. Key design attributes include:
* **Lifecycle columns**: Every primary operational table includes `id uuid`, `created_at`, `updated_at`, `created_by`, `branch_id`, and `deleted_at`.
* **Fuzzy Search Indexes**: Built using Trigram indexes (`pg_trgm`) on customer phone, name, and loan numbers.
* **Audit Trails**: Trigger-based auditing (`audit_row_change()`) monitors all inserts, updates, and deletes, saving change metadata to `public.audit_logs`. Changes log changed column names, omitting PII values.
* **Logs Archival**: A `pg_cron` schedule executes the `archive_old_audit_logs()` function monthly on the 1st, migrating records older than 1 year to `public.audit_logs_archive`.
