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
    if (
      currentUser.kind === "authenticated" &&
      currentUser.reviewRole === null
    ) {
      redirect("/my-incidents");
    }
    notFound();
  }

  return (
    <main className="home-page review-queue-page relative isolate min-h-[calc(100dvh-68px)] overflow-x-clip bg-[#080d16] px-5 py-7 text-slate-100 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto w-full max-w-310">
        <header className="relative mb-5 border-b border-slate-800/60 pb-5 sm:pb-6">
          {/* Top-right label */}
          <p
            aria-hidden="true"
            className="absolute right-0 top-1 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 sm:block"
          >
            Review Workspace
          </p>

          <div>
            <h1 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-normal leading-[0.96] tracking-tighter text-[#f1f1e9] font-[Georgia,'Times_New_Roman',serif]">
              Incident <em className="not-italic text-[#a3e635]">Review</em>
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-400">
              Review reported incidents, validate the analysis, and make a
              decision.
            </p>
          </div>
        </header>

        {result.kind === "error" ? (
          <div
            role="alert"
            className="border-y border-rose-500/30 bg-rose-500/6 px-4 py-5 text-sm text-rose-200 sm:px-5"
          >
            <p className="font-semibold">
              Unable to load the reviewer workspace.
            </p>
            <p className="mt-2 wrap-break-word text-rose-200/80">
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
