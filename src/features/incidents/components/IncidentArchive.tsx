"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { IncidentSeverity } from "@/types/incident";
import type { PublishedIncidentSummary } from "@/features/incidents/server/queries";

type SeverityFilter = "ALL" | IncidentSeverity;
const PAGE_SIZE = 10;

const severityClass: Record<IncidentSeverity, string> = {
  CRITICAL: "is-critical",
  MAJOR: "is-major",
  MINOR: "is-minor",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTimelineTime(occurredAt: string, offsetMinutes: number) {
  return new Date(
    new Date(occurredAt).getTime() + offsetMinutes * 60_000,
  ).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function timelinePosition(
  offsetMinutes: number,
  preview: PublishedIncidentSummary["timelinePreview"],
) {
  const firstOffset = preview[0]?.timestampOffsetMinutes ?? 0;
  const lastOffset = preview[preview.length - 1]?.timestampOffsetMinutes ?? firstOffset;
  const span = lastOffset - firstOffset;
  if (span <= 0) return 50;
  return Math.min(100, Math.max(0, ((offsetMinutes - firstOffset) / span) * 100));
}

export default function IncidentArchive({
  incidents,
  error,
}: {
  incidents: PublishedIncidentSummary[] | null;
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("ALL");
  const [page, setPage] = useState(1);

  const filteredIncidents = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return (incidents ?? []).filter((incident) => {
      const matchesSeverity = severity === "ALL" || incident.severity === severity;
      const searchable = [
        incident.title,
        incident.summary,
        incident.system,
        incident.company_name,
        incident.pattern,
        ...incident.technologies,
      ]
        .join(" ")
        .toLocaleLowerCase();

      return matchesSeverity && (!search || searchable.includes(search));
    });
  }, [incidents, query, severity]);

  const pageCount = Math.ceil(filteredIncidents.length / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleIncidents = filteredIncidents.slice(pageStart, pageStart + PAGE_SIZE);

  function goToPage(nextPage: number) {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      document.getElementById("incident-ledger")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    });
  }

  return (
    <main className="home-page incident-archive-page relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] px-5 py-10 text-slate-100 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div aria-hidden="true" className="home-grid" />
      <div className="incident-archive-shell relative mx-auto max-w-5xl">
        <header className="incident-archive-heading">
          <p className="home-kicker">
            <span className="home-kicker-mark" aria-hidden="true" />
            Public archive
          </p>
          <h1>Incident archive</h1>
          <p className="incident-archive-intro">
            Reviewed incident reports, system failures, and the lessons teams
            recorded for others.
          </p>
          {incidents && (
            <p className="incident-archive-total" aria-live="polite">
              <span>{filteredIncidents.length}</span>
              {filteredIncidents.length === 1 ? " report" : " reports"}
              {query || severity !== "ALL" ? " found" : " published"}
            </p>
          )}
        </header>

        {error ? (
          <div className="incident-archive-state is-error" role="alert">
            <strong>Unable to load the public archive.</strong>
            <p>{error}</p>
          </div>
        ) : incidents === null ? (
          <p className="incident-archive-state" role="status">
            Loading published incidents...
          </p>
        ) : incidents.length === 0 ? (
          <div className="incident-archive-state">
            <h2>No incidents published yet.</h2>
            <p>Reviewed reports will appear here when they are published.</p>
          </div>
        ) : (
          <>
            <section className="incident-archive-controls" aria-label="Filter incidents">
              <label className="incident-archive-search">
                <Search aria-hidden="true" size={16} />
                <span className="sr-only">Search incidents</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search incidents, systems, technologies..."
                />
              </label>
              <label className="incident-archive-severity-filter">
                <span>Severity</span>
                <select
                  value={severity}
                  onChange={(event) =>
                    {
                      setSeverity(event.target.value as SeverityFilter);
                      setPage(1);
                    }
                  }
                >
                  <option value="ALL">All levels</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="MAJOR">Major</option>
                  <option value="MINOR">Minor</option>
                </select>
              </label>
            </section>

            {filteredIncidents.length ? (
              <>
              <ol
                className="incident-ledger"
                id="incident-ledger"
                aria-label="Published incidents"
              >
                {visibleIncidents.map((incident, index) => (
                  <li className="incident-ledger-item" key={incident.id}>
                    <div className="incident-ledger-rail" aria-hidden="true">
                      <span className="incident-ledger-index">
                        {String(pageStart + index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`incident-ledger-marker ${severityClass[incident.severity]}`}
                      />
                    </div>
                    <Link
                      href={`/incidents/report/${incident.slug}`}
                      className="incident-dossier"
                      style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
                    >
                      <div className="incident-dossier-topline">
                        <span
                          className={`incident-archive-severity ${severityClass[incident.severity]}`}
                        >
                          {incident.severity}
                        </span>
                        <time dateTime={incident.occurred_at}>
                          {formatDate(incident.occurred_at)}
                        </time>
                        <span className="incident-dossier-system">
                          {incident.system}
                        </span>
                        <ArrowUpRight
                          className="incident-dossier-arrow"
                          aria-hidden="true"
                          size={15}
                        />
                      </div>
                      <h2>{incident.title}</h2>
                      <p className="incident-archive-summary">
                        {incident.summary}
                      </p>
                      <div className="incident-dossier-stats">
                        <span>{formatLabel(incident.pattern)}</span>
                        <span>{formatDuration(incident.duration_minutes)}</span>
                        <span>{incident.timelineCount} events</span>
                      </div>
                      {incident.timelinePreview.length ? (
                        <div className="incident-trace">
                          <div className="incident-trace-axis" aria-hidden="true">
                            <span className="incident-trace-line" />
                            {incident.timelinePreview.map((event, eventIndex) => (
                              <span
                                className={`incident-trace-marker stage-${event.stage.toLowerCase()}`}
                                aria-hidden="true"
                                key={`${event.stage}-${event.timestampOffsetMinutes}-${eventIndex}`}
                                style={{
                                  left: `${timelinePosition(event.timestampOffsetMinutes, incident.timelinePreview)}%`,
                                }}
                                title={`${event.title} · ${formatLabel(event.stage)} · ${formatTimelineTime(incident.occurred_at, event.timestampOffsetMinutes)}`}
                              />
                            ))}
                          </div>
                          <ol
                            className="incident-trace-events"
                            aria-label={`${incident.timelineCount} recorded events; showing selected checkpoints`}
                            style={{
                              gridTemplateColumns: `repeat(${incident.timelinePreview.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {incident.timelinePreview.map((event, eventIndex) => (
                              <li
                                className={`incident-trace-event stage-${event.stage.toLowerCase()}`}
                                key={`${event.stage}-${event.timestampOffsetMinutes}-${eventIndex}`}
                                aria-label={`${event.title}, ${formatLabel(event.stage)}, ${formatTimelineTime(incident.occurred_at, event.timestampOffsetMinutes)}`}
                              >
                                <span className="incident-trace-event-copy">
                                  <span>{formatLabel(event.stage)}</span>
                                  <time>
                                    {formatTimelineTime(
                                      incident.occurred_at,
                                      event.timestampOffsetMinutes,
                                    )}
                                  </time>
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <p className="incident-mini-empty">
                          No timeline was recorded for this incident.
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
              {pageCount > 1 && (
                <nav className="incident-archive-pagination" aria-label="Incident archive pages">
                  <p>
                    Showing {pageStart + 1}–
                    {Math.min(pageStart + PAGE_SIZE, filteredIncidents.length)} of{" "}
                    {filteredIncidents.length}
                  </p>
                  <div>
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => goToPage(Math.max(1, page - 1))}
                    >
                      Previous
                    </button>
                    <span aria-live="polite">
                      Page {page} of {pageCount}
                    </span>
                    <button
                      type="button"
                      disabled={page === pageCount}
                      onClick={() => goToPage(Math.min(pageCount, page + 1))}
                    >
                      Next
                    </button>
                  </div>
                </nav>
              )}
              </>
            ) : (
              <div className="incident-archive-state">
                <h2>No matching incidents</h2>
                <p>Try a different search or severity filter.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
