/** @format */

"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserState,
  hasAuthorAccess,
} from "@/features/auth/server/current-user";
import { incidentFormSchema } from "@/features/incidents/form-schema";
import { getMyReports } from "@/features/incidents/server/queries";

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

export async function fetchMyReports() {
  return getMyReports();
}

export async function createIncident(
  input: unknown,
  idempotencyKey?: string | null,
) {
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

  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "anonymous") {
    return {
      error: "You must be signed in to submit an incident.",
    };
  }

  if (currentUser.kind === "error") {
    return { error: "Could not verify your sign-in. Please sign in again." };
  }

  if (currentUser.roleError) {
    return { error: "Could not verify your role. Please try again." };
  }

  if (!hasAuthorAccess(currentUser)) {
    return { error: "Author access required." };
  }

  const supabase = await createClient();

  const incident = parsed.data;

  // Idempotency: if a row with this key already exists for this user,
  // return it instead of inserting a duplicate.
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("incidents")
      .select("slug")
      .eq("idempotency_key", idempotencyKey)
      .eq("author_id", currentUser.userId)
      .maybeSingle();

    if (existing?.slug) {
      return { error: null, slug: existing.slug, alreadyExists: true };
    }
  }

  const slug = createSlug(incident.title);
  const row: Record<string, unknown> = {
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
    author_id: currentUser.userId,
    status: "PENDING_REVIEW",
  };

  if (idempotencyKey) {
    row.idempotency_key = idempotencyKey;
  }

  const { error: insertError } = await supabase.from("incidents").insert(row);

  if (!insertError) {
    return { error: null, slug };
  }

  // A 23505 on the idempotency_key column means a concurrent request
  // already inserted this incident — return success with the existing slug.
  if (insertError.code === "23505" && idempotencyKey) {
    const { data: concurrent } = await supabase
      .from("incidents")
      .select("slug")
      .eq("idempotency_key", idempotencyKey)
      .eq("author_id", currentUser.userId)
      .maybeSingle();

    if (concurrent?.slug) {
      return { error: null, slug: concurrent.slug, alreadyExists: true };
    }
  }

  if (insertError.code !== "23505") {
    return { error: insertError.message };
  }

  const retryRow = {
    ...row,
    slug: `${slug}-${randomUUID().slice(0, 8)}`,
  };
  const { error: retryError } = await supabase
    .from("incidents")
    .insert(retryRow);

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

export async function updateIncidentResubmit(input: unknown) {
  const payloadSchema = z.object({
    id: z.string(),
    // reuse the incident form schema for validation of the rest of the payload
    title: incidentFormSchema.shape.title,
    companyName: incidentFormSchema.shape.companyName,
    occurredAt: incidentFormSchema.shape.occurredAt,
    durationMinutes: incidentFormSchema.shape.durationMinutes,
    severity: incidentFormSchema.shape.severity,
    pattern: incidentFormSchema.shape.pattern,
    summary: incidentFormSchema.shape.summary,
    officialPostMortemUrl: incidentFormSchema.shape.officialPostMortemUrl,
    system: incidentFormSchema.shape.system,
    technologies: incidentFormSchema.shape.technologies,
    timeline: incidentFormSchema.shape.timeline,
    rootCauseTree: incidentFormSchema.shape.rootCauseTree,
    architectureDiff: incidentFormSchema.shape.architectureDiff,
    preventionActions: incidentFormSchema.shape.preventionActions,
  });

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
        .join("; "),
    };
  }

  const occurredAt = isoDateTimeSchema.safeParse(
    parsed.data.occurredAt as string,
  );
  if (!occurredAt.success) {
    return {
      error: "The incident date must be submitted as an ISO timestamp.",
    };
  }

  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "anonymous") {
    return { error: "You must be signed in to resubmit an incident." };
  }

  if (currentUser.kind === "error") {
    return { error: "Could not verify your sign-in. Please sign in again." };
  }

  if (currentUser.roleError) {
    return { error: "Could not verify your role. Please try again." };
  }

  if (!hasAuthorAccess(currentUser)) {
    return { error: "Author access required." };
  }

  const supabase = await createClient();

  const id = parsed.data.id;

  const row = {
    title: parsed.data.title,
    company_name: parsed.data.companyName,
    occurred_at: occurredAt.data,
    duration_minutes: parsed.data.durationMinutes,
    severity: parsed.data.severity,
    pattern: parsed.data.pattern,
    summary: parsed.data.summary,
    official_post_mortem_url: parsed.data.officialPostMortemUrl || null,
    system: parsed.data.system,
    technologies: parsed.data.technologies,
    timeline: parsed.data.timeline,
    root_cause_tree: parsed.data.rootCauseTree,
    architecture_diff: parsed.data.architectureDiff,
    prevention_actions: parsed.data.preventionActions,
    status: "PENDING_REVIEW",
  };

  // Attempt conditional update: only allow owner to update and only when status is CHANGES_REQUESTED
  const incidentUpdate = supabase.from("incidents");

  const { count: updatedCount, error: updateError } = await incidentUpdate
    .update(row, { count: "exact" })
    .eq("id", id)
    .eq("author_id", currentUser.userId)
    .eq("status", "CHANGES_REQUESTED");

  if (updateError) {
    return { error: updateError.message };
  }

  if (updatedCount === 0) {
    return {
      error:
        "Could not update the incident. It may not exist, you may not be the owner, or it is no longer editable.",
    };
  }

  if (updatedCount !== 1) {
    return {
      error: "The incident update did not affect exactly one report.",
    };
  }

  return { error: null };
}
