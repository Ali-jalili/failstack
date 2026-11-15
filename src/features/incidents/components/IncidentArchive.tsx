"use client";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layers2, Search } from "lucide-react";
import type { IncidentSeverity } from "@/types/incident";
import IncidentArchiveRadar from "./IncidentArchiveRadar";
import { IncidentArchiveRow, severityOptions } from "./IncidentArchiveRow";
import type { PublishedIncidentSummary } from "@/features/incidents/server/queries";

type SeverityFilter = "ALL" | IncidentSeverity;
type RadarSize = { width: number; height: number };
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
                <IncidentArchiveRadar
                  radarSize={radarSize}
                  radarRef={radarRef}
                  visibleIncidents={visibleIncidents}
                  filteredCount={filteredIncidents.length}
                  activeId={activeId}
                />
              </div>

              <section
                className="archive-incident-list"
                aria-label="Published incidents"
                ref={listRef}
                tabIndex={0}
              >
                <ol>
                  {visibleIncidents.map((incident) => (
                    <IncidentArchiveRow
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
