"use client";

import { Check } from "lucide-react";
import type { TimelineEvent } from "@/types/incident";
import { label, offsetClockLabel, stageColors } from "./public-incident-formatters";
import type { EvidenceChip, EvidenceTab } from "./public-incident-types";

export function PublicIncidentTimeline({
  events,
  occurredAt,
  activeEvent,
  timelineRef,
  onKeyDown,
  onSelect,
  evidenceChips,
  onOpenEvidence,
}: {
  events: TimelineEvent[];
  occurredAt: string;
  activeEvent: TimelineEvent | null;
  timelineRef: React.RefObject<HTMLUListElement | null>;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onSelect: (id: string) => void;
  evidenceChips: EvidenceChip[];
  onOpenEvidence: (tab: EvidenceTab) => void;
}) {
  return (
    <>
      {events.length ? (
        <div className="public-timeline-board">
          <ul
            ref={timelineRef}
            className="public-timeline-track"
            tabIndex={0}
            onKeyDown={onKeyDown}
            aria-label="Incident timeline, select an event"
          >
            {events.map((event, index) => {
              const color = stageColors[event.stage] ?? "#94a3b8";
              const previous =
                index > 0 ? (stageColors[events[index - 1].stage] ?? color) : color;
              const next =
                index < events.length - 1
                  ? (stageColors[events[index + 1].stage] ?? color)
                  : color;
              const isActive = event.id === activeEvent?.id;
              return (
                <li
                  key={event.id}
                  style={{
                    ["--c" as string]: color,
                    ["--prev" as string]: previous,
                    ["--next" as string]: next,
                    ["--halo" as string]: color + "33",
                  }}
                >
                  <button
                    type="button"
                    id={"event-" + event.id}
                    className={
                      "public-timeline-event" + (isActive ? " is-active" : "")
                    }
                    aria-pressed={isActive}
                    onClick={() => onSelect(event.id)}
                  >
                    <span className="public-timeline-time">
                      {offsetClockLabel(occurredAt, event.timestampOffsetMinutes)}
                    </span>
                    <span
                      aria-hidden
                      className="public-timeline-node"
                      style={{ color }}
                    />
                    <span className="pid-tl-title">{event.title}</span>
                    <span
                      className="public-timeline-label"
                      style={{ color: isActive ? color : undefined }}
                    >
                      {label(event.stage)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="public-empty">No timeline was included in this report.</div>
      )}

      {activeEvent && (
        <aside
          key={activeEvent.id}
          className="public-event-card"
          aria-live="polite"
          aria-atomic="true"
        >
          <p
            className="public-event-card-time"
            style={{ color: stageColors[activeEvent.stage] ?? "#94a3b8" }}
          >
            {offsetClockLabel(occurredAt, activeEvent.timestampOffsetMinutes)}{" "}
            · {label(activeEvent.stage)}
          </p>
          <h3 className="public-event-card-title">{activeEvent.title}</h3>
          <p className="public-event-card-desc">{activeEvent.description}</p>
          <div className="public-evidence-chips">
            <p className="public-evidence-chips-label">Related evidence</p>
            {evidenceChips.length ? (
              evidenceChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className="public-evidence-chip"
                  onClick={() => onOpenEvidence(chip.tab)}
                >
                  <Check
                    aria-hidden
                    className="h-3 w-3"
                    style={{ color: "#34d399" }}
                  />
                  <span>{chip.label}</span>
                </button>
              ))
            ) : (
              <span className="public-evidence-chip">No linked evidence</span>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
