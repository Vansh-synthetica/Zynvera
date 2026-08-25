-- 029: Break RLS infinite-recursion loops between sibling tables.
-- Root cause: submissions/assessment_submissions "Leadership view" policies
-- queried assignments/assessments under INVOKER rights; combined with
-- assignments."Parents view" querying submissions back, evaluating
-- INSERT ... RETURNING SELECT policies recursed forever
-- ("infinite recursion detected in policy for relation ...").
-- Fix: route cross-table checks through SECURITY DEFINER helpers which
-- bypass RLS internally and therefore can never recurse.

create or replace function public.leadership_sees_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from assignments a
    where a.id = p_assignment_id
      and course_in_user_institution(a.course_id)
  );
$$;

create or replace function public.leadership_sees_assessment(p_assessment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from assessments a
    where a.id = p_assessment_id
      and course_in_user_institution(a.course_id)
  );
$$;

drop policy if exists "Leadership view submissions" on public.submissions;
create policy "Leadership view submissions"
  on public.submissions
  for select
  using (
    is_leadership() AND leadership_sees_assignment(assignment_id)
  );

drop policy if exists "Leadership view assessment submissions" on public.assessment_submissions;
create policy "Leadership view assessment submissions"
  on public.assessment_submissions
  for select
  using (
    is_leadership() AND leadership_sees_assessment(assessment_id)
  );
