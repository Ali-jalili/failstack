/** @format */

"use server";

import {
  getCurrentUserState,
  hasAuthorAccess,
} from "@/features/auth/server/current-user";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * QA-015 — Duplicate-title check.
 *
 * Duplicate titles are allowed by product decision; this action only backs a
 * non-blocking advisory warning in the incident form. It is deliberately
 * scoped to `PUBLISHED` incidents, the same visibility boundary used by the
 * public archive (`getPublishedIncidentSummaries`), so no private, draft, or
 * pending-review data is ever read or returned.
 *
 * The result is optional: a query failure (or a non-author session) yields
 * `checked: false` so the client never blocks submission on this check.
 */

const inputSchema = z.object({
  title: z.string().min(5),
  // Edit mode excludes the incident being edited from the comparison.
  incidentId: z.string().min(1).optional(),
});

export type CheckDuplicateTitleResult =
  | { checked: false }
  | { checked: true; duplicate: boolean };

function normalizeTitleForComparison(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function checkDuplicateTitle(
  input: unknown,
): Promise<CheckDuplicateTitleResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { checked: false };
  }

  const currentUser = await getCurrentUserState();
  if (currentUser.kind !== "authenticated") {
    return { checked: false };
  }
  if (currentUser.roleError) {
    return { checked: false };
  }
  // The form is only reachable with author access, but re-check here so the
  // action can never be called by a reviewer.
  if (!hasAuthorAccess(currentUser)) {
    return { checked: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("id, title")
    .eq("status", "PUBLISHED")
    .limit(500);

  if (error || data === null || data === undefined) {
    return { checked: false };
  }

  const target = normalizeTitleForComparison(parsed.data.title);
  const duplicate = data.some((row) => {
    if (parsed.data.incidentId && row.id === parsed.data.incidentId) {
      return false;
    }
    return normalizeTitleForComparison(String(row.title)) === target;
  });

  return { checked: true, duplicate };
}
