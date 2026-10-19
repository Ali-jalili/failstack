/** @format */

import { notFound, redirect } from "next/navigation";
import IncidentForm from "@/features/incidents/components/IncidentForm";
import {
  getCurrentUserState,
  hasAuthorAccess,
} from "@/features/auth/server/current-user";

export default async function NewIncidents() {
  const userState = await getCurrentUserState();

  if (userState.kind === "error") {
    throw new Error(`Unable to verify sign-in: ${userState.message}`);
  }

  if (userState.kind === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/incidents/new")}`);
  }

  if (userState.kind === "authenticated" && userState.roleError) {
    throw new Error(`Unable to verify account role: ${userState.roleError}`);
  }

  if (!hasAuthorAccess(userState)) {
    notFound();
  }

  return <IncidentForm />;
}
