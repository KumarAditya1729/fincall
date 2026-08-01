# KNOWN LIMITATIONS
## REC-DOC-021

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-021
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
2. [Functional System Limitations](#2-functional-system-limitations)
3. [Infrastructure & Setup Limitations](#3-infrastructure--setup-limitations)
4. [FAQ](#4-faq)

---

### 1. Purpose
This document provides a summary of the current limitations and scope constraints of the **Recovera** platform as of release v1.0.0.

### 2. Functional System Limitations
* **Manual Call Logging**: The platform provides structured call result options and notes input, but calls must be placed using the executive's device native dialer. The system does not dial calls automatically.
* **No Telephony Integration**: Automatic outcome logging, dialer screens, and call recording are not supported in the current release.
* **Notifications Configuration Required**: The platform includes user template settings and database schema variables for SMS, WhatsApp, and Email alerts, but these features require configuring production gateway APIs (e.g. Twilio, MSG91) on the background worker VM before messages can be dispatched.
* **No Direct Payment Gateway**: Executives record payment details manually. Borrowers cannot process online payments through a gateway directly in the system.

### 3. Infrastructure & Setup Limitations
* **Continuous Network Connectivity**: The application runs entirely online. It does not support offline data entry or sync modes.
* **Synchronous Browser File Caps**: Ingestion uploads via the Excel parsing tool are restricted to **2,000 rows** or **5 MB** per batch to prevent browser window timeouts.

### 4. FAQ
* **Q: Can we load files larger than 2,000 rows?**
  - *A*: No. Large files must be split into smaller blocks before uploading to avoid browser timeouts.
* **Q: Does the system run without internet access?**
  - *A*: No. A persistent internet connection is required to communicate with the database and enforce RLS policies.
