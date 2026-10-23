"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPublishedIncidents } from "@/features/incidents/server/actions";
import type { PublishedIncident } from "@/features/incidents/server/queries";
import PublicIncidentDetail from "@/features/incidents/components/PublicIncidentDetail";

export default function IncidentArchive() {
  const [incidents, setIncidents] = useState<PublishedIncident[] | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    fetchPublishedIncidents()
      .then((result) => {
        if (!isCurrent) return;
        setIncidents(result.incidents);
        setError(result.error);
      })
      .catch((fetchError: unknown) => {
        if (!isCurrent) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "An unexpected error occurred while loading the archive.",
        );
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const selectedIncident =
    incidents?.find((incident) => incident.id === selectedIncidentId) ??
    incidents?.[0] ??
    null;
  const relatedIncidents = selectedIncident
    ? (incidents ?? []).filter((incident) => incident.id !== selectedIncident.id)
    : [];

  return (
    <main className="home-page relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] px-5 py-10 text-slate-100 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto max-w-5xl">
        {!selectedIncident && <h1 className="sr-only">Published incidents</h1>}

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200"
          >
            <p className="font-semibold">Unable to load the incident archive.</p>
            <p className="mt-2 break-words text-rose-200/80">{error}</p>
          </div>
        ) : incidents === null ? (
          <p role="status" className="py-12 text-center text-sm text-slate-400">
            Loading published incidents...
          </p>
        ) : incidents.length === 0 ? (
          <section className="relative isolate overflow-hidden border-y border-dashed border-slate-700/80 px-5 py-14 text-center sm:py-20">
            <div aria-hidden="true" className="home-grid opacity-40" />
            <div className="relative mx-auto max-w-xl">
              <p className="home-kicker justify-center">
                <span className="home-kicker-mark" aria-hidden="true" />
                The public archive
              </p>
              <h2 className="mt-5 font-normal tracking-tight text-[#f1f1e9] [font-family:Georgia,'Times_New_Roman',serif] text-3xl sm:text-4xl">
                No incidents published <em className="text-[#c6e47c]">yet.</em>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                Reviewed incident reports will appear here as the archive grows.
                Have a postmortem to share? Start the first report.
              </p>
              <Link
                href="/incidents/new"
                className="home-primary-action mt-7 inline-flex min-h-11 items-center justify-center gap-3 rounded-none px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
              >
                Submit an incident <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </section>
        ) : selectedIncident ? (
          <PublicIncidentDetail
            incident={selectedIncident}
            related={relatedIncidents}
            onSelect={setSelectedIncidentId}
          />
        ) : null}
      </div>
    </main>
  );
}
