/** @format */

"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserState,
  hasReviewerAccess,
} from "@/features/auth/server/current-user";

const reviewSchema = z.discriminatedUnion("action", [
  z.object({
    incidentId: z.string().uuid(),
    action: z.literal("APPROVED"),
  }),
  z.object({
    incidentId: z.string().uuid(),
    action: z.literal("CHANGES_REQUESTED"),
    reason: z.string().trim().min(1, "Reason is required"),
  }),
]);

export async function reviewIncident(input: unknown) {
  const parsed = reviewSchema.safeParse(input);

  if (!parsed.success) {
    const reasonIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "reason",
    );

    return {
      error: reasonIssue?.message ?? "Invalid review request. Please try again.",
    };
  }

  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "anonymous") {
    return { error: "You must be signed in." };
  }

  if (currentUser.kind === "error") {
    return { error: "Could not verify your sign-in. Please sign in again." };
  }

  if (currentUser.roleError) {
    return {
      error: "Could not verify reviewer access. Please refresh and try again.",
    };
  }

  if (!hasReviewerAccess(currentUser)) {
    return { error: "Reviewer access required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("review_incident", {
    p_incident_id: parsed.data.incidentId,
    p_action: parsed.data.action,
    p_reason:
      parsed.data.action === "CHANGES_REQUESTED" ? parsed.data.reason : null,
  });

  if (error) {
    return {
      error:
        "Could not save this decision. The incident may have already been reviewed. Refresh the queue and try again.",
    };
  }

  return { error: null };
}
