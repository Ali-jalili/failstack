/** @format */

import { redirect } from "next/navigation";
import MyReportsList from "@/features/incidents/components/MyReportsList";
import { getMyReports } from "@/features/incidents/server/queries";
import { getCurrentUserState } from "@/features/auth/server/current-user";

export default async function MyIncidentsPage() {
  const currentUser = await getCurrentUserState();

  if (currentUser.kind === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/my-incidents")}`);
  }

  if (currentUser.kind === "authenticated" && currentUser.roleError) {
    throw new Error(`Unable to verify account role: ${currentUser.roleError}`);
  }

  if (currentUser.kind === "authenticated" && currentUser.reviewRole !== null) {
    redirect("/review/incidents");
  }

  const result = await getMyReports();

  if (result.kind === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/my-incidents")}`);
  }

  if (result.kind === "forbidden") {
    redirect("/review/incidents");
  }

  return (
    <main className="home-page relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] text-slate-100">
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <MyReportsList
          reports={result.kind === "success" ? result.reports : null}
          error={result.kind === "error" ? result.message : null}
        />
      </div>
    </main>
  );
}
