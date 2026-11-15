-- Written from the app's expected behavior, not exported from a live database. Apply to a FRESH project only; compare with the live project before using it there.
-- Account deletion is restricted while authored incidents exist to preserve
-- published reports and their attribution. Role rows are removed with users;
-- reviewer feedback survives reviewer deletion with reviewer_id set to NULL.

begin;

create table if not exists public.user_roles (
  user_id uuid primary key
    references auth.users (id) on delete cascade,
  role text not null
    check (role in ('reviewer', 'admin'))
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  company_name text not null,
  occurred_at timestamptz not null,
  duration_minutes integer not null,
  severity text not null
    check (severity in ('CRITICAL', 'MAJOR', 'MINOR')),
  pattern text not null
    check (
      pattern in (
        'SINGLE_POINT_OF_FAILURE',
        'CASCADING_FAILURE',
        'THUNDERING_HERD',
        'POISON_PILL',
        'RACE_CONDITION',
        'SPLIT_BRAIN',
        'RESOURCE_EXHAUSTION'
      )
    ),
  summary text not null,
  official_post_mortem_url text,
  system text not null,
  technologies jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  root_cause_tree jsonb not null default '[]'::jsonb,
  architecture_diff jsonb,
  prevention_actions jsonb not null default '[]'::jsonb,
  author_id uuid not null
    references auth.users (id) on delete restrict,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED')),
  idempotency_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists incidents_slug_uidx
  on public.incidents (slug);

create unique index if not exists incidents_author_idempotency_key_uidx
  on public.incidents (author_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists incidents_author_id_idx
  on public.incidents (author_id);

create index if not exists incidents_status_idx
  on public.incidents (status);

create index if not exists incidents_status_created_at_idx
  on public.incidents (status, created_at);

-- This table is an implementation detail used by review_incident and
-- get_my_reports. The application does not query it directly.
create table if not exists public.incident_review_feedback (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null
    references public.incidents (id) on delete cascade,
  reviewer_id uuid
    references auth.users (id) on delete set null,
  reason text not null check (length(btrim(reason)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists incident_review_feedback_latest_idx
  on public.incident_review_feedback (incident_id, created_at desc, id desc);

commit;
