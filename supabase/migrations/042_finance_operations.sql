-- 042: Fee & payroll operations. All leadership-only, all institution-scoped,
-- all posting into finance_transactions so the ledger stays the single view.

-- ── Generate invoices for every active student missing one ───────
create or replace function public.generate_fee_invoices(
  p_structure_id uuid,
  p_due_date date default null,
  p_title text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inst uuid;
  v_cnt int := 0;
begin
  if not is_leadership() then
    raise exception 'Only school leadership can generate invoices';
  end if;
  select institution_id into v_inst from fee_structures where id = p_structure_id;
  if not found or v_inst <> get_user_institution() then
    raise exception 'Fee structure not found in your school';
  end if;

  insert into fee_invoices (institution_id, student_user_id, fee_structure_id, title, amount, due_date)
  select
    v_inst,
    ce.user_id,
    fs.id,
    coalesce(p_title, fs.name),
    fs.amount,
    p_due_date
  from fee_structures fs
  join course_enrolments ce on ce.status = 'active'
  join users u on u.id = ce.user_id and u.role = 'student'
              and u.institution_id = fs.institution_id
  where fs.id = p_structure_id
  on conflict (student_user_id, fee_structure_id) do nothing;

  get diagnostics v_cnt = row_count;
  return v_cnt;
end;
$$;

-- ── Record a payment against an invoice ──────────────────────────
create or replace function public.record_fee_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_method text default 'cash',
  p_paid_on date default current_date,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv fee_invoices%rowtype;
  v_student_name text;
  v_paid numeric;
begin
  if not is_leadership() then
    raise exception 'Only school leadership can record payments';
  end if;
  if p_amount <= 0 then raise exception 'Payment must be positive'; end if;

  select * into v_inv from fee_invoices where id = p_invoice_id;
  if not found or v_inv.institution_id <> get_user_institution() then
    raise exception 'Invoice not found in your school';
  end if;
  if v_inv.status = 'waived' then raise exception 'Invoice is waived'; end if;

  insert into fee_payments (institution_id, invoice_id, student_user_id, amount, method, paid_on, recorded_by, note)
  values (v_inv.institution_id, v_inv.id, v_inv.student_user_id, p_amount,
          coalesce(nullif(p_method,''), 'cash'), p_paid_on, auth.uid(), p_note);

  -- Derive status from total paid.
  select coalesce(sum(amount),0) into v_paid
  from fee_payments where invoice_id = v_inv.id;

  update fee_invoices
     set status = case when v_paid >= amount then 'paid'
                       when v_paid > 0 then 'partial'
                       else 'unpaid' end
   where id = v_inv.id;

  -- Post income into the main ledger.
  select name into v_student_name from users where id = v_inv.student_user_id;
  insert into finance_transactions (institution_id, type, category, amount, description, tx_date)
  values (
    v_inv.institution_id,
    'income',
    'Fees',
    p_amount,
    format('Fee payment: %s — %s', coalesce(v_student_name,'student'), v_inv.title),
    p_paid_on
  );

  return case when v_paid >= v_inv.amount then 'paid' else 'partial' end;
end;
$$;

-- ── Payroll: snapshot salaries for a month ───────────────────────
create or replace function public.run_payroll(p_month date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inst uuid := get_user_institution();
  v_run uuid;
  v_total numeric := 0;
begin
  if not is_leadership() then
    raise exception 'Only school leadership can run payroll';
  end if;
  if exists (select 1 from payroll_runs where institution_id = v_inst and month = p_month) then
    raise exception 'Payroll for this month already exists';
  end if;

  insert into payroll_runs (institution_id, month, run_by)
  values (v_inst, date_trunc('month', p_month)::date, auth.uid())
  returning id into v_run;

  insert into payroll_items (run_id, staff_user_id, staff_name, amount)
  select v_run, ss.staff_user_id, u.name, ss.monthly_amount
  from staff_salaries ss
  join users u on u.id = ss.staff_user_id
  where ss.institution_id = v_inst and ss.active = true;

  select coalesce(sum(amount),0) into v_total from payroll_items where run_id = v_run;
  update payroll_runs set total_amount = v_total where id = v_run;

  return v_run;
end;
$$;

-- ── Mark a payroll run paid → posts expense to ledger ────────────
create or replace function public.pay_payroll(p_run_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run payroll_runs%rowtype;
begin
  if not is_leadership() then
    raise exception 'Only school leadership can mark payroll paid';
  end if;
  select * into v_run from payroll_runs where id = p_run_id;
  if not found or v_run.institution_id <> get_user_institution() then
    raise exception 'Payroll run not found in your school';
  end if;
  if v_run.status = 'paid' then raise exception 'Already marked paid'; end if;

  update payroll_runs set status = 'paid', paid_at = now() where id = v_run.id;

  insert into finance_transactions (institution_id, type, category, amount, description, tx_date)
  values (
    v_run.institution_id,
    'expense',
    'Salaries',
    v_run.total_amount,
    format('Payroll %s (%s staff)', to_char(v_run.month, 'Mon YYYY'),
           (select count(*) from payroll_items where run_id = v_run.id)),
    current_date
  );

  return v_run.total_amount;
end;
$$;

grant execute on function public.generate_fee_invoices(uuid, date, text) to authenticated;
grant execute on function public.record_fee_payment(uuid, numeric, text, date, text) to authenticated;
grant execute on function public.run_payroll(date) to authenticated;
grant execute on function public.pay_payroll(uuid) to authenticated;
