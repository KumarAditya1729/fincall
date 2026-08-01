# RECOVERY EXECUTIVE MANUAL
## REC-DOC-017

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-017
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
3. [Step by Step Tasks](#3-step-by-step-tasks)
4. [Expected Result](#4-expected-result)
5. [Common Errors](#5-common-errors)
6. [Troubleshooting](#6-troubleshooting)
7. [FAQ](#7-faq)

---

### 1. Purpose
This manual instructs Recovery Executives on managing assigned customer portfolios, logging phone communication history, establishing Promise-to-Pay (PTP) agreements, and recording payment collections.

### 2. Prerequisites
* Authenticated account with the role `recovery_executive`.
* Assigned active borrower accounts.

---

### 3. Step by Step Tasks

#### A. Managing the Recovery Queue
1. Log into the system. You are redirected to your dashboard.
2. Click **Recovery Queue** on the sidebar.
3. Review the tabs: **Broken Promises** (high priority), **PTP Today**, **Overdue**, and **Uncontacted**.

> [SCREENSHOT: Prioritized Recovery Queue tabs display showing target collection counts]

#### B. Logging a Customer Call & Setting PTP
1. Select a customer from the queue list.
2. Under the **Timeline** tab, click **Log Call Action**.
3. Select **Call Status** (e.g. Connected, Busy, Switched Off), **Purpose**, and **Talked With**.
4. Enter the call duration and detail remarks.
5. If the customer promises to pay: Check the **Schedule PTP** box. Input the **PTP Date** and **PTP Amount**.
6. Click **Save Call Details**.

> [SCREENSHOT: Call Logging drawer form displaying inputs for PTP amount and date]

#### C. Recording Customer Payments
1. On the borrower page, click the **Record Payment** button.
2. Enter the collection **Amount**, **Date Collected**, **Payment Mode** (Cash, UPI, NEFT), and reference details.
3. Click **Submit Collection**.

---

### 4. Expected Result
* Logging a PTP shifts the borrower's category tag to "PTP".
* Recording a payment reduces the outstanding loan balance on screen in real time.
* If a payment fully settles the balance, the borrower record moves to "Paid" and leaves the active queue.

### 5. Common Errors
* **Error**: `PTP Amount exceeds outstanding balance`
  - *Cause*: Attempting to schedule a promise for more than what is currently due.
* **Error**: `Network request timed out`
  - *Cause*: Flaky internet. Do not re-click "Submit". The system blocks duplicates and will update when the network is restored.

### 6. Troubleshooting
* If a borrower does not show in your queue, ensure the Branch Manager has assigned them to your profile.
* If you set a call follow-up date and it does not show, verify that it was not scheduled on a Sunday or holiday.

### 7. FAQ
* **Q: Can I delete a call log if I made a typo?**
  - *A*: No. Call logs are immutable for compliance. Create a new log correcting the error in the remarks.
* **Q: What is the difference between "PTP Today" and "Broken Promises"?**
  - *A*: "PTP Today" contains cases promised for today. "Broken Promises" matches cases where the promise date passed without the promised payment being made.
