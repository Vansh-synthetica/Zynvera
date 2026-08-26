-- 035: Scope published-assignment visibility to enrolled students.
-- The old OR-arm allowed ANY authenticated user on ANY institution to read
-- every published assignment (status-only check). Enrollment now required;
-- teachers/leadership keep their own dedicated policies.

drop policy if exists "Students can view published assignments" on public.assignments;

create policy "Students can view published assignments"
  on public.assignments
  for select
  using (
    (
      status = any (array['published'::text,'active'::text,'graded'::text,'returned'::text])
      and course_id in (
        select ce.course_id from public.course_enrolments ce
        where ce.user_id = auth.uid()
      )
    )
    or exists (
      select 1 from public.submissions s
      where s.assignment_id = assignments.id
        and is_parent_of(s.user_id)
    )
  );
