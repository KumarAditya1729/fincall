-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create Archive Table mirroring audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  id uuid PRIMARY KEY,
  user_id uuid,
  branch_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL
);

-- Grant permissions on archive table
GRANT SELECT, INSERT ON public.audit_logs_archive TO authenticated;
GRANT ALL ON public.audit_logs_archive TO service_role;
ALTER TABLE public.audit_logs_archive ENABLE ROW LEVEL SECURITY;

-- Enable RLS policies for Archive table (similar to audit_logs)
CREATE POLICY "Allow super_admin to view archive logs" ON public.audit_logs_archive
  FOR SELECT TO authenticated USING (public.is_admin());

-- Stored procedure to archive logs older than 1 year
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Move logs older than 1 year to archive table
  WITH moved_rows AS (
    DELETE FROM public.audit_logs
    WHERE created_at < now() - interval '1 year'
    RETURNING *
  )
  INSERT INTO public.audit_logs_archive (id, user_id, branch_id, action, entity_type, entity_id, metadata, created_at)
  SELECT id, user_id, branch_id, action, entity_type, entity_id, metadata, created_at FROM moved_rows;
END;
$$;

-- Schedule the job to run every month on the 1st at midnight
-- Note: '0 0 1 * *' is standard cron format for "monthly at midnight"
SELECT cron.schedule(
  'archive-old-audit-logs-job',
  '0 0 1 * *',
  'SELECT public.archive_old_audit_logs()'
);
