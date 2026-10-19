/** @format */

import { redirect } from "next/navigation";
import MyReportsList from "@/features/incidents/components/MyReportsList";
import { getMyReports } from "@/features/incidents/server/queries";

export default async function MyIncidentsPage() {
  const result = await getMyReports();

  if (result.kind === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/my-incidents")}`);
  }

  return (
    <main className="home-page relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] text-slate-100">
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[58rem]">
          <header className="mb-10 sm:mb-12">
            <p className="home-kicker">
              <span aria-hidden="true" className="home-kicker-mark" />
              Author workspace
            </p>
            <h1 className="mt-6 text-[clamp(2.6rem,6vw,4.2rem)] font-normal leading-[0.98] tracking-[-0.06em] text-[#f1f1e9] [font-family:Georgia,'Times_New_Roman',serif]">
              My <em className="text-[#c6e47c]">reports.</em>
            </h1>
            <p className="mt-5 max-w-xl text-[13px] leading-[1.75] text-slate-400 sm:text-sm">
              Follow each incident from submission through review and publication.
            </p>
          </header>

          <MyReportsList
            reports={result.kind === "success" ? result.reports : null}
            error={result.kind === "error" ? result.message : null}
          />
        </div>
      </div>
    </main>
  );
}
