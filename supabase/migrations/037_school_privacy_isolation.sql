-- 037: Full school privacy — no cross-institution catalog exposure.
-- Product model: each school installs Zynvera as its own private tenant.
-- Course/programme/term/campus titles were readable by ANY authenticated
-- user of ANY approved school ("public catalog"). All four are now scoped
-- to the viewer's own institution. Leadership/principal course policies
-- were also unscoped platform-wide; they are now limited to the admin's
-- own school too.
--
-- Stays intentionally public: institutions (approved+active) so new users
-- can find & join their school during signup.

-- ── courses ──
drop policy if exists "Public can view courses" on public.courses;
create policy "View own institution courses"
  on public.courses
  for select
  using (
    institution_id = get_user_institution()
    or teaches_course(id)
  );

drop policy if exists "Leadership view institution courses" on public.courses;
create policy "Leadership view own institution courses"
  on public.courses
  for select
  using (
    is_leadership()
    and course_in_user_institution(id)
  );

drop policy if exists "Principals can manage courses" on public.courses;
create policy "Principals can manage own institution courses"
  on public.courses
  for all
  using (
    is_leadership()
    and course_in_user_institution(id)
  )
  with check (
    is_leadership()
    and course_in_user_institution(id)
  );

-- ── programmes ──
drop policy if exists "Public can view programmes" on public.programmes;
create policy "View own institution programmes"
  on public.programmes
  for select
  using (institution_id = get_user_institution());

-- ── academic terms ──
drop policy if exists "Public can view terms" on public.academic_terms;
create policy "View own institution terms"
  on public.academic_terms
  for select
  using (institution_id = get_user_institution());

-- ── campuses ──
drop policy if exists "Public can view campuses" on public.campuses;
create policy "View own institution campuses"
  on public.campuses
  for select
  using (institution_id = get_user_institution());
