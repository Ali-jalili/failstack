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

type IncidentRowWithoutAuthor = Omit<ReviewIncident, "author_name" | "author_email">;

export async function getIncidentReviewQueue(): Promise<IncidentReviewQueueResult> {
  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "error") {
    return {
      kind: "error",
      message: `Could not verify your sign-in: ${currentUser.message}`,
    };
  }

  if (currentUser.kind === "anonymous") {
    return { kind: "unauthenticated" };
  }

  if (currentUser.roleError) {
    return {
      kind: "error",
      message: `Could not verify reviewer access: ${currentUser.roleError}`,
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
      message: `Could not load incidents pending review: ${error.message}`,
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
  // If the function has not been created (or EXECUTE has not been granted
  // to the calling role), we degrade gracefully: every incident gets
  // `author_name: null, author_email: null` and the queue still renders.
  const authorIds = Array.from(
    new Set(
      incidents
        .map((i) => i.author_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  let authorMap: Map<string, AuthorIdentity> = new Map();
  if (authorIds.length > 0) {
    const { data: authorRows, error: authorError } = await supabase.rpc(
      "get_author_identities",
      { p_author_ids: authorIds },
    );

    if (!authorError && Array.isArray(authorRows)) {
      authorMap = new Map(
        authorRows
          .filter(
            (row): row is AuthorIdentity =>
              typeof row?.author_id === "string",
          )
          .map((row) => [row.author_id, row] as const),
      );
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
