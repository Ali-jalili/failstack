"use server";

export async function createIncident(input: unknown) {
  const { createIncident } = await import("@/features/incidents/server/actions");
  return createIncident(input);
}

export async function updateIncidentResubmit(input: unknown) {
  const { updateIncidentResubmit } = await import("@/features/incidents/server/actions");
  return updateIncidentResubmit(input);
}
