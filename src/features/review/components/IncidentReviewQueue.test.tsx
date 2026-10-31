/** @format */

/**
 * @vitest-environment jsdom
 *
 * UI tests for the reviewer-queue author identity block:
 *
 *  - Author name + email are shown when available.
 *  - Only email is shown when name is missing.
 *  - The block is omitted entirely when neither name nor email is present.
 *  - Each incident's author is bound to its own incident row.
 *
 * These tests exercise the *rendering* behavior only; the server-side
 * authorization boundary (reviewer-only) is covered by
 * `src/features/review/server/queries.test.ts`.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import IncidentReviewQueue from "@/features/review/components/IncidentReviewQueue";
import type { ReviewIncident } from "@/features/review/server/queries";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/review/server/actions", () => ({
  reviewIncident: vi.fn(),
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

describe("IncidentReviewQueue author identity block", () => {
  it("shows the author's name and email when both are present", () => {
    render(
      <IncidentReviewQueue
        incidents={[
          makeIncident({
            author_name: "Alex Morgan",
            author_email: "alex@example.com",
          }),
        ]}
      />,
    );
    expect(document.body.textContent).toContain("Submitted by");
    expect(document.body.textContent).toContain("Alex Morgan");
    expect(document.body.textContent).toContain("alex@example.com");
  });

  it("shows only the email when the name is missing", () => {
    render(
      <IncidentReviewQueue
        incidents={[
          makeIncident({ author_name: null, author_email: "only@example.com" }),
        ]}
      />,
    );
    expect(document.body.textContent).toContain("only@example.com");
    // The label is still shown; the name slot is omitted.
    expect(document.body.textContent).toContain("Submitted by");
  });

  it("omits the entire author block when neither name nor email is present", () => {
    render(
      <IncidentReviewQueue
        incidents={[makeIncident({ author_name: null, author_email: null })]}
      />,
    );
    expect(document.body.textContent).not.toContain("Submitted by");
  });

  it("binds each incident's author to its own row (no cross-association)", () => {
    const incidentA = makeIncident({
      id: "i-1",
      title: "Incident A",
      author_id: "user-A",
      author_name: "Author A",
      author_email: "a@example.com",
    });
    const incidentB = makeIncident({
      id: "i-2",
      title: "Incident B",
      author_id: "user-B",
      author_name: "Author B",
      author_email: "b@example.com",
    });

    // The queue renders one incident card at a time; each incident's author
    // block is scoped to that single incident's own data.
    const { unmount } = render(<IncidentReviewQueue incidents={[incidentA]} />);
    expect(document.body.textContent).toContain("Author A");
    expect(document.body.textContent).toContain("a@example.com");
    expect(document.body.textContent).not.toContain("Author B");
    unmount();

    render(<IncidentReviewQueue incidents={[incidentB]} />);
    expect(document.body.textContent).toContain("Author B");
    expect(document.body.textContent).toContain("b@example.com");
    expect(document.body.textContent).not.toContain("Author A");
  });
});
