# SCOPE OF WORK
## REC-DOC-003

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-003
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
1. [Objective](#1-objective)
2. [Project Deliverables](#2-project-deliverables)
3. [Scope Boundaries (Included vs. Excluded)](#3-scope-boundaries-included-vs-excluded)
4. [Assumptions & Client Responsibilities](#4-assumptions--client-responsibilities)

---

### 1. Objective
This Scope of Work (SOW) defines the boundary of technical implementations, configurations, and services delivered by SoftTech Verse under the **Recovera** deployment contract.

### 2. Project Deliverables
SoftTech Verse will deliver the following system deliverables:
* **Web Console**: A React/Vite-based Single Page Application (SPA) responsive dashboard and operations portal.
* **Database Setup**: Supabase PostgreSQL database schemas, Row-Level Security (RLS) policies, and performance indexes.
* **Worker Process**: Node.js/Bun background worker code executing tasks such as Excel ingestion, template generation, and audit log cleanups.

---

### 3. Scope Boundaries (Included vs. Excluded)

To prevent future disputes, the project scope is explicitly divided into included modules and excluded capabilities.

#### Included Scope
The following modules and features are implemented and included in the system:
1. **Authentication**: Supabase Auth integration, user invitation, role management, and session timeouts.
2. **Recovery Queue**: Dynamic status-based filtering (Overdue, PTP Today, Broken Promises, Uncontacted) computed entirely at the database level.
3. **Customer Management**: Profile directories, branch allocation, executive assignments, and notes management.
4. **Loan Management**: Record tracking for loan balances, principal amounts, Days Past Due (DPD), next due dates, and amortization metadata.
5. **Reports**: Operational metrics dashboards (Branch-wise and executive-wise counts, collections, and promise trends).
6. **Call Logging**: Structured remarks, connection status tracking, talked-with validation, and database logs.
7. **Promise to Pay (PTP)**: Amount validation, date selection, automated queue shifting, and promise-broken markers.
8. **Payment Recording**: Secure transaction records linked to profiles and loans with immediate balance adjustments.
9. **Audit Logs**: Immutable Postgres triggers auditing all tables, capturing changed fields (names only) for maximum security compliance.

#### Excluded Scope
The following features are **not** implemented in the current system and are explicitly excluded from this SOW. Any future request for these items will require a separate Change Request:
1. **Mobile App**: Native Android or iOS applications (the web app is fully responsive on mobile browsers, but no standalone store app is provided).
2. **Auto Dialer / Telephony**: Automatic dialers, call recordings, CTI dialer screens, and interactive voice response (IVR) setups.
3. **WhatsApp Integration**: Outbound API pipelines or WhatsApp Business account dispatch setups.
4. **SMS Gateway**: Production MSG91/Twilio SMS gateway connections (the dashboard supports template definition, but actual SMS delivery pipelines are not configured).
5. **Payment Gateway**: Integrations with Razorpay, Stripe, or Paytm to collect payments directly from customers.
6. **AI**: Predictive scoring, machine learning based delinquency clustering, or AI chat assistants.
7. **OCR**: Optical Character Recognition for borrower KYC documents.
8. **Voice Analytics**: Speech-to-text transcription of executive calls or call tone analysis.

---

### 4. Assumptions & Client Responsibilities
* ACFL Patna will provide a clean Supabase production project with full access.
* Master data templates (Excel sheets) must strictly match the schemas defined in the documentation package.
