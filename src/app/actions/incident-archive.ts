"use server";

export async function fetchMyReports() {
  const { getMyReports } = await import("@/features/incidents/server/queries");
  return getMyReports();
}

export async function fetchPublishedIncidents() {
  const { getPublishedIncidents } = await import("@/features/incidents/server/queries");
  return getPublishedIncidents();
}
