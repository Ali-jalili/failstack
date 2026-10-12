import type {
  ArchitectureDiff,
  IncidentSeverity,
  PreventionAction,
  RootCauseNode,
  TimelineEvent,
} from "@/types/incident";
import { createClient } from "@/lib/supabase/server";

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
}

export type IncidentReviewQueueResult =
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "success"; incidents: ReviewIncident[] };

export async function getIncidentReviewQueue(): Promise<IncidentReviewQueueResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return {
      kind: "error",
      message: `Could not verify your sign-in: ${authError.message}`,
    };
  }

  if (!user) {
    return { kind: "unauthenticated" };
  }

  const { data: userRole, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) {
    return {
      kind: "error",
      message: `Could not verify reviewer access: ${roleError.message}`,
    };
  }

  if (userRole?.role !== "reviewer") {
    return { kind: "forbidden" };
  }

  const { data, error } = await supabase
    .from("incidents")
    .select(
      "id, slug, title, company_name, occurred_at, duration_minutes, severity, pattern, summary, official_post_mortem_url, system, technologies, timeline, root_cause_tree, architecture_diff, prevention_actions, created_at",
    )
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true });

  if (error) {
    return {
      kind: "error",
      message: `Could not load incidents pending review: ${error.message}`,
    };
  }

  return { kind: "success", incidents: data };
}
