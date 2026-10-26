/** @format */

"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, GitBranch, Link2 } from "lucide-react";
import Link from "next/link";
import type {
  PublishedIncident,
  PublishedIncidentSummary,
} from "@/features/incidents/server/queries";
import type { IncidentSeverity } from "@/types/incident";
import { usePublicIncidentNavigation } from "./use-public-incident-navigation";
import { PublicIncidentEvidence } from "./PublicIncidentEvidence";
import { PublicIncidentImpactMap } from "./PublicIncidentImpactMap";
import { PublicIncidentFixSection } from "./PublicIncidentFixSection";
import { PublicIncidentCausalTree } from "./PublicIncidentCausalTree";
import { PublicIncidentTimeline } from "./PublicIncidentTimeline";
import type { EvidenceTab, SeverityStyle } from "./public-incident-types";
import { PublicIncidentOverview } from "./PublicIncidentOverview";
import {
  dateLabel,
  durationLabel,
  hasConfigDiff,
} from "./public-incident-formatters";
import { ServerIcon } from "./public-incident-icons";

/* ---------- helpers ---------- */

const severityStyles: Record<IncidentSeverity, SeverityStyle> = {
  CRITICAL: {
    color: "#fb7185",
    bg: "rgba(251,113,133,.12)",
    border: "rgba(251,113,133,.5)",
  },
  MAJOR: {
    color: "#fb7185",
    bg: "rgba(251,113,133,.12)",
    border: "rgba(251,113,133,.5)",
  },
  MINOR: {
    color: "#c6e47c",
    bg: "rgba(198,228,124,.12)",
    border: "rgba(198,228,124,.4)",
  },
};

/* ---------- small building blocks ---------- */

function SectionHeader({
  n,
  eyebrow,
  title,
  description,
  color = "#d5eca0",
  children,
}: {
  n: string;
  eyebrow: string;
  title: string;
  description: string;
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="public-section-header">
      <p className="public-section-eyebrow" style={{ color }}>
        <span className="public-section-number">{n}</span>
        {eyebrow}
      </p>
      <h2 className="public-section-title">{title}</h2>
      <p className="public-section-description">{description}</p>
      {children}
    </div>
  );
}

/* ---------- component ---------- */

