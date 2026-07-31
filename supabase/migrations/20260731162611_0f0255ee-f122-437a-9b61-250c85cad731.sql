-- 1. Lock down SECURITY DEFINER helpers (callable only internally by policies)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_access_branch(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_branch_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Referential integrity for log tables so profile names can be embedded
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.followups
  ADD CONSTRAINT followups_assigned_to_fkey FOREIGN KEY (assigned_to)
  REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.call_logs
  ADD CONSTRAINT call_logs_called_by_fkey FOREIGN KEY (called_by)
  REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.remarks
  ADD CONSTRAINT remarks_author_id_fkey FOREIGN KEY (author_id)
  REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Payments become tamper-resistant
DROP POLICY IF EXISTS payments_write ON public.payments;
CREATE POLICY payments_insert ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (collected_by = auth.uid() AND (can_access_branch(branch_id) OR branch_id IS NULL));
CREATE POLICY payments_admin_update ON public.payments
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY payments_admin_delete ON public.payments
  FOR DELETE TO authenticated USING (is_admin());

-- 4. Value integrity
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);
ALTER TABLE public.loans ADD CONSTRAINT loans_amounts_non_negative
  CHECK (outstanding_amount >= 0 AND overdue_amount >= 0 AND principal_amount >= 0 AND days_past_due >= 0);
ALTER TABLE public.call_logs ADD CONSTRAINT call_logs_duration_non_negative
  CHECK (duration_seconds >= 0 AND (ptp_amount IS NULL OR ptp_amount > 0));

-- 5. Performance indexes for queue / timeline / audit screens
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON public.customers (updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_loans_branch ON public.loans (branch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_branch ON public.call_logs (branch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_loan ON public.payments (loan_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_followups_schedule ON public.followups (scheduled_date, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_remarks_customer ON public.remarks (customer_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);