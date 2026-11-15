-- Written from the app's expected behavior, not exported from a live database. Apply to a FRESH project only; compare with the live project before using it there.
-- The exposed RPC behavior follows the live function definitions supplied for
-- this project, with explicit author/reviewer role checks and admin support.

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
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = v_user_id
      and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
  ) then
    raise exception 'Author access required';
  end if;

  return query
  select i.id,
         i.slug,
         i.title,
         i.created_at,
         i.status,
         case
           when i.status = 'CHANGES_REQUESTED' then (
             select f.reason
             from public.incident_review_feedback as f
             where f.incident_id = i.id
               and f.action = 'CHANGES_REQUESTED'
             order by f.created_at desc, f.id desc
             limit 1
           )
           else null::text
         end as latest_review_reason
  from public.incidents as i
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
language sql
stable
security definer
set search_path = ''
as $function$
  select u.id,
         u.raw_user_meta_data ->> 'name',
         u.email
  from auth.users as u
  where u.id = any(p_author_ids)
    and exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = auth.uid()
        and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
    );
$function$;

create or replace function public.review_incident(
  p_incident_id uuid,
  p_action text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_current_status text;
  v_new_status text;
  v_reason text := nullif(trim(p_reason), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.user_roles as ur
    where ur.user_id = v_user_id
      and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
  ) then
    raise exception 'Reviewer access required';
  end if;

  if p_action is null or p_action not in ('APPROVED', 'CHANGES_REQUESTED') then
    raise exception 'Invalid review action';
  end if;

  if p_action = 'CHANGES_REQUESTED' and v_reason is null then
    raise exception 'A reason is required';
  end if;

  v_new_status := case p_action
    when 'APPROVED' then 'PUBLISHED'
    when 'CHANGES_REQUESTED' then 'CHANGES_REQUESTED'
  end;

  select i.status
    into v_current_status
    from public.incidents as i
   where i.id = p_incident_id
   for update;

  if not found then
    raise exception 'Incident not found';
  end if;

  if v_current_status <> 'PENDING_REVIEW' then
    raise exception 'Incident is not pending review';
  end if;

  update public.incidents
     set status = v_new_status
   where id = p_incident_id;

  insert into public.incident_review_feedback (
    incident_id,
    reviewer_id,
    action,
    reason
  ) values (
    p_incident_id,
    v_user_id,
    p_action,
    v_reason
  );
end;
$function$;

revoke all on function public.get_my_reports() from public, anon, authenticated, service_role;
revoke all on function public.get_author_identities(uuid[]) from public, anon, authenticated, service_role;
revoke all on function public.review_incident(uuid, text, text) from public, anon, authenticated, service_role;

grant execute on function public.get_my_reports() to authenticated;
grant execute on function public.get_author_identities(uuid[]) to authenticated;
grant execute on function public.review_incident(uuid, text, text) to authenticated;

commit;
