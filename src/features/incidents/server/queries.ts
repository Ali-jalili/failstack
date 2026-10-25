import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserState,
  hasAuthorAccess,
} from "@/features/auth/server/current-user";
import { z } from "zod";
import type { IncidentStatus } from "@/types/incident";
import type {
  ArchitectureDiff,
  IncidentSeverity,
  IncidentPattern,
  PreventionAction,
  RootCauseNode,
  TimelineEvent,
} from "@/types/incident";

const incidentStatusValues = [
  "DRAFT",
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "PUBLISHED",
] as const satisfies readonly IncidentStatus[];

const myReportSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string(),
  created_at: z.string().datetime({ offset: true }),
  status: z.enum(incidentStatusValues),
  latest_review_reason: z.string().nullable(),
});

export interface PublishedIncident {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  occurred_at: string;
  duration_minutes: number;
  severity: IncidentSeverity;
  pattern: IncidentPattern;
  summary: string;
  system: string;
  technologies: string[];
  timeline: TimelineEvent[];
  root_cause_tree: RootCauseNode[];
  architecture_diff: ArchitectureDiff;
  prevention_actions: PreventionAction[];
  official_post_mortem_url: string | null;
}

export type PublishedIncidentSummary = Pick<
  PublishedIncident,
  | "id"
  | "slug"
  | "title"
  | "company_name"
  | "occurred_at"
  | "duration_minutes"
  | "severity"
  | "pattern"
  | "summary"
  | "system"
  | "technologies"
>;

type PublishedIncidentRow = Omit<
  PublishedIncident,
  | "technologies"
  | "timeline"
  | "root_cause_tree"
  | "architecture_diff"
  | "prevention_actions"
> & {
  technologies: unknown;
  timeline: unknown;
  root_cause_tree: unknown;
  architecture_diff: unknown;
  prevention_actions: unknown;
};

const publishedIncidentColumns =
  "id, slug, title, company_name, occurred_at, duration_minutes, severity, pattern, summary, system, technologies, timeline, root_cause_tree, architecture_diff, prevention_actions, official_post_mortem_url";

function mapPublishedIncident(incident: PublishedIncidentRow): PublishedIncident {
  return {
    id: incident.id,
    slug: incident.slug,
    title: incident.title,
    company_name: incident.company_name,
    occurred_at: incident.occurred_at,
    duration_minutes: incident.duration_minutes,
    severity: incident.severity,
    pattern: incident.pattern,
    summary: incident.summary,
    system: incident.system,
    technologies: Array.isArray(incident.technologies)
      ? incident.technologies.filter(
          (technology): technology is string => typeof technology === "string",
        )
      : [],
    timeline: Array.isArray(incident.timeline)
      ? (incident.timeline as TimelineEvent[])
      : [],
    root_cause_tree: Array.isArray(incident.root_cause_tree)
      ? (incident.root_cause_tree as RootCauseNode[])
      : [],
    architecture_diff:
      incident.architecture_diff && typeof incident.architecture_diff === "object"
        ? (incident.architecture_diff as ArchitectureDiff)
        : {
            beforeFix: "No prior architecture details were provided.",
            afterFix: "No updated architecture details were provided.",
            isFact: false,
            notes: "The report did not include an architecture comparison.",
          },
    prevention_actions: Array.isArray(incident.prevention_actions)
      ? (incident.prevention_actions as PreventionAction[])
      : [],
    official_post_mortem_url: incident.official_post_mortem_url ?? null,
  };
}

export interface MyReport {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  status: IncidentStatus;
  latest_review_reason: string | null;
}

export type MyReportsResult =
  | { kind: "anonymous" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "success"; reports: MyReport[] };

export async function getMyReports(): Promise<MyReportsResult> {
  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "anonymous") {
    return { kind: "anonymous" };
  }

  if (currentUser.kind === "error") {
    return {
      kind: "error",
      message: `Could not verify your sign-in: ${currentUser.message}`,
    };
  }

  if (currentUser.kind === "authenticated" && currentUser.roleError) {
    return {
      kind: "error",
      message: `Could not verify your role: ${currentUser.roleError}`,
    };
  }

  if (!hasAuthorAccess(currentUser)) {
    return { kind: "forbidden" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_reports");

  if (error) {
    return {
      kind: "error",
      message: `Could not load your reports: ${error.message}`,
    };
  }

  const reportsResult = z.array(myReportSchema).safeParse(data);

  if (!reportsResult.success) {
    return {
      kind: "error",
      message: "The reports service returned an unexpected response.",
    };
  }

  return {
    kind: "success",
    reports: reportsResult.data,
  };
}

export async function getPublishedIncidentBySlug(slug: string): Promise<{
  incident: PublishedIncident | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(publishedIncidentColumns)
    .eq("status", "PUBLISHED")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { incident: null, error: error.message };
  if (!data) return { incident: null, error: null };

  return {
    incident: mapPublishedIncident(data as PublishedIncidentRow),
    error: null,
  };
}

export async function getPublishedIncidentSummaries(): Promise<{
  incidents: PublishedIncidentSummary[] | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(
      "id, slug, title, company_name, occurred_at, duration_minutes, severity, pattern, summary, system, technologies",
    )
    .eq("status", "PUBLISHED")
    .order("occurred_at", { ascending: false });

  if (error) return { incidents: null, error: error.message };

  const incidents = data.map((incident) => ({
    id: incident.id,
    slug: incident.slug,
    title: incident.title,
    company_name: incident.company_name,
    occurred_at: incident.occurred_at,
    duration_minutes: incident.duration_minutes,
    severity: incident.severity,
    pattern: incident.pattern,
    summary: incident.summary,
    system: incident.system,
    technologies: Array.isArray(incident.technologies)
      ? incident.technologies.filter(
          (technology): technology is string => typeof technology === "string",
        )
      : [],
  }));

  return { incidents, error: null };
}
