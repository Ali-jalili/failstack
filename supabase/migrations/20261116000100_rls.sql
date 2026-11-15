-- Written from the app's expected behavior, not exported from a live database. Apply to a FRESH project only; compare with the live project before using it there.
-- The inspected live policies use reviewer-only roles. Admin is included here
-- per the app contract; both roles receive reviewer capabilities.

begin;

alter table public.incidents enable row level security;
alter table public.user_roles enable row level security;
alter table public.incident_review_feedback enable row level security;

revoke all on table public.incidents from public, anon, authenticated, service_role;
revoke all on table public.user_roles from public, anon, authenticated, service_role;
revoke all on table public.incident_review_feedback from public, anon, authenticated, service_role;

grant select on table public.incidents to anon, authenticated;
grant insert, update, delete on table public.incidents to authenticated;
grant select on table public.user_roles to authenticated;

-- Remove both the policy names observed in the live project and the names
-- used by the initial inferred draft, so reruns do not leave permissive extras.
drop policy if exists incidents_public_published_read on public.incidents;
drop policy if exists incidents_author_read_own on public.incidents;
drop policy if exists incidents_reviewer_read_all on public.incidents;
drop policy if exists incidents_author_insert_own on public.incidents;
drop policy if exists incidents_author_update_own on public.incidents;
drop policy if exists incidents_author_delete_own on public.incidents;
drop policy if exists incidents_select_own on public.incidents;
drop policy if exists incidents_select_published on public.incidents;
drop policy if exists incidents_select_reviewer on public.incidents;
drop policy if exists incidents_insert_own on public.incidents;
drop policy if exists incidents_update_resubmit on public.incidents;
drop policy if exists incidents_delete_own on public.incidents;

create policy incidents_select_published
  on public.incidents
  for select
  to public
  using (status = 'PUBLISHED');

create policy incidents_select_own
  on public.incidents
  for select
  to authenticated
  using (
    author_id = (select auth.uid())
    and status in ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED')
  );

create policy incidents_select_reviewer
  on public.incidents
  for select
  to authenticated
  using (
    status in ('PENDING_REVIEW', 'CHANGES_REQUESTED')
    and exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
    )
  );

create policy incidents_insert_own
  on public.incidents
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and status in ('DRAFT', 'PENDING_REVIEW')
    and not exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
    )
  );

create policy incidents_update_resubmit
  on public.incidents
  for update
  to authenticated
  using (
    author_id = (select auth.uid())
    and status in ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED')
    and not exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
    )
  )
  with check (
    author_id = (select auth.uid())
    and status in ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED')
    and not exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
    )
  );

create policy incidents_delete_own
  on public.incidents
  for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    and status in ('DRAFT', 'CHANGES_REQUESTED')
    and not exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer'::public.app_role, 'admin'::public.app_role)
    )
  );

drop policy if exists "Users can read their own role" on public.user_roles;
drop policy if exists user_roles_read_own on public.user_roles;
create policy "Users can read their own role"
  on public.user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No client policies or grants are provided for incident_review_feedback;
-- SECURITY DEFINER RPCs are its only application access path.

commit;
