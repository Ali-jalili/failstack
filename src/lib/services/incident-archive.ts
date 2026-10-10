import { createClient } from "@/lib/supabase/server";

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
