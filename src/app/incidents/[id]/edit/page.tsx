import IncidentForm from "@/features/incidents/components/IncidentForm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !incident) {
    // Incident not found or DB error: go back to archive
    redirect("/incidents");
  }

  if (incident.author_id !== user.id) {
    // Not the owner
    redirect("/incidents");
  }

  if (incident.status !== "CHANGES_REQUESTED") {
    // Only editable when changes were requested
    redirect("/incidents");
  }

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
    <IncidentForm initialValues={initialValues} incidentId={id} mode="edit" />
  );
}
