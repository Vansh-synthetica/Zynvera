-- 034: Allow 'assignment' as a grade entry type.
-- Teacher assignment-grading syncs scores into grade_entries with
-- assessment_type='assignment'; the old check rejected it, so those
-- grades silently never reached the student's Grades page.

alter table public.grade_entries drop constraint grade_entries_assessment_type_check;
alter table public.grade_entries
  add constraint grade_entries_assessment_type_check
  check (assessment_type = any (array[
    'quiz'::text,'test'::text,'exam'::text,'practical'::text,
    'project'::text,'oral'::text,'homework'::text,'assignment'::text
  ]));
