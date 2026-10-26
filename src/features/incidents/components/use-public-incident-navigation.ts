"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RootCauseNode, TimelineEvent } from "@/types/incident";

/** Owns deep-link selection and keyboard navigation for a report's story. */
export function usePublicIncidentNavigation(
  events: TimelineEvent[],
  causes: RootCauseNode[],
) {
  const [activeEventId, setActiveEventId] = useState(events[0]?.id ?? null);
  const [activeCauseId, setActiveCauseId] = useState(
    causes.find((node) => node.type === "ROOT_CAUSE")?.id ??
      causes[0]?.id ??
      null,
  );
  const timelineRef = useRef<HTMLUListElement>(null);
  const previousActiveEventIdRef = useRef(activeEventId);
  const eventIds = useMemo(() => events.map((event) => event.id), [events]);
  const activeEvent = events.find((event) => event.id === activeEventId) ?? null;
  const activeCause = causes.find((node) => node.id === activeCauseId) ?? null;

  useEffect(() => {
    if (previousActiveEventIdRef.current === activeEventId) return;
    previousActiveEventIdRef.current = activeEventId;
    const selectedEvent = timelineRef.current?.querySelector<HTMLButtonElement>(
      '.public-timeline-event[aria-pressed="true"]',
    );
    if (!selectedEvent) return;
    selectedEvent.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [activeEventId]);

  const handleTimelineKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const index = eventIds.indexOf(activeEventId ?? "");
      if (index < 0) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setActiveEventId(eventIds[Math.min(index + 1, eventIds.length - 1)]);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveEventId(eventIds[Math.max(index - 1, 0)]);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveEventId(eventIds[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveEventId(eventIds[eventIds.length - 1]);
      }
    },
    [eventIds, activeEventId],
  );

  useEffect(() => {
    const syncFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash.startsWith("event-")) {
        const id = hash.slice("event-".length);
        if (events.some((event) => event.id === id)) setActiveEventId(id);
      }
      if (hash.startsWith("cause-")) {
        const id = hash.slice("cause-".length);
        if (causes.some((cause) => cause.id === id)) setActiveCauseId(id);
      }
    };
    syncFromHash();
    window.addEventListener("popstate", syncFromHash);
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      window.removeEventListener("popstate", syncFromHash);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [events, causes]);

  const selectEvent = useCallback((id: string) => {
    setActiveEventId(id);
    const url = new URL(window.location.href);
    url.hash = "event-" + id;
    window.history.pushState(null, "", url);
  }, []);

  const selectCause = useCallback((id: string) => {
    setActiveCauseId(id);
    const url = new URL(window.location.href);
    url.hash = "cause-" + id;
    window.history.pushState(null, "", url);
  }, []);

  return {
    activeEvent,
    activeCause,
    activeEventId,
    activeCauseId,
    timelineRef,
    handleTimelineKeyDown,
    selectEvent,
    selectCause,
  };
}
