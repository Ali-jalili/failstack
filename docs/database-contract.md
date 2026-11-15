# Database contract

The SQL implementation is in [supabase/migrations](../supabase/migrations/). It was written from the app's expected behavior and the schema details shared for this project, not exported from a live database; use it for a fresh project and compare the proposed changes with an existing project before applying. The inspected `app_role` enum contains only `reviewer`; the base migration adds `admin` because the app's access checks support it. The inspected project has no `supabase_migrations.schema_migrations` table, so the Supabase CLI has no recorded migration history. The `updated_at` column has a default but no update trigger.

| App query or RPC | Database objects | Authorization |
| --- | --- | --- |
| `getCurrentUserState` | `user_roles` | `Users can read their own role`: authenticated users can read only their own role row. |
| `getPublishedIncidentBySlug`, `getPublishedIncidentSummaries` | `incidents` | `incidents_select_published`: anonymous and authenticated clients can read published rows only. |
| Author incident queries and mutations (`createIncident`, `saveDraft`, `updateIncidentResubmit`, `submitDraft`, `deleteIncident`) | `incidents` | `incidents_select_own`, `incidents_insert_own`, `incidents_update_resubmit`, and `incidents_delete_own` scope rows to `auth.uid()`; insert/update cannot set `PUBLISHED`; update/delete require an allowed current status. |
| `getMyReports` → `get_my_reports` | `incidents`, `incident_review_feedback`, `user_roles` | SECURITY DEFINER RPC checks authenticated author access and returns only the caller's reports; the feedback table is an RPC implementation detail, not queried directly by the app. |
| `getIncidentReviewQueue` | `incidents`, `user_roles` | `incidents_select_reviewer`: reviewer/admin role row is checked in `user_roles`; reviewers receive read-only incident access. |
| `get_author_identities` | `auth.users`, `user_roles` | SECURITY DEFINER RPC checks reviewer/admin access and returns identities for the requested author IDs. |
| `reviewIncident` → `review_incident` | `incidents`, `incident_review_feedback`, `user_roles` | SECURITY DEFINER RPC checks reviewer/admin access; it transitions only pending incidents and requires a non-empty reason for `CHANGES_REQUESTED`. |
