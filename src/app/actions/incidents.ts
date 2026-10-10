"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { incidentFormSchema } from "@/lib/validation/incident-form";

const isoDateTimeSchema = z.string().datetime();

function createSlug(title: string) {
  return (
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "incident"
  );
}

export async function createIncident(input: unknown) {
  const parsed = incidentFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
        .join("; "),
    };
  }

  const occurredAt = isoDateTimeSchema.safeParse(parsed.data.occurredAt);
  if (!occurredAt.success) {
    return {
      error: "The incident date must be submitted as an ISO timestamp.",
    };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "You must be signed in to submit an incident.",
    };
  }

  const incident = parsed.data;
  const slug = createSlug(incident.title);
  const row = {
    slug,
    title: incident.title,
    company_name: incident.companyName,
    occurred_at: occurredAt.data,
    duration_minutes: incident.durationMinutes,
    severity: incident.severity,
    pattern: incident.pattern,
    summary: incident.summary,
    official_post_mortem_url: incident.officialPostMortemUrl || null,
    system: incident.system,
    technologies: incident.technologies,
    timeline: incident.timeline,
    root_cause_tree: incident.rootCauseTree,
    architecture_diff: incident.architectureDiff,
    prevention_actions: incident.preventionActions,
    author_id: user.id,
    status: "DRAFT",
  };

  const { error: insertError } = await supabase.from("incidents").insert(row);

  if (!insertError) {
    return { error: null, slug };
  }

  if (insertError.code !== "23505") {
    return { error: insertError.message };
  }

  const retryRow = {
    ...row,
    slug: `${slug}-${randomUUID().slice(0, 8)}`,
  };
  const { error: retryError } = await supabase.from("incidents").insert(retryRow);

  if (retryError) {
    return {
      error:
        retryError.code === "23505"
          ? "Could not create a unique incident URL. Please try submitting again."
          : retryError.message,
    };
  }

  return { error: null, slug: retryRow.slug };
}
