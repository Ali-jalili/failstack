/** @format */

import IncidentForm from "@/features/incidents/components/IncidentForm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyReports } from "@/features/incidents/server/queries";

type Props = { params: Promise<{ id: string }> };

export default async function EditIncidentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(`Unable to verify sign-in: ${authError.message}`);
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/incidents/${id}/edit`)}`);
  }

  const { data: incident, error } = await supabase
    .from("incidents")
    .select(
      "id, author_id, status, title, company_name, occurred_at, duration_minutes, severity, pattern, summary, official_post_mortem_url, system, technologies, timeline, root_cause_tree, architecture_diff, prevention_actions",
    )
    .eq("id", id)
    .eq("author_id", user.id)
    .eq("status", "CHANGES_REQUESTED")
    .maybeSingle();

  if (error || !incident) {
    // Incident not found, not the owner's, no longer in CHANGES_REQUESTED,
    // or DB error: go back to archive
    redirect("/incidents");
  }

  // Fetch the latest reviewer reason from the canonical RPC. The RPC is
  // scoped to the current user's own reports, so no cross-tenant leak.
  const myReports = await getMyReports();
  const reviewerNote =
    myReports.kind === "success"
      ? myReports.reports.find((r) => r.id === id)?.latest_review_reason ?? null
      : null;

  function toLocalDateTime(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const initialValues = {
    title: incident.title ?? "",
    companyName: incident.company_name ?? "",
    occurredAt: toLocalDateTime(incident.occurred_at),
    durationMinutes: incident.duration_minutes ?? 0,
    severity: incident.severity ?? "MINOR",
    pattern: incident.pattern ?? "SINGLE_POINT_OF_FAILURE",
    summary: incident.summary ?? "",
    officialPostMortemUrl: incident.official_post_mortem_url ?? "",
    system: incident.system ?? "",
    technologies: incident.technologies ?? [],
    timeline: incident.timeline ?? [],
    rootCauseTree: incident.root_cause_tree ?? [],
    architectureDiff: incident.architecture_diff ?? {
      beforeFix: "",
      afterFix: "",
      isFact: true,
      notes: "",
    },
    preventionActions: incident.prevention_actions ?? [],
  };

  return (
    // Use the same IncidentForm client component with mode 'edit'
    <IncidentForm
      initialValues={initialValues}
      incidentId={id}
      mode="edit"
      reviewerNote={reviewerNote}
    />
  );
}
