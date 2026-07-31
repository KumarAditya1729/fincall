CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_created ON public.audit_logs (branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_branch_created ON public.activity_logs (branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followups_status_date ON public.followups (status, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_branch_paid_on ON public.payments (branch_id, paid_on DESC) WHERE deleted_at IS NULL;
ANALYZE public.audit_logs;
ANALYZE public.activity_logs;