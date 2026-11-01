/** @format */

/**
 * @vitest-environment jsdom
 *
 * UI tests for the dedicated incident detail's decision flow
 * (`incident-review-detail.tsx`):
 *
 *  - Approve success + a next pending incident → auto-advance to it.
 *  - Approve success + no next incident → navigate to the queue, which
 *    shows the queue-clear / completed state.
 *  - Decision failure → stay on the incident and surface the error, with a
 *    refresh affordance.
 *  - CHANGES_REQUESTED requires a reason before submitting.
 *
 * The server action's own validation/authz is covered by
 * `src/features/review/server/actions.test.ts`.
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { IncidentReviewDetail } from "./incident-review-detail";
import { reviewIncident } from "@/features/review/server/actions";
import type { ReviewIncident } from "@/features/review/server/queries";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
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

function renderDetail(nextIncidentId: string | null) {
  render(
    <IncidentReviewDetail
      incident={makeIncident()}
      nextIncidentId={nextIncidentId}
      position={1}
      totalPending={nextIncidentId ? 2 : 1}
    />,
  );
}

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
  vi.mocked(reviewIncident).mockReset();
});

afterEach(() => {
  cleanup();
});

describe("decision flow — success", () => {
  it("auto-advances to the next pending incident when one exists", async () => {
    vi.mocked(reviewIncident).mockResolvedValue({ error: null });
    renderDetail("i-2");

    fireEvent.click(screen.getByRole("button", { name: /approve & publish/i }));

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/review/incidents/i-2"),
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("navigates back to the queue when this was the last pending incident", async () => {
    vi.mocked(reviewIncident).mockResolvedValue({ error: null });
    renderDetail(null);

    fireEvent.click(screen.getByRole("button", { name: /approve & publish/i }));

    // No next incident: the inline queue-completed state is shown instead of
    // an auto-advance, and the return-to-queue link is present.
    await waitFor(() => expect(screen.getByText("Queue clear")).toBeTruthy());
    expect(
      screen.getByRole("link", { name: /return to review queue/i }),
    ).toBeTruthy();
  });
});

describe("decision flow — failure stays put", () => {
  it("surfaces the action error and does not navigate", async () => {
    vi.mocked(reviewIncident).mockResolvedValue({
      error: "Could not save this decision.",
    });
    renderDetail("i-2");

    fireEvent.click(screen.getByRole("button", { name: /approve & publish/i }));

    await waitFor(() =>
      expect(screen.getByText("Could not save this decision.")).toBeTruthy(),
    );
    expect(pushMock).not.toHaveBeenCalled();
    // The incident remains visible; a refresh affordance is offered.
    expect(screen.getByRole("button", { name: /refresh/i })).toBeTruthy();
  });

  it("requires a reason before a change request can be submitted", async () => {
    vi.mocked(reviewIncident).mockResolvedValue({ error: null });
    renderDetail("i-2");

    fireEvent.click(screen.getByRole("button", { name: /request changes/i }));
    const textarea = screen.getByRole("textbox");
    fireEvent.click(
      screen.getByRole("button", { name: /send change request/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("Enter a reason before requesting changes."),
      ).toBeTruthy(),
    );
    // Blocked at the client boundary: the action is never called.
    expect(reviewIncident).not.toHaveBeenCalled();
    expect(textarea).toBeTruthy();
  });

  it("sends a change request with the reason and auto-advances on success", async () => {
    vi.mocked(reviewIncident).mockResolvedValue({ error: null });
    renderDetail("i-2");

    fireEvent.click(screen.getByRole("button", { name: /request changes/i }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Timeline is incomplete." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /send change request/i }),
    );

    await waitFor(() =>
      expect(reviewIncident).toHaveBeenCalledWith({
        incidentId: "i-1",
        action: "CHANGES_REQUESTED",
        reason: "Timeline is incomplete.",
      }),
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/review/incidents/i-2"),
    );
  });
});
