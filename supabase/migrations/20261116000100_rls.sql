-- Written from the app's expected behavior, not exported from a live database. Apply to a FRESH project only; compare with the live project before using it there.

begin;

alter table public.incidents enable row level security;
alter table public.user_roles enable row level security;
alter table public.incident_review_feedback enable row level security;

revoke all on table public.incidents from public, anon, authenticated;
revoke all on table public.user_roles from public, anon, authenticated;
revoke all on table public.incident_review_feedback from public, anon, authenticated;

grant select on table public.incidents to anon, authenticated;
grant insert, update, delete on table public.incidents to authenticated;
grant select on table public.user_roles to authenticated;

drop policy if exists incidents_public_published_read on public.incidents;
create policy incidents_public_published_read
  on public.incidents
  for select
  to anon, authenticated
  using (status = 'PUBLISHED');

drop policy if exists incidents_author_read_own on public.incidents;
create policy incidents_author_read_own
  on public.incidents
  for select
  to authenticated
  using (
    author_id = (select auth.uid())
    and not exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer', 'admin')
    )
  );

drop policy if exists incidents_reviewer_read_all on public.incidents;
create policy incidents_reviewer_read_all
  on public.incidents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer', 'admin')
    )
  );

drop policy if exists incidents_author_insert_own on public.incidents;
create policy incidents_author_insert_own
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
        and ur.role in ('reviewer', 'admin')
    )
  );

drop policy if exists incidents_author_update_own on public.incidents;
create policy incidents_author_update_own
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
        and ur.role in ('reviewer', 'admin')
    )
  )
  with check (
    author_id = (select auth.uid())
    and status in ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED')
    and not exists (
      select 1
      from public.user_roles as ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('reviewer', 'admin')
    )
  );

drop policy if exists incidents_author_delete_own on public.incidents;
create policy incidents_author_delete_own
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
        and ur.role in ('reviewer', 'admin')
    )
  );

drop policy if exists user_roles_read_own on public.user_roles;
create policy user_roles_read_own
  on public.user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No client policies or grants are provided for incident_review_feedback;
-- the SECURITY DEFINER RPCs are its only application access path.

commit;