export default function PublicIncidentDetail({
  incident,
  related,
}: {
  incident: PublishedIncident;
  related: PublishedIncidentSummary[];
}) {
  const events = useMemo(
    () =>
      [...incident.timeline].sort(
        (a, b) => a.timestampOffsetMinutes - b.timestampOffsetMinutes,
      ),
    [incident.timeline],
  );

  const navigation = usePublicIncidentNavigation(
    events,
    incident.root_cause_tree,
  );
  const {
    activeEvent,
    activeCause,
    activeCauseId,
    timelineRef,
    handleTimelineKeyDown,
    selectEvent,
    selectCause,
  } = navigation;

  /* ---------- derived data (only what the report actually recorded) ---------- */

  const components = useMemo(() => {
    const names = new Set<string>();
    for (const e of events) {
      const n = e.affectedComponent.trim();
      if (n) names.add(n);
    }
    for (const n of incident.root_cause_tree) {
      const c = n.systemComponent.trim();
      if (c) names.add(c);
    }
    return Array.from(names);
  }, [events, incident.root_cause_tree]);

  const failedComponents = useMemo(() => {
    const set = new Set<string>();
    for (const node of incident.root_cause_tree) {
      if (node.type === "DIRECT_FAILURE" || node.type === "SYSTEM_IMPACT") {
        const c = node.systemComponent.trim();
        if (c) set.add(c);
      }
    }
    return set;
  }, [incident.root_cause_tree]);

  const causalComponentRoles = useMemo(() => {
    const roles = new Map<string, Set<string>>();
    for (const node of incident.root_cause_tree) {
      const component = node.systemComponent.trim();
      if (!component) continue;
      const componentRoles = roles.get(component) ?? new Set<string>();
      componentRoles.add(node.type);
      roles.set(component, componentRoles);
    }
    return roles;
  }, [incident.root_cause_tree]);

  const namedServices = Array.from(new Set([incident.system, ...components]));
  const componentsInCausalPath = namedServices.filter((name) =>
    causalComponentRoles.has(name),
  );
  const otherComponents = namedServices.filter(
    (name) => !causalComponentRoles.has(name),
  );

  const mitigationEvents = useMemo(
    () => events.filter((e) => e.stage === "MITIGATION"),
    [events],
  );

  /* evidence */
  const hasConfigEvidence = hasConfigDiff(incident.architecture_diff);
  const hasExternalEvidence = Boolean(incident.official_post_mortem_url);

  const [activeTab, setActiveTab] = useState<EvidenceTab>("config");

  function openEvidence(tab: EvidenceTab) {
    setActiveTab(tab);
    window.requestAnimationFrame(() => {
      document.getElementById("section-evidence")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "nearest",
      });
    });
  }

  // Defensive: DB rows are cast, not validated, so an unknown severity
  // must still render with a valid style.
  const sev = severityStyles[incident.severity] ?? severityStyles.MINOR;

  const eventEvidenceChips = useMemo(() => {
    if (!activeEvent) return [];
    const chips: { label: string; tab: EvidenceTab }[] = [];
    if ((activeEvent.cliCommands?.length ?? 0) > 0)
      chips.push({ label: "CLI commands", tab: "cli" });
    if (hasConfigEvidence)
      chips.push({ label: "Configuration change", tab: "config" });
    if (hasExternalEvidence)
      chips.push({ label: "Post-mortem link", tab: "external" });
    return chips;
  }, [activeEvent, hasConfigEvidence, hasExternalEvidence]);

  return (
    <article className="public-incident-page pid-page">
      {/* ---- top bar ---- */}
      <div className="pid-topbar">
        <Link href="/incidents" className="pid-back">
          <ArrowLeft size={14} /> Back to incidents
        </Link>
        <span className="pid-case">Public archive · {incident.slug}</span>
      </div>

      {/* ---- hero ---- */}
      <PublicIncidentOverview
        incident={incident}
        severityStyle={sev}
        eventCount={events.length}
        namedServices={namedServices}
      />

      {/* ---- 01 the story ---- */}
      <section id="section-timeline" className="pid-section">
        <div className="pid-split pid-split-story">
          <SectionHeader
            n="01"
            eyebrow="The story"
            title="What happened?"
            description="A timeline view of the incident from the first signal to full recovery. Select any event to explore details and related evidence."
            color="#38bdf8"
          >
            <p className="pid-pill">{events.length} events recorded</p>
          </SectionHeader>

          <PublicIncidentTimeline
            events={events}
            occurredAt={incident.occurred_at}
            activeEvent={activeEvent}
            timelineRef={timelineRef}
            onKeyDown={handleTimelineKeyDown}
            onSelect={selectEvent}
            evidenceChips={eventEvidenceChips}
            onOpenEvidence={openEvidence}
          />
        </div>
      </section>

      {/* ---- 02 impact | 03 root cause ---- */}
      <div className="pid-row pid-row-impact">
        <section id="section-impact" className="public-section pid-section">
          <div className="pid-split pid-split-impact">
            <SectionHeader
              n="02"
              eyebrow="System impact"
              title="How it spread?"
              description="Explore how the issue propagated across services and understand the real impact on the system."
              color="#38bdf8"
            />

            <PublicIncidentImpactMap
              incident={incident}
              components={components}
              failedComponents={failedComponents}
              causalComponentRoles={causalComponentRoles}
            />

            <aside className="public-impact-summary">
              <p className="public-impact-summary-title">Impact summary</p>
              <div className="public-impact-row">
                <span className="public-impact-row-icon">
                  <GitBranch />
                </span>
                <div>
                  <p className="public-impact-row-value">
                    {componentsInCausalPath.join(", ") || "Not recorded"}
                  </p>
                  <p className="public-impact-row-label">
                    Components in causal path
                  </p>
                </div>
              </div>
              <div className="public-impact-row">
                <span className="public-impact-row-icon">
                  <ServerIcon />
                </span>
                <div>
                  <p className="public-impact-row-value">
                    {otherComponents.join(", ") || "None recorded"}
                  </p>
                  <p className="public-impact-row-label">
                    Other components mentioned in the report
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="section-cause" className="public-section pid-section">
          <div className="pid-split pid-split-cause">
            <SectionHeader
              n="03"
              eyebrow="The root cause"
              title="Why it happened?"
              description="Understand the root cause and the contributing factors that led to this incident."
              color="#38bdf8"
            />

            {incident.root_cause_tree.length ? (
              <div className="pid-cause-col">
                <PublicIncidentCausalTree
                  causes={incident.root_cause_tree}
                  activeCauseId={activeCauseId}
                  onSelect={selectCause}
                />
                {activeCause && (
                  <div
                    key={activeCause.id}
                    className="pid-cause-detail"
                    aria-live="polite"
                  >
                    <p className="public-cause-detail-label">
                      Recorded explanation
                    </p>
                    <p>{activeCause.description}</p>
                    {activeCause.type === "ROOT_CAUSE" && (
                      <a
                        className="public-cause-event-link"
                        href="#section-timeline"
                      >
                        <Link2 aria-hidden className="h-3 w-3" />
                        View in timeline
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="public-empty">
                No causal factors were recorded.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ---- 04 evidence | 05 fix ---- */}
      <div className="pid-row pid-row-proof">
        <section id="section-evidence" className="public-section pid-section">
          <div className="pid-split pid-split-evidence">
            <SectionHeader
              n="04"
              eyebrow="The evidence"
              title="See the proof"
              description="Inspect the actual data, logs, configuration changes, and commands that confirm what happened."
              color="#38bdf8"
            />

            <PublicIncidentEvidence
              incident={incident}
              events={events}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </section>

        <PublicIncidentFixSection
          incident={incident}
          components={components}
          failedComponents={failedComponents}
          mitigationEvents={mitigationEvents}
        />
      </div>

      {/* ---- 06 prevention ---- */}
      <section
        id="section-prevention"
        className="public-section pid-section pid-section-wide"
      >
        <div className="pid-split pid-split-prevent">
          <SectionHeader
            n="06"
            eyebrow="Prevention"
            title="What we learned?"
            description="Key actions to prevent this type of incident and improve system reliability."
            color="#34d399"
          />
          {incident.prevention_actions.length ? (
            <ol className="pid-prevent-grid">
              {incident.prevention_actions.map((action, i) => (
                <li key={i} className="pid-prevent-item">
                  <span className="pid-check" aria-hidden>
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="public-prevention-title">{action.title}</p>
                    {action.description && (
                      <p className="public-prevention-desc">
                        {action.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="public-empty">
              No prevention actions were documented.
            </div>
          )}
        </div>
      </section>

      {/* ---- related ---- */}
      {related.length > 0 && (
        <section
          id="section-related"
          className="public-section pid-section pid-section-wide"
        >
          <div className="pid-split pid-split-prevent">
            <SectionHeader
              n="07"
              eyebrow="Explore more"
              title="More incidents"
              description="More reports from the public archive."
              color="#8a9a85"
            />
            <div className="public-related-grid">
              {related.map((item) => {
                // Defensive: see note above for the main severity lookup.
                const itemSev =
                  severityStyles[item.severity] ?? severityStyles.MINOR;
                return (
                  <Link
                    href={`/incidents/report/${item.slug}`}
                    key={item.id}
                    className="public-related-card"
                  >
                    <span
                      className="public-related-card-sev"
                      style={{
                        color: itemSev.color,
                        borderColor: itemSev.border,
                        backgroundColor: itemSev.bg,
                      }}
                    >
                      {item.severity}
                    </span>
                    <span className="public-related-card-title">
                      {item.title}
                    </span>
                    <span className="public-related-card-meta">
                      {dateLabel(item.occurred_at)} ·{" "}
                      {durationLabel(item.duration_minutes)}
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link className="public-related-archive" href="/incidents">
              Browse all public incidents <ArrowUpRight aria-hidden size={14} />
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
