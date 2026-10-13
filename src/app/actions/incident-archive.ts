"use server";

import {
  getMyReports,
  getPublishedIncidents,
} from "@/lib/services/incident-archive";

export async function fetchPublishedIncidents() {
  return getPublishedIncidents();
}

export async function fetchMyReports() {
  return getMyReports();
}
