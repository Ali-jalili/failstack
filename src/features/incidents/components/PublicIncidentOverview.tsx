import { ArrowUpRight } from "lucide-react";
import type { PublishedIncident } from "@/features/incidents/server/queries";
import {
  ActivityIcon,
  CalendarIcon,
  ClockIcon,
  LayersIcon,
  ServerIcon,
  TimerIcon,
  WaypointsIcon,
  ZapIcon,
} from "./public-incident-icons";
import { dateLabel, dateTimeLabel, durationLabel, patternLabel } from "./public-incident-formatters";

type SeverityStyle = { color: string; bg: string; border: string };

export function PublicIncidentOverview({
  incident,
  severityStyle,
  eventCount,
  namedServices,
}: {
  incident: PublishedIncident;
  severityStyle: SeverityStyle;
  eventCount: number;
  namedServices: string[];
}) {
  const heroStats = [
    {
      icon: <ClockIcon />,
      value: durationLabel(incident.duration_minutes),
      label: "Duration",
      color: "#c6e47c",
    },
    {
      icon: <ActivityIcon />,
      value: patternLabel(incident.severity),
      label: "Severity",
      color: severityStyle.color,
    },
    {
      icon: <ZapIcon />,
      value: `${eventCount} events`,
      label: "Events recorded",
      color: "#60a5fa",
    },
    {
      icon: <ServerIcon />,
      value: `${namedServices.length} services`,
      label: "Services named",
      color: "#60a5fa",
    },
  ];

  return (
    <header className="pid-hero">
      <div className="pid-hero-main">
        <div className="pid-meta-row">
          <span
            className="pid-badge"
            style={{ backgroundColor: severityStyle.color, borderColor: severityStyle.color }}
          >
            {incident.severity}
          </span>
          <span className="pid-meta-item">{dateLabel(incident.occurred_at)}</span>
          <span className="pid-meta-sep" aria-hidden />
          <span className="pid-meta-item">{durationLabel(incident.duration_minutes)}</span>
        </div>

        <h1 className="pid-title">{incident.title}</h1>
        <p className="pid-summary">{incident.summary}</p>

        <div className="pid-tags">
          <span className="pid-tag">{incident.system}</span>
          {incident.technologies.map((technology) => (
            <span key={technology} className="pid-tag">
              {technology}
            </span>
          ))}
          <span className="pid-tag">{patternLabel(incident.pattern)}</span>
        </div>

        <div className="pid-metrics" aria-label="Incident summary">
          {heroStats.map((stat, index) => (
            <div
              key={stat.label}
              className="pid-metric"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="pid-metric-icon" style={{ color: stat.color }}>
                {stat.icon}
              </span>
              <div>
                <p className="pid-metric-value">{stat.value}</p>
                <p className="pid-metric-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="pid-glance" aria-label="Incident at a glance">
        <h2 className="pid-glance-title">Incident at a glance</h2>
        <dl className="pid-glance-list">
          <div className="pid-glance-row">
            <span className="pid-glance-icon" aria-hidden><CalendarIcon /></span>
            <dt>Date</dt>
            <dd>{dateTimeLabel(incident.occurred_at)} UTC</dd>
          </div>
          <div className="pid-glance-row">
            <span className="pid-glance-icon" aria-hidden><TimerIcon /></span>
            <dt>Duration</dt>
            <dd>{durationLabel(incident.duration_minutes)}</dd>
          </div>
          <div className="pid-glance-row">
            <span className="pid-glance-icon" aria-hidden><WaypointsIcon /></span>
            <dt>Pattern</dt>
            <dd>{patternLabel(incident.pattern)}</dd>
          </div>
          <div className="pid-glance-row">
            <span className="pid-glance-icon" aria-hidden><LayersIcon /></span>
            <dt>Technologies</dt>
            <dd>{incident.technologies.join(" · ") || "Not specified"}</dd>
          </div>
          <div className="pid-glance-row">
            <span className="pid-glance-icon" aria-hidden><ServerIcon /></span>
            <dt>Services mentioned</dt>
            <dd>{namedServices.join(", ")}</dd>
          </div>
        </dl>
        {incident.official_post_mortem_url && (
          <a
            className="public-glance-link"
            href={incident.official_post_mortem_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open official post-mortem{" "}
            <ArrowUpRight aria-hidden className="h-3 w-3" />
          </a>
        )}
      </aside>
    </header>
  );
}
