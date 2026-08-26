-- 041: Real school finance — fees connected to students, salaries to staff.
--
-- Before: finance was a manual diary (typed income/expense rows).
-- Now:  fee structures -> auto-generated per-student invoices -> payments
--       (status derived, defaulters visible) and monthly payroll runs.
--       Both flows post into the existing finance_transactions ledger so
--       the overview/analytics stay the single source of truth.

-- ── Fee structures ────────────────────────────────────────────────
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount > 0),
  frequency text not null default 'termly'
    check (frequency in ('termly','monthly','annual','one_time')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- One invoice per student per structure.
create table if not exists public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  student_user_id uuid not null references public.users(id) on delete cascade,
  fee_structure_id uuid not null references public.fee_structures(id) on delete cascade,
  title text not null,
  amount numeric not null check (amount > 0),
  due_date date,
  status text not null default 'unpaid'
    check (status in ('unpaid','partial','paid','waived')),
  created_at timestamptz not null default now(),
  unique (student_user_id, fee_structure_id)
);

create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  student_user_id uuid not null,
  amount numeric not null check (amount > 0),
  method text not null default 'cash'
    check (method in ('cash','bank','upi','card','cheque','other')),
  paid_on date not null default current_date,
  recorded_by uuid,
  note text,
  created_at timestamptz not null default now()
);

-- ── Payroll ───────────────────────────────────────────────────────
create table if not exists public.staff_salaries (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  staff_user_id uuid not null references public.users(id) on delete cascade,
  monthly_amount numeric not null check (monthly_amount >= 0),
  effective_from date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (staff_user_id)
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  month date not null,
  status text not null default 'draft' check (status in ('draft','paid')),
  total_amount numeric not null default 0,
  run_by uuid,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (institution_id, month)
);

create table if not exists public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  staff_user_id uuid not null,
  staff_name text,
  amount numeric not null
);

-- ── RLS ───────────────────────────────────────────────────────────
alter table public.fee_structures enable row level security;
alter table public.fee_invoices   enable row level security;
alter table public.fee_payments   enable row level security;
alter table public.staff_salaries enable row level security;
alter table public.payroll_runs   enable row level security;
alter table public.payroll_items  enable row level security;

-- Structures: staff of the school can view; leadership manages via RPCs.
create policy "Staff view own school fee structures"
  on public.fee_structures for select
  using (institution_id = get_user_institution());

-- Invoices: leadership/staff view school-wide; students view own;
-- parents view their children's.
create policy "View school invoices"
  on public.fee_invoices for select
  using (
    institution_id = get_user_institution()
    or student_user_id = auth.uid()
    or is_parent_of(student_user_id)
  );

create policy "View school payments"
  on public.fee_payments for select
  using (
    institution_id = get_user_institution()
    or student_user_id = auth.uid()
    or is_parent_of(student_user_id)
  );

create policy "Staff view school salaries"
  on public.staff_salaries for select
  using (institution_id = get_user_institution());

create policy "Leadership view payroll runs"
  on public.payroll_runs for select
  using (institution_id = get_user_institution());

create policy "Leadership view payroll items"
  on public.payroll_items for select
  using (
    exists (
      select 1 from payroll_runs r
      where r.id = payroll_items.run_id
        and r.institution_id = get_user_institution()
    )
  );
