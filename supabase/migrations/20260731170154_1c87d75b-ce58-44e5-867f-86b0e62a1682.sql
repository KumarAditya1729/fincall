
-- ============================================================
-- 1. MASTER DATA
-- ============================================================
CREATE TABLE public.master_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('recovery_status','purpose','talked_with')),
  code text NOT NULL,
  label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 120),
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  branch_id uuid REFERENCES public.branches(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_items TO authenticated;
GRANT ALL ON public.master_items TO service_role;
ALTER TABLE public.master_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY master_items_read ON public.master_items FOR SELECT TO authenticated USING (true);
CREATE POLICY master_items_admin ON public.master_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE UNIQUE INDEX master_items_type_code_uniq
  ON public.master_items (type, lower(code)) WHERE deleted_at IS NULL;
CREATE INDEX master_items_type_idx ON public.master_items (type, sort_order) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. HOLIDAY CALENDAR
-- ============================================================
CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  holiday_date date NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  notes text,
  branch_id uuid REFERENCES public.branches(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY holidays_read ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY holidays_admin ON public.holidays FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE UNIQUE INDEX holidays_date_branch_uniq
  ON public.holidays (holiday_date, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE deleted_at IS NULL;
CREATE INDEX holidays_date_idx ON public.holidays (holiday_date) WHERE deleted_at IS NULL;

-- ============================================================
-- 3. WORKING HOURS
-- ============================================================
CREATE TABLE public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_working_day boolean NOT NULL DEFAULT true,
  start_time time NOT NULL DEFAULT '09:30',
  end_time time NOT NULL DEFAULT '18:30',
  branch_id uuid REFERENCES public.branches(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT working_hours_range CHECK (end_time > start_time)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_hours TO authenticated;
GRANT ALL ON public.working_hours TO service_role;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY working_hours_read ON public.working_hours FOR SELECT TO authenticated USING (true);
CREATE POLICY working_hours_admin ON public.working_hours FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE UNIQUE INDEX working_hours_day_branch_uniq
  ON public.working_hours (day_of_week, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE deleted_at IS NULL;

-- ============================================================
-- 4. NOTIFICATION TEMPLATES
-- ============================================================
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL CHECK (code ~ '^[a-z0-9_]{2,60}$'),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  channel text NOT NULL CHECK (channel IN ('sms','email','whatsapp','in_app')),
  subject text,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  is_active boolean NOT NULL DEFAULT true,
  branch_id uuid REFERENCES public.branches(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_templates_read ON public.notification_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY notification_templates_admin ON public.notification_templates FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE UNIQUE INDEX notification_templates_code_uniq
  ON public.notification_templates (lower(code), channel) WHERE deleted_at IS NULL;

-- ============================================================
-- 5. ROLE PERMISSIONS
-- ============================================================
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission text NOT NULL CHECK (permission ~ '^[a-z0-9_]+\.[a-z0-9_]+$'),
  allowed boolean NOT NULL DEFAULT true,
  branch_id uuid REFERENCES public.branches(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_permissions_read ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY role_permissions_admin ON public.role_permissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE UNIQUE INDEX role_permissions_uniq
  ON public.role_permissions (role, permission) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role AND rp.deleted_at IS NULL
    WHERE ur.user_id = _user_id AND rp.permission = _permission AND rp.allowed
  ) OR public.has_role(_user_id, 'super_admin');
$$;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 6. IMPORT BATCHES
-- ============================================================
CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('customers','loans')),
  file_name text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  success_rows integer NOT NULL DEFAULT 0 CHECK (success_rows >= 0),
  failed_rows integer NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  branch_id uuid REFERENCES public.branches(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY import_batches_read ON public.import_batches FOR SELECT TO authenticated
  USING (public.is_admin() OR created_by = auth.uid() OR public.can_access_branch(branch_id));
CREATE INDEX import_batches_created_idx ON public.import_batches (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- 7. TIMESTAMP + AUDIT TRIGGERS ON NEW TABLES
-- ============================================================
CREATE TRIGGER t_master_items BEFORE UPDATE ON public.master_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_holidays BEFORE UPDATE ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_working_hours BEFORE UPDATE ON public.working_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_notification_templates BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_role_permissions BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_import_batches BEFORE UPDATE ON public.import_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER audit_master_items AFTER INSERT OR UPDATE OR DELETE ON public.master_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_holidays AFTER INSERT OR UPDATE OR DELETE ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_working_hours AFTER INSERT OR UPDATE OR DELETE ON public.working_hours
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_notification_templates AFTER INSERT OR UPDATE OR DELETE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_role_permissions AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_import_batches AFTER INSERT OR UPDATE OR DELETE ON public.import_batches
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- ============================================================
-- 8. USER ROLES: standard columns + admin-managed grants
-- ============================================================
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid;
CREATE TRIGGER t_user_roles BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Role changes go exclusively through admin_set_user_roles(), which is
-- SECURITY DEFINER and re-checks the caller. No direct write grants.
CREATE OR REPLACE FUNCTION public.admin_set_user_roles(_user_id uuid, _roles public.app_role[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_admin_count int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only super admins can change roles'; END IF;
  IF _roles IS NULL OR array_length(_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one role is required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Employee not found';
  END IF;

  -- Never let the platform end up without a super admin, and never let an
  -- admin silently strip their own privileges.
  IF public.has_role(_user_id, 'super_admin') AND NOT ('super_admin' = ANY(_roles)) THEN
    IF _user_id = v_uid THEN
      RAISE EXCEPTION 'You cannot remove your own super admin role';
    END IF;
    SELECT count(*) INTO v_admin_count FROM public.user_roles WHERE role = 'super_admin';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'At least one super admin must remain';
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND NOT (role = ANY(_roles));
  INSERT INTO public.user_roles (user_id, role, created_by)
  SELECT _user_id, r, v_uid FROM unnest(_roles) AS r
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.activity_logs (user_id, activity, entity_type, entity_id, metadata)
  VALUES (v_uid, 'employee.roles_update', 'user_roles', _user_id,
          jsonb_build_object('roles', to_jsonb(_roles)));
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, public.app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, public.app_role[]) TO authenticated;

-- ============================================================
-- 9. ASSIGNMENT / TRANSFER RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_customers(_customer_ids uuid[], _assigned_to uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_target_branch uuid;
  v_count int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.is_admin() OR public.has_role(v_uid, 'branch_manager')) THEN
    RAISE EXCEPTION 'You are not allowed to assign borrowers';
  END IF;
  IF _customer_ids IS NULL OR array_length(_customer_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Select at least one borrower';
  END IF;
  IF array_length(_customer_ids, 1) > 500 THEN
    RAISE EXCEPTION 'Assign at most 500 borrowers at a time';
  END IF;

  IF _assigned_to IS NOT NULL THEN
    SELECT branch_id INTO v_target_branch FROM public.profiles
      WHERE id = _assigned_to AND is_active AND deleted_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Selected employee is not active'; END IF;
  END IF;

  UPDATE public.customers c
     SET assigned_to = _assigned_to
   WHERE c.id = ANY(_customer_ids)
     AND c.deleted_at IS NULL
     AND (public.is_admin() OR public.can_access_branch(c.branch_id))
     AND (_assigned_to IS NULL OR v_target_branch IS NULL OR c.branch_id IS NULL
          OR c.branch_id = v_target_branch);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No borrowers could be assigned. Check branch of the selected employee.';
  END IF;

  INSERT INTO public.activity_logs (user_id, branch_id, activity, entity_type, metadata)
  VALUES (v_uid, v_target_branch, 'customer.assign', 'customers',
          jsonb_build_object('assignedTo', _assigned_to, 'count', v_count));
  RETURN v_count;
END; $$;
REVOKE EXECUTE ON FUNCTION public.assign_customers(uuid[], uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_customers(uuid[], uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.transfer_customers_branch(_customer_ids uuid[], _branch_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only super admins can transfer branches'; END IF;
  IF _customer_ids IS NULL OR array_length(_customer_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Select at least one borrower';
  END IF;
  IF array_length(_customer_ids, 1) > 500 THEN
    RAISE EXCEPTION 'Transfer at most 500 borrowers at a time';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.branches WHERE id = _branch_id AND deleted_at IS NULL AND is_active) THEN
    RAISE EXCEPTION 'Target branch is not active';
  END IF;

  -- Clear ownership when the current owner does not belong to the new branch.
  UPDATE public.customers c
     SET branch_id = _branch_id,
         assigned_to = CASE
           WHEN c.assigned_to IS NULL THEN NULL
           WHEN EXISTS (SELECT 1 FROM public.profiles p
                        WHERE p.id = c.assigned_to AND p.branch_id = _branch_id) THEN c.assigned_to
           ELSE NULL END
   WHERE c.id = ANY(_customer_ids) AND c.deleted_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.loans SET branch_id = _branch_id
   WHERE customer_id = ANY(_customer_ids) AND deleted_at IS NULL;

  INSERT INTO public.activity_logs (user_id, branch_id, activity, entity_type, metadata)
  VALUES (v_uid, _branch_id, 'customer.branch_transfer', 'customers',
          jsonb_build_object('count', v_count));
  RETURN v_count;
END; $$;
REVOKE EXECUTE ON FUNCTION public.transfer_customers_branch(uuid[], uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_customers_branch(uuid[], uuid) TO authenticated;

-- ============================================================
-- 10. EXCEL IMPORT RPCs (validated server-side, per-row errors)
-- ============================================================
CREATE OR REPLACE FUNCTION public.import_customers(_rows jsonb, _branch_id uuid, _file_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row jsonb;
  v_index int := 0;
  v_ok int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_code text; v_name text; v_phone text; v_branch uuid;
  v_batch_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.is_admin() OR public.has_role(v_uid, 'branch_manager')) THEN
    RAISE EXCEPTION 'You are not allowed to import borrowers';
  END IF;
  IF jsonb_typeof(_rows) <> 'array' THEN RAISE EXCEPTION 'Invalid file contents'; END IF;
  IF jsonb_array_length(_rows) > 2000 THEN RAISE EXCEPTION 'Import at most 2000 rows per file'; END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    v_index := v_index + 1;
    v_code := btrim(COALESCE(v_row->>'customer_code',''));
    v_name := btrim(COALESCE(v_row->>'full_name',''));
    v_phone := regexp_replace(COALESCE(v_row->>'phone',''), '[^0-9+]', '', 'g');
    v_branch := COALESCE(NULLIF(v_row->>'branch_id','')::uuid, _branch_id);

    IF v_code = '' OR v_name = '' OR length(v_phone) < 7 THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason',
        'customer_code, full_name and a valid phone are required');
      CONTINUE;
    END IF;
    IF v_branch IS NULL OR NOT public.can_access_branch(v_branch) THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason', 'Branch missing or not permitted');
      CONTINUE;
    END IF;
    IF EXISTS (SELECT 1 FROM public.customers WHERE lower(customer_code) = lower(v_code) AND deleted_at IS NULL) THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason', 'Duplicate customer code');
      CONTINUE;
    END IF;

    INSERT INTO public.customers (customer_code, full_name, phone, alternate_phone, email,
      address_line, city, state, pincode, kyc_id, branch_id, created_by)
    VALUES (v_code, v_name, v_phone, NULLIF(btrim(COALESCE(v_row->>'alternate_phone','')),''),
      NULLIF(btrim(COALESCE(v_row->>'email','')),''), NULLIF(btrim(COALESCE(v_row->>'address_line','')),''),
      NULLIF(btrim(COALESCE(v_row->>'city','')),''), NULLIF(btrim(COALESCE(v_row->>'state','')),''),
      NULLIF(btrim(COALESCE(v_row->>'pincode','')),''), NULLIF(btrim(COALESCE(v_row->>'kyc_id','')),''),
      v_branch, v_uid);
    v_ok := v_ok + 1;
  END LOOP;

  INSERT INTO public.import_batches (entity_type, file_name, total_rows, success_rows, failed_rows,
    errors, branch_id, created_by)
  VALUES ('customers', COALESCE(NULLIF(btrim(_file_name),''), 'upload.xlsx'), v_index, v_ok,
    jsonb_array_length(v_errors), v_errors, _branch_id, v_uid)
  RETURNING id INTO v_batch_id;

  RETURN jsonb_build_object('batchId', v_batch_id, 'total', v_index, 'success', v_ok,
    'failed', jsonb_array_length(v_errors), 'errors', v_errors);
END; $$;
REVOKE EXECUTE ON FUNCTION public.import_customers(jsonb, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_customers(jsonb, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.import_loans(_rows jsonb, _file_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row jsonb;
  v_index int := 0;
  v_ok int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_loan_no text; v_cust_code text; v_customer public.customers%ROWTYPE;
  v_principal numeric; v_outstanding numeric; v_emi numeric; v_overdue numeric;
  v_batch_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.is_admin() OR public.has_role(v_uid, 'branch_manager')) THEN
    RAISE EXCEPTION 'You are not allowed to import loans';
  END IF;
  IF jsonb_typeof(_rows) <> 'array' THEN RAISE EXCEPTION 'Invalid file contents'; END IF;
  IF jsonb_array_length(_rows) > 2000 THEN RAISE EXCEPTION 'Import at most 2000 rows per file'; END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    v_index := v_index + 1;
    v_loan_no := btrim(COALESCE(v_row->>'loan_number',''));
    v_cust_code := btrim(COALESCE(v_row->>'customer_code',''));

    IF v_loan_no = '' OR v_cust_code = '' THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason',
        'loan_number and customer_code are required');
      CONTINUE;
    END IF;

    SELECT * INTO v_customer FROM public.customers
      WHERE lower(customer_code) = lower(v_cust_code) AND deleted_at IS NULL LIMIT 1;
    IF NOT FOUND THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason', 'Unknown customer code');
      CONTINUE;
    END IF;
    IF NOT public.can_access_branch(v_customer.branch_id) THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason', 'Borrower is outside your branch');
      CONTINUE;
    END IF;
    IF EXISTS (SELECT 1 FROM public.loans WHERE lower(loan_number) = lower(v_loan_no) AND deleted_at IS NULL) THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason', 'Duplicate loan number');
      CONTINUE;
    END IF;

    BEGIN
      v_principal := COALESCE(NULLIF(v_row->>'principal_amount','')::numeric, 0);
      v_outstanding := COALESCE(NULLIF(v_row->>'outstanding_amount','')::numeric, v_principal);
      v_emi := COALESCE(NULLIF(v_row->>'emi_amount','')::numeric, 0);
      v_overdue := COALESCE(NULLIF(v_row->>'overdue_amount','')::numeric, 0);
    EXCEPTION WHEN others THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason', 'Amount columns must be numeric');
      CONTINUE;
    END;

    IF v_principal < 0 OR v_outstanding < 0 OR v_emi < 0 OR v_overdue < 0 THEN
      v_errors := v_errors || jsonb_build_object('row', v_index, 'reason', 'Amounts cannot be negative');
      CONTINUE;
    END IF;

    INSERT INTO public.loans (loan_number, customer_id, branch_id, product_name, principal_amount,
      outstanding_amount, emi_amount, overdue_amount, days_past_due, tenure_months, interest_rate,
      disbursed_on, next_due_date)
    VALUES (v_loan_no, v_customer.id, v_customer.branch_id,
      NULLIF(btrim(COALESCE(v_row->>'product_name','')),''), v_principal, v_outstanding, v_emi, v_overdue,
      GREATEST(0, COALESCE(NULLIF(v_row->>'days_past_due','')::int, 0)),
      NULLIF(v_row->>'tenure_months','')::int, NULLIF(v_row->>'interest_rate','')::numeric,
      NULLIF(v_row->>'disbursed_on','')::date, NULLIF(v_row->>'next_due_date','')::date);
    v_ok := v_ok + 1;
  END LOOP;

  INSERT INTO public.import_batches (entity_type, file_name, total_rows, success_rows, failed_rows,
    errors, created_by)
  VALUES ('loans', COALESCE(NULLIF(btrim(_file_name),''), 'upload.xlsx'), v_index, v_ok,
    jsonb_array_length(v_errors), v_errors, v_uid)
  RETURNING id INTO v_batch_id;

  RETURN jsonb_build_object('batchId', v_batch_id, 'total', v_index, 'success', v_ok,
    'failed', jsonb_array_length(v_errors), 'errors', v_errors);
END; $$;
REVOKE EXECUTE ON FUNCTION public.import_loans(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_loans(jsonb, text) TO authenticated;

-- ============================================================
-- 11. SEED BASELINE MASTER DATA + PERMISSION MATRIX
-- ============================================================
INSERT INTO public.master_items (type, code, label, sort_order, is_system) VALUES
  ('recovery_status','new','New',10,true),
  ('recovery_status','in_progress','In Progress',20,true),
  ('recovery_status','ptp','Promise to Pay',30,true),
  ('recovery_status','partially_paid','Partially Paid',40,true),
  ('recovery_status','paid','Paid',50,true),
  ('recovery_status','non_contactable','Non Contactable',60,true),
  ('recovery_status','legal','Legal',70,true),
  ('recovery_status','written_off','Written Off',80,true),
  ('purpose','recovery_followup','Recovery follow-up',10,false),
  ('purpose','ptp_reminder','PTP reminder',20,false),
  ('purpose','overdue_notice','Overdue notice',30,false),
  ('purpose','payment_confirmation','Payment confirmation',40,false),
  ('purpose','address_verification','Address verification',50,false),
  ('purpose','legal_warning','Legal warning',60,false),
  ('purpose','other','Other',70,false),
  ('talked_with','borrower','Borrower',10,false),
  ('talked_with','spouse','Spouse',20,false),
  ('talked_with','family_member','Family member',30,false),
  ('talked_with','guarantor','Guarantor',40,false),
  ('talked_with','neighbour','Neighbour',50,false),
  ('talked_with','group_leader','Group leader',60,false),
  ('talked_with','not_reachable','Not reachable',70,false);

INSERT INTO public.working_hours (day_of_week, is_working_day, start_time, end_time) VALUES
  (1,true,'09:30','18:30'),(2,true,'09:30','18:30'),(3,true,'09:30','18:30'),
  (4,true,'09:30','18:30'),(5,true,'09:30','18:30'),(6,true,'09:30','14:00'),
  (0,false,'09:30','18:30');

INSERT INTO public.notification_templates (code, name, channel, subject, body) VALUES
  ('ptp_reminder','PTP reminder','sms',NULL,
   'Dear {{customer_name}}, your promise to pay {{amount}} is due on {{date}}. Kindly pay to avoid further action.'),
  ('overdue_notice','Overdue notice','sms',NULL,
   'Dear {{customer_name}}, your loan {{loan_number}} is overdue by {{days}} days. Please contact {{branch_phone}}.'),
  ('payment_receipt','Payment receipt','email','Payment received - {{loan_number}}',
   'Dear {{customer_name}}, we have received {{amount}} towards loan {{loan_number}} on {{date}}. Thank you.');

INSERT INTO public.role_permissions (role, permission, allowed) VALUES
  ('super_admin','customers.manage',true),('super_admin','loans.manage',true),
  ('super_admin','payments.record',true),('super_admin','employees.manage',true),
  ('super_admin','branches.manage',true),('super_admin','masters.manage',true),
  ('super_admin','imports.run',true),('super_admin','reports.export',true),
  ('branch_manager','customers.manage',true),('branch_manager','loans.manage',true),
  ('branch_manager','payments.record',true),('branch_manager','employees.manage',false),
  ('branch_manager','branches.manage',false),('branch_manager','masters.manage',false),
  ('branch_manager','imports.run',true),('branch_manager','reports.export',true),
  ('recovery_executive','customers.manage',false),('recovery_executive','loans.manage',false),
  ('recovery_executive','payments.record',true),('recovery_executive','employees.manage',false),
  ('recovery_executive','branches.manage',false),('recovery_executive','masters.manage',false),
  ('recovery_executive','imports.run',false),('recovery_executive','reports.export',false);
