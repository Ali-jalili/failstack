/** @format */
/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { RootCauseNode, TimelineEvent } from "@/types/incident";
import { usePublicIncidentNavigation } from "./use-public-incident-navigation";

const events: TimelineEvent[] = [
  {
    id: "ev-1",
    timestampOffsetMinutes: 0,
    stage: "TRIGGER",
    title: "Traffic spike",
    description: "Sudden traffic increase",
    affectedComponent: "edge",
  },
  {
    id: "ev-2",
    timestampOffsetMinutes: 12,
    stage: "FAILURE",
    title: "Database timeout",
    description: "Queries started timing out",
    affectedComponent: "db",
    cliCommands: ["psql -c 'select 1'"],
  },
  {
    id: "ev-3",
    timestampOffsetMinutes: 30,
    stage: "MITIGATION",
    title: "Failover executed",
    description: "Primary/secondary switched",
    affectedComponent: "db",
  },
];

const causes: RootCauseNode[] = [
  {
    id: "cause-contrib",
    parentId: "cause-root",
    type: "CONTRIBUTING_FACTOR",
    title: "Missing connection pool cap",
    description: "Pool grew unbounded",
    systemComponent: "db",
  },
  {
    id: "cause-root",
    parentId: null,
    type: "ROOT_CAUSE",
    title: "Unbounded connection pool",
    description: "No pool limit in production config",
    systemComponent: "db",
  },
];

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

function setHash(hash: string) {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#${hash}`,
  );
}

function pressKey(
  handler: (event: React.KeyboardEvent) => void,
  press: string,
) {
  const event = {
    key: press,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent;
  act(() => {
    handler(event);
  });
  return event;
}

let scrollIntoViewSpy: ReturnType<typeof vi.fn>;
let scrollIntoViewDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  mockMatchMedia(false);
  window.history.replaceState(null, "", window.location.pathname);
  // jsdom does not implement scrollIntoView, so it must be defined before
  // spying (vi.spyOn only works on existing properties).
  scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
    window.HTMLElement.prototype,
    "scrollIntoView",
  );
  scrollIntoViewSpy = vi.fn();
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoViewSpy,
  });
});

