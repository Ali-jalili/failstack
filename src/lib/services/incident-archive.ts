import { createClient } from "@/lib/supabase/server";
import { getCurrentUserState } from "@/lib/services/current-user";
import { z } from "zod";

const myReportSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string(),
  created_at: z.string().datetime({ offset: true }),
  status: z.string().min(1),
  latest_review_reason: z.string().nullable(),
});

export interface PublishedIncident {
  id: string;
  title: string;
  company_name: string;
  occurred_at: string;
  duration_minutes: number;
  severity: string;
  pattern: string;
  summary: string;
  system: string;
  technologies: string[];
}

export interface MyReport {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  status: string;
  latest_review_reason: string | null;
}

export type MyReportsResult =
  | { kind: "anonymous" }
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

export async function getPublishedIncidents(): Promise<{
  incidents: PublishedIncident[] | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(
      "id, title, company_name, occurred_at, duration_minutes, severity, pattern, summary, system, technologies",
    )
    .eq("status", "PUBLISHED")
    .order("occurred_at", { ascending: false });

  if (error) {
    return { incidents: null, error: error.message };
  }

  const incidents = data.map((incident) => ({
    id: incident.id,
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
