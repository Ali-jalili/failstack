/** @format */

import IncidentArchive from "@/features/incidents/components/IncidentArchive";
import { getPublishedIncidentSummaries } from "@/features/incidents/server/queries";

export default async function IncidentsPage() {
  const { incidents, error } = await getPublishedIncidentSummaries();
  return <IncidentArchive incidents={incidents} error={error} />;
}
