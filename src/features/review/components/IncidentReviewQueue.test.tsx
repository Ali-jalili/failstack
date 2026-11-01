/** @format */

/**
 * @vitest-environment jsdom
 *
 * UI tests for the link-list review queue (`IncidentReviewQueue`):
 *
 *  - Each pending incident renders as a link to its own detail route
 *    (`/review/incidents/{id}`), giving every incident a directly
 *    addressable URL.
 *  - The author's name/email is shown inline when available.
 *  - The empty state is shown when there are no pending incidents.
 *
 * The server-side authorization boundary is covered by
 * `src/features/review/server/queries.test.ts`.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import IncidentReviewQueue from "./IncidentReviewQueue";
import type { ReviewIncident } from "@/features/review/server/queries";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function makeIncident(overrides: Partial<ReviewIncident> = {}): ReviewIncident {
  return {
    id: "i-1",
    slug: "db-outage",
    title: "Database outage",
    company_name: "Acme",
    occurred_at: "2026-01-01T00:00:00Z",
    duration_minutes: 45,
    severity: "MAJOR",
    pattern: "CASCADING_FAILURE",
    summary: "A database outage affected order processing.",
    official_post_mortem_url: null,
    system: "orders-service",
    technologies: ["PostgreSQL"],
    timeline: [],
    root_cause_tree: [],
    architecture_diff: {
      beforeFix: "Single database instance",
      afterFix: "Automated failover",
      isFact: true,
    },
    prevention_actions: [],
    created_at: "2026-01-01T00:00:00Z",
    author_id: "user-1",
    author_name: "Alex Morgan",
    author_email: "alex@example.com",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("IncidentReviewQueue (link-list) rows", () => {
  it("links each incident to its dedicated detail route", () => {
    const a = makeIncident({ id: "i-1", title: "Incident A" });
    const b = makeIncident({ id: "i-2", title: "Incident B" });
    render(<IncidentReviewQueue incidents={[a, b]} />);

    const links = screen.getAllByRole("link");
    const detailLinks = links.filter((link) =>
      link.getAttribute("href")?.startsWith("/review/incidents/"),
    );
    expect(detailLinks).toHaveLength(2);
    expect(detailLinks[0].getAttribute("href")).toBe("/review/incidents/i-1");
    expect(detailLinks[1].getAttribute("href")).toBe("/review/incidents/i-2");
  });

  it("shows the author's name when available", () => {
    render(
      <IncidentReviewQueue
        incidents={[
          makeIncident({ author_name: "Alex Morgan", author_email: null }),
        ]}
      />,
    );
    expect(screen.getByText("Alex Morgan")).toBeTruthy();
  });

  it("falls back to the author's email when the name is missing", () => {
    render(
      <IncidentReviewQueue
        incidents={[
          makeIncident({ author_name: null, author_email: "only@example.com" }),
        ]}
      />,
    );
    expect(screen.getByText("only@example.com")).toBeTruthy();
  });

  it("omits the author slot entirely when neither name nor email is present", () => {
    render(
      <IncidentReviewQueue
        incidents={[makeIncident({ author_name: null, author_email: null })]}
      />,
    );
    expect(screen.queryByText("only@example.com")).toBeNull();
  });
});

describe("IncidentReviewQueue (link-list) empty state", () => {
  it("renders the queue-clear state when there are no pending incidents", () => {
    render(<IncidentReviewQueue incidents={[]} />);
    expect(screen.getByText("Queue clear")).toBeTruthy();
    expect(screen.getByText("No reports awaiting review")).toBeTruthy();
  });
});
