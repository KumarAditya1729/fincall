-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','branch_manager','recovery_executive');
CREATE TYPE public.recovery_status AS ENUM ('new','in_progress','ptp','partially_paid','paid','non_contactable','legal','written_off');
CREATE TYPE public.loan_status AS ENUM ('active','overdue','npa','closed','settled');
CREATE TYPE public.followup_status AS ENUM ('pending','completed','missed','cancelled');
CREATE TYPE public.priority_level AS ENUM ('low','medium','high','urgent');

-- UPDATED_AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- BRANCHES
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  city text,
  state text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  employee_code text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_branch_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT branch_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.can_access_branch(_branch_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin')
      OR (_branch_id IS NOT NULL AND _branch_id = public.current_branch_id());
$$;

-- FIRST USER BECOMES SUPER ADMIN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), NEW.email);
  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recovery_executive');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  alternate_phone text,
  email text,
  address_line text,
  city text,
  state text,
  pincode text,
  kyc_id text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recovery_status public.recovery_status NOT NULL DEFAULT 'new',
  notes text,
  deleted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- LOANS
CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  product_name text,
  principal_amount numeric(14,2) NOT NULL DEFAULT 0,
  outstanding_amount numeric(14,2) NOT NULL DEFAULT 0,
  emi_amount numeric(14,2) NOT NULL DEFAULT 0,
  overdue_amount numeric(14,2) NOT NULL DEFAULT 0,
  days_past_due integer NOT NULL DEFAULT 0,
  tenure_months integer,
  interest_rate numeric(6,2),
  disbursed_on date,
  next_due_date date,
  status public.loan_status NOT NULL DEFAULT 'active',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  paid_on date NOT NULL DEFAULT current_date,
  mode text,
  reference_no text,
  collected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- CALL STATUS
CREATE TABLE public.call_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_connected boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_status TO authenticated;
GRANT ALL ON public.call_status TO service_role;
ALTER TABLE public.call_status ENABLE ROW LEVEL SECURITY;

-- CALL LOGS
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  called_by uuid NOT NULL,
  call_status_id uuid REFERENCES public.call_status(id) ON DELETE SET NULL,
  purpose text,
  talked_with text,
  remark text,
  is_connected boolean NOT NULL DEFAULT false,
  duration_seconds integer NOT NULL DEFAULT 0,
  ptp_amount numeric(14,2),
  ptp_date date,
  next_followup_date date,
  next_followup_time time,
  called_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- FOLLOWUPS
CREATE TABLE public.followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  call_log_id uuid REFERENCES public.call_logs(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  assigned_to uuid NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  status public.followup_status NOT NULL DEFAULT 'pending',
  notes text,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followups TO authenticated;
GRANT ALL ON public.followups TO service_role;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- REMARKS
CREATE TABLE public.remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.remarks TO authenticated;
GRANT ALL ON public.remarks TO service_role;
ALTER TABLE public.remarks ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  branch_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  branch_id uuid,
  activity text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- SETTINGS
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- TRIGGERS
CREATE TRIGGER t_branches BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_loans BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_call_status BEFORE UPDATE ON public.call_status FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_call_logs BEFORE UPDATE ON public.call_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_followups BEFORE UPDATE ON public.followups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_remarks BEFORE UPDATE ON public.remarks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_notifications BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INDEXES
CREATE INDEX idx_customers_branch ON public.customers(branch_id);
CREATE INDEX idx_customers_assigned ON public.customers(assigned_to);
CREATE INDEX idx_customers_status ON public.customers(recovery_status);
CREATE INDEX idx_loans_customer ON public.loans(customer_id);
CREATE INDEX idx_call_logs_customer ON public.call_logs(customer_id);
CREATE INDEX idx_call_logs_called_at ON public.call_logs(called_at);
CREATE INDEX idx_call_logs_called_by ON public.call_logs(called_by);
CREATE INDEX idx_followups_assigned ON public.followups(assigned_to, scheduled_date);
CREATE INDEX idx_payments_paid_on ON public.payments(paid_on);

-- POLICIES
CREATE POLICY branches_read ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY branches_admin_write ON public.branches FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY profiles_self_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.can_access_branch(branch_id));
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY user_roles_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY customers_read ON public.customers FOR SELECT TO authenticated USING (public.can_access_branch(branch_id) OR assigned_to = auth.uid());
CREATE POLICY customers_insert ON public.customers FOR INSERT TO authenticated WITH CHECK (public.can_access_branch(branch_id));
CREATE POLICY customers_update ON public.customers FOR UPDATE TO authenticated USING (public.can_access_branch(branch_id) OR assigned_to = auth.uid()) WITH CHECK (public.can_access_branch(branch_id) OR assigned_to = auth.uid());
CREATE POLICY customers_delete ON public.customers FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY loans_read ON public.loans FOR SELECT TO authenticated USING (public.can_access_branch(branch_id) OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = loans.customer_id AND c.assigned_to = auth.uid()));
CREATE POLICY loans_write ON public.loans FOR ALL TO authenticated USING (public.can_access_branch(branch_id)) WITH CHECK (public.can_access_branch(branch_id));

