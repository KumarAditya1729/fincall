# BRANCH MANAGER MANUAL
## REC-DOC-016

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-016
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
3. [Step by Step Operations](#3-step-by-step-operations)
4. [Expected Result](#4-expected-result)
5. [Common Errors](#5-common-errors)
6. [Troubleshooting](#6-troubleshooting)
7. [FAQ](#7-faq)

---

### 1. Purpose
This manual instructs Branch Managers on daily operations, including uploading customer portfolios, assigning recovery cases, executing branch customer transfers, and reviewing branch performance metrics.

### 2. Prerequisites
* Authenticated session with the role `branch_manager`.
* Profile link mapped to a valid `branch_id` in the database.

---

### 3. Step by Step Operations

#### A. Case Allocation & Reassignment
1. Navigate to the **Borrower Directory** page.
2. Select multiple customers using the checkboxes on the data table.
3. Click the **Assign Selected** button on the table toolbar.
4. Choose the target **Recovery Executive** from the dropdown menu. Click **Assign**.

> [SCREENSHOT: Borrower Directory table showing checked boxes and the bulk assignment selection dropdown]

#### B. Importing Loan & Customer Data
1. Navigate to **Data Operations** → **Imports**.
2. Click **Download Ingestion Template** (.xlsx) to match the correct column format.
3. Prepare the spreadsheet. Click **Upload File**, choose the Excel workbook, and submit.
4. Track the batch processing state on the **Import Batches** table.

> [SCREENSHOT: Data Operations Import page showing progress meters and import batch records]

#### C. Requesting Branch-to-Branch Transfers
1. Select a customer record in the directory.
2. Click **Transfer Branch**.
3. Select the target destination branch and click **Submit Transfer**. This triggers `transfer_customers_branch()` at the database transaction layer.

---

### 4. Expected Result
* Reassigned cases disappear from the previous executive's Today's Work list and show up immediately in the new assignee's queue.
* Excel uploads are parsed asynchronously in chunks by background workers, showing progress bars (0% to 100%) in the interface.

### 5. Common Errors
* **Error**: `Cannot assign customers outside your branch`
  - *Cause*: RLS prevents managers from accessing profiles, customers, or employees of other branch IDs.
* **Error**: `Validation Error: File contains invalid customer codes`
  - *Cause*: Uploaded sheet contains blank fields in required key columns.

### 6. Troubleshooting
* If a background import appears "Stuck" in the queued state, verify if the background worker daemon (`npm run worker`) is active on the server.
* Ensure executives are assigned to the manager's branch before seeking to assign cases to them.

### 7. FAQ
* **Q: Can I edit loan values manually from the UI?**
  - *A*: No. Loan updates are ledger-driven. Update outstanding amounts through imports or payment logging.
* **Q: How can I download my branch performance report?**
  - *A*: Use the **Export to CSV** action located on the **Collections Reports** dashboard.
