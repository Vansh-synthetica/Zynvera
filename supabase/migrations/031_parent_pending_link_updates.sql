-- 031: Parents may revise or cancel their OWN pending link requests.
-- Without this, a duplicate/re-request upsert fails on the UPDATE arm of
-- ON CONFLICT (no parent-side UPDATE policy existed). with_check pins
-- status='pending' so parents can never self-approve.

create policy "Parents update own pending links"
  on public.parent_links
  for update
  using (
    parent_user_id = auth.uid() AND status = 'pending'
  )
  with check (
    parent_user_id = auth.uid() AND status = 'pending'
  );
