# ANNUAL MAINTENANCE CONTRACT (AMC) PROPOSAL
## REC-DOC-005

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-005
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
1. [Purpose](#1-purpose)
2. [Scope of Services](#2-scope-of-services)
3. [Proactive Maintenance & Database Optimization](#3-proactive-maintenance--database-optimization)
4. [Commercial Terms & AMC Fees](#4-commercial-terms--amc-fees)

---

### 1. Purpose
This document presents the Annual Maintenance Contract (AMC) proposal to ACFL Patna for post-warranty support and upkeep of the **Recovera** software platform.

### 2. Scope of Services
The AMC ensures the platform continues running smoothly in production. It includes:
* **Production Support**: Continued access to support channels with P1/P2/P3 response guarantees.
* **Minor Enhancements**: Up to 12 small developer hours per month for text updates, template edits, and system configuration.
* **Platform Upgrades**: Applying minor Supabase database patches, Node.js runtime updates, and React library updates.

### 3. Proactive Maintenance & Database Optimization
To prevent system slowdowns as portfolios scale, SoftTech Verse will execute:
* **Database Performance Review**: Monthly check of query execution times, composite indexes, and vacuuming logs.
* **Worker Heartbeat Monitoring**: Verifying daemon health metrics and job failure logs in the DLQ.
* **Archival Audits**: Ensuring pg_cron tasks successfully migrate old `audit_logs` to `audit_logs_archive` tables.

---

### 4. Commercial Terms & AMC Fees
* **AMC Fee**: Billed annually at **1,20,000 INR per year** (exclusive of GST).
* **Payment Terms**: 100% advance at the beginning of the AMC term.
* **Renewal**: The AMC will renew automatically unless terminated with 30 days written notice prior to the end of the term.
* **Exclusions**: Major structural design changes or new feature developments remain excluded and will require a Change Request.
