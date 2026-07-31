# Enterprise Background Processing Platform

## Overview
The Recovera Background Processing Platform is a mature, decoupled, and horizontally scalable asynchronous execution engine. It serves as the foundation for all long-running, CPU-intensive, or external-API-dependent tasks, preventing the primary web server (Nitro) and the browser from blocking.

## Core Principles
1. **Complete Decoupling:** The web frontend and API only *enqueue* jobs. They never process them.
2. **Generic Queue System:** Designed as an Enterprise Job Processing Platform, it supports diverse workloads (e.g., imports, AI scoring, telephony syncing, scheduled reports) rather than being hardcoded for Excel imports.
3. **Pluggability:** New job types can be added by registering a new `JobHandler` in the worker process.
4. **Resiliency:** Jobs are atomic, automatically retried with exponential backoff on failure, and moved to a Dead Letter Queue (DLQ) if they permanently fail. Stale jobs (where a worker died unexpectedly) are recovered using heartbeat monitoring.

## Supported Job Types
- `customer_import`
- `loan_import`
- `employee_import`
- `sms_dispatch`
- `whatsapp_dispatch`
- `email_dispatch`
- `daily_report`
- `weekly_report`
- `monthly_report`
- `archive_logs`
- `cleanup_storage`
- `telephony_sync`
- `ai_transcription`
- `ai_summary`
- `ai_scoring`
- `backup`
- `restore`

## Deployment
Workers run independently from the web server using `npm run worker`. In production, this allows you to scale workers horizontally on different containers/VMs than the web frontend.
