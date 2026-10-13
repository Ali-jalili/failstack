"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchMyReports,
  fetchPublishedIncidents,
} from "@/app/actions/incident-archive";
import type {
  MyReport,
  PublishedIncident,
} from "@/lib/services/incident-archive";

const severityStyles: Record<string, string> = {
  CRITICAL: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  MAJOR: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  MINOR: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function IncidentArchive({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [incidents, setIncidents] = useState<PublishedIncident[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myReports, setMyReports] = useState<MyReport[] | null>(null);
  const [myReportsError, setMyReportsError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated) return;

    let isCurrent = true;

    fetchMyReports()
      .then((result) => {
        if (!isCurrent) return;
        if (result.kind === "anonymous") {
          setMyReportsError(
            "Your sign-in could not be verified. Refresh and try again.",
          );
          return;
        }
        if (result.kind === "error") {
          setMyReportsError(result.message);
          return;
        }

        setMyReports(result.reports);
      })
      .catch((fetchError: unknown) => {
        if (!isCurrent) return;
        setMyReportsError(
          fetchError instanceof Error
            ? fetchError.message
            : "An unexpected error occurred while loading your reports.",
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated]);

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-6 py-14 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">
              Incident archive
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Published Incidents
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Explore documented production incidents, their impact, and the
              systems involved.
            </p>
          </div>
          <Link
            href="/incidents/new"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Submit an Incident
          </Link>
        </header>

        {isAuthenticated && (
          <section
            aria-labelledby="my-reports-heading"
            className="mb-12 border-b border-slate-800 pb-10"
          >
            <div className="mb-5">
              <h2
                id="my-reports-heading"
                className="text-xl font-semibold text-white"
              >
                My Reports
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Track the review status of incidents you submitted.
              </p>
            </div>

            {myReportsError ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200"
              >
                <p className="font-semibold">Unable to load your reports.</p>
                <p className="mt-2 break-words text-rose-200/80">
                  {myReportsError}
                </p>
              </div>
            ) : myReports === null ? (
              <p role="status" className="py-6 text-sm text-slate-400">
                Loading your reports...
              </p>
            ) : myReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-5 py-8">
                <p className="text-sm text-slate-300">
                  You haven&apos;t submitted any incident reports yet.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/30">
                {myReports.map((report) => (
                  <li key={report.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-slate-100">
                          {report.title}
                        </h3>
                        <time
                          dateTime={report.created_at}
                          className="mt-1 block text-xs text-slate-500"
                        >
                          Submitted {formatCreatedAt(report.created_at)}
                        </time>
                      </div>
                      <span className="rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-slate-300">
                        {formatStatus(report.status)}
                      </span>
                    </div>
                    {report.status === "CHANGES_REQUESTED" &&
                      report.latest_review_reason && (
                        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                          <p className="text-xs font-medium text-amber-200">
                            Reviewer feedback
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-300">
                            {report.latest_review_reason}
                          </p>
                        </div>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

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
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-slate-200">
              No published incidents yet
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Published incidents will appear here.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {incidents.map((incident) => (
              <li
                key={incident.id}
                className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase ${
                      severityStyles[incident.severity] ??
                      "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                  >
                    {incident.severity}
                  </span>
                  <time
                    dateTime={incident.occurred_at}
                    className="text-xs text-slate-500"
                  >
                    {new Date(incident.occurred_at).toLocaleDateString("en", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                </div>

                <h2 className="mt-4 text-lg font-semibold leading-snug text-white">
                  {incident.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {incident.company_name} · {incident.system}
                </p>
                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">
                  {incident.summary}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
                  <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300">
                    {formatLabel(incident.pattern)}
                  </span>
                  <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300">
                    {incident.duration_minutes} min
                  </span>
                  {incident.technologies.slice(0, 3).map((technology) => (
                    <span
                      key={technology}
                      className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400"
                    >
                      {technology}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
