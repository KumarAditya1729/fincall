
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (full_name public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm ON public.customers USING gin (phone public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_code_trgm ON public.customers USING gin (customer_code public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_loans_number_trgm ON public.loans USING gin (loan_number public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_call_logs_ptp_date ON public.call_logs (ptp_date) WHERE deleted_at IS NULL AND ptp_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_called_at ON public.call_logs (customer_id, called_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_loans_overdue ON public.loans (customer_id) WHERE deleted_at IS NULL AND overdue_amount > 0;
CREATE INDEX IF NOT EXISTS idx_followups_customer ON public.followups (customer_id, scheduled_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_collected_by ON public.payments (collected_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_remarks_author ON public.remarks (author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles (branch_id) WHERE deleted_at IS NULL;

-- ---------- Data quality constraints ----------
ALTER TABLE public.customers
  ADD CONSTRAINT customers_name_not_blank CHECK (length(btrim(full_name)) > 0) NOT VALID;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_phone_length CHECK (length(btrim(phone)) BETWEEN 6 AND 20) NOT VALID;
ALTER TABLE public.remarks
  ADD CONSTRAINT remarks_body_not_blank CHECK (length(btrim(body)) > 0) NOT VALID;
ALTER TABLE public.call_logs
  ADD CONSTRAINT call_logs_ptp_requires_date CHECK (ptp_amount IS NULL OR ptp_date IS NOT NULL) NOT VALID;
ALTER TABLE public.branches
  ADD CONSTRAINT branches_code_not_blank CHECK (length(btrim(code)) > 0) NOT VALID;

ALTER TABLE public.customers VALIDATE CONSTRAINT customers_name_not_blank;
ALTER TABLE public.customers VALIDATE CONSTRAINT customers_phone_length;
ALTER TABLE public.remarks VALIDATE CONSTRAINT remarks_body_not_blank;
ALTER TABLE public.call_logs VALIDATE CONSTRAINT call_logs_ptp_requires_date;
ALTER TABLE public.branches VALIDATE CONSTRAINT branches_code_not_blank;

-- ---------- Recovery queue bucket resolution, computed in the database ----------
-- SECURITY INVOKER: the caller's RLS policies still decide which rows are visible.
CREATE OR REPLACE FUNCTION public.recovery_bucket_customer_ids(_bucket text)
RETURNS TABLE (customer_id uuid, in_bucket boolean)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT l.customer_id, true
  FROM public.loans l
  WHERE _bucket = 'overdue' AND l.deleted_at IS NULL AND l.overdue_amount > 0
  UNION
  SELECT DISTINCT c.customer_id, true
  FROM public.call_logs c
  WHERE _bucket = 'ptp_today' AND c.deleted_at IS NULL AND c.ptp_date = CURRENT_DATE
  UNION
  SELECT DISTINCT c.customer_id, true
  FROM public.call_logs c
  WHERE _bucket = 'broken_ptp' AND c.deleted_at IS NULL AND c.ptp_date < CURRENT_DATE
  UNION
  SELECT DISTINCT c.customer_id, false
  FROM public.call_logs c
  WHERE _bucket = 'uncontacted' AND c.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.recovery_bucket_customer_ids(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recovery_bucket_customer_ids(text) TO authenticated;
