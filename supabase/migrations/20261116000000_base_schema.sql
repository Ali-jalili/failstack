-- Written from the app's expected behavior, not exported from a live database. Apply to a FRESH project only; compare with the live project before using it there.
-- The observed live app_role currently has reviewer only. The application
-- additions (admin, severity check, lookup indexes) are added after this base
-- schema in the same transaction. updated_at has a default and no trigger.

begin;

do $migration$
begin
  create type public.app_role as enum ('reviewer');
exception
  when duplicate_object then null;
end;
$migration$;

create table if not exists public.user_roles (
  user_id uuid primary key
    references auth.users (id) on delete cascade,
  role public.app_role not null
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  company_name text not null,
  occurred_at timestamptz not null,
  duration_minutes integer not null,
  severity text not null,
  pattern text not null,
  summary text not null,
  official_post_mortem_url text,
  system text not null,
  technologies jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  root_cause_tree jsonb not null default '[]'::jsonb,
  architecture_diff jsonb not null,
  prevention_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_id uuid not null
    references auth.users (id) on delete no action,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED')),
  idempotency_key uuid,
  constraint incidents_slug_key unique (slug),
  constraint incidents_author_idempotency_key_unique
    unique (author_id, idempotency_key)
);

create table if not exists public.incident_review_feedback (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null
    references public.incidents (id) on delete cascade,
  reviewer_id uuid not null
    references auth.users (id) on delete no action,
  action text not null
    check (action in ('CHANGES_REQUESTED', 'APPROVED')),
  reason text,
  created_at timestamptz not null default now(),
  constraint feedback_reason_required
    check (action <> 'CHANGES_REQUESTED' or length(btrim(reason)) > 0)
);

alter type public.app_role add value if not exists 'admin';

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.incidents'::regclass
      and conname = 'incidents_severity_check'
  ) then
    alter table public.incidents
      add constraint incidents_severity_check
      check (severity in ('CRITICAL', 'MAJOR', 'MINOR'));
  end if;
end;
$migration$;

create index if not exists incidents_author_id_idx
  on public.incidents (author_id);

create index if not exists incidents_status_idx
  on public.incidents (status);

create index if not exists incident_review_feedback_latest_idx
  on public.incident_review_feedback (incident_id, created_at desc);

commit;
