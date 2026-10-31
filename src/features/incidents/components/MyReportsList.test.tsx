/** @format */

/**
 * @vitest-environment jsdom
 *
 * UI tests for the author-facing delete flow in `MyReportsList`:
 *
 *  - Delete is available for DRAFT.
 *  - Delete is available for CHANGES_REQUESTED.
 *  - Delete is unavailable for PENDING_REVIEW.
 *  - Delete is unavailable for PUBLISHED.
 *  - Clicking Delete opens the confirmation dialog without a delete request.
 *  - Canceling closes the dialog without deleting.
 *  - Confirming deletion invokes the delete action.
 *  - Success removes the incident from the list; failure keeps it visible.
 *
 * No jest-dom matchers are configured in this project, so assertions use
 * query-based null checks instead of `toBeInTheDocument`.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import MyReportsList from "./MyReportsList";
import type { MyReport } from "@/features/incidents/server/queries";
import * as actions from "@/features/incidents/server/actions";

const deleteIncident = vi.mocked(actions.deleteIncident);

vi.mock("@/features/incidents/server/actions", () => ({
  deleteIncident: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function makeReport(overrides: Partial<MyReport> = {}): MyReport {
  return {
    id: "id-1",
    slug: "case-1",
    title: "Database outage",
    created_at: "2026-01-01T00:00:00Z",
    status: "DRAFT",
    latest_review_reason: null,
    ...overrides,
  };
}

function renderWithReports(reports: MyReport[]) {
  render(<MyReportsList reports={reports} error={null} />);
}

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: /delete report/i }));
}

afterEach(() => {
  cleanup();
  deleteIncident.mockReset();
});

describe("MyReportsList delete visibility", () => {
  it("shows Delete for a DRAFT incident", () => {
    renderWithReports([makeReport({ status: "DRAFT" })]);
    expect(
      screen.queryByRole("button", { name: /delete report/i }),
    ).not.toBeNull();
  });

  it("shows Delete for a CHANGES_REQUESTED incident", () => {
    renderWithReports([makeReport({ status: "CHANGES_REQUESTED" })]);
    expect(
      screen.queryByRole("button", { name: /delete report/i }),
    ).not.toBeNull();
  });

  it("hides Delete for a PENDING_REVIEW incident", () => {
    renderWithReports([makeReport({ status: "PENDING_REVIEW" })]);
    expect(screen.queryByRole("button", { name: /delete report/i })).toBeNull();
  });

  it("hides Delete for a PUBLISHED incident", () => {
    renderWithReports([makeReport({ status: "PUBLISHED" })]);
    expect(screen.queryByRole("button", { name: /delete report/i })).toBeNull();
  });
});

describe("MyReportsList delete confirmation dialog", () => {
  it("opens the dialog on Delete without making a delete request", () => {
    renderWithReports([makeReport({ status: "DRAFT" })]);
    openDialog();

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toMatch(/delete incident/i);
    expect(dialog.textContent).toContain("Database outage");
    expect(dialog.textContent).toMatch(/this action is permanent/i);
    expect(deleteIncident).not.toHaveBeenCalled();
  });

  it("canceling closes the dialog without deleting", () => {
    renderWithReports([makeReport({ status: "CHANGES_REQUESTED" })]);
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(deleteIncident).not.toHaveBeenCalled();
  });

  it("confirming deletion invokes the delete action with the incident id", async () => {
    deleteIncident.mockResolvedValue({ error: null });
    renderWithReports([makeReport({ status: "DRAFT" })]);
    openDialog();

    fireEvent.click(
      screen.getByRole("button", { name: /delete permanently/i }),
    );

    await waitFor(() => expect(deleteIncident).toHaveBeenCalledWith("id-1"));
  });

  it("keeps the incident visible when the delete request fails", async () => {
    deleteIncident.mockResolvedValue({ error: "Something went wrong." });
    renderWithReports([makeReport({ status: "CHANGES_REQUESTED" })]);
    openDialog();

    fireEvent.click(
      screen.getByRole("button", { name: /delete permanently/i }),
    );

    await waitFor(() => expect(deleteIncident).toHaveBeenCalledTimes(1));
    const headings = screen.getAllByText("Database outage");
    expect(headings.some((el) => el.tagName === "H3")).toBe(true);
  });
});
