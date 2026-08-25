-- 028: Student quiz-taking pipeline
-- Server-side graded submissions: enforces enrollment, window, attempt limits;
-- auto-grades objective questions; never exposes correct answers for grading;
-- syncs scores into grade_entries so student Grades/dashboard reflect quizzes.

create or replace function public.student_submit_quiz(
  p_assessment_id uuid,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asg      assessments%rowtype;
  v_uid      uuid := auth.uid();
  v_enrolled boolean;
  v_prev     int;
  v_q        assessment_questions%rowtype;
  v_earned   numeric := 0;
  v_total    numeric := 0;
  v_auto_ok  boolean := true;
  v_ans      text;
  v_correct  text;
  v_num_a    numeric;
  v_num_c    numeric;
  v_sub      assessment_submissions%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_asg from assessments where id = p_assessment_id;
  if not found then
    raise exception 'Assessment not found';
  end if;
  if v_asg.status <> 'active' then
    raise exception 'This assessment is not open';
  end if;

  select exists (
    select 1 from course_enrolments ce
    where ce.course_id = v_asg.course_id
      and ce.user_id = v_uid
      and ce.status = 'active'
  ) into v_enrolled;
  if not v_enrolled then
    raise exception 'You are not enrolled in this course';
  end if;

  if v_asg.start_date is not null and now() < v_asg.start_date then
    raise exception 'This assessment has not opened yet';
  end if;
  if v_asg.end_date is not null and now() > v_asg.end_date then
    raise exception 'This assessment is closed';
  end if;

  select count(*) into v_prev
  from assessment_submissions
  where assessment_id = p_assessment_id and user_id = v_uid;
  if v_prev >= v_asg.max_attempts then
    raise exception 'You have used all your attempts';
  end if;

  for v_q in
    select * from assessment_questions
    where assessment_id = p_assessment_id
    order by order_index
  loop
    v_total := v_total + v_q.points;
    v_ans     := lower(btrim(coalesce(p_answers ->> v_q.id::text, '')));
    v_correct := lower(btrim(coalesce(v_q.correct_answer, '')));

    if v_q.type in ('multiple_choice', 'true_false', 'short_answer') then
      if v_correct <> '' and v_ans <> '' and v_ans = v_correct then
        v_earned := v_earned + v_q.points;
      end if;
    elsif v_q.type = 'numeric' then
      if v_correct <> '' and v_ans <> '' then
        if v_ans = v_correct then
          v_earned := v_earned + v_q.points;
        else
          begin
            v_num_a := cast(v_ans as numeric);
            v_num_c := cast(v_correct as numeric);
            if abs(v_num_a - v_num_c) < 1e-9 then
              v_earned := v_earned + v_q.points;
            end if;
          exception when others then
            null; -- non-numeric answer; no credit
          end;
        end if;
      end if;
    elsif v_q.type = 'long_answer' then
      -- Cannot be auto-graded; whole submission goes to manual grading.
      v_auto_ok := false;
    end if;
  end loop;

  insert into assessment_submissions (assessment_id, user_id, answers, score, submitted_at, attempt_number)
  values (
    p_assessment_id,
    v_uid,
    p_answers,
    case when v_auto_ok then v_earned else null end,
    now(),
    v_prev + 1
  )
  returning * into v_sub;

  -- Keep the student's gradebook in sync for auto-graded quizzes.
  if v_auto_ok and v_total > 0 then
    update grade_entries
       set score = v_earned,
           max_score = v_total,
           date = current_date
     where course_id = v_asg.course_id
       and user_id = v_uid
       and assessment_name = v_asg.title;

    if not found then
      insert into grade_entries (
        course_id, user_id, assessment_name, assessment_type,
        score, max_score, weight, category, date
      ) values (
        v_asg.course_id, v_uid, v_asg.title, v_asg.type,
        v_earned, v_total, 1, 'Assessments', current_date
      );
    end if;
  end if;

  return jsonb_build_object(
    'id', v_sub.id,
    'score', v_sub.score,
    'total', v_total,
    'attempt_number', v_sub.attempt_number,
    'needs_grading', not v_auto_ok
  );
end;
$$;

grant execute on function public.student_submit_quiz(uuid, jsonb) to authenticated;
revoke execute on function public.student_submit_quiz(uuid, jsonb) from anon;
