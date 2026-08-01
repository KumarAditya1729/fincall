# DATABASE BACKUP AND RESTORE GUIDE
## REC-DOC-010

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-010
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
2. [Backup Strategy & Architecture](#2-backup-strategy--architecture)
3. [Manual Backup (pg_dump)](#3-manual-backup-pg_dump)
4. [Database Restore Procedure](#4-database-restore-procedure)
5. [Disaster Recovery Drills](#5-disaster-recovery-drills)

---

### 1. Purpose
This document provides instructions on backing up and restoring the Recovera Supabase PostgreSQL database. It outlines recovery point objectives (RPO) and recovery time objectives (RTO).

### 2. Backup Strategy & Architecture
* **Point-in-Time Recovery (PITR)**: Enabled by default on Supabase Pro projects. PostgreSQL database write-ahead logs (WAL) are archived to Cloud Storage every 2 minutes. This provides an **RPO of 2 minutes**.
* **Daily Logical Backups**: Automated snapshots are captured nightly at 00:00 UTC and retained for 30 days.

---

### 3. Manual Backup (pg_dump)
Administrators must capture a manual logical backup prior to running database schema migrations or code upgrades.

#### Commands to execute:
```bash
# Export the schema and user roles
pg_dump -h db.your-project-ref.supabase.co -U postgres -d postgres --schema-only > recovera_schema_backup.sql

# Export the table data
pg_dump -h db.your-project-ref.supabase.co -U postgres -d postgres --data-only --exclude-schema=storage > recovera_data_backup.sql
```
*Note: Ensure your IP is added to the allowed database connection whitelist in your Supabase dashboard settings.*

---

### 4. Database Restore Procedure
If data corruption occurs, execute these steps to restore service:

#### Step 1: Place Application in Maintenance Mode
Stop all background worker daemons on your VMs to prevent active writes:
```bash
pm2 stop recovera-worker
```

#### Step 2: Restore via Supabase Dashboard
1. Open the **Supabase Dashboard** → **Database** → **Backups**.
2. Select the daily snapshot preceding the corruption date.
3. Click **Restore**. The database will reboot and restore the selected state.

#### Step 3: Manual Restore (Alternative)
If restoring to a new database instance:
1. Re-initialize migrations to build the schema structure:
   ```bash
   npx supabase db push
   ```
2. Import the data dump:
   ```bash
   psql -h db.your-new-project-ref.supabase.co -U postgres -d postgres -f recovera_data_backup.sql
   ```

#### Step 4: Restart Services
Start the background workers to resume operations:
```bash
pm2 start recovera-worker
```

---

### 5. Disaster Recovery Drills
* **Restoration Rehearsals**: DR drills must be performed quarterly by restoring logical backups to a sandbox testing project. This helps verify backup integrity and test restoration times.
* **Target Recovery Time Objective (RTO)**: 1 Hour.
