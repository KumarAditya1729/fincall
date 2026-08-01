# EXCEL INGESTION GUIDE
## REC-DOC-018

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-018
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
3. [Ingestion Schemas & Templates](#3-ingestion-schemas--templates)
4. [Step by Step Ingestion Flow](#4-step-by-step-ingestion-flow)
5. [Common Validation Errors & Troubleshooting](#5-common-validation-errors--troubleshooting)
6. [FAQ](#6-faq)

---

### 1. Purpose
This document provides instructions on how to ingest batch customer and loan portfolios into the Recovera system using Excel spreadsheets. It details column validation rules, data constraints, and troubleshooting.

### 2. Prerequisites
* Role of `super_admin` or `branch_manager`.
* Excel files must not exceed **2,000 rows** or **5 MB** in size per upload batch to prevent browser execution timeouts.
* Files must be in standard `.xlsx` format.

---

### 3. Ingestion Schemas & Templates

#### Customer Ingestion Schema
| Column Name | Data Type | Required | Description / Constraints |
| --- | --- | --- | --- |
| **customer_code** | String | Yes | Unique identifier for the borrower. |
| **full_name** | String | Yes | Full name of the borrower. |
| **phone** | String | Yes | 10-digit mobile number. |
| **alternate_phone**| String | No | Secondary contact number. |
| **address_line** | String | No | Residential address. |
| **city** | String | No | City of residence. |
| **state** | String | No | State of residence. |
| **pincode** | String | No | 6-digit postal code. |
| **kyc_id** | String | No | Aadhaar / PAN card identifier. |

#### Loan Ingestion Schema
| Column Name | Data Type | Required | Description / Constraints |
| --- | --- | --- | --- |
| **loan_number** | String | Yes | Unique identifier for the loan ledger. |
| **customer_code** | String | Yes | Must match an existing customer_code. |
| **product_name** | String | No | Micro-loan, Agri-loan, Gold-loan, etc. |
| **principal_amount**| Decimal | Yes | Total principal disbursed in INR. |
| **outstanding_amount**| Decimal | Yes | Current total amount owed. |
| **overdue_amount** | Decimal | Yes | Current overdue balance. |
| **days_past_due** | Integer | Yes | Days overdue (DPD count). |
| **disbursed_on** | Date (YYYY-MM-DD) | Yes | Original disbursement date. |
| **next_due_date** | Date (YYYY-MM-DD) | Yes | Upcoming EMI date. |

---

### 4. Step by Step Ingestion Flow
1. Navigate to **Data Operations** → **Imports**.
2. Click **Download Template** for either Customers or Loans.
3. Open the spreadsheet and paste data columns matching the required schemas.
4. Drag and drop the completed file into the upload box.
5. Click **Upload**. The page will register a background task.
6. Refresh the page to track progress on the **Import Batches** grid.

> [SCREENSHOT: Drag-and-drop file uploader area inside the Recovera import module]

---

### 5. Common Validation Errors & Troubleshooting
* **Error**: `Customer Code not found`
  - *Cause*: Attempted to upload a loan sheet containing customer codes that do not exist in the database.
  - *Fix*: Ingest the customer details sheet first before loading the loan records.
* **Error**: `Invalid date format`
  - *Cause*: Date columns are formatted as text or custom locale formats instead of YYYY-MM-DD.
  - *Fix*: Set cell format to Date (YYYY-MM-DD) inside Excel before saving.

### 6. FAQ
* **Q: Can we load both customers and loans in the same file?**
  - *A*: No. The database handles them in separate tables with foreign key constraints. Use the distinct templates provided.
* **Q: How does the system handle duplicate customer codes?**
  - *A*: The import database transaction performs an `UPSERT`. It updates existing records with the newest values.
