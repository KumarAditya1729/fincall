# SUPER ADMINISTRATOR MANUAL
## REC-DOC-015

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-015
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
3. [Step by Step System Configurations](#3-step-by-step-system-configurations)
4. [Expected Result](#4-expected-result)
5. [Common Errors](#5-common-errors)
6. [Troubleshooting](#6-troubleshooting)
7. [FAQ](#7-faq)

---

### 1. Purpose
This manual instructs Super Administrators on configuring organizations, adding branches, mapping employee security roles using transaction-secure RPC operations, managing global holiday calendars, and monitoring background worker processes.

### 2. Prerequisites
* Actively authenticated Supabase credentials with the role `super_admin` assigned.
* Network access to the Admin Panel routes (`/admin/*`).

---

### 3. Step by Step System Configurations

#### A. Managing Branches
1. Navigate to the **Admin Dashboard** → **Branch Configuration**.
2. Click **Add New Branch**.
3. Input the unique **Branch Code** (e.g., BR-PATNA-01), Branch Name, Address, and City.
4. Click **Submit**.

> [SCREENSHOT: Branch Configuration panel showing the "Add New Branch" form modal]

#### B. Mapping Employee Roles Securely
1. Navigate to the **Employee Directory** under the Admin panel.
2. Select the target profile row. Click **Manage Roles**.
3. Toggle checkmarks for the desired roles (`super_admin`, `branch_manager`, `recovery_executive`).
4. Click **Apply Changes**. This triggers the `admin_set_user_roles()` stored function to commit changes.

> [SCREENSHOT: Employee Role Configuration Modal with app_role enum checkboxes]

#### C. Setting Holidays and Working Hours
1. Navigate to **System Settings** → **Holiday Calendar**.
2. Click **Create Holiday**. Input the name (e.g. Independence Day), date, and select if it is recurring.
3. In the **Working Hours** tab, set day-wise operational start and end times. Click **Save Working Hours**.

> [SCREENSHOT: System Holiday Calendar grid displaying monthly national and regional holidays]

---

### 4. Expected Result
* New branches immediately appear in customer transfer dropdown selectors.
* Employees assigned a role can instantly log in and access their role-specific dashboards.
* Scheduled PTP dates are validated against the holiday calendar table; warning dialogs alert users if a PTP overlaps with a defined holiday.

### 5. Common Errors
* **Error**: `Only super admins can change roles`
  - *Cause*: A user lacking the `super_admin` role attempted to update security settings.
* **Error**: `At least one super admin must remain`
  - *Cause*: Attempting to remove the `super_admin` role from the last surviving administrator or yourself.

### 6. Troubleshooting
* If an employee cannot see data, ensure their `branch_id` is correctly mapped on their profile table row. RLS policies block reads if the profile lacks a valid, active branch link.
* Check the **Background Jobs** monitoring screen (`/admin/jobs`) to verify worker heartbeats if imports fail to process.

### 7. FAQ
* **Q: Can we delete branches that have active loans?**
  - *A*: No. The database references branch IDs in the `loans` table. Set the branch status to "Inactive" instead to block logins.
* **Q: What happens if I update a role while the employee is logged in?**
  - *A*: The security token remains active until it expires. Have the employee log out and log back in to reload their token payload.
