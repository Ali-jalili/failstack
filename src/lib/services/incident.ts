/** @format */

"use server";

import { createClient } from "@/lib/supabase/server";
import { incidentSchema } from "@/lib/validation/incident";
import { Incident } from "@/types/incident";

export async function saveIncidentAction(data: Incident) {
  // 1. Double check validation on server-side
  const validationResult = incidentSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.issues.map((i) => i.message),
    };
  }

  const validData = validationResult.data;
  const supabase = await createClient();

  // 2. Insert into Supabase
  const { error } = await supabase.from("incidents").insert({
    slug: validData.slug,
    title: validData.title,
    company_name: validData.companyName,
    occurred_at: validData.occurredAt,
    duration_minutes: validData.durationMinutes,
    severity: validData.severity,
    pattern: validData.pattern,
    summary: validData.summary,
    official_post_mortem_url: validData.officialPostMortemUrl,
    system: validData.system,
    technologies: validData.technologies,
    timeline: validData.timeline,
    root_cause_tree: validData.rootCauseTree,
    architecture_diff: validData.architectureDiff,
    prevention_actions: validData.preventionActions,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return { success: false, errors: [error.message] };
  }

  return { success: true };
}
