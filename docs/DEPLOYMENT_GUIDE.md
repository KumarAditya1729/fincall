# Deployment Guide

This document provides a step-by-step guide to deploying the Recovera enterprise platform into a production environment.

## 1. System Architecture
Recovera operates on a decoupled architecture requiring three primary hosting environments:
1. **Frontend Web Server**: Hosts the React/Vite SPA (e.g., Vercel, Netlify, or AWS S3 + CloudFront).
2. **Background Worker Daemon**: A persistent Node.js/Bun process running `npm run worker` (e.g., AWS EC2, DigitalOcean Droplet, Render Background Worker).
3. **Database & Auth**: Supabase Managed Platform (PostgreSQL + GoTrue Auth).

---

## 2. Supabase Setup (Database & Auth)

1. **Create a Production Project** on [Supabase](https://supabase.com/).
2. **Retrieve Credentials**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Required ONLY for the backend worker daemon).
3. **Run Migrations**:
   From your local terminal, link the production database and push the schema:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. **Configure Authentication**:
   - Disable "Enable email confirmations" if using magic links or auto-verification for internal employees.
   - Set the Site URL to your production domain in Auth Settings.

---

## 3. Frontend Deployment (Vercel / Netlify)

1. Connect your Git repository to your hosting provider.
2. Set the build command: `npm run build`
3. Set the output directory: `dist`
4. Add the following **Environment Variables**:
   ```env
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
5. Deploy.

---

## 4. Background Worker Deployment (EC2 / Render / Railway)

The background worker MUST run continuously. Do not run this on a serverless function with a short timeout.

1. Provision a standard Linux VM or a Background Worker PaaS.
2. Clone the repository and run `npm install`.
3. Add the following **Environment Variables**:
   ```env
   # Database Access (Requires Service Role for background tasks)
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

   # Communication Platform Secrets
   TWILIO_API_KEY=...
   TWILIO_ACCOUNT_SID=...
   MSG91_API_KEY=...
   SMTP_PASSWORD=...
   ```
4. Start the daemon using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "recovera-worker" -- run worker
   ```
5. Configure PM2 to restart on boot:
   ```bash
   pm2 startup
   pm2 save
   ```

---

## 5. Post-Deployment Verification
- Navigate to the Admin Dashboard > Background Jobs.
- Verify the Worker Health indicator shows the production worker is alive and emitting heartbeats.
- Run a small Excel Import to test the storage bucket -> queue -> worker pipeline.
- Fire a test SMS campaign to ensure the SecretsProvider and dispatcher fallback logic operates correctly.
