/** @format */

import { notFound, redirect } from "next/navigation";
import IncidentReviewQueue from "@/features/review/components/IncidentReviewQueue";
import { getIncidentReviewQueue } from "@/features/review/server/queries";

export default async function ReviewIncidentsPage() {
  const result = await getIncidentReviewQueue();

  if (result.kind === "unauthenticated") {
    redirect(`/login?next=${encodeURIComponent("/review/incidents")}`);
  }

  if (result.kind === "forbidden") {
    notFound();
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">
            Reviewer workspace
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Incident review queue
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Review submitted incident reports before they are considered for
            public release.
          </p>
        </header>

        {result.kind === "error" ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200"
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
