"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, Layers2, Search } from "lucide-react";
import type { IncidentSeverity } from "@/types/incident";
import type { PublishedIncidentSummary } from "@/features/incidents/server/queries";

type SeverityFilter = "ALL" | IncidentSeverity;
type RadarSize = { width: number; height: number };
const RADAR_SWEEP_SECONDS = 5;

const radarBlips = [
  { angle: 18, radius: 0.78 },
  { angle: 47, radius: 0.62 },
  { angle: 76, radius: 0.86 },
  { angle: 112, radius: 0.7 },
  { angle: 139, radius: 0.92 },
  { angle: 167, radius: 0.58 },
  { angle: 202, radius: 0.82 },
  { angle: 229, radius: 0.67 },
  { angle: 258, radius: 0.9 },
  { angle: 291, radius: 0.73 },
  { angle: 323, radius: 0.88 },
  { angle: 345, radius: 0.6 },
];

const severityClass: Record<IncidentSeverity, string> = {
  CRITICAL: "is-critical",
  MAJOR: "is-major",
  MINOR: "is-minor",
};

const severityOptions: { value: SeverityFilter; label: string }[] = [
  { value: "ALL", label: "All severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "MAJOR", label: "Major" },
  { value: "MINOR", label: "Minor" },
];

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

function IncidentRow({
  incident,
  active,
  onFocus,
  onRowElement,
}: {
  incident: PublishedIncidentSummary;
  active: boolean;
  onFocus: (id: string) => void;
  onRowElement: (id: string, element: HTMLLIElement | null) => void;
}) {
  return (
    <li
      className={`archive-incident-row ${severityClass[incident.severity]}${active ? " is-active" : ""}`}
      data-incident-id={incident.id}
      ref={(element) => onRowElement(incident.id, element)}
    >
      <Link
        href={`/incidents/report/${incident.slug}`}
        className="archive-incident-link"
        onFocus={() => onFocus(incident.id)}
        onMouseEnter={() => onFocus(incident.id)}
      >
        <span className={`archive-row-severity ${severityClass[incident.severity]}`}>
          <span aria-hidden="true" />
          {incident.severity}
        </span>
        <span className="archive-row-copy">
          <span className="archive-row-title">{incident.title}</span>
          <span className="archive-row-metadata">
            <span>
              <Layers2 aria-hidden="true" size={13} />
              {incident.system}
            </span>
            <time dateTime={incident.occurred_at}>
              {formatDate(incident.occurred_at)}
            </time>
            <span>{formatDuration(incident.duration_minutes)}</span>
            <span>
              <Activity aria-hidden="true" size={13} />
              {incident.timelineCount}{" "}
              {incident.timelineCount === 1 ? "event" : "events"}
            </span>
          </span>
        </span>
        <span className="archive-row-open" aria-hidden="true">
          <ArrowRight size={16} />
        </span>
      </Link>
    </li>
  );
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
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [focusedIncidentId, setFocusedIncidentId] = useState<string | null>(null);
  const [radarSize, setRadarSize] = useState<RadarSize>({
    width: 1200,
    height: 560,
  });
  const explorerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const radarRef = useRef<SVGSVGElement>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const visibleRowsRef = useRef(new Map<string, HTMLLIElement>());
  const activeIdRef = useRef<string | null>(null);

  const systems = useMemo(() => {
    const counts = new Map<string, number>();
    for (const incident of incidents ?? []) {
      counts.set(incident.system, (counts.get(incident.system) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return (incidents ?? []).filter((incident) => {
      const matchesSeverity =
        severity === "ALL" || incident.severity === severity;
      const matchesSystem =
        selectedSystem === null || incident.system === selectedSystem;
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

      return (
        matchesSeverity &&
        matchesSystem &&
        (!search || searchable.includes(search))
      );
    });
  }, [incidents, query, selectedSystem, severity]);

  const visibleIncidents = filteredIncidents;
  const publishedCount = incidents?.length ?? 0;
  const activeId = visibleIncidents.some(
    (incident) => incident.id === focusedIncidentId,
  )
    ? focusedIncidentId
    : (visibleIncidents[0]?.id ?? null);
  const activeIncident = visibleIncidents.find(
    (incident) => incident.id === activeId,
  );

  const focusIncident = useCallback((id: string) => {
    activeIdRef.current = id;
    setFocusedIncidentId((current) => (current === id ? current : id));
  }, []);
  const registerRow = useCallback(
    (id: string, element: HTMLLIElement | null) => {
      if (element) rowRefs.current.set(id, element);
      else rowRefs.current.delete(id);
    },
    [],
  );

  useEffect(() => {
    const svg = radarRef.current;
    const explorer = explorerRef.current;
    const list = listRef.current;
    if (
      !svg ||
      !explorer ||
      !list ||
      typeof ResizeObserver === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const visibleRows = visibleRowsRef.current;
    let frame = 0;
    const updateRadar = () => {
      frame = 0;
      const svgRect = svg.getBoundingClientRect();
      const width = svgRect.width;
      const height = svgRect.height;
      if (!width || !height) return;

      const centerX = width * 0.205;
      const centerY = height / 2;
      const radius = Math.min(width * 0.205, height * 0.465);
      let closestId = activeIdRef.current;
      let closestDistance = Number.POSITIVE_INFINITY;
      const viewportCenter =
        list.getBoundingClientRect().top + list.clientHeight / 2;

      for (const [id, row] of visibleRows) {
        const rowRect = row.getBoundingClientRect();
        const rowY = rowRect.top + rowRect.height / 2;
        const deltaY = Math.max(-radius * 0.94, Math.min(radius * 0.94, rowY - (svgRect.top + centerY)));
        const angle = Math.asin(deltaY / radius);
        const pointX = centerX + radius * Math.cos(angle);
        const pointY = centerY + deltaY;
        const targetX = rowRect.left - svgRect.left + 1;
        const targetY = rowY - svgRect.top;
        const path = svg.querySelector<SVGPathElement>(
          `[data-link-id="${CSS.escape(id)}"]`,
        );
        const point = svg.querySelector<SVGGElement>(
          `[data-point-id="${CSS.escape(id)}"]`,
        );

        if (path) {
          path.setAttribute(
            "d",
            `M ${pointX} ${pointY} C ${pointX + 30} ${pointY}, ${targetX - 36} ${targetY}, ${targetX} ${targetY}`,
          );
        }
        if (point) {
          point.setAttribute("transform", `translate(${pointX} ${pointY})`);
          point.setAttribute("opacity", "1");
        }

        const distance = Math.abs(rowY - viewportCenter);
        if (distance < closestDistance) {
          closestId = id;
          closestDistance = distance;
        }
      }

      svg.querySelectorAll<SVGGElement>("[data-point-id]").forEach((point) => {
        const id = point.getAttribute("data-point-id");
        if (id && !visibleRows.has(id)) {
          point.setAttribute("opacity", "0");
        }
      });

      if (closestId && closestId !== activeIdRef.current) {
        activeIdRef.current = closestId;
        setFocusedIncidentId(closestId);
      }
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateRadar);
    };

    const resizeObserver = new ResizeObserver(() => {
      const rect = svg.getBoundingClientRect();
      setRadarSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
      scheduleUpdate();
    });
    resizeObserver.observe(svg);
    resizeObserver.observe(list);
    for (const row of rowRefs.current.values()) resizeObserver.observe(row);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLLIElement).dataset.incidentId;
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleRows.set(id, entry.target as HTMLLIElement);
          } else {
            visibleRows.delete(id);
          }
        }
        scheduleUpdate();
      },
      { root: list, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const row of rowRefs.current.values()) intersectionObserver.observe(row);
    list.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      list.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      visibleRows.clear();
    };
  }, [visibleIncidents]);

  const centerX = radarSize.width * 0.205;
  const centerY = radarSize.height / 2;
  const radius = Math.min(radarSize.width * 0.205, radarSize.height * 0.465);
  const radarPath = `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius}`;

  return (
    <main className="archive-page">
      <div className="archive-texture" aria-hidden="true" />
      <div className="archive-shell">
        <header className="archive-header">
          <div className="archive-intro">
            <p className="archive-kicker">
              <span aria-hidden="true" />
              Public archive
            </p>
            <h1>
              Failure, <em>documented.</em>
            </h1>
            <p className="archive-deck">
              Explore outages, trace what happened, and learn what teams
              recorded.
            </p>
          </div>

          <div className="archive-toolbar">
            <div className="archive-stats" aria-label="Archive totals">
              <p>
                <strong>{incidents === null ? "—" : publishedCount}</strong>
                <span>Published case files</span>
              </p>
              <p>
                <strong>{incidents === null ? "—" : systems.length}</strong>
                <span>Systems</span>
              </p>
            </div>

            <section className="archive-controls" aria-label="Filter archive">
              <label className="archive-search">
                <Search aria-hidden="true" size={16} />
                <span className="sr-only">Search published incidents</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                  }}
                  placeholder="Search incident cases, systems, or technologies…"
                />
              </label>
              <label className="archive-severity-control">
                <span className="sr-only">Filter by severity</span>
                <select
                  value={severity}
                  onChange={(event) => {
                    setSeverity(event.target.value as SeverityFilter);
                  }}
                >
                  {severityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          </div>
        </header>

        {error ? (
          <div className="archive-state is-error" role="alert">
            <h2>Unable to load the public archive.</h2>
            <p>Please try again shortly.</p>
          </div>
        ) : incidents === null ? (
          <p className="archive-state" role="status">
            Loading published incidents…
          </p>
        ) : incidents.length === 0 ? (
          <div className="archive-state">
            <h2>No incidents published yet.</h2>
            <p>Reviewed reports will appear here when they are published.</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="archive-state">
            <h2>No matching case files.</h2>
            <p>Try a different search, severity, or system filter.</p>
            <button
              className="archive-reset"
              type="button"
              onClick={() => {
                setQuery("");
                setSeverity("ALL");
                setSelectedSystem(null);
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="archive-result-count" aria-live="polite">
              Showing {visibleIncidents.length} of {filteredIncidents.length}{" "}
              matching case files
            </p>

            <div className="archive-explorer" ref={explorerRef}>
              <div className="archive-radar-layer" aria-hidden="true">
                <svg
                  className="archive-radar-svg"
                  ref={radarRef}
                  viewBox={`0 0 ${radarSize.width} ${radarSize.height}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <clipPath id="archive-radar-viewport">
                      <rect
                        x="0"
                        y="0"
                        width={radarSize.width}
                        height={radarSize.height}
                      />
                    </clipPath>
                    <linearGradient id="archive-radar-sweep" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c6e47c" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#c6e47c" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <g
                    className="archive-radar-instrument"
                    clipPath="url(#archive-radar-viewport)"
                  >
                    {[0.32, 0.54, 0.76, 1].map((scale) => (
                      <circle
                        key={scale}
                        className="archive-radar-ring"
                        cx={centerX}
                        cy={centerY}
                        r={radius * scale}
                      />
                    ))}
                    <path
                      className="archive-radar-crosshair"
                      d={`M ${centerX - radius} ${centerY} H ${centerX + radius} M ${centerX} ${centerY - radius} V ${centerY + radius}`}
                    />
                    <path className="archive-radar-orbit" d={radarPath} />
                    {radarBlips.map((blip) => {
                      const radians = (blip.angle * Math.PI) / 180;
                      const x = Number(
                        (centerX + Math.sin(radians) * radius * blip.radius).toFixed(2),
                      );
                      const y = Number(
                        (centerY - Math.cos(radians) * radius * blip.radius).toFixed(2),
                      );
                      return (
                        <circle
                          key={blip.angle}
                          className="archive-radar-blip"
                          cx={x}
                          cy={y}
                          r="2"
                          style={{
                            animationDelay: `${-(blip.angle / 360) * RADAR_SWEEP_SECONDS}s`,
                          }}
                        />
                      );
                    })}
                    <g
                      className="archive-radar-sweep"
                      style={{
                        transformBox: "view-box",
                        transformOrigin: `${centerX}px ${centerY}px`,
                      }}
                    >
                      <path
                        d={`M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY} Z`}
                        fill="url(#archive-radar-sweep)"
                      />
                    </g>
                    {visibleIncidents.map((incident, index) => (
                      <g
                        key={incident.id}
                        className={`archive-orbit-point ${severityClass[incident.severity]}${activeId === incident.id ? " is-active" : ""}`}
                        data-point-id={incident.id}
                        transform={`translate(${centerX} ${centerY})`}
                        opacity="0"
                      >
                        <circle
                          className="archive-orbit-echo"
                          r="8"
                          style={{ animationDelay: `${index * 0.18}s` }}
                        />
                        <circle r={activeId === incident.id ? 6 : 4} />
                      </g>
                    ))}
                    {visibleIncidents.map((incident) => (
                      <path
                        key={`link-${incident.id}`}
                        className={`archive-radar-connection ${severityClass[incident.severity]}${activeId === incident.id ? " is-active" : ""}`}
                        data-link-id={incident.id}
                        d=""
                      />
                    ))}
                    <circle
                      className="archive-radar-core"
                      cx={centerX}
                      cy={centerY}
                      r={radius * 0.32}
                    />
                    <text
                      className="archive-radar-title"
                      x={centerX}
                      y={centerY - 5}
                    >
                      Incident
                    </text>
                    <text
                      className="archive-radar-title"
                      x={centerX}
                      y={centerY + 17}
                    >
                      Explorer
                    </text>
                    <text
                      className="archive-radar-count"
                      x={centerX}
                      y={centerY + 40}
                    >
                      {filteredIncidents.length} CASES
                    </text>
                  </g>
                </svg>
              </div>

              <section
                className="archive-incident-list"
                aria-label="Published incidents"
                ref={listRef}
                tabIndex={0}
              >
                <ol>
                  {visibleIncidents.map((incident) => (
                    <IncidentRow
                      key={incident.id}
                      incident={incident}
                      active={activeId === incident.id}
                      onFocus={focusIncident}
                      onRowElement={registerRow}
                    />
                  ))}
                </ol>
              </section>
            </div>

            {systems.length > 0 && (
              <nav className="archive-systems" aria-label="Browse by system">
                <h2 className="archive-section-label">
                  <Layers2 aria-hidden="true" size={17} />
                  Browse by system
                </h2>
                <div className="archive-system-list">
                  <button
                    className={selectedSystem === null ? "is-selected" : ""}
                    type="button"
                    aria-pressed={selectedSystem === null}
                    onClick={() => {
                      setSelectedSystem(null);
                    }}
                  >
                    All systems <span>({systems.length})</span>
                  </button>
                  {systems.map(([system, count]) => (
                    <button
                      className={selectedSystem === system ? "is-selected" : ""}
                      type="button"
                      aria-pressed={selectedSystem === system}
                      key={system}
                      onClick={() => {
                        setSelectedSystem((current) =>
                          current === system ? null : system,
                        );
                      }}
                    >
                      {system} <span>({count})</span>
                    </button>
                  ))}
                </div>
              </nav>
            )}
          </>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {activeIncident ? `Focused incident: ${activeIncident.title}` : ""}
      </span>
    </main>
  );
}
