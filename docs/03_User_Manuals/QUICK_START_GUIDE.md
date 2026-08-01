# QUICK START GUIDE
## REC-DOC-019

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-019
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
2. [Prerequisites](#2-prerequisites)
3. [Quick Action Guides by Role](#3-quick-action-guides-by-role)
4. [FAQ](#4-faq)

---

### 1. Purpose
This document provides a condensed guide to get started with the Recovera platform immediately.

### 2. Prerequisites
* A valid invite link sent from Supabase Auth to your email.
* Modern web browser (Chrome, Edge, or Safari).

---

### 3. Quick Action Guides by Role

#### Super Admin (System Setup)
1. **Log in** to your admin account.
2. Go to **Branches** → Click **Add Branch** → Create your first branch unit.
3. Go to **Employees** → Click **Create Profile** → Input user details.
4. Select the employee → Click **Manage Roles** → Check the required access roles.

#### Branch Manager (Data Import & Allocations)
1. **Log in** to your manager dashboard.
2. Go to **Imports** → Select **Customer Template** → Download and fill with client data.
3. Upload the file and monitor the queue until it is processed.
4. Go to the **Borrower Directory** → Select rows → Click **Assign Selected** → Choose an executive.

#### Recovery Executive (Daily Recovery Actions)
1. **Log in** to the recovery console.
2. Open the **Recovery Queue** on your sidebar.
3. Select a borrower from the list.
4. Call the customer. Click **Log Call Action** → Input notes, schedule a PTP, or log a payment.

---

### 4. FAQ
* **Q: Where do I find template spreadsheets?**
  - *A*: Go to **Data Operations** → **Imports**. The template download links are located directly above the file upload zones.
* **Q: How long does a payment take to reflect?**
  - *A*: Payment ledger updates reflect immediately across all tables because the writes run in transaction-secure SQL database blocks.
* **Q: Can I access the system on my mobile device?**
  - *A*: Yes. The platform uses a responsive layout designed for mobile web browsers.
