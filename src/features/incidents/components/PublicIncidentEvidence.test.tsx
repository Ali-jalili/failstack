/** @format */
/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { PublishedIncident } from "@/features/incidents/server/queries";
import type { ArchitectureDiff, TimelineEvent } from "@/types/incident";
import { PublicIncidentEvidence } from "./PublicIncidentEvidence";

const diff: ArchitectureDiff = {
  beforeFix: "pool.max: unset",
  afterFix: "pool.max: 50",
  isFact: false,
  notes: "Tuned under load test",
};

const emptyDiff: ArchitectureDiff = {
  beforeFix: "",
  afterFix: "",
  isFact: true,
};

function makeIncident(
  overrides: Partial<PublishedIncident> = {},
): PublishedIncident {
  return {
    id: "inc-1",
    slug: "db-pool-exhaustion",
    title: "Connection pool exhaustion",
    company_name: "Acme",
    occurred_at: "2026-04-15T09:00:00Z",
    duration_minutes: 47,
    severity: "MAJOR",
    pattern: "RESOURCE_EXHAUSTION",
    summary: "Queries queued behind an unbounded pool",
    system: "order-service",
    technologies: ["Postgres", "Node.js"],
    timeline: [],
    root_cause_tree: [],
    architecture_diff: diff,
    prevention_actions: [],
    official_post_mortem_url: null,
    ...overrides,
  };
}

const cliEvents: TimelineEvent[] = [
  {
    id: "ev-cli",
    timestampOffsetMinutes: 5,
    stage: "DETECTION",
    title: "Alerts fired",
    description: "Queue depth alarm",
    affectedComponent: "metrics",
    cliCommands: ["psql -c 'select 1'", "k logs | grep pool"],
  },
];

describe("PublicIncidentEvidence", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;
  let clipboardDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    vi.restoreAllMocks();
  });

  it("renders configuration diff details with the interpretation badge", () => {
    render(
      <PublicIncidentEvidence
        incident={makeIncident()}
        events={[]}
        activeTab="config"
        onTabChange={() => {}}
      />,
    );
    expect(screen.getByText("pool.max: unset")).toBeTruthy();
    expect(screen.getByText("pool.max: 50")).toBeTruthy();
    expect(screen.getByText("Author interpretation")).toBeTruthy();
    expect(screen.getByText("Tuned under load test")).toBeTruthy();
  });

  it("marks a fact diff as recorded", () => {
    render(
      <PublicIncidentEvidence
        incident={makeIncident({
          architecture_diff: {
            beforeFix: "a",
            afterFix: "b",
            isFact: true,
          },
        })}
        events={[]}
        activeTab="config"
        onTabChange={() => {}}
      />,
    );
    expect(screen.getByText("Recorded as fact")).toBeTruthy();
  });

  it("disables empty tabs and falls back to the first available tab", () => {
    render(
      <PublicIncidentEvidence
        incident={makeIncident({
          architecture_diff: emptyDiff,
          official_post_mortem_url: "https://example.com/postmortem",
        })}
        events={cliEvents}
        activeTab="config"
        onTabChange={() => {}}
      />,
    );
    const configTab = screen.getByRole<HTMLButtonElement>("tab", {
      name: /Configuration/i,
    });
    const cliTab = screen.getByRole<HTMLButtonElement>("tab", {
      name: /CLI Commands/i,
    });
    const externalTab = screen.getByRole<HTMLButtonElement>("tab", {
      name: /External post-mortem/i,
    });
    expect(configTab.disabled).toBe(true);
    expect(cliTab.disabled).toBe(false);
    // The requested `config` tab has no evidence, so the effective tab is
    // the first available one: CLI.
    expect(cliTab.getAttribute("aria-selected")).toBe("true");
    expect(externalTab.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByText("Alerts fired")).toBeTruthy();
  });

  it("keeps a requested tab when it has evidence", () => {
    render(
      <PublicIncidentEvidence
        incident={makeIncident({
          official_post_mortem_url: "https://example.com/postmortem",
        })}
        events={cliEvents}
        activeTab="external"
        onTabChange={() => {}}
      />,
    );
    const externalTab = screen.getByRole("tab", {
      name: /External post-mortem/i,
    });
    expect(externalTab.getAttribute("aria-selected")).toBe("true");
    const link = screen.getByRole("link", {
      name: /example\.com\/postmortem/,
    });
    expect(link.getAttribute("href")).toBe("https://example.com/postmortem");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("lists CLI commands grouped under their timeline events", () => {
    render(
      <PublicIncidentEvidence
        incident={makeIncident({ architecture_diff: emptyDiff })}
        events={cliEvents}
        activeTab="cli"
        onTabChange={() => {}}
      />,
    );
    expect(screen.getByText("Alerts fired")).toBeTruthy();
    expect(screen.getByText("psql -c 'select 1'")).toBeTruthy();
    expect(screen.getByText("k logs | grep pool")).toBeTruthy();
  });

  it("falls back to the configuration panel when no tab has evidence", () => {
    render(
      <PublicIncidentEvidence
        incident={makeIncident({ architecture_diff: emptyDiff })}
        events={[]}
        activeTab="cli"
        onTabChange={() => {}}
      />,
    );
    expect(
      screen.getByText(
        "No configuration or change record was included in this report.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Configuration/i }).getAttribute("aria-selected")).toBe("true");
  });

  it("copies a command via the clipboard and shows a transient copied state", async () => {
    vi.useFakeTimers();
    render(
      <PublicIncidentEvidence
        incident={makeIncident({ architecture_diff: emptyDiff })}
        events={cliEvents}
        activeTab="cli"
        onTabChange={() => {}}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /^Copy$/ })[0]);
    });
    expect(writeTextMock).toHaveBeenCalledWith("psql -c 'select 1'");
    expect(screen.getByText("Copied")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Command copied.");
    // The copied state resets after the 1800ms timeout.
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.queryByText("Copied")).toBeNull();
  });

  it("clears the copied state when the clipboard write fails", async () => {
    writeTextMock.mockRejectedValueOnce(new Error("denied"));
    render(
      <PublicIncidentEvidence
        incident={makeIncident({ architecture_diff: emptyDiff })}
        events={cliEvents}
        activeTab="cli"
        onTabChange={() => {}}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /^Copy$/ })[0]);
    });
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Copy$/ })).toHaveLength(2);
  });

  it("falls back when the requested external tab has no link", () => {
    render(
      <PublicIncidentEvidence
        incident={makeIncident()}
        events={[]}
        activeTab="external"
        onTabChange={() => {}}
      />,
    );
    expect(screen.getByText("pool.max: unset")).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: /Configuration/i }).getAttribute("aria-selected"),
    ).toBe("true");
  });
});
