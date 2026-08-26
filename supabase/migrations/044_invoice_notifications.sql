-- 044: Invoice generation notifies the invoiced student.
-- Same fan-out pattern as attendance/announcements: notifications.source
-- stores the invoice id so re-runs never double-notify.

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
  v_fs fee_structures%rowtype;
  v_student record;
  v_inv fee_invoices%rowtype;
begin
  if not is_leadership() then
    raise exception 'Only school leadership can generate invoices';
  end if;
  select * into v_fs from fee_structures where id = p_structure_id;
  if not found or v_fs.institution_id <> get_user_institution() then
    raise exception 'Fee structure not found in your school';
  end if;

  for v_student in
    select distinct ce.user_id
    from course_enrolments ce
    join users u on u.id = ce.user_id and u.role = 'student'
                and u.institution_id = v_fs.institution_id
    where ce.status = 'active'
  loop
    insert into fee_invoices (institution_id, student_user_id, fee_structure_id, title, amount, due_date)
    values (v_fs.institution_id, v_student.user_id, v_fs.id,
            coalesce(p_title, v_fs.name), v_fs.amount, p_due_date)
    on conflict (student_user_id, fee_structure_id) do nothing
    returning * into v_inv;

    if found then
      v_cnt := v_cnt + 1;

      -- Tell the student their new invoice exists.
      insert into notifications (user_id, title, message, category, action_url, source, read)
      values (
        v_inv.student_user_id,
        case when v_inv.due_date is null then 'New fee invoice'
             else format('Fee due %s', to_char(v_inv.due_date, 'DD Mon')) end,
        format('%s — %s. Check Fee Status for details.',
               v_inv.title, to_char(v_inv.amount, 'FM999,999,999')),
        'institution',
        '/student/fees',
        v_inv.id::text,
        false
      );
    end if;
  end loop;

  return v_cnt;
end;
$$;
