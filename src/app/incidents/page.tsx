/** @format */

import IncidentArchive from "./components/IncidentArchive";
import { getCurrentUserState } from "@/lib/services/current-user";

export default async function IncidentsPage() {
  const userState = await getCurrentUserState();
  const isAuthenticated = userState.kind === "authenticated";

  return <IncidentArchive isAuthenticated={isAuthenticated} />;
}
