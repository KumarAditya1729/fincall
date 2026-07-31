CREATE OR REPLACE FUNCTION public.record_payment(
  _loan_id uuid,
  _customer_id uuid,
  _branch_id uuid,
  _amount numeric,
  _paid_on date,
  _mode text,
  _reference_no text,
  _mark_paid boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_payment_id uuid;
  v_outstanding numeric;
  v_overdue numeric;
  v_loan_branch uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  SELECT outstanding_amount, overdue_amount, branch_id
    INTO v_outstanding, v_overdue, v_loan_branch
  FROM public.loans
  WHERE id = _loan_id AND customer_id = _customer_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found for this borrower';
  END IF;

  IF NOT (public.is_admin() OR public.can_access_branch(COALESCE(v_loan_branch, _branch_id))) THEN
    RAISE EXCEPTION 'Not allowed to collect for this branch';
  END IF;

  INSERT INTO public.payments (loan_id, customer_id, branch_id, amount, paid_on, mode, reference_no, collected_by)
  VALUES (_loan_id, _customer_id, COALESCE(v_loan_branch, _branch_id), _amount, COALESCE(_paid_on, CURRENT_DATE), _mode, NULLIF(_reference_no, ''), v_uid)
  RETURNING id INTO v_payment_id;

  UPDATE public.loans
     SET outstanding_amount = GREATEST(0, COALESCE(v_outstanding, 0) - _amount),
         overdue_amount = GREATEST(0, COALESCE(v_overdue, 0) - _amount)
   WHERE id = _loan_id;

  UPDATE public.customers
     SET recovery_status = CASE WHEN _mark_paid THEN 'paid'::recovery_status ELSE 'partially_paid'::recovery_status END
   WHERE id = _customer_id;

  INSERT INTO public.audit_logs (user_id, branch_id, action, entity_type, entity_id, metadata)
  VALUES (v_uid, COALESCE(v_loan_branch, _branch_id), 'payment.record', 'payments', v_payment_id,
          jsonb_build_object('customerId', _customer_id, 'loanId', _loan_id, 'amount', _amount, 'mode', _mode));

  INSERT INTO public.activity_logs (user_id, branch_id, activity, entity_type, entity_id, metadata)
  VALUES (v_uid, COALESCE(v_loan_branch, _branch_id), 'payment.record', 'payments', v_payment_id,
          jsonb_build_object('customerId', _customer_id, 'loanId', _loan_id, 'amount', _amount, 'mode', _mode));

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment(uuid, uuid, uuid, numeric, date, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_payment(uuid, uuid, uuid, numeric, date, text, text, boolean) TO authenticated;

DROP POLICY IF EXISTS loans_write ON public.loans;

CREATE POLICY loans_manage ON public.loans
FOR ALL
TO authenticated
USING (public.is_admin() OR (public.has_role(auth.uid(), 'branch_manager') AND public.can_access_branch(branch_id)))
WITH CHECK (public.is_admin() OR (public.has_role(auth.uid(), 'branch_manager') AND public.can_access_branch(branch_id)));