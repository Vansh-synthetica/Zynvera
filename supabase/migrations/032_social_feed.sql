-- 032: Social feed schema. app/social queries posts + likes + comments(count)
-- and embeds profiles:author_id(display_name,username,avatar_url).
-- None of these existed, so every student saw a dead feed.

-- ── profiles: real table kept in sync with users (PostgREST needs a PK to embed) ──
create table if not exists public.profiles (
  id uuid primary key,
  institution_id uuid,
  display_name text,
  username text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create or replace function public.sync_profile() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, institution_id, display_name, username, avatar_url)
  values (
    new.id,
    new.institution_id,
    coalesce(new.name, split_part(new.email,'@',1)),
    lower(regexp_replace(split_part(new.email,'@',1),'[^a-z0-9._-]','','i')),
    new.avatar
  )
  on conflict (id) do update
    set institution_id = excluded.institution_id,
        display_name   = excluded.display_name,
        username       = excluded.username,
        avatar_url     = excluded.avatar_url,
        updated_at     = now();
  return new;
end;
$$;

drop trigger if exists trg_sync_profile on public.users;
create trigger trg_sync_profile
  after insert or update of name, email, avatar, institution_id
  on public.users
  for each row execute function public.sync_profile();

-- Backfill existing users
insert into profiles (id, institution_id, display_name, username, avatar_url)
select id, institution_id,
       coalesce(name, split_part(email,'@',1)),
       lower(regexp_replace(split_part(email,'@',1),'[^a-z0-9._-]','','i')),
       avatar
from public.users
on conflict (id) do nothing;

-- ── posts ──
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ── likes ──
create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ── comments (counted in feed embeds) ──
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ── RLS ──
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.profiles enable row level security;

-- Profiles visible within your institution (or your own).
create policy "View institution profiles"
  on public.profiles for select
  using (
    id = auth.uid()
    or (
      institution_id is not null
      and institution_id = (select u.institution_id from public.users u where u.id = auth.uid())
    )
  );

-- Feed scoped to your institution.
create policy "View institution posts"
  on public.posts for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = posts.author_id
        and p.institution_id = (select u.institution_id from public.users u where u.id = auth.uid())
    )
  );

create policy "Author own posts"
  on public.posts for insert
  with check (author_id = auth.uid());

create policy "Authors edit own posts"
  on public.posts for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Authors delete own posts"
  on public.posts for delete
  using (author_id = auth.uid());

-- Likes visible wherever their post is visible.
create policy "View institution likes"
  on public.likes for select
  using (
    exists (
      select 1
      from public.posts p
      join public.profiles pa on pa.id = p.author_id
      where p.id = likes.post_id
        and pa.institution_id = (select u.institution_id from public.users u where u.id = auth.uid())
    )
  );

create policy "Like as yourself"
  on public.likes for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.posts p
      join public.profiles pa on pa.id = p.author_id
      where p.id = likes.post_id
        and pa.institution_id = (select u.institution_id from public.users u where u.id = auth.uid())
    )
  );

create policy "Unlike own"
  on public.likes for delete
  using (user_id = auth.uid());

create policy "View institution comments"
  on public.comments for select
  using (
    exists (
      select 1
      from public.posts p
      join public.profiles pa on pa.id = p.author_id
      where p.id = comments.post_id
        and pa.institution_id = (select u.institution_id from public.users u where u.id = auth.uid())
    )
  );

create policy "Comment as yourself"
  on public.comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.posts p
      join public.profiles pa on pa.id = p.author_id
      where p.id = comments.post_id
        and pa.institution_id = (select u.institution_id from public.users u where u.id = auth.uid())
    )
  );

create policy "Delete own comments"
  on public.comments for delete
  using (author_id = auth.uid());
