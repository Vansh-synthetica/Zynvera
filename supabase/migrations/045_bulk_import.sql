-- 045: CSV bulk import for schools without email infrastructure.
-- Principal pastes "email,name" rows; RPC creates login-ready accounts
-- (bcrypt password, confirmed email, auth identity row), provisions
-- profile + family code, skips duplicates, returns one-time credentials.

create or replace function public.bulk_import_students(
  p_rows jsonb,
  p_default_password text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inst uuid := get_user_institution();
  v_row  jsonb;
  v_email text;
  v_name  text;
  v_uid   uuid;
  v_pw    text;
  v_code  text;
  v_created int := 0;
  v_skipped int := 0;
  v_creds  jsonb := '[]'::jsonb;
begin
  if not is_leadership() then
    raise exception 'Only school leadership can import students';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_email := lower(btrim(coalesce(v_row->>'email','')));
    v_name  := btrim(coalesce(v_row->>'name', split_part(v_email,'@',1)));

    -- Basic sanity; silently skip malformed rows.
    if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    -- Duplicate?
    if exists (select 1 from auth.users au where lower(au.email) = v_email) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_uid  := gen_random_uuid();
    v_pw   := coalesce(nullif(p_default_password,''),
                       'Zn-' || substr(encode(gen_random_bytes(9),'base64'),1,10));
    -- Unique-ish 8-digit family code
    loop
      v_code := lpad((floor(random()*100000000))::int::text, 8, '0');
      exit when not exists (
        select 1 from users u2 where u2.family_code = v_code
      );
    end loop;

    begin
      insert into auth.users (
        id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_user_meta_data
      ) values (
        v_uid, 'authenticated', 'authenticated', v_email,
        crypt(v_pw, gen_salt('bf', 10)),
        now(), now(), now(),
        jsonb_build_object('provider','email','providers','["email"]'::jsonb)
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_uid, v_email,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', now(), now(), now()
      );

      -- Profile row exists via handle_new_user(); enrich it.
      update users set
        role = 'student',
        institution_id = v_inst,
        name = coalesce(nullif(v_name,''), split_part(v_email,'@',1)),
        family_code = v_code
      where id = v_uid;

      v_created := v_created + 1;
      v_creds := v_creds || jsonb_build_object(
        'email', v_email, 'password', v_pw, 'family_code', v_code
      );
    exception when others then
      v_skipped := v_skipped + 1;
    end;
  end loop;

  return jsonb_build_object('created', v_created, 'skipped', v_skipped, 'credentials', v_creds);
end;
$$;

grant execute on function public.bulk_import_students(jsonb, text) to authenticated;
