-- 033: Hide draft assessments from students at the API level.
-- The UI filtered drafts client-side, but any student could fetch a draft
-- quiz (with questions AND correct answers) by id via getAssessment().

drop policy if exists "Students can view active assessments" on public.assessments;

create policy "Students can view active assessments"
  on public.assessments
  for select
  using (
    (
      status <> 'draft'
      and enrolled_in_assessment(id)
    )
    or teaches_assessment(id)
    or is_leadership()
  );
