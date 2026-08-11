-- Background Jobs Queue Architecture

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Workers table (for heartbeats)
CREATE TABLE IF NOT EXISTS public.workers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hostname text NOT NULL,
    pid int NOT NULL,
    status text NOT NULL CHECK (status IN ('alive', 'offline')),
    last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'retrying', 'completed', 'cancelled', 'dead_letter', 'archived', 'paused')),
    payload jsonb DEFAULT '{}'::jsonb,
    progress int DEFAULT 0,
    attempts int DEFAULT 0,
    max_attempts int DEFAULT 3,
    error_message text,
    assigned_worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    locked_at timestamptz,
    next_run_at timestamptz DEFAULT now(),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_priority_next_run ON public.jobs (status, priority, next_run_at) WHERE status IN ('queued', 'retrying');

-- 3. Job Logs table
CREATE TABLE IF NOT EXISTS public.job_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    level text NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON public.job_logs(job_id);

-- 4. Job Failures table (DLQ Stack Traces)
CREATE TABLE IF NOT EXISTS public.job_failures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    failed_at timestamptz DEFAULT now(),
    error_details text NOT NULL,
    stack_trace text
);

-- Triggers
CREATE OR REPLACE TRIGGER set_jobs_updated_at 
BEFORE UPDATE ON public.jobs 
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_failures ENABLE ROW LEVEL SECURITY;

-- Admins and branch managers can read jobs
DROP POLICY IF EXISTS "Admins and managers can see jobs" ON public.jobs;
CREATE POLICY "Admins and managers can see jobs" ON public.jobs FOR SELECT
  USING (public.is_admin() OR branch_id IS NULL OR public.can_access_branch(branch_id));

-- Admins and branch managers can insert jobs for their branch
DROP POLICY IF EXISTS "Admins and managers can insert jobs" ON public.jobs;
CREATE POLICY "Admins and managers can insert jobs" ON public.jobs FOR INSERT
  WITH CHECK (public.is_admin() OR branch_id IS NULL OR public.can_access_branch(branch_id));

-- Admins and branch managers can update jobs
DROP POLICY IF EXISTS "Admins and managers can update jobs" ON public.jobs;
CREATE POLICY "Admins and managers can update jobs" ON public.jobs FOR UPDATE
  USING (public.is_admin() OR branch_id IS NULL OR public.can_access_branch(branch_id));

-- Anyone who can see the job can see its logs
DROP POLICY IF EXISTS "Can see job logs if can see job" ON public.job_logs;
CREATE POLICY "Can see job logs if can see job" ON public.job_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_logs.job_id));

DROP POLICY IF EXISTS "Can see job failures if can see job" ON public.job_failures;
CREATE POLICY "Can see job failures if can see job" ON public.job_failures FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_failures.job_id));

DROP POLICY IF EXISTS "Super admins can see workers" ON public.workers;
CREATE POLICY "Super admins can see workers" ON public.workers FOR SELECT
  USING (public.is_admin());

-- Supabase Storage bucket for background processing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job_files', 'job_files', false) 
ON CONFLICT DO NOTHING;

-- RLS for Storage (Authenticated users can upload/read)
DROP POLICY IF EXISTS "Authenticated users can upload job files" ON storage.objects;
CREATE POLICY "Authenticated users can upload job files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job_files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read job files" ON storage.objects;
CREATE POLICY "Authenticated users can read job files" ON storage.objects FOR SELECT
  USING (bucket_id = 'job_files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update job files" ON storage.objects;
CREATE POLICY "Authenticated users can update job files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'job_files' AND auth.role() = 'authenticated');

-- Atomic Dequeue Function
CREATE OR REPLACE FUNCTION public.dequeue_job(p_worker_id uuid)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.jobs;
BEGIN
  -- We want to pop exactly 1 job, locking it atomically.
  -- Sort order: Critical (1), High (2), Medium (3), Low (4), then oldest created.
  UPDATE public.jobs
  SET 
    status = 'running',
    assigned_worker_id = p_worker_id,
    locked_at = now(),
    started_at = COALESCE(started_at, now()),
    updated_at = now()
  WHERE id = (
    SELECT id
    FROM public.jobs
    WHERE status IN ('queued', 'retrying')
      AND next_run_at <= now()
    ORDER BY 
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END ASC,
      created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING * INTO v_job;

  IF FOUND THEN
    RETURN NEXT v_job;
  END IF;
END;
$$;