CREATE POLICY payments_read ON public.payments FOR SELECT TO authenticated USING (public.can_access_branch(branch_id) OR collected_by = auth.uid());
CREATE POLICY payments_write ON public.payments FOR ALL TO authenticated USING (public.can_access_branch(branch_id) OR collected_by = auth.uid()) WITH CHECK (public.can_access_branch(branch_id) OR collected_by = auth.uid());

CREATE POLICY call_status_read ON public.call_status FOR SELECT TO authenticated USING (true);
CREATE POLICY call_status_admin ON public.call_status FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY call_logs_read ON public.call_logs FOR SELECT TO authenticated USING (public.can_access_branch(branch_id) OR called_by = auth.uid());
CREATE POLICY call_logs_insert ON public.call_logs FOR INSERT TO authenticated WITH CHECK (called_by = auth.uid());
CREATE POLICY call_logs_update ON public.call_logs FOR UPDATE TO authenticated USING (called_by = auth.uid() OR public.is_admin()) WITH CHECK (called_by = auth.uid() OR public.is_admin());

CREATE POLICY followups_read ON public.followups FOR SELECT TO authenticated USING (public.can_access_branch(branch_id) OR assigned_to = auth.uid());
CREATE POLICY followups_insert ON public.followups FOR INSERT TO authenticated WITH CHECK (assigned_to = auth.uid() OR public.can_access_branch(branch_id));
CREATE POLICY followups_update ON public.followups FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR public.can_access_branch(branch_id)) WITH CHECK (assigned_to = auth.uid() OR public.can_access_branch(branch_id));

CREATE POLICY remarks_read ON public.remarks FOR SELECT TO authenticated USING (public.can_access_branch(branch_id) OR author_id = auth.uid());
CREATE POLICY remarks_insert ON public.remarks FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY remarks_update ON public.remarks FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin()) WITH CHECK (author_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notifications_own_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY audit_logs_read ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin() OR public.can_access_branch(branch_id));

CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY activity_logs_read ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin() OR public.can_access_branch(branch_id));

CREATE POLICY settings_read ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY settings_admin ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SEED LOOKUPS
INSERT INTO public.call_status (name, is_connected, sort_order) VALUES
  ('Connected - Promise to Pay', true, 1),
  ('Connected - Paid', true, 2),
  ('Connected - Refused', true, 3),
  ('Connected - Dispute', true, 4),
  ('Not Reachable', false, 5),
  ('Switched Off', false, 6),
  ('Wrong Number', false, 7),
  ('Busy / Call Later', false, 8);

INSERT INTO public.settings (key, value, description) VALUES
  ('organization', '{"name":"Recovera Microfinance","currency":"INR"}'::jsonb, 'Organization profile'),
  ('recovery_targets', '{"daily_calls":40,"recovery_rate":75}'::jsonb, 'Default performance targets');