# Database contract

The SQL implementation is in [supabase/migrations](../supabase/migrations/). It was written from the app's expected behavior, not exported from a live database; apply to a fresh project only and compare with the live project before using it there.

| App query or RPC | Database objects | Authorization |
| --- | --- | --- |
| `getCurrentUserState` | `user_roles` | `user_roles_read_own`: authenticated users can read only their own role row. |
| `getPublishedIncidentBySlug`, `getPublishedIncidentSummaries` | `incidents` | `incidents_public_published_read`: anonymous and authenticated clients can read published rows only. |
| Author incident queries and mutations (`createIncident`, `saveDraft`, `updateIncidentResubmit`, `submitDraft`, `deleteIncident`) | `incidents` | Author policies scope rows to `auth.uid()`; insert/update cannot set `PUBLISHED`; update/delete require an allowed current status. |
| `getMyReports` → `get_my_reports` | `incidents`, `incident_review_feedback`, `user_roles` | SECURITY DEFINER RPC checks authenticated author access and returns only the caller's reports; the feedback table is an RPC implementation detail, not queried directly by the app. |
| `getIncidentReviewQueue` | `incidents`, `user_roles` | `incidents_reviewer_read_all`: reviewer/admin role row is checked in `user_roles`; reviewers receive read-only incident access. |
| `get_author_identities` | `incidents`, `auth.users`, `user_roles` | SECURITY DEFINER RPC checks reviewer/admin access and returns identities only for authors in the pending review queue. |
| `reviewIncident` → `review_incident` | `incidents`, `incident_review_feedback`, `user_roles` | SECURITY DEFINER RPC checks reviewer/admin access; it transitions only pending incidents and requires a non-empty reason for `CHANGES_REQUESTED`. |
