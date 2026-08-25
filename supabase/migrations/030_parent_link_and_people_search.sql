-- 030: Fix two broken user-visibility flows.
--
-- Bug A: Parents could never link to a child — no RLS policy lets a parent
-- read student rows, so requestChildLink's lookup always returned nothing.
-- Fix: SECURITY DEFINER RPC that verifies identifier AND family code
-- server-side and returns only the matched row (id + institution).
--
-- Bug B: Students could never search people (New Chat / People) — users
-- SELECT policies cover staff/teachers/self only. Fix: definer RPC that
-- returns same-institution staff plus classmates sharing an active course.

-- Helper used below; create first so function-body validation passes.
create or replace function public.escape_ilike(t text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(coalesce(t,''), '\', '\\'), '%', '\%'), '_', '\_')
$$;

create or replace function public.find_linkable_student(
  p_identifier text,
  p_family_code text
)
returns table (id uuid, institution_id uuid, email text, name text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.institution_id, u.email, u.name
  from users u
  where u.role = 'student'
    and lower(u.email) = lower(btrim(p_identifier))
    and u.family_code is not null
    and upper(u.family_code) = upper(btrim(p_family_code))
  limit 1;
$$;

create or replace function public.search_messageable_users(p_query text)
returns table (id uuid, name text, email text, role text, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.name, u.email, u.role::text, u.avatar
  from users u
  where u.id <> auth.uid()
    and u.institution_id = (select i2.institution_id from users i2 where i2.id = auth.uid())
    and (
      u.role in ('teacher','principal','admin','super_admin','counselor','department_head')
      or exists (
        select 1
        from course_enrolments me
        join course_enrolments them on them.course_id = me.course_id
        where me.user_id = auth.uid() and me.status = 'active'
          and them.user_id = u.id and them.status = 'active'
      )
    )
    and (
      u.name ilike '%' || escape_ilike(btrim(p_query)) || '%'
      or u.email ilike '%' || escape_ilike(btrim(p_query)) || '%'
    )
  order by u.name
  limit 10;
$$;
