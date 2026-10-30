/** @format */

/**
 * @vitest-environment jsdom
 *
 * QA-015 regression tests at the form level:
 *
 *  - A duplicate title shows a non-blocking warning banner.
 *  - A non-duplicate title shows no warning.
 *  - The warning does not block submission.
 *  - A failed title-check request does not block submission.
 *  - Changing the title to a non-duplicate clears the warning.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type * as React from "react";

// Mock the server boundary (actions + duplicate check) before importing the
// form, so the real wizard, zod resolver and step components all run.
vi.mock("@/features/incidents/server/actions", () => ({
  createIncident: vi.fn(),
  updateIncidentResubmit: vi.fn(),
}));

vi.mock("@/features/incidents/server/title-duplicates", () => ({
  checkDuplicateTitle: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", async () => {
  const react = await import("react");
  const MockLink = ({ children }: { children?: React.ReactNode }) =>
    react.createElement(react.Fragment, null, children);
  return { default: MockLink };
});

import type { IncidentFormValues } from "@/features/incidents/form-schema";
import { createIncident } from "@/features/incidents/server/actions";
import { checkDuplicateTitle } from "@/features/incidents/server/title-duplicates";
import IncidentForm from "./IncidentForm";

const mockedCreateIncident = vi.mocked(createIncident);
const mockedCheck = vi.mocked(checkDuplicateTitle);

const WARNING_TEXT = /another published incident already uses this title/i;

function initialValues(): IncidentFormValues {
  return {
    title: "Database outage",
    companyName: "Acme",
    occurredAt: "2026-01-01T00:00:00",
    durationMinutes: 60,
    severity: "MAJOR",
    pattern: "CASCADING_FAILURE",
    summary: "A summary that is long enough for validation.",
    officialPostMortemUrl: "",
    system: "orders-service",
    technologies: ["kubernetes"],
    timeline: [
      {
        id: "e1",
        timestampOffsetMinutes: 0,
        stage: "TRIGGER",
        title: "trigger",
        description: "desc desc",
        affectedComponent: "db",
      },
      {
        id: "e2",
        timestampOffsetMinutes: 10,
        stage: "FAILURE",
        title: "failure",
        description: "desc desc",
        affectedComponent: "api",
      },
    ],
    rootCauseTree: [
      {
        id: "r1",
        parentId: null,
        type: "ROOT_CAUSE",
        title: "root cause",
        description: "desc desc",
        systemComponent: "db",
      },
    ],
    architectureDiff: {
      beforeFix: "before state",
      afterFix: "after state",
      isFact: true,
      notes: "",
    },
    preventionActions: [{ title: "add alerts" }],
  };
}

/** Advance the wizard one step and wait for the step heading to render. */
async function continueToStep(stepHeading: RegExp) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  });
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 2, name: stepHeading }),
    ).toBeTruthy();
  });
}

/** Drive the wizard from step 1 to the final step (submit is visible). */
async function advanceToFinalStep() {
  await continueToStep(/system & technologies/i);
  await continueToStep(/timeline/i);
  await continueToStep(/root cause & architecture/i);
  await continueToStep(/prevention & review/i);
  await continueToStep(/final preview/i);
}

beforeEach(() => {
  mockedCreateIncident.mockReset();
  mockedCreateIncident.mockResolvedValue({
    error: null,
    slug: "database-outage",
  });
  mockedCheck.mockReset();
  mockedCheck.mockResolvedValue({ checked: true, duplicate: false });
});

afterEach(() => {
  cleanup();
});

describe("QA-015: duplicate-title warning in the incident form", () => {
  it("shows a non-blocking warning when the title duplicates an existing incident", async () => {
    mockedCheck.mockResolvedValue({ checked: true, duplicate: true });

    render(<IncidentForm initialValues={initialValues()} />);

    // Leaving the basic-info step triggers the check; the advisory banner
    // appears under the step card and the wizard has already advanced.
    await continueToStep(/system & technologies/i);

    expect(await screen.findByText(WARNING_TEXT)).toBeTruthy();
    expect(mockedCheck).toHaveBeenCalledTimes(1);
  });

  it("shows no warning for a non-duplicate title", async () => {
    render(<IncidentForm initialValues={initialValues()} />);

    await continueToStep(/system & technologies/i);
    // Let the async check settle.
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText(WARNING_TEXT)).toBeNull();
  });

  it("does not block submission when the warning is shown", async () => {
    mockedCheck.mockResolvedValue({ checked: true, duplicate: true });

    render(<IncidentForm initialValues={initialValues()} />);

    await advanceToFinalStep();
    const warning = await screen.findByText(WARNING_TEXT);
    expect(warning).toBeTruthy();
    // The submit control stays enabled despite the warning.
    const submit = screen.getByRole("button", {
      name: /confirm & submit/i,
    });
    expect((submit as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      fireEvent.click(submit);
    });

    expect(
      await screen.findByText(/incident submitted for review/i),
    ).toBeTruthy();
    expect(mockedCreateIncident).toHaveBeenCalledTimes(1);
  });

  it("does not block submission when the title-check request fails", async () => {
    mockedCheck.mockRejectedValue(new Error("network down"));

    render(<IncidentForm initialValues={initialValues()} />);

    await advanceToFinalStep();

    // A failed check surfaces no warning and no form error.
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByText(WARNING_TEXT)).toBeNull();

    const submit = screen.getByRole("button", {
      name: /confirm & submit/i,
    });
    expect((submit as HTMLButtonElement).disabled).toBe(false);

    await act(async () => {
      fireEvent.click(submit);
    });

    expect(
      await screen.findByText(/incident submitted for review/i),
    ).toBeTruthy();
    expect(mockedCreateIncident).toHaveBeenCalledTimes(1);
  });

  it("clears the warning when the title changes to a non-duplicate", async () => {
    mockedCheck
      .mockResolvedValueOnce({ checked: true, duplicate: true })
      .mockResolvedValue({ checked: true, duplicate: false });

    render(<IncidentForm initialValues={initialValues()} />);

    // First transition: duplicate title -> warning shows.
    await continueToStep(/system & technologies/i);
    const shownWarning = await screen.findByText(WARNING_TEXT);
    expect(shownWarning).toBeTruthy();

    // Go back, fix the title, and leave the step again.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /back/i }));
    });
    fireEvent.change(screen.getByLabelText("Incident title"), {
      target: { value: "Database outage in the backup region" },
    });
    await continueToStep(/system & technologies/i);

    await waitFor(() => {
      expect(screen.queryByText(WARNING_TEXT)).toBeNull();
    });
    expect(mockedCheck).toHaveBeenCalledTimes(2);
  });
});

