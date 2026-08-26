-- 036: Scope the parent-view assignments policy as well.
-- "Parents view assignments of child work" also carried an unscoped
-- status-only arm exposing every published assignment platform-wide.
-- Parents now see published assignments of courses their approved
-- children are enrolled in, plus anything tied to the child's submissions.

drop policy if exists "Parents view assignments of child work" on public.assignments;

create policy "Parents view assignments of child work"
  on public.assignments
  for select
  using (
    exists (
      select 1 from public.submissions s
      where s.assignment_id = assignments.id
        and is_parent_of(s.user_id)
    )
    or (
      status = any (array['published'::text,'active'::text,'graded'::text,'returned'::text])
      and exists (
        select 1
        from public.parent_links pl
        join public.course_enrolments ce
          on ce.user_id = pl.student_user_id
         and ce.status = 'active'
        where pl.parent_user_id = auth.uid()
          and pl.status = 'approved'
          and ce.course_id = assignments.course_id
      )
    )
  );
