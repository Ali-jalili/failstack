/** @format */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Inbox } from "lucide-react";
import { IncidentReviewDetail } from "@/features/review/components/incident-review-detail";
import { getReviewIncidentDetail } from "@/features/review/server/queries";
import { getCurrentUserState } from "@/features/auth/server/current-user";

type Props = { params: Promise<{ incidentId: string }> };

export default async function ReviewIncidentDetailPage({ params }: Props) {
  const { incidentId } = await params;

  const result = await getReviewIncidentDetail(incidentId);

  if (result.kind === "unauthenticated") {
    redirect(
      `/login?next=${encodeURIComponent(`/review/incidents/${incidentId}`)}`,
    );
  }

  if (result.kind === "forbidden") {
    const currentUser = await getCurrentUserState();
    if (
      currentUser.kind === "authenticated" &&
      currentUser.reviewRole === null
    ) {
      redirect("/my-incidents");
    }
    // No session, or role lookup error: do not leak existence; 404.
    notFound();
  }

  if (result.kind === "error") {
    return (
      <main className="home-page review-detail-page relative isolate min-h-[calc(100dvh-68px)] overflow-x-clip bg-[#080d16] px-5 py-9 text-slate-100 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div aria-hidden="true" className="home-grid" />
        <div className="relative mx-auto w-full max-w-[1240px]">
          <div
            role="alert"
            className="border-y border-rose-500/30 bg-rose-500/[0.06] px-4 py-5 text-sm text-rose-200 sm:px-5"
          >
            <p className="font-semibold">Unable to load this incident.</p>
            <p className="mt-2 break-words text-rose-200/80">
              {result.message}
            </p>
            <Link
              href="/review/incidents"
              className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-medium text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
            >
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              Return to the review queue
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // `success` but the incident is not in the pending queue: it has already
  // been decided (or the id is invalid). Do NOT surface this as a generic
  // 404 — show a friendly explanatory state with a link back to the queue.
  if (!result.incident) {
    return (
      <main className="home-page review-detail-page relative isolate min-h-[calc(100dvh-68px)] overflow-x-clip bg-[#080d16] px-5 py-9 text-slate-100 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div aria-hidden="true" className="home-grid" />
        <div className="relative mx-auto w-full max-w-[1240px]">
          <div className="border-y border-slate-800/80 px-4 py-14 text-center sm:px-8 sm:py-20">
            <Inbox
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-slate-600"
            />
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#c6e47c]">
              No longer awaiting review
            </p>
            <h1 className="mt-3 text-2xl font-normal tracking-tight text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif] sm:text-3xl">
              This report is not in the pending queue.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              It may have already been approved, returned for changes, or the
              link is out of date. The review queue always shows the reports
              still waiting on a decision.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/review/incidents"
                className="inline-flex min-h-11 items-center gap-2 bg-[#c6e47c] px-5 text-sm font-semibold text-[#11150a] transition-colors hover:bg-[#d5ee96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back to the review queue
              </Link>
              {result.incidents.length > 0 && (
                <Link
                  href={`/review/incidents/${result.incidents[0].id}`}
                  className="inline-flex min-h-11 items-center gap-2 border border-slate-700 px-5 text-sm font-medium text-slate-200 transition-colors hover:border-[#c6e47c]/60 hover:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
                >
                  Open the first pending report
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const position =
    result.incidents.findIndex((i) => i.id === result.incident!.id) + 1;

  return (
    <main className="home-page review-detail-page relative isolate min-h-[calc(100dvh-68px)] overflow-x-clip bg-[#080d16] px-5 py-9 text-slate-100 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto w-full max-w-[1240px]">
        <header className="mb-8 grid gap-6 border-b border-slate-800/80 pb-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
          <div>
            <p className="home-kicker">
              <span aria-hidden="true" className="home-kicker-mark" />
              Reviewer workspace / Intake
            </p>
            <h1 className="mt-4 text-[clamp(2.65rem,5vw,4.4rem)] font-normal leading-[0.96] tracking-[-0.06em] text-[#f1f1e9] [font-family:Georgia,'Times_New_Roman',serif]">
              Incident <em className="text-[#c6e47c]">review.</em>
            </h1>
          </div>
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
        </header>

        {/* Prev / Next + back-to-queue bar, driven by the server-computed
            queue order (created_at ascending). */}
        <nav
          aria-label="Queue navigation"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4"
        >
          <Link
            href="/review/incidents"
            className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Back to queue
          </Link>

          <div className="flex items-center gap-2">
            {result.previousId ? (
              <Link
                href={`/review/incidents/${result.previousId}`}
                className="inline-flex min-h-10 items-center gap-2 border border-slate-700 px-4 text-xs font-medium text-slate-300 transition-colors hover:border-[#c6e47c]/60 hover:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
              >
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 border border-slate-800 px-4 text-xs font-medium text-slate-600">
                <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                First report
              </span>
            )}
            {result.nextId ? (
              <Link
                href={`/review/incidents/${result.nextId}`}
                className="inline-flex min-h-10 items-center gap-2 border border-slate-700 px-4 text-xs font-medium text-slate-300 transition-colors hover:border-[#c6e47c]/60 hover:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
              >
                Next
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 border border-slate-800 px-4 text-xs font-medium text-slate-600">
                Last report
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </nav>

        <IncidentReviewDetail
          incident={result.incident}
          nextIncidentId={result.nextId}
          position={position}
          totalPending={result.incidents.length}
        />
      </div>
    </main>
  );
}
