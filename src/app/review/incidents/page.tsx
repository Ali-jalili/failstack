/** @format */

import { notFound, redirect } from "next/navigation";
import IncidentReviewQueue from "@/features/review/components/IncidentReviewQueue";
import { getIncidentReviewQueue } from "@/features/review/server/queries";
import { getCurrentUserState } from "@/features/auth/server/current-user";

export default async function ReviewIncidentsPage() {
  const result = await getIncidentReviewQueue();

  if (result.kind === "unauthenticated") {
    redirect(`/login?next=${encodeURIComponent("/review/incidents")}`);
  }

  if (result.kind === "forbidden") {
    const currentUser = await getCurrentUserState();
    if (currentUser.kind === "authenticated" && currentUser.reviewRole === null) {
      redirect("/my-incidents");
    }
    notFound();
  }

  return (
    <main className="home-page relative isolate min-h-[calc(100dvh-68px)] overflow-x-clip bg-[#080d16] px-5 py-9 text-slate-100 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto max-w-[1240px]">
        <header className="mb-8 grid gap-6 border-b border-slate-800/80 pb-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
          <div>
            <p className="home-kicker">
              <span aria-hidden="true" className="home-kicker-mark" />
              Reviewer workspace / Intake
            </p>
            <h1 className="mt-4 text-[clamp(2.65rem,5vw,4.4rem)] font-normal leading-[0.96] tracking-[-0.06em] text-[#f1f1e9] [font-family:Georgia,'Times_New_Roman',serif]">
              Incident <em className="text-[#c6e47c]">review.</em>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Assess each submission against its timeline, failure analysis,
              and remediation record. The oldest reports appear first.
            </p>
          </div>
          {result.kind === "success" && (
            <div className="flex items-end gap-4 border-l border-slate-800 pl-4 md:min-w-40 md:pb-1 md:pl-6">
              <p className="font-mono text-[9px] uppercase leading-5 tracking-[0.12em] text-slate-500">
                Awaiting
                <br />
                decision
              </p>
              <p className="font-mono text-3xl tabular-nums leading-none text-[#c6e47c]">
                {result.incidents.length}
              </p>
            </div>
          )}
        </header>

        {result.kind === "error" ? (
          <div
            role="alert"
            className="border-y border-rose-500/30 bg-rose-500/[0.06] px-4 py-5 text-sm text-rose-200 sm:px-5"
          >
            <p className="font-semibold">
              Unable to load the reviewer workspace.
            </p>
            <p className="mt-2 break-words text-rose-200/80">
              {result.message}
            </p>
          </div>
        ) : (
          <IncidentReviewQueue incidents={result.incidents} />
        )}
      </div>
    </main>
  );
}
