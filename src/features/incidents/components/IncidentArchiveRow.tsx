import Link from "next/link";
import { Activity, ArrowRight, Layers2 } from "lucide-react";
import type { IncidentSeverity } from "@/types/incident";
import type { PublishedIncidentSummary } from "@/features/incidents/server/queries";
type SeverityFilter = "ALL" | IncidentSeverity;

export const severityClass: Record<IncidentSeverity, string> = {
  CRITICAL: "is-critical",
  MAJOR: "is-major",
  MINOR: "is-minor",
};

export const severityOptions: { value: SeverityFilter; label: string }[] = [
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

export function IncidentArchiveRow({
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

