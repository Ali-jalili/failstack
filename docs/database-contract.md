# Supabase database contract (code-derived)

This document records the database objects and response shapes that the
application currently expects. It is derived from the repository code; it is
not a SQL schema, migration, or confirmation of the live Supabase project.
Column types, nullability, defaults, foreign keys, indexes, constraints, and
Row Level Security policies must be verified against the actual project.

## Tables

### `incidents`

The application reads and writes these columns:

| Column | Application use |
| --- | --- |
| `id` | Incident identifier used by edit, review, and delete operations. |
| `slug` | Public detail route and URL lookup. |
| `title` | Report title and duplicate-title advisory. |
| `company_name` | Company named in the report. |
| `occurred_at` | Incident timestamp. |
| `duration_minutes` | Incident duration. |
| `severity` | `CRITICAL`, `MAJOR`, or `MINOR`. |
| `pattern` | Incident pattern from the domain schema. |
| `summary` | Public and reviewer summary. |
| `official_post_mortem_url` | Optional source URL. |
| `system` | Affected service or system. |
| `technologies` | Technology list. |
| `timeline` | Timeline event data. |
| `root_cause_tree` | Root cause and contributing-factor data. |
| `architecture_diff` | Before/after architecture data. |
| `prevention_actions` | Prevention action data. |
| `author_id` | Supabase Auth user identifier for author-scoped operations. |
| `status` | `DRAFT`, `PENDING_REVIEW`, `CHANGES_REQUESTED`, or `PUBLISHED`. |
| `idempotency_key` | Optional key used to recognize repeated create/save requests. |
| `created_at` | Queue ordering and author report timestamp. |
| `latest_review_reason` | Reason returned by the author reports RPC. |

Create and draft-save flows handle PostgreSQL unique-violation code `23505` for
slug collisions and idempotency collisions. The code filters idempotency
lookups by both `idempotency_key` and `author_id`; verify the corresponding
database constraints and intended scope in Supabase.

### `user_roles`

The application looks up `role` by `user_id`. It recognizes `reviewer` and
`admin`; an authenticated user with no recognized reviewer role is treated as
an author by the application role helpers. This lookup is not a substitute for
database authorization policies.

## RPCs

| RPC | Arguments read by the app | Expected result or effect |
| --- | --- | --- |
| `get_my_reports` | None | Rows with `id`, `slug`, `title`, `created_at`, `status`, and nullable `latest_review_reason`. The app expects results scoped to the current author. |
| `get_author_identities` | `p_author_ids` | Rows with `author_id`, nullable `author_name`, and nullable `author_email`, used to decorate reviewer queue entries. The code comment expects the implementation to read Supabase Auth identity data server-side and restrict execution to reviewers. |
| `review_incident` | `p_incident_id`, `p_action`, `p_reason` | Performs the review status transition and records the optional changes-requested feedback/reason. The app treats an RPC error as a failed decision. |

The application has no direct query to an `incident_review_feedback` table. If
the deployed `review_incident` function stores feedback in such a table, that
table and its retention/access rules are part of the external database
contract, not a schema confirmed by this repository.

The application expects `get_author_identities` to resolve the name from
`auth.users.raw_user_meta_data ->> 'name'` and email from `auth.users.email`.
That expectation comes from `src/features/review/server/queries.ts`; the
function definition is not present in this repository.

## Access-control checks to verify in Supabase

- `incidents`: authors can access only their own reports; public reads expose
  published incidents; reviewer operations are restricted to reviewer/admin.
- `user_roles`: users cannot grant themselves roles, and role reads are
  restricted according to the deployed authorization model.
- `review_incident`: the function's execution privileges and any
  `SECURITY DEFINER` behavior enforce reviewer authorization in the database.
- `get_author_identities`: execution is limited to the intended reviewer
  callers and does not expose `auth.users` data to public or author clients.

These checks cannot be confirmed from the application repository alone. This
document describes application assumptions only; it does not claim that the
live database satisfies them.

## Source references

- `src/features/incidents/server/actions.ts`
- `src/features/incidents/server/queries.ts`
- `src/features/review/server/actions.ts`
- `src/features/review/server/queries.ts`
- `src/features/auth/server/current-user.ts`
- `src/features/incidents/schema.ts`
