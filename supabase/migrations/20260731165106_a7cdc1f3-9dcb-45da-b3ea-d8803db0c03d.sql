-- =============================================================
-- 1. TAMPER-PROOF AUDIT TRAIL (database-enforced, not client)
-- =============================================================
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_row jsonb;
  v_old jsonb;
  v_action text;
  v_entity uuid;
  v_branch uuid;
  v_changed text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := to_jsonb(OLD);
    v_action := TG_TABLE_NAME || '.delete';
  ELSE
    v_row := to_jsonb(NEW);
    IF TG_OP = 'INSERT' THEN
      v_action := TG_TABLE_NAME || '.create';
    ELSE
      v_old := to_jsonb(OLD);
      SELECT array_agg(key ORDER BY key) INTO v_changed
      FROM jsonb_each(v_row) e(key, value)
      WHERE key NOT IN ('updated_at') AND v_old -> key IS DISTINCT FROM e.value;

      IF v_changed IS NULL THEN
        RETURN NEW;
      END IF;

      IF (v_old ? 'deleted_at')
         AND v_old ->> 'deleted_at' IS NULL
         AND v_row ->> 'deleted_at' IS NOT NULL THEN
        v_action := TG_TABLE_NAME || '.soft_delete';
      ELSE
        v_action := TG_TABLE_NAME || '.update';
      END IF;
    END IF;
  END IF;

  v_entity := NULLIF(v_row ->> 'id', '')::uuid;
  IF v_row ? 'branch_id' THEN
    v_branch := NULLIF(v_row ->> 'branch_id', '')::uuid;
  END IF;

  -- Only field NAMES are recorded, never values: the audit trail must not
  -- become a secondary store of borrower personal data.
  INSERT INTO public.audit_logs (user_id, branch_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    v_branch,
    v_action,
    TG_TABLE_NAME,
    v_entity,
    jsonb_strip_nulls(jsonb_build_object('changed', to_jsonb(v_changed)))
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_customers ON public.customers;
CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_loans ON public.loans;
CREATE TRIGGER audit_loans AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_call_logs ON public.call_logs;
CREATE TRIGGER audit_call_logs AFTER INSERT OR UPDATE OR DELETE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_followups ON public.followups;
CREATE TRIGGER audit_followups AFTER INSERT OR UPDATE OR DELETE ON public.followups
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_remarks ON public.remarks;
CREATE TRIGGER audit_remarks AFTER INSERT OR UPDATE OR DELETE ON public.remarks
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_branches ON public.branches;
CREATE TRIGGER audit_branches AFTER INSERT OR UPDATE OR DELETE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- =============================================================
-- 2. SOFT DELETE ONLY FOR BORROWERS
-- =============================================================
DROP POLICY IF EXISTS customers_delete ON public.customers;
REVOKE DELETE ON public.customers FROM authenticated;

-- =============================================================
-- 3. ATOMIC BROKEN PROMISE
-- =============================================================
CREATE OR REPLACE FUNCTION public.mark_broken_promise(
  _customer_id uuid,
  _note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_branch uuid;
  v_assigned uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _note IS NULL OR length(btrim(_note)) = 0 THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  SELECT branch_id, assigned_to INTO v_branch, v_assigned
  FROM public.customers
  WHERE id = _customer_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrower not found';
  END IF;

  IF NOT (public.is_admin() OR public.can_access_branch(v_branch) OR v_assigned = v_uid) THEN
    RAISE EXCEPTION 'Not allowed for this borrower';
  END IF;

  INSERT INTO public.remarks (customer_id, branch_id, author_id, body)
  VALUES (_customer_id, v_branch, v_uid, 'Broken promise: ' || btrim(_note));

  UPDATE public.customers
     SET recovery_status = 'in_progress'::recovery_status
   WHERE id = _customer_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_broken_promise(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_broken_promise(uuid, text) TO authenticated;

-- =============================================================
-- 4. SERVER-SIDE RECOVERY QUEUE (single round-trip, paginated)
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_loans_number_trgm
  ON public.loans USING gin (loan_number extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_loans_overdue
  ON public.loans (customer_id) WHERE deleted_at IS NULL AND overdue_amount > 0;

CREATE OR REPLACE FUNCTION public.recovery_queue_page(
  _search text DEFAULT NULL,
  _loan_search text DEFAULT NULL,
  _status text DEFAULT NULL,
  _branch_id uuid DEFAULT NULL,
  _assigned_to uuid DEFAULT NULL,
  _bucket text DEFAULT NULL,
  _limit int DEFAULT 20,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  full_name text,
  customer_code text,
  phone text,
  recovery_status recovery_status,
  branch_id uuid,
  branch_name text,
  assignee_id uuid,
  assignee_name text,
  outstanding numeric,
  overdue numeric,
  max_dpd int,
  loan_numbers text[],
  last_call_at timestamptz,
  ptp_amount numeric,
  ptp_date date,
  is_broken_promise boolean,
  total_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH today AS (SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date AS d),
  base AS (
    SELECT c.*
    FROM public.customers c
    WHERE c.deleted_at IS NULL
      AND (_search IS NULL OR _search = '' OR
           c.full_name ILIKE '%' || _search || '%' OR
           c.phone ILIKE '%' || _search || '%' OR
           c.customer_code ILIKE '%' || _search || '%')
      AND (_status IS NULL OR _status = '' OR c.recovery_status::text = _status)
      AND (_branch_id IS NULL OR c.branch_id = _branch_id)
      AND (_assigned_to IS NULL OR c.assigned_to = _assigned_to)
      AND (_loan_search IS NULL OR _loan_search = '' OR EXISTS (
            SELECT 1 FROM public.loans l
            WHERE l.customer_id = c.id AND l.deleted_at IS NULL
              AND l.loan_number ILIKE '%' || _loan_search || '%'))
      AND (
        _bucket IS NULL OR _bucket = '' OR _bucket = 'all'
        OR (_bucket = 'overdue' AND EXISTS (
              SELECT 1 FROM public.loans l
              WHERE l.customer_id = c.id AND l.deleted_at IS NULL AND l.overdue_amount > 0))
        OR (_bucket = 'ptp_today' AND EXISTS (
              SELECT 1 FROM public.call_logs cl, today t
              WHERE cl.customer_id = c.id AND cl.deleted_at IS NULL AND cl.ptp_date = t.d))
        OR (_bucket = 'broken_ptp' AND c.recovery_status = 'ptp'::recovery_status AND EXISTS (
              SELECT 1 FROM public.call_logs cl, today t
              WHERE cl.customer_id = c.id AND cl.deleted_at IS NULL AND cl.ptp_date < t.d))
        OR (_bucket = 'uncontacted' AND NOT EXISTS (
              SELECT 1 FROM public.call_logs cl
              WHERE cl.customer_id = c.id AND cl.deleted_at IS NULL))
      )
  ),
  counted AS (SELECT count(*) AS n FROM base),
  page AS (
    SELECT * FROM base
    ORDER BY updated_at DESC
    LIMIT GREATEST(1, LEAST(_limit, 100)) OFFSET GREATEST(0, _offset)
  )
  SELECT
    p.id,
    p.full_name,
    p.customer_code,
    p.phone,
    p.recovery_status,
    p.branch_id,
    b.name,
    p.assigned_to,
    pr.full_name,
    COALESCE(la.outstanding, 0),
    COALESCE(la.overdue, 0),
    COALESCE(la.max_dpd, 0),
    COALESCE(la.loan_numbers, ARRAY[]::text[]),
    lc.called_at,
    lc.ptp_amount,
    lc.ptp_date,
    (lc.ptp_date IS NOT NULL AND lc.ptp_date < t.d AND p.recovery_status = 'ptp'::recovery_status),
    counted.n
  FROM page p
  CROSS JOIN counted
  CROSS JOIN today t
  LEFT JOIN public.branches b ON b.id = p.branch_id
  LEFT JOIN public.profiles pr ON pr.id = p.assigned_to
  LEFT JOIN LATERAL (
    SELECT sum(l.outstanding_amount) AS outstanding,
           sum(l.overdue_amount) AS overdue,
           max(l.days_past_due) AS max_dpd,
           array_agg(l.loan_number ORDER BY l.loan_number) AS loan_numbers
    FROM public.loans l
    WHERE l.customer_id = p.id AND l.deleted_at IS NULL
  ) la ON true
  LEFT JOIN LATERAL (
    SELECT cl.called_at, cl.ptp_amount, cl.ptp_date
    FROM public.call_logs cl
    WHERE cl.customer_id = p.id AND cl.deleted_at IS NULL
    ORDER BY cl.called_at DESC
    LIMIT 1
  ) lc ON true
  ORDER BY p.updated_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.recovery_queue_page(text, text, text, uuid, uuid, text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recovery_queue_page(text, text, text, uuid, uuid, text, int, int) TO authenticated;