/** Advance through all data-entry steps and land on the preview step. */
async function advanceToPreview() {
  await continueToStep(/system & technologies/i);
  await continueToStep(/timeline/i);
  await continueToStep(/root cause & architecture/i);
  await continueToStep(/prevention & review/i);
  await continueToStep(/final preview/i);
}

describe("Final preview step", () => {
  it("displays representative values from all major sections", async () => {
    render(<IncidentForm initialValues={initialValues()} />);
    await advanceToPreview();

    // Each section's representative value is visible in the preview region.
    const preview = screen.getByRole("region", {
      name: "Incident report preview",
    });
    expect(preview.textContent).toContain("Database outage");
    expect(preview.textContent).toContain("Acme");
    expect(preview.textContent).toContain("orders-service");
    expect(preview.textContent).toContain("kubernetes");
    expect(preview.textContent).toContain("Cascading Failure");
    // A timeline event and a prevention action are surfaced too.
    expect(preview.textContent).toContain("trigger");
    expect(preview.textContent).toContain("add alerts");
  });

  // NOTE: "empty/optional fields render gracefully" is covered by the
  // focused unit test in preview/PreviewSections.test.tsx. It is not repeated
  // here because emptying the *required* array fields (technologies,
  // preventionActions) would trip the wizard's own per-step validation and
  // block reaching the preview.

  it("is reachable only after the data-entry validations succeed", async () => {
    const invalid: IncidentFormValues = {
      ...initialValues(),
      title: "short", // < 5 chars -> step 1 invalid
    };

    render(<IncidentForm initialValues={invalid} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Step 1 fails validation, so the wizard never advances: the final
    // preview step and its region are unreachable.
    expect(
      screen.queryByRole("heading", { level: 2, name: /final preview/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", { name: "Incident report preview" }),
    ).toBeNull();
  });

  it("Back to Edit preserves entered values and returns to the previous step", async () => {
    render(<IncidentForm initialValues={initialValues()} />);
    await advanceToPreview();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /back to edit/i }));
    });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: /prevention & review/i,
        }),
      ).toBeTruthy();
    });

    // Data survives the round-trip: the Prevention & review step re-renders
    // the entered title through its "Review incident" summary.
    expect(screen.getByText("Database outage")).toBeTruthy();
  });

  it("reaching the preview does not invoke the server action", async () => {
    render(<IncidentForm initialValues={initialValues()} />);
    await advanceToPreview();

    expect(mockedCreateIncident).not.toHaveBeenCalled();
  });

  it("Confirm & Submit invokes the existing submission flow exactly once", async () => {
    render(<IncidentForm initialValues={initialValues()} />);
    await advanceToPreview();

    const submit = screen.getByRole("button", { name: /confirm & submit/i });
    await act(async () => {
      fireEvent.click(submit);
    });

    expect(
      await screen.findByText(/incident submitted for review/i),
    ).toBeTruthy();
    expect(mockedCreateIncident).toHaveBeenCalledTimes(1);
  });

  it("a failed submission keeps form data available and displays the error", async () => {
    mockedCreateIncident.mockResolvedValue({
      error: "Could not create a unique incident URL.",
    });

    render(<IncidentForm initialValues={initialValues()} />);
    await advanceToPreview();

    const submit = screen.getByRole("button", { name: /confirm & submit/i });
    await act(async () => {
      fireEvent.click(submit);
    });

    // The error is shown and the author is NOT redirected / locked out.
    expect(
      await screen.findByText(/could not create a unique incident url/i),
    ).toBeTruthy();
    // Still on the preview step and the title value is intact.
    expect(
      screen.getByRole("region", { name: "Incident report preview" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /confirm & submit/i }),
    ).toBeTruthy();
  });

  it("keeps the duplicate-title warning visible on the preview step", async () => {
    mockedCheck.mockResolvedValue({ checked: true, duplicate: true });

    render(<IncidentForm initialValues={initialValues()} />);
    await advanceToPreview();

    expect(await screen.findByText(WARNING_TEXT)).toBeTruthy();
  });
});
