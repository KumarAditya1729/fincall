# WARRANTY AND SUPPORT AGREEMENT
## REC-DOC-004

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-004
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
2. [Scope of Warranty (Bug-Fix Only)](#2-scope-of-warranty-bug-fix-only)
3. [Exclusions from Warranty](#3-exclusions-from-warranty)
4. [Support Service Levels (SLAs)](#4-support-service-levels-slas)

---

### 1. Purpose
This document defines the terms of the software warranty and support deliverables provided by SoftTech Verse to ACFL Patna for the **Recovera** platform deployment.

### 2. Scope of Warranty (Bug-Fix Only)
SoftTech Verse warrants that the software will perform substantially in accordance with the user manuals for a period of **90 days** from the Go-Live date.
* This warranty is strictly limited to fixing verified defects (bugs) where the software deviates from the specified features (e.g. database RLS filters failing, payments failing to post).
* Verified bugs will be resolved at no additional charge to ACFL Patna during the warranty window.

### 3. Exclusions from Warranty
The warranty does **not** cover, and SoftTech Verse is not responsible for, the following:
* **Feature Additions**: Any request for new functional scopes, modules, layout updates, API additions, or modifications.
* **Integrations**: Telephony connections, actual SMS/WhatsApp dispatch pipelines, or payment gateway setups.
* **Database Management**: Data loss arising from administrator operations, incorrect Excel workbook data uploads, or credential leaks.
* **Third-Party Failures**: Outages on Supabase, Vercel, Render, or MSG91 networks.

---

### 4. Support Service Levels (SLAs)
During the warranty window, support requests will be addressed based on severity level:

| Severity Level | Definition | Response SLA | Resolution SLA |
| --- | --- | --- | --- |
| **P1 - Critical** | Core system offline, login blocked, or RLS security breach. | 2 Hours | 8 Hours |
| **P2 - High** | Excel uploader blocked, dashboard charts failing, or queries timing out. | 4 Hours | 24 Hours |
| **P3 - Low** | Layout formatting, cosmetic bugs, or minor UI display problems. | 12 Hours | 5 Days |
