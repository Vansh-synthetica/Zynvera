-- 043: Leadership can manage fee structures & staff salary records
-- directly from the finance page (writes were missing policies).

create policy "Leadership manage own school fee structures"
  on public.fee_structures
  for all
  using (
    is_leadership()
    and institution_id = get_user_institution()
  )
  with check (
    is_leadership()
    and institution_id = get_user_institution()
  );

create policy "Leadership manage own school salaries"
  on public.staff_salaries
  for all
  using (
    is_leadership()
    and institution_id = get_user_institution()
  )
  with check (
    is_leadership()
    and institution_id = get_user_institution()
  );
