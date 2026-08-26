-- 039: Single source of truth for absence alerts.
-- The old trg_att_absence_notify fired per row with NO same-day dedup, so
-- saving a register twice sent parents duplicate alerts. It also ignored
-- 'late'. Alerts now live solely inside teacher_save_attendance(), which
-- dedupes per student+parent+day+status and reports counts.

drop trigger if exists trg_att_absence_notify on public.attendance_records;

create or replace function public.teacher_save_attendance(
  p_section_id uuid,
  p_date date,
  p_records jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_course  uuid;
  v_ctx     text;
  v_rec     jsonb;
  v_student uuid;
  v_status  text;
  v_name    text;
  v_parent_row record;
  v_saved   int := 0;
  v_absent  int := 0;
  v_late    int := 0;
  v_alerts  int := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select cs.course_id into v_course
  from class_sections cs
  where cs.id = p_section_id;
  if not found then
    raise exception 'Class section not found';
  end if;

  if not (teaches_course(v_course) or is_leadership()) then
    raise exception 'You do not teach this class';
  end if;

  -- Context for alert copy: course title / section name.
  select coalesce(c.title, cs.name) into v_ctx
  from class_sections cs
  join courses c on c.id = cs.course_id
  where cs.id = p_section_id;

  -- Replace the day's register atomically.
  delete from attendance_records
  where class_section_id = p_section_id and date = p_date;

  for v_rec in select * from jsonb_array_elements(p_records) loop
    v_student := (v_rec->>'user_id')::uuid;
    v_status  := coalesce(v_rec->>'status', 'present');

    if v_status not in ('present','absent','late','excused','unexplained') then
      raise exception 'Invalid attendance status: %', v_status;
    end if;

    insert into attendance_records (class_section_id, user_id, date, status, recorded_by)
    values (p_section_id, v_student, p_date, v_status, v_uid);
    v_saved := v_saved + 1;

    continue when v_status in ('present', 'excused');

    if v_status = 'late' then v_late := v_late + 1; else v_absent := v_absent + 1; end if;

    select name into v_name from users where id = v_student;
    if v_name is null then v_name := 'Your child'; end if;

    -- Student alert (deduped per student+status+day).
    if not exists (
      select 1 from notifications n
      where n.user_id = v_student
        and n.category = 'attendance'
        and n.title = (case when v_status = 'late' then 'Marked late' else 'Absence recorded' end)
        and n.created_at::date = p_date
    ) then
      insert into notifications (user_id, title, message, category, action_url, read)
      values (
        v_student,
        case when v_status = 'late' then 'Marked late' else 'Absence recorded' end,
        format('Marked %s in %s on %s.', v_status,
               coalesce(v_ctx, 'class'), to_char(p_date, 'DD Mon YYYY')),
        'attendance',
        '/student/attendance',
        false
      );
      v_alerts := v_alerts + 1;
    end if;

    -- Parent alerts (deduped per parent+status+day).
    for v_parent_row in
      select pl.parent_user_id from parent_links pl
      where pl.student_user_id = v_student and pl.status = 'approved'
    loop
      if not exists (
        select 1 from notifications n
        where n.user_id = v_parent_row.parent_user_id
          and n.category = 'attendance'
          and n.title = (case when v_status = 'late' then 'Your child arrived late' else 'Your child is not in school' end)
          and n.created_at::date = p_date
      ) then
        insert into notifications (user_id, title, message, category, action_url, read)
        values (
          v_parent_row.parent_user_id,
          case when v_status = 'late' then 'Your child arrived late' else 'Your child is not in school' end,
          format('%s was marked %s in %s on %s. Contact the school if this is unexpected.',
                 v_name, upper(v_status), coalesce(v_ctx, 'class'), to_char(p_date, 'DD Mon YYYY')),
          'attendance',
          '/parent/dashboard',
          false
        );
        v_alerts := v_alerts + 1;
      end if;
    end loop;
  end loop;

  return jsonb_build_object(
    'saved', v_saved,
    'absent', v_absent,
    'late', v_late,
    'alerts_sent', v_alerts
  );
end;
$$;
