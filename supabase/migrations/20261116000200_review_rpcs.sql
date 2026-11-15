-- Written from the app's expected behavior, not exported from a live database. Apply to a FRESH project only; compare with the live project before using it there.

begin;

create or replace function public.get_my_reports()
returns table (
  id uuid,
  slug text,
  title text,
  created_at timestamptz,
  status text,
  latest_review_reason text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_role text;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select ur.role
    into v_role
    from public.user_roles as ur
   where ur.user_id = v_user_id;

  if v_role in ('reviewer', 'admin') then
    raise exception 'Author access required' using errcode = '42501';
  end if;

  return query
  select i.id,
         i.slug,
         i.title,
         i.created_at,
         i.status,
         feedback.reason
    from public.incidents as i
    left join lateral (
      select f.reason
        from public.incident_review_feedback as f
       where f.incident_id = i.id
       order by f.created_at desc, f.id desc
       limit 1
    ) as feedback on true
   where i.author_id = v_user_id
   order by i.created_at desc;
end;
$function$;

create or replace function public.get_author_identities(p_author_ids uuid[])
returns table (
  author_id uuid,
  author_name text,
  author_email text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_role text;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select ur.role
    into v_role
    from public.user_roles as ur
   where ur.user_id = v_user_id;

  if v_role is null or v_role not in ('reviewer', 'admin') then
    raise exception 'Reviewer access required' using errcode = '42501';
  end if;

  return query
  select distinct i.author_id,
         u.raw_user_meta_data ->> 'name',
         u.email
    from public.incidents as i
    join auth.users as u on u.id = i.author_id
   where i.status = 'PENDING_REVIEW'
     and i.author_id = any(coalesce(p_author_ids, array[]::uuid[]));
end;
$function$;

create or replace function public.review_incident(
  p_incident_id uuid,
  p_action text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_role text;
  v_user_id uuid := auth.uid();
  v_locked_id uuid;
  v_reason text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select ur.role
    into v_role
    from public.user_roles as ur
   where ur.user_id = v_user_id;

  if v_role is null or v_role not in ('reviewer', 'admin') then
    raise exception 'Reviewer access required' using errcode = '42501';
  end if;

  if p_action not in ('APPROVED', 'CHANGES_REQUESTED') then
    raise exception 'Unsupported review action' using errcode = '22023';
  end if;

  v_reason := btrim(coalesce(p_reason, ''));
  if p_action = 'CHANGES_REQUESTED' and v_reason = '' then
    raise exception 'A reason is required when requesting changes' using errcode = '22023';
  end if;

  select i.id
    into v_locked_id
    from public.incidents as i
   where i.id = p_incident_id
     and i.status = 'PENDING_REVIEW'
   for update;

  if not found then
    raise exception 'Incident not found or no longer pending review' using errcode = 'P0002';
  end if;

  if p_action = 'APPROVED' then
    update public.incidents
       set status = 'PUBLISHED'
     where id = v_locked_id;
  else
    update public.incidents
       set status = 'CHANGES_REQUESTED'
     where id = v_locked_id;

    insert into public.incident_review_feedback (
      incident_id,
      reviewer_id,
      reason
    ) values (
      v_locked_id,
      v_user_id,
      v_reason
    );
  end if;
end;
$function$;

revoke all on function public.get_my_reports() from public, anon, authenticated;
revoke all on function public.get_author_identities(uuid[]) from public, anon, authenticated;
revoke all on function public.review_incident(uuid, text, text) from public, anon, authenticated;

grant execute on function public.get_my_reports() to authenticated;
grant execute on function public.get_author_identities(uuid[]) to authenticated;
grant execute on function public.review_incident(uuid, text, text) to authenticated;

commit;
