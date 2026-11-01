/** @format */

import type {
  ArchitectureDiff,
  IncidentSeverity,
  PreventionAction,
  RootCauseNode,
  TimelineEvent,
} from "@/types/incident";
import {
  getCurrentUserState,
  hasReviewerAccess,
} from "@/features/auth/server/current-user";
import { createClient } from "@/lib/supabase/server";

/**
 * An author's resolvable identity. `author_name` comes from Supabase Auth
 * `user_metadata.name` (written by `handleSignUp`); `author_email` is the
 * user's registration email. Both are resolved server-side from
 * `auth.users` and are reviewer-only.
 */
export interface AuthorIdentity {
  author_id: string;
  author_name: string | null;
  author_email: string | null;
}

export interface ReviewIncident {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  occurred_at: string;
  duration_minutes: number;
  severity: IncidentSeverity;
  pattern: string;
  summary: string;
  official_post_mortem_url: string | null;
  system: string;
  technologies: string[];
  timeline: TimelineEvent[];
  root_cause_tree: RootCauseNode[];
  architecture_diff: ArchitectureDiff;
  prevention_actions: PreventionAction[];
  created_at: string;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
}

export type IncidentReviewQueueResult =
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "success"; incidents: ReviewIncident[] };

/**
 * Result of looking up a single incident for the dedicated review detail
 * route. `incidents` is the full pending queue in its canonical order
 * (`created_at` ascending) — the same query and ordering as
 * `getIncidentReviewQueue()`, so Previous/Next navigation always matches
 * the queue. `incident` is null when the requested id is not currently
 * pending review (already decided, or never existed).
 */
export type ReviewIncidentDetailResult =
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      incident: ReviewIncident | null;
      incidents: ReviewIncident[];
      /** Id of the previous pending incident in queue order, if any. */
      previousId: string | null;
      /** Id of the next pending incident in queue order, if any. */
      nextId: string | null;
    };

type IncidentRowWithoutAuthor = Omit<
  ReviewIncident,
  "author_name" | "author_email"
>;

const REVIEW_SIGN_IN_ERROR =
  "Could not verify your sign-in. Please refresh and try again.";
const REVIEW_ACCESS_ERROR =
  "Could not verify reviewer access. Please refresh and try again.";
const REVIEW_QUEUE_ERROR =
  "Could not load incidents pending review. Please refresh and try again.";
const AUTHOR_IDENTITIES_ERROR =
  "Could not load author identities for the review queue. Please refresh and try again.";

export async function getIncidentReviewQueue(): Promise<IncidentReviewQueueResult> {
  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "error") {
    return {
      kind: "error",
      message: REVIEW_SIGN_IN_ERROR,
    };
  }

  if (currentUser.kind === "anonymous") {
    return { kind: "unauthenticated" };
  }

  if (currentUser.roleError) {
    return {
      kind: "error",
      message: REVIEW_ACCESS_ERROR,
    };
  }

  if (!hasReviewerAccess(currentUser)) {
    return { kind: "forbidden" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(
      "id, slug, title, company_name, occurred_at, duration_minutes, severity, pattern, summary, official_post_mortem_url, system, technologies, timeline, root_cause_tree, architecture_diff, prevention_actions, created_at, author_id",
    )
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true });

  if (error) {
    return {
      kind: "error",
      message: REVIEW_QUEUE_ERROR,
    };
  }

  const incidents = (data ?? []) as IncidentRowWithoutAuthor[];

  // The author's name + email live in Supabase Auth (GoTrue `auth.users`),
  // which is NOT reachable through the regular (anon-key) client via
  // `from("auth.users")`. Resolve it in a single batch with the
  // `get_author_identities` RPC, which the DBA must create as a
  // `SECURITY DEFINER` Postgres function that reads
  //   - `auth.users.email`
  //   - `auth.users.raw_user_meta_data ->> 'name'`
  // and is callable only by the reviewer role that is already gated above.
  //
  // An empty successful result means identities are unavailable for these
  // authors. An RPC failure is different: return an error rather than showing
  // a successful queue with silently missing identity data.
  const authorIds = Array.from(
    new Set(
      incidents
        .map((i) => i.author_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  let authorMap: Map<string, AuthorIdentity> = new Map();
  if (authorIds.length > 0) {
    try {
      const { data: authorRows, error: authorError } = await supabase.rpc(
        "get_author_identities",
        { p_author_ids: authorIds },
      );

      if (authorError) {
        return { kind: "error", message: AUTHOR_IDENTITIES_ERROR };
      }

      if (Array.isArray(authorRows)) {
        authorMap = new Map(
          authorRows
            .filter(
              (row): row is AuthorIdentity =>
                typeof row?.author_id === "string",
            )
            .map((row) => [row.author_id, row] as const),
        );
      }
    } catch {
      return { kind: "error", message: AUTHOR_IDENTITIES_ERROR };
    }
  }

  return {
    kind: "success",
    incidents: incidents.map((incident) => {
      const entry = incident.author_id
        ? authorMap.get(incident.author_id)
        : undefined;
      return {
        ...incident,
        author_name: entry?.author_name ?? null,
        author_email: entry?.author_email ?? null,
      };
    }),
  };
}

/**
 * Load one incident for the dedicated detail route.
 *
 * Reuses `getIncidentReviewQueue()` so the pending set, ordering, and
 * author-identity resolution are identical to the queue page. The
 * requested incident is located within that ordered list, which also
 * yields its previous/next neighbours for navigation.
 *
 * An id that is not currently pending (already decided, or unknown) is
 * reported as `incident: null` — a state the UI can express as "this
 * report no longer awaits review" without a 404. Database or
 * authorization failures are surfaced as their own result kinds and are
 * never misrepresented as a missing incident.
 */
export async function getReviewIncidentDetail(
  incidentId: string,
): Promise<ReviewIncidentDetailResult> {
  const queueResult = await getIncidentReviewQueue();

  if (
    queueResult.kind === "unauthenticated" ||
    queueResult.kind === "forbidden" ||
    queueResult.kind === "error"
  ) {
    return queueResult;
  }

  const incidents = queueResult.incidents;
  const index = incidents.findIndex((incident) => incident.id === incidentId);

  if (index === -1) {
    return {
      kind: "success",
      incident: null,
      incidents,
      previousId: null,
      nextId: null,
    };
  }

  return {
    kind: "success",
    incident: incidents[index],
    incidents,
    previousId: index > 0 ? incidents[index - 1].id : null,
    nextId: index < incidents.length - 1 ? incidents[index + 1].id : null,
  };
}
