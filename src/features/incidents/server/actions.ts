/** @format */

"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { logServerError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserState,
  hasAuthorAccess,
} from "@/features/auth/server/current-user";
import {
  incidentDraftSchema,
  incidentFormSchema,
  type IncidentDraftValues,
} from "@/features/incidents/form-schema";
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

type CreateIncidentResult =
  | { error: string; slug?: never; alreadyExists?: never }
  | { error: null; slug: string; alreadyExists?: boolean };

export async function createIncident(
  input: unknown,
  idempotencyKey?: string | null,
): Promise<CreateIncidentResult> {
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
    return {
      error: logServerError(
        "createIncident.auth",
        currentUser.message,
        "Could not verify your sign-in. Please sign in again.",
      ),
    };
  }

  if (currentUser.roleError) {
    return {
      error: logServerError(
        "createIncident.role",
        currentUser.roleError,
        "Could not verify your role. Please try again.",
      ),
    };
  }

  if (!hasAuthorAccess(currentUser)) {
    return { error: "Author access required." };
  }

  const supabase = await createClient();

  const incident = parsed.data;
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

  const submittedStatuses = new Set([
    "PENDING_REVIEW",
    "CHANGES_REQUESTED",
    "PUBLISHED",
  ]);
  const transitionDraft = async (
    existing: { id: string; slug: string; status: string },
  ): Promise<CreateIncidentResult> => {
    const { data: updated, error: updateError } = await supabase
      .from("incidents")
      .update({ ...row, slug: existing.slug })
      .eq("id", existing.id)
      .eq("author_id", currentUser.userId)
      .eq("status", "DRAFT")
      .select("slug, status");

    if (updateError) {
      return {
        error: logServerError(
          "createIncident.transitionDraft",
          updateError,
          "Could not submit the incident. Please try again.",
        ),
      };
    }

    const submitted = updated?.find((item) =>
      submittedStatuses.has(item.status),
    );
    if (submitted) {
      return { error: null, slug: submitted.slug };
    }

    // Another request may have completed the same transition while this
    // request was in flight. Confirm the stored state before reporting success.
    const { data: latest, error: latestError } = await supabase
      .from("incidents")
      .select("slug, status")
      .eq("id", existing.id)
      .eq("author_id", currentUser.userId)
      .maybeSingle();

    if (latestError) {
      return {
        error: logServerError(
          "createIncident.verifyTransition",
          latestError,
          "Could not verify whether the incident was submitted. Please refresh and check your reports.",
        ),
      };
    }

    if (latest && submittedStatuses.has(latest.status)) {
      return { error: null, slug: latest.slug, alreadyExists: true };
    }

    return {
      error:
        "The draft was not submitted. It may have been deleted or its status changed.",
    };
  };

  const existingResult = (
    existing: { id: string; slug: string; status: string },
  ): Promise<CreateIncidentResult> | CreateIncidentResult => {
    if (submittedStatuses.has(existing.status)) {
      return { error: null, slug: existing.slug, alreadyExists: true };
    }

    if (existing.status !== "DRAFT") {
      return { error: "Could not verify the incident submission status." };
    }

    return transitionDraft(existing);
  };

  // Idempotency: if a row with this key already exists for this user,
  // transition a draft or return only an already-submitted incident.
  if (idempotencyKey) {
    const { data: existing, error: lookupError } = await supabase
      .from("incidents")
      .select("id, slug, status")
      .eq("idempotency_key", idempotencyKey)
      .eq("author_id", currentUser.userId)
      .maybeSingle();

    if (lookupError) {
      return {
        error: logServerError(
          "createIncident.lookup",
          lookupError,
          "Could not verify the incident submission. Please try again.",
        ),
      };
    }

    if (existing) {
      return existingResult(existing);
    }
  }

  const { error: insertError } = await supabase.from("incidents").insert(row);

  if (!insertError) {
    return { error: null, slug };
  }

  // A 23505 on the idempotency_key column means a concurrent request
  // may have created or saved this incident. Handle its lifecycle state.
  if (insertError.code === "23505" && idempotencyKey) {
    const { data: concurrent, error: lookupError } = await supabase
      .from("incidents")
      .select("id, slug, status")
      .eq("idempotency_key", idempotencyKey)
      .eq("author_id", currentUser.userId)
      .maybeSingle();

    if (lookupError) {
      return {
        error: logServerError(
          "createIncident.raceLookup",
          lookupError,
          "Could not verify the incident submission. Please try again.",
        ),
      };
    }

    if (concurrent) {
      return existingResult(concurrent);
    }
  }

  if (insertError.code !== "23505") {
    return {
      error: logServerError(
        "createIncident.insert",
        insertError,
        "Could not submit the incident. Please try again.",
      ),
    };
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
          : logServerError(
              "createIncident.slugRetry",
              retryError,
              "Could not submit the incident. Please try again.",
            ),
    };
  }

  return { error: null, slug: retryRow.slug };
}

