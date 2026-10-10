"use server";

import { getPublishedIncidents } from "@/lib/services/incident-archive";

export async function fetchPublishedIncidents() {
  return getPublishedIncidents();
}
