-- Fix import worker auth context

CREATE OR REPLACE FUNCTION public.current_branch_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT branch_id FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_branch(_user_id uuid, _branch_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'super_admin')
      OR (_branch_id IS NOT NULL AND _branch_id = public.current_branch_id(_user_id));
$$;

CREATE OR REPLACE FUNCTION public.import_customers(_rows jsonb, _branch_id uuid, _file_name text, _created_by uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := COALESCE(_created_by, auth.uid());
  v_row jsonb;
  v_index int := 0;
  v_ok int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_code text; v_name text; v_phone text; v_branch uuid;
  v_batch_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(v_uid, 'super_admin') OR public.has_role(v_uid, 'branch_manager')) THEN
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
    IF v_branch IS NULL OR NOT public.can_access_branch(v_uid, v_branch) THEN
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

CREATE OR REPLACE FUNCTION public.import_loans(_rows jsonb, _file_name text, _created_by uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := COALESCE(_created_by, auth.uid());
  v_row jsonb;
  v_index int := 0;
  v_ok int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_loan_no text; v_cust_code text; v_customer public.customers%ROWTYPE;
  v_principal numeric; v_outstanding numeric; v_emi numeric; v_overdue numeric;
  v_batch_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.has_role(v_uid, 'super_admin') OR public.has_role(v_uid, 'branch_manager')) THEN
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
    IF NOT public.can_access_branch(v_uid, v_customer.branch_id) THEN
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
