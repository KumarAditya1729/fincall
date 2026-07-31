# Queue Architecture

## Decoupled Flow
```mermaid
graph TD
    UI[Frontend (React)] -->|Enqueue Job via RPC| API[Supabase DB / RPC]
    API -->|Insert| JobsTable[(Jobs Table)]
    Storage[(Supabase Storage)] -->|Store Large File| API
    
    Worker1[Worker Instance 1] -.->|Heartbeat| WorkersTable[(Workers Table)]
    Worker2[Worker Instance 2] -.->|Heartbeat| WorkersTable
    
    JobsTable -->|dequeue_job() atomic pull| Worker1
    Worker1 -->|Parse & Execute| Handlers[Job Handlers]
    Handlers -->|Update Progress| JobsTable
    Handlers -->|Write Logs| LogsTable[(Job Logs)]
```

## Atomic Locking & Concurrency
To allow horizontal scaling, workers use a highly optimized PostgreSQL function (`dequeue_job`).
This function uses `SELECT ... FOR UPDATE SKIP LOCKED` to atomically grab the highest-priority `queued` job. If multiple workers poll simultaneously, they will securely grab different jobs without race conditions.

## Priorities
Jobs are processed based on their `priority` level:
1. `critical` (e.g., OTP dispatch, real-time webhooks)
2. `high` (e.g., small bulk operations)
3. `medium` (default, e.g., standard imports)
4. `low` (e.g., weekly archival, cleanup)

## Health & Stale Job Recovery
Each worker registers itself in the `workers` table upon boot and emits a heartbeat every 30 seconds.
If a worker crashes, its heartbeat stops. Another worker running the recovery cron will detect jobs assigned to a "dead" worker (heartbeat older than 2 minutes) and re-queue them.

## Retry Mechanism & Dead Letter Queue (DLQ)
Jobs that throw an error increment their `attempts` counter. 
They are rescheduled with exponential backoff.
If `attempts >= max_attempts`, the job status transitions to `dead_letter` and its final stack trace is inserted into `job_failures`. This ensures administrators can inspect and manually requeue the job later.
