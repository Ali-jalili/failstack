/** @format */

/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import IncidentArchive from "./IncidentArchive";
import type { PublishedIncidentSummary } from "@/features/incidents/server/queries";

function makeIncident(
  overrides: Partial<PublishedIncidentSummary> = {},
): PublishedIncidentSummary {
  return {
    id: "incident-1",
    slug: "payment-api-outage",
    title: "Payment API outage",
    company_name: "Example",
    occurred_at: "2026-10-19T12:00:00Z",
    duration_minutes: 25,
    severity: "CRITICAL",
    pattern: "CASCADING_FAILURE",
    summary: "Requests failed after a deployment changed timeout settings.",
    system: "Payment API",
    technologies: ["PostgreSQL"],
    prevention_actions: [],
    timelineCount: 1,
    timelinePreview: [
      {
        stage: "TRIGGER",
        timestampOffsetMinutes: 0,
        title: "New deployment reached production",
      },
    ],
    ...overrides,
  };
}

afterEach(cleanup);

describe("IncidentArchive", () => {
  it("renders published incidents as linked radar rows", () => {
    render(
      <IncidentArchive
        incidents={[
          makeIncident(),
          makeIncident({
            id: "incident-2",
            slug: "auth-latency",
            title: "Authentication latency",
            severity: "MINOR",
            system: "Authentication Service",
            occurred_at: "2026-10-18T12:00:00Z",
            timelinePreview: [],
            timelineCount: 0,
          }),
          makeIncident({
            id: "incident-3",
            slug: "database-recovery",
            title: "Database recovery",
            severity: "MAJOR",
            system: "Database",
          }),
        ]}
        error={null}
      />,
    );

    expect(screen.getByRole("link", { name: /Payment API outage/i })).not.toBeNull();
    expect(screen.getByRole("link", { name: /Authentication latency/i })).not.toBeNull();
    expect(screen.getByLabelText("Archive totals").textContent).toContain(
      "3Published case files",
    );
    expect(screen.getByRole("link", { name: /Payment API outage/i }).getAttribute("href"))
      .toBe("/incidents/report/payment-api-outage");
    expect(
      screen
        .getByRole("link", { name: /Authentication latency/i })
        .getAttribute("href"),
    ).toBe("/incidents/report/auth-latency");
    expect(screen.getAllByText("1 event")).toHaveLength(2);
  });

  it("filters by supported search fields, severity, and derived system names", () => {
    render(
      <IncidentArchive
        incidents={[
          makeIncident(),
          makeIncident({
            id: "incident-2",
            slug: "auth-latency",
            title: "Authentication latency",
            severity: "MINOR",
            system: "Authentication Service",
            technologies: ["Redis"],
          }),
        ]}
        error={null}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Redis" },
    });
    expect(screen.getByRole("link", { name: /Authentication latency/i })).not.toBeNull();
    expect(screen.queryByRole("link", { name: /Payment API outage/i })).toBeNull();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CRITICAL" },
    });
    expect(screen.getByRole("link", { name: /Payment API outage/i })).not.toBeNull();
    expect(screen.queryByRole("link", { name: /Authentication latency/i })).toBeNull();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "ALL" },
    });
    fireEvent.click(screen.getByRole("button", { name: /authentication service/i }));
    expect(screen.getByRole("link", { name: /Authentication latency/i })).not.toBeNull();
    expect(screen.queryByRole("link", { name: /Payment API outage/i })).toBeNull();
  });

  it("shows no fabricated timeline stages when the archive has no timeline preview", () => {
    render(
      <IncidentArchive
        incidents={[
          makeIncident({
            timelineCount: 0,
            timelinePreview: [],
            prevention_actions: [],
          }),
        ]}
        error={null}
      />,
    );

    expect(screen.getByText("Payment API outage")).not.toBeNull();
    expect(screen.queryByText("Trigger")).toBeNull();
    expect(screen.queryByText("New deployment reached production")).toBeNull();
  });

  it("keeps all filtered cases in one scrollable incident list", () => {
    const incidents = Array.from({ length: 8 }, (_, index) =>
      makeIncident({
        id: `incident-${index}`,
        slug: `incident-${index}`,
        title: `Incident ${index}`,
      }),
    );

    render(<IncidentArchive incidents={incidents} error={null} />);

    const list = screen.getByRole("region", { name: "Published incidents" });
    expect(list.getAttribute("tabindex")).toBe("0");
    expect(screen.getAllByRole("link")).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /load more cases/i })).toBeNull();
  });
});
