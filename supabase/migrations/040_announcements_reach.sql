-- 040: Announcements that actually reach people.
-- 1) sort_order column so the principal's drag-to-reorder PERSISTS
--    (previously it only mutated local state and reverted on refresh).
-- 2) announce_institution(): fans the announcement out as notifications to
--    every institution member (except the author), deduped per announcement
--    so re-calls never double-send.

alter table public.announcements
  add column if not exists sort_order integer not null default 0;

create or replace function public.reorder_announcements(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inst uuid;
  v_id   uuid;
  i      int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Caller must be leadership of their own institution.
  if not is_leadership() then
    raise exception 'Only school leadership can reorder announcements';
  end if;
  v_inst := get_user_institution();

  foreach v_id in array p_ids loop
    -- Only touch rows belonging to the caller's institution.
    update announcements
       set sort_order = i
     where id = v_id
       and institution_id = v_inst;
    i := i + 1;
  end loop;
end;
$$;

create or replace function public.announce_institution(p_announcement_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ann   announcements%rowtype;
  v_uid   uuid;
  v_cnt   int := 0;
  v_title text;
  v_msg   text;
  v_member record;
begin
  select * into v_ann from announcements where id = p_announcement_id;
  if not found then
    raise exception 'Announcement not found';
  end if;

  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Author or same-institution leadership may broadcast.
  if v_ann.author_id <> v_uid and not is_leadership() then
    raise exception 'Not allowed to broadcast this announcement';
  end if;

  v_title := case when v_ann.priority = 'urgent'
                  then 'URGENT: ' || v_ann.title
                  else v_ann.title end;
  v_msg := left(v_ann.content, 220);

  for v_member in
    select u.id
    from users u
    where u.institution_id = v_ann.institution_id
      and u.id <> coalesce(v_uid, v_ann.author_id)
  loop
    -- Deduped per announcement: source stores the announcement id.
    if not exists (
      select 1 from notifications n
      where n.user_id = v_member.id
        and n.category = 'announcements'
        and n.source = p_announcement_id::text
    ) then
      insert into notifications (user_id, title, message, category, action_url, source, read)
      values (
        v_member.id,
        v_title,
        v_msg,
        'announcements',
        '/student/announcements',
        p_announcement_id::text,
        false
      );
      v_cnt := v_cnt + 1;
    end if;
  end loop;

  return v_cnt;
end;
$$;

grant execute on function public.reorder_announcements(uuid[]) to authenticated;
grant execute on function public.announce_institution(uuid) to authenticated;
