/** @format */

import IncidentArchive from "@/features/incidents/components/IncidentArchive";
import { getCurrentUserState } from "@/features/auth/server/current-user";

export default async function IncidentsPage() {
  const userState = await getCurrentUserState();
  const isAuthenticated = userState.kind === "authenticated";

  return <IncidentArchive isAuthenticated={isAuthenticated} />;
}