export async function updateIncidentResubmit(input: unknown) {
  const payloadSchema = z.intersection(
    z.object({ id: z.string() }),
    incidentFormSchema,
  );

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
    return {
      error: logServerError(
        "updateIncidentResubmit.auth",
        currentUser.message,
        "Could not verify your sign-in. Please sign in again.",
      ),
    };
  }

  if (currentUser.roleError) {
    return {
      error: logServerError(
        "updateIncidentResubmit.role",
        currentUser.roleError,
        "Could not verify your role. Please try again.",
      ),
    };
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

  // Attempt conditional update: only allow owner to update. Published and
  // other unsupported statuses are rejected by the status IN clause below.
  const incidentUpdate = supabase.from("incidents");

  const { count: updatedCount, error: updateError } = await incidentUpdate
    .update(row, { count: "exact" })
    .eq("id", id)
    .eq("author_id", currentUser.userId)
    .in("status", ["DRAFT", "PENDING_REVIEW", "CHANGES_REQUESTED"]);

  if (updateError) {
    return {
      error: logServerError(
        "updateIncidentResubmit.update",
        updateError,
        "Could not update the incident. Please try again.",
      ),
    };
  }

  if (updatedCount === 0) {
    return {
      error:
        "Could not update the incident. It may not exist, you may not be the owner, or its status no longer allows editing.",
    };
  }

  if (updatedCount !== 1) {
    return {
      error: "The incident update did not affect exactly one report.",
    };
  }

  return { error: null };
}

// ---------------------------------------------------------------------------
// Draft lifecycle
//
//  - saveDraft: create or update a DRAFT. Incomplete data is fine — only the
//    minimum identifying fields (incidentDraftSchema) are required. This does
//    NOT submit the incident for review; the status stays DRAFT.
//  - submitDraft: validate the full report (incidentFormSchema) and transition
//    a DRAFT to PENDING_REVIEW. A failed validation does not change the
//    status.
// ---------------------------------------------------------------------------

function toDraftRow(
  incident: IncidentDraftValues,
  occurredAt: string,
  authorId: string,
): Record<string, unknown> {
  return {
    title: incident.title,
    company_name: incident.companyName,
    occurred_at: occurredAt,
    duration_minutes: incident.durationMinutes,
    severity: incident.severity,
    pattern: incident.pattern,
    summary: incident.summary,
    official_post_mortem_url: incident.officialPostMortemUrl || null,
    system: incident.system,
    technologies: incident.technologies,
    timeline: incident.timeline,
    root_cause_tree: incident.rootCauseTree,
    architecture_diff: incident.architectureDiff ?? null,
    prevention_actions: incident.preventionActions,
    author_id: authorId,
    status: "DRAFT",
  };
}