afterEach(() => {
  if (scrollIntoViewDescriptor) {
    Object.defineProperty(
      window.HTMLElement.prototype,
      "scrollIntoView",
      scrollIntoViewDescriptor,
    );
  } else {
    Reflect.deleteProperty(window.HTMLElement.prototype, "scrollIntoView");
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("usePublicIncidentNavigation initial selection", () => {
  it("activates the first timeline event by default", () => {
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    expect(result.current.activeEventId).toBe("ev-1");
    expect(result.current.activeEvent?.id).toBe("ev-1");
  });

  it("activates the ROOT_CAUSE node before other nodes", () => {
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    expect(result.current.activeCauseId).toBe("cause-root");
  });

  it("falls back to the first cause when no ROOT_CAUSE node exists", () => {
    const contributingOnly = causes.filter(
      (node) => node.type !== "ROOT_CAUSE",
    );
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, contributingOnly),
    );
    expect(result.current.activeCauseId).toBe("cause-contrib");
  });

  it("returns null selections for empty input", () => {
    const { result } = renderHook(() => usePublicIncidentNavigation([], []));
    expect(result.current.activeEventId).toBeNull();
    expect(result.current.activeCauseId).toBeNull();
  });
});

describe("timeline keyboard navigation", () => {
  function setup() {
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    act(() => {
      result.current.selectEvent("ev-2");
    });
    return { result };
  }

  it("moves forward with ArrowRight/ArrowDown and stops at the end", () => {
    const { result } = setup();
    expect(
      pressKey(result.current.handleTimelineKeyDown, "ArrowRight")
        .preventDefault,
    ).toHaveBeenCalled();
    expect(result.current.activeEventId).toBe("ev-3");
    const arrowDown = pressKey(result.current.handleTimelineKeyDown, "ArrowDown");
    expect(arrowDown.preventDefault).toHaveBeenCalledOnce();
    expect(result.current.activeEventId).toBe("ev-3");
  });

  it("moves backward with ArrowLeft/ArrowUp and stops at the start", () => {
    const { result } = setup();
    pressKey(result.current.handleTimelineKeyDown, "ArrowLeft");
    expect(result.current.activeEventId).toBe("ev-1");
    pressKey(result.current.handleTimelineKeyDown, "ArrowUp");
    expect(result.current.activeEventId).toBe("ev-1");
  });

  it("jumps to the first event with Home and the last with End", () => {
    const { result } = setup();
    pressKey(result.current.handleTimelineKeyDown, "End");
    expect(result.current.activeEventId).toBe("ev-3");
    pressKey(result.current.handleTimelineKeyDown, "Home");
    expect(result.current.activeEventId).toBe("ev-1");
  });

  it("ignores unrelated keys and an unknown active event", () => {
    const { result } = setup();
    pressKey(result.current.handleTimelineKeyDown, "a");
    expect(result.current.activeEventId).toBe("ev-2");
    act(() => {
      result.current.selectEvent("does-not-exist");
    });
    pressKey(result.current.handleTimelineKeyDown, "ArrowRight");
    expect(result.current.activeEventId).toBe("does-not-exist");
  });
});

describe("deep-link (hash) selection", () => {
  it("selects events from an event- hash", () => {
    setHash("event-ev-2");
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    expect(result.current.activeEventId).toBe("ev-2");
  });

  it("selects causes from a cause- hash", async () => {
    setHash("cause-cause-contrib");
    expect(window.location.hash).toBe("#cause-cause-contrib");
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    await waitFor(() =>
      expect(result.current.activeCauseId).toBe("cause-contrib"),
    );
  });

  it("ignores hashes that reference unknown ids", () => {
    setHash("event-missing");
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    expect(result.current.activeEventId).toBe("ev-1");
  });

  it("decodes URL-encoded event ids from the hash", () => {
    const encodedId = "ev with space";
    const encodedEvent: TimelineEvent = {
      ...events[0],
      id: encodedId,
    };
    setHash(`event-${encodeURIComponent(encodedId)}`);
    const { result } = renderHook(() =>
      usePublicIncidentNavigation([encodedEvent], causes),
    );
    expect(result.current.activeEventId).toBe(encodedId);
  });

  it("selectEvent updates the URL hash and active event", () => {
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    act(() => {
      result.current.selectEvent("ev-3");
    });
    expect(result.current.activeEventId).toBe("ev-3");
    expect(decodeURIComponent(window.location.hash.slice(1))).toBe("event-ev-3");
    expect(window.location.href).toContain("#event-ev-3");
  });

  it("selectCause updates the URL hash and active cause", () => {
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    act(() => {
      result.current.selectCause("cause-contrib");
    });
    expect(result.current.activeCauseId).toBe("cause-contrib");
    expect(decodeURIComponent(window.location.hash.slice(1))).toBe(
      "cause-cause-contrib",
    );
    expect(window.location.href).toContain("#cause-cause-contrib");
  });

  it("reacts to hashchange and popstate events", async () => {
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    expect(result.current.activeEventId).toBe("ev-1");
    act(() => {
      window.location.hash = "event-ev-2";
    });
    await waitFor(() => expect(result.current.activeEventId).toBe("ev-2"));
    act(() => {
      window.history.pushState(null, "", "#event-ev-3");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.activeEventId).toBe("ev-3");
  });
});

describe("scrolling to the active event", () => {
  function mountTimelineWithPressedEvent() {
    const timeline = document.createElement("ul");
    const selected = document.createElement("button");
    selected.className = "public-timeline-event";
    selected.setAttribute("aria-pressed", "true");
    timeline.appendChild(selected);
    document.body.appendChild(timeline);
    return { timeline };
  }

  it("scrolls smoothly for a user without reduced motion", () => {
    mockMatchMedia(false);
    const { timeline } = mountTimelineWithPressedEvent();
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    act(() => {
      result.current.timelineRef.current = timeline;
      result.current.selectEvent("ev-2");
    });
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
    document.body.removeChild(timeline);
  });

  it("scrolls instantly when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    const { timeline } = mountTimelineWithPressedEvent();
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    act(() => {
      result.current.timelineRef.current = timeline;
      result.current.selectEvent("ev-2");
    });
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: "nearest",
      inline: "center",
      behavior: "auto",
    });
    document.body.removeChild(timeline);
  });

  it("does nothing when the timeline ref has no pressed event", () => {
    mockMatchMedia(false);
    const timeline = document.createElement("ul");
    const { result } = renderHook(() =>
      usePublicIncidentNavigation(events, causes),
    );
    act(() => {
      result.current.timelineRef.current = timeline;
      result.current.selectEvent("ev-2");
    });
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});
