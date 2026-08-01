# COMMERCIAL SOFTWARE PROPOSAL
## REC-DOC-001

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-001
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

### APPROVAL & SIGN-OFF

```text
Prepared By: SoftTech Verse Technical Writing Team
Signature: __________________________  Date: ______________

Reviewed By: Project Manager, SoftTech Verse
Signature: __________________________  Date: ______________

Approved By: Director of Operations, SoftTech Verse
Signature: __________________________  Date: ______________

Accepted By Client: ACFL Patna Authorized Signatory
Signature: __________________________  Date: ______________
```

---

### TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [Purpose](#2-purpose)
3. [Business Challenges Addressed](#3-business-challenges-addressed)
4. [Implemented System Capabilities](#4-implemented-system-capabilities)
5. [Enterprise-Grade Security & Scalability](#5-enterprise-grade-security--scalability)
6. [Conclusion](#6-conclusion)

---

### 1. Executive Summary
SoftTech Verse is pleased to present this Commercial Software Proposal to ACFL Patna for the **Recovera Loan Recovery Management System**. As microfinance institutions (MFIs) and Non-Banking Financial Companies (NBFCs) scale, managing non-performing assets (NPAs) and streamlining recovery processes becomes critical. Recovera is a specialized enterprise solution built to optimize the daily operations of loan recovery teams, manage portfolios, enforce Row-Level Security (RLS) across branches, track Promises to Pay (PTP), and record payment collections in a centralized, secure repository.

### 2. Purpose
The purpose of this document is to outline the commercial and functional capabilities of the Recovera platform as implemented for ACFL Patna. It maps the system modules to operational needs, detailing how the software resolves security, performance, and field execution issues in collections.

### 3. Business Challenges Addressed
* **Branch-wise Data Leakage**: Standard systems expose global portfolios to executives. Recovera restricts access using strict Postgres Row-Level Security (RLS) so users only view their assigned branches.
* **Unstructured Follow-ups**: Field executives lack a structured, prioritized queue of cases, leading to missed broken promises. Recovera provides an automated status-based Recovery Queue.
* **Double Posting Risks**: Flaky networks in rural areas often cause executives to click "Submit Payment" multiple times, resulting in duplicate collections. Recovera disables automatic retries for mutations and wraps multi-table writes in transaction-guaranteed database functions.
* **Lack of Compliance Trail**: Regulatory audits require tracking who accessed or modified what borrower information. Recovera enforces trigger-based immutable auditing.

### 4. Implemented System Capabilities
Recovera is structured into several high-performance modules:
* **Recovery Queue**: Automatically buckets loans into "Overdue", "PTP Today", "Broken Promises", and "Uncontacted" based on real-time database query computations.
* **Borrower Directory & 360-degree View**: A detailed portal containing customer metadata, active loans, call logs, scheduled follow-ups, and payment records.
* **Call Logging & Follow-ups**: Provides executives the ability to log calls, set connection statuses, schedule future follow-up dates (validated against branch holiday calendars), and input PTP details.
* **Transaction Recording**: Atomic payment recording utilizing specialized database functions to update outstanding loan balances and customer recovery states.

### 5. Enterprise-Grade Security & Scalability
Recovera is built using a React/TypeScript SPA frontend paired with a Supabase PostgreSQL backend. It utilizes:
* **PostgreSQL RLS Triggers**: Database-level security functions (`has_role`, `can_access_branch`) ensure data isolation.
* **Horizontal Background Workers**: A dedicated queue runner (`npm run worker`) processes data imports, notifications, and archival jobs asynchronously, offloading CPU-heavy tasks from the main thread.

### 6. Conclusion
The Recovera Loan Recovery Management System represents a secure, compliant, and highly performant platform tailored to ACFL Patna’s recovery goals. We look forward to executing a successful rollout.