export async function saveDraft(
  input: unknown,
  incidentId?: string | null,
  idempotencyKey?: string | null,
): Promise<{
  error: string | null;
  slug?: string | null;
  incidentId?: string | null;
}> {
  const parsed = incidentDraftSchema.safeParse(input);

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
    return { error: "You must be signed in to save a draft." };
  }
  if (currentUser.kind === "error") {
    return {
      error: logServerError(
        "saveDraft.auth",
        currentUser.message,
        "Could not verify your sign-in. Please sign in again.",
      ),
    };
  }
  if (currentUser.roleError) {
    return {
      error: logServerError(
        "saveDraft.role",
        currentUser.roleError,
        "Could not verify your role. Please try again.",
      ),
    };
  }
  if (!hasAuthorAccess(currentUser)) {
    return { error: "Author access required." };
  }

  const supabase = await createClient();
  const row = toDraftRow(parsed.data, occurredAt.data, currentUser.userId);

  const updateExistingDraft = async (draftId: string) => {
    const { data: updated, error: updateError } = await supabase
      .from("incidents")
      .update(row, { count: "exact" })
      .eq("id", draftId)
      .eq("author_id", currentUser.userId)
      .eq("status", "DRAFT")
      .select("slug");

    if (updateError) {
      return {
        error: logServerError(
          "saveDraft.update",
          updateError,
          "Could not save your draft. Please try again.",
        ),
      };
    }

    if (!updated || updated.length === 0) {
      return {
        error:
          "The draft could not be updated. It may have been deleted or its status changed.",
      };
    }

    return {
      error: null,
      incidentId: draftId,
      slug: updated[0].slug ?? null,
    };
  };

  // Updating an existing draft (resume flow).
  if (incidentId) {
    const { data: incident, error: fetchError } = await supabase
      .from("incidents")
      .select("id, status, slug")
      .eq("id", incidentId)
      .eq("author_id", currentUser.userId)
      .maybeSingle();

    if (fetchError || !incident) {
      if (fetchError) {
        logServerError(
          "saveDraft.fetch",
          fetchError,
          "Could not find that draft. It may have been deleted.",
        );
      }
      return { error: "Could not find that draft. It may have been deleted." };
    }

    // Only DRAFTs are updatable through this path; a PENDING_REVIEW /
    // CHANGES_REQUESTED / PUBLISHED report must use the resubmit flow.
    if (incident.status !== "DRAFT") {
      return {
        error:
          "This report can no longer be saved as a draft. Use the edit flow instead.",
      };
    }

    return updateExistingDraft(incidentId);
  }

  if (idempotencyKey) {
    const { data: existing, error: lookupError } = await supabase
      .from("incidents")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .eq("author_id", currentUser.userId)
      .eq("status", "DRAFT")
      .maybeSingle();

    if (lookupError) {
      return {
        error: logServerError(
          "saveDraft.lookup",
          lookupError,
          "Could not find your saved draft. Please try again.",
        ),
      };
    }

    if (existing) {
      return updateExistingDraft(existing.id);
    }
  }

  // Creating a new draft.
  const slug = createSlug(parsed.data.title);
  const createRow: Record<string, unknown> = { ...row, slug };

  if (idempotencyKey) {
    createRow.idempotency_key = idempotencyKey;

    const { data: inserted, error: insertError } = await supabase
      .from("incidents")
      .insert(createRow)
      .select("id, slug")
      .single();

    if (insertError) {
      return {
        error: logServerError(
          "saveDraft.insertWithKey",
          insertError,
          "Could not save your draft. Please try again.",
        ),
      };
    }

    return {
      error: null,
      incidentId: inserted.id,
      slug: inserted.slug ?? slug,
    };
  } else {
    const { error: insertError } = await supabase
      .from("incidents")
      .insert(createRow);

    if (insertError) {
      return {
        error: logServerError(
          "saveDraft.insert",
          insertError,
          "Could not save your draft. Please try again.",
        ),
      };
    }
  }

  // The row's slug is deterministic from the title; return it so the caller
  // can link to the draft. A freshly-created draft always has this slug.
  return { error: null, incidentId: null, slug: slug };
}

