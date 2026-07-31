# Job Schema

## `workers`
Tracks active worker processes for heartbeat monitoring.
- `id`: UUID (Primary Key)
- `hostname`: VARCHAR
- `pid`: INT
- `status`: VARCHAR (alive, offline)
- `last_heartbeat_at`: TIMESTAMPTZ
- `started_at`: TIMESTAMPTZ

## `jobs`
The core queue table.
- `id`: UUID (Primary Key)
- `type`: VARCHAR (e.g., 'customer_import')
- `priority`: VARCHAR ('critical', 'high', 'medium', 'low')
- `status`: VARCHAR ('queued', 'running', 'retrying', 'completed', 'cancelled', 'dead_letter', 'archived')
- `payload`: JSONB (Data required for the job, e.g., file paths)
- `progress`: INT (0 - 100)
- `attempts`: INT (Default 0)
- `max_attempts`: INT (Default 3)
- `error_message`: TEXT (Last error message)
- `assigned_worker_id`: UUID (FK to `workers`)
- `branch_id`: UUID (FK to `branches` for RBAC)
- `created_by`: UUID (FK to `users`)
- `locked_at`: TIMESTAMPTZ
- `next_run_at`: TIMESTAMPTZ
- `started_at`: TIMESTAMPTZ
- `finished_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

## `job_logs`
Structured logs emitted by the worker during execution.
- `id`: UUID (Primary Key)
- `job_id`: UUID (FK to `jobs`)
- `level`: VARCHAR ('info', 'warn', 'error')
- `message`: TEXT
- `metadata`: JSONB
- `created_at`: TIMESTAMPTZ

## `job_failures`
Stores detailed stack traces for jobs in the Dead Letter Queue.
- `id`: UUID (Primary Key)
- `job_id`: UUID (FK to `jobs`)
- `failed_at`: TIMESTAMPTZ
- `error_details`: TEXT
- `stack_trace`: TEXT
