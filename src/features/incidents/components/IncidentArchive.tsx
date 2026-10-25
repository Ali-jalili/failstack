"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import type { IncidentSeverity } from "@/types/incident";
import type { PublishedIncidentSummary } from "@/features/incidents/server/queries";

type SeverityFilter = "ALL" | IncidentSeverity;

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

export default function IncidentArchive({
  incidents,
  error,
}: {
  incidents: PublishedIncidentSummary[] | null;
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<SeverityFilter>("ALL");

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
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search incidents, systems, technologies..."
                />
              </label>
              <label className="incident-archive-severity-filter">
                <span>Severity</span>
                <select
                  value={severity}
                  onChange={(event) =>
                    setSeverity(event.target.value as SeverityFilter)
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
              <ul className="incident-archive-grid" aria-label="Published incidents">
                {filteredIncidents.map((incident, index) => (
                  <li key={incident.id}>
                    <Link
                      href={`/incidents/report/${incident.slug}`}
                      className="incident-archive-card"
                      style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
                    >
                      <div className="incident-archive-card-top">
                        <span
                          className={`incident-archive-severity ${severityClass[incident.severity]}`}
                        >
                          {incident.severity}
                        </span>
                        <span>{formatDate(incident.occurred_at)}</span>
                      </div>
                      <h2>{incident.title}</h2>
                      <p className="incident-archive-summary">
                        {incident.summary}
                      </p>
                      <div className="incident-archive-tags">
                        <span className="incident-archive-tag is-system">
                          {incident.system}
                        </span>
                        {incident.technologies.slice(0, 2).map((technology) => (
                          <span className="incident-archive-tag" key={technology}>
                            {technology}
                          </span>
                        ))}
                      </div>
                      <div className="incident-archive-card-bottom">
                        <span>
                          {formatLabel(incident.pattern)}
                          <span aria-hidden="true"> · </span>
                          {formatDuration(incident.duration_minutes)}
                        </span>
                        <span className="incident-archive-open">
                          Read report <ArrowUpRight aria-hidden="true" size={14} />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
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