export async function submitDraft(
  incidentId: string,
): Promise<{ error: string | null; slug?: string }> {
  if (!incidentId || typeof incidentId !== "string") {
    return { error: "Invalid incident ID." };
  }

  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "anonymous") {
    return { error: "You must be signed in to submit a draft." };
  }
  if (currentUser.kind === "error") {
    return {
      error: logServerError(
        "submitDraft.auth",
        currentUser.message,
        "Could not verify your sign-in. Please sign in again.",
      ),
    };
  }
  if (currentUser.roleError) {
    return {
      error: logServerError(
        "submitDraft.role",
        currentUser.roleError,
        "Could not verify your role. Please try again.",
      ),
    };
  }
  if (!hasAuthorAccess(currentUser)) {
    return { error: "Author access required." };
  }

  const supabase = await createClient();

  // Fetch the full draft, revalidate it against the *submission* schema, and
  // only then transition it. A report that fails full validation is left in
  // DRAFT so the author can keep editing.
  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("author_id", currentUser.userId)
    .eq("status", "DRAFT")
    .maybeSingle();

  if (fetchError) {
    return {
      error: logServerError(
        "submitDraft.fetch",
        fetchError,
        "Could not load the draft. Please try again.",
      ),
    };
  }

  if (!incident) {
    return {
      error: "Could not find that draft. It may have been deleted.",
    };
  }

  const submitRow = {
    title: incident.title,
    companyName: incident.company_name,
    occurredAt: incident.occurred_at,
    durationMinutes: incident.duration_minutes,
    severity: incident.severity,
    pattern: incident.pattern,
    summary: incident.summary,
    officialPostMortemUrl: incident.official_post_mortem_url ?? "",
    system: incident.system,
    technologies: (incident.technologies as unknown[]) ?? [],
    timeline: (incident.timeline as unknown[]) ?? [],
    rootCauseTree: (incident.root_cause_tree as unknown[]) ?? [],
    architectureDiff: incident.architecture_diff ?? null,
    preventionActions: (incident.prevention_actions as unknown[]) ?? [],
  };

  const validated = incidentFormSchema.safeParse(submitRow);
  if (!validated.success) {
    return {
      error:
        "This report is not complete yet: " +
        validated.error.issues
          .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
          .join("; "),
    };
  }

  // The submission must re-check the ISO timestamp for the occurredAt value.
  const occurredAt = isoDateTimeSchema.safeParse(
    validated.data.occurredAt as string,
  );
  if (!occurredAt.success) {
    return {
      error: "The incident date must be submitted as an ISO timestamp.",
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("incidents")
    .update({
      status: "PENDING_REVIEW",
      occurred_at: occurredAt.data,
    })
    .eq("id", incidentId)
    .eq("author_id", currentUser.userId)
    .eq("status", "DRAFT")
    .select("slug");

  if (updateError) {
    return {
      error: logServerError(
        "submitDraft.update",
        updateError,
        "Could not submit your draft. Please try again.",
      ),
    };
  }

  if (!updated || updated.length === 0) {
    return {
      error:
        "The draft was not submitted. It may have been deleted or its status changed.",
    };
  }

  return { error: null, slug: updated[0].slug ?? null };
}

export async function deleteIncident(
  id: string,
): Promise<{ error: string | null }> {
  const authState = await getCurrentUserState();
  if (authState.kind === "error") {
    return {
      error: logServerError(
        "deleteIncident.auth",
        authState.message,
        "Could not verify your sign-in. Please sign in again.",
      ),
    };
  }
  if (authState.kind === "anonymous") {
    return { error: "Not authenticated." };
  }

  if (authState.roleError) {
    return {
      error: logServerError(
        "deleteIncident.role",
        authState.roleError,
        "Could not verify your role. Please try again.",
      ),
    };
  }

  // Reviewers/admins must not use the author deletion flow; only plain
  // authors may delete their own reports.
  if (!hasAuthorAccess(authState)) {
    return { error: "Author access required." };
  }

  const userId = authState.userId;

  if (!id || typeof id !== "string") {
    return { error: "Invalid incident ID." };
  }

  const supabase = await createClient();
  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("id, title, status")
    .eq("id", id)
    .single()
    .then(
      (res) =>
        res as
          | {
              data: { id: string; title: string; status: string } | null;
              error: unknown;
            }
          | { data: null; error: { message: string } },
    );

  if (fetchError || !incident) {
    if (fetchError) {
      logServerError(
        "deleteIncident.fetch",
        fetchError,
        "Could not find the incident. It may have been deleted already.",
      );
    }
    return {
      error: "Could not find the incident. It may have been deleted already.",
    };
  }

  const allowedStatuses = ["DRAFT", "CHANGES_REQUESTED"] as const;
  if (
    !allowedStatuses.includes(
      incident.status as (typeof allowedStatuses)[number],
    )
  ) {
    return {
      error:
        "This incident cannot be deleted. Only incidents in DRAFT or CHANGES_REQUESTED status can be deleted.",
    };
  }

  const { data: accessCheck, error: accessError } = await supabase
    .from("incidents")
    .select("id")
    .eq("id", id)
    .eq("author_id", userId)
    .single()
    .then((res) => res as { data: { id: string } | null; error: unknown });

  if (accessError || !accessCheck) {
    if (accessError) {
      logServerError(
        "deleteIncident.accessCheck",
        accessError,
        "You do not have permission to delete this incident.",
      );
    }
    return { error: "You do not have permission to delete this incident." };
  }

  const { data: deletedRows, error: deleteError } = await supabase
    .from("incidents")
    .delete()
    .eq("id", id)
    .eq("author_id", userId)
    .in("status", allowedStatuses)
    .select("id");

  if (deleteError) {
    return {
      error: logServerError(
        "deleteIncident.delete",
        deleteError,
        "Could not delete the incident. Please try again.",
      ),
    };
  }

  if (!deletedRows?.length) {
    return {
      error:
        "Could not delete the incident. It may have already been deleted or is no longer eligible for deletion.",
    };
  }

  return { error: null };
}
