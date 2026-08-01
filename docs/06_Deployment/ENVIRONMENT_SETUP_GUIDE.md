# ENVIRONMENT SETUP GUIDE
## REC-DOC-011

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-011
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
2. [Local Machine Prerequisites](#2-local-machine-prerequisites)
3. [Step-by-Step Initial Setup](#3-step-by-step-initial-setup)
4. [Configuring Environment Variables](#4-configuring-environment-variables)
5. [Database Migrations & Mock Seed](#5-database-migrations--mock-seed)
6. [Running Local Servers](#6-running-local-servers)

---

### 1. Purpose
This document provides developers step-by-step instructions to configure, install, and execute a local development environment for the Recovera platform.

### 2. Local Machine Prerequisites
* **Node.js**: Version 20.x or higher (LTS recommended).
* **NPM**: Version 10.x or higher, or **Bun** runtime (v1.1+).
* **Docker Desktop**: Required to run local Supabase containers.
* **Supabase CLI**: Installed globally or invoked via `npx`.

---

### 3. Step-by-Step Initial Setup
1. Clone the repository to your local workstation:
   ```bash
   git clone your-recovera-repo.git
   cd warm-welcome-main
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```

### 4. Configuring Environment Variables
1. Copy the environment variables template file:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and populate the local credentials. The default values for local development are:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=your-local-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
   ```

---

### 5. Database Migrations & Mock Seed
1. Ensure Docker Desktop is active on your machine.
2. Initialize and start the local Supabase container environment:
   ```bash
   npx supabase start
   ```
3. Run migrations and seed data:
   ```bash
   npx supabase db reset
   ```
   *Note: This command runs all sql migration files under `supabase/migrations/` and executes the seed file to establish initial profiles, branches, and sample loans.*

---

### 6. Running Local Servers
To run the complete system locally, start the frontend server and the background worker daemon in separate terminals:

#### Terminal 1: Frontend Web Server
```bash
npm run dev
```
*Loads the React application. Open [http://localhost:5173](http://localhost:5173) in your web browser.*

#### Terminal 2: Background Worker Daemon
```bash
npm run worker
```
*Launches the local job runner queue. The worker checks for queued Excel imports and schedules follow-up logs.*
