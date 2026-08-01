# DEPLOYMENT GUIDE
## REC-DOC-008

---

### PROJECT METADATA
* **Project Name**: Recovera Loan Recovery Management System
* **Client Name**: ACFL Patna
* **Version**: 1.0.0
* **Document No.**: REC-DOC-008
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
2. [Target Environments](#2-target-environments)
3. [Database & Authentication Setup (Supabase)](#3-database--authentication-setup-supabase)
4. [Frontend Web App Deployment (Vercel)](#4-frontend-web-app-deployment-vercel)
5. [Background Worker Ingestion Setup (PM2 VM)](#5-background-worker-ingestion-setup-pm2-vm)
6. [Post-Deployment Verification](#6-post-deployment-verification)

---

### 1. Purpose
This document provides step-by-step instructions to install and deploy the Recovera production platform, including database setup, frontend configuration, and background worker services.

---

### 2. Target Environments
Recovera requires three hosting setups:
1. **Frontend App**: Serverless SPA hosting (Vercel, Netlify, or AWS S3 + CloudFront).
2. **Database & API**: Supabase Managed Postgres.
3. **Background Worker Daemon**: Persistent VM (EC2, DigitalOcean Droplet, Render) running Bun or Node.js.

---

### 3. Database & Authentication Setup (Supabase)
1. **Create a Production Project** on the Supabase dashboard.
2. Go to **Project Settings** → **API** to copy the URL, Anon Key, and Service Role Key (securely storage the Service Role Key).
3. Open your terminal in the Recovera project repository.
4. Link the CLI to your production reference and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref your-production-project-ref
   npx supabase db push
   ```
5. In **Auth Settings**:
   - Set the Site URL to the production frontend domain.
   - Disable email confirmation if using magic link verification.

---

### 4. Frontend Web App Deployment (Vercel)
1. Import your Recovera Git repository into Vercel.
2. Select **Vite** as the framework template.
3. Set the build command to `npm run build` and output directory to `dist`.
4. Add the following **Environment Variables**:
   * `VITE_SUPABASE_URL` = (Your Supabase URL)
   * `VITE_SUPABASE_ANON_KEY` = (Your Supabase Anon Key)
5. Click **Deploy**.

---

### 5. Background Worker Ingestion Setup (PM2 VM)
The worker daemon executes async bulk data imports and campaign alerts. It must run as a persistent process.
1. Provision a Linux VM (Ubuntu 22.04 LTS). Install Node.js v20+ and NPM.
2. Clone the codebase and install dependencies:
   ```bash
   git clone your-recovera-repo.git
   cd warm-welcome-main
   npm install
   ```
3. Create a production `.env` file in the root:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_API_KEY=your-key
   MSG91_API_KEY=your-msg-key
   SMTP_PASSWORD=your-smtp-pwd
   ```
4. Install PM2 process manager globally:
   ```bash
   sudo npm install -g pm2
   ```
5. Launch the daemon:
   ```bash
   pm2 start npm --name "recovera-worker" -- run worker
   ```
6. Set up startup system scripts to persist the process after VM reboots:
   ```bash
   pm2 startup
   pm2 save
   ```

---

### 6. Post-Deployment Verification
* Access the Admin Panel under the **Background Jobs** tab.
* Confirm that worker heartbeats update every 30 seconds.
* Run a test customer spreadsheet upload. Check that the progress indicator moves and status changes to "completed".
