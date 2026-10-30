/** @format */

/**
 * @vitest-environment jsdom
 *
 * Focused unit tests for the preview sections: they must render empty and
 * optional values gracefully (graceful placeholders, never raw
 * `undefined` / `null`). Rendering the sections directly with empty props
 * keeps this decoupled from the wizard's required-field validation.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ArchitectureSection,
  BasicInfoSection,
  PreventionSection,
  RootCauseSection,
  SystemSection,
  TimelineSection,
} from "./PreviewSections";

function assertNoRawState() {
  const visible = document.body.textContent ?? "";
  expect(visible).not.toContain("undefined");
  expect(visible).not.toContain("null");
}

describe("Preview sections — graceful empty/optional rendering", () => {
  it("renders empty optional fields without leaking undefined/null", () => {
    render(
      <BasicInfoSection
        title="Database outage"
        companyName=""
        occurredAt=""
        durationMinutes={0}
        severity="MINOR"
        pattern="SINGLE_POINT_OF_FAILURE"
        summary=""
        officialPostMortemUrl={undefined}
      />,
    );
    assertNoRawState();
    // Empty company / summary fall back to a graceful placeholder.
    expect(document.body.textContent).toContain("Not provided");
  });

  it("shows a placeholder when no technologies are recorded", () => {
    render(<SystemSection system="orders-service" technologies={[]} />);
    expect(screen.getByText("No technologies recorded")).toBeTruthy();
    assertNoRawState();
  });

  it("shows a placeholder when the timeline is empty", () => {
    render(<TimelineSection events={[]} occurredAt="2026-01-01T00:00:00" />);
    expect(screen.getByText("No timeline events recorded")).toBeTruthy();
    assertNoRawState();
  });

  it("shows a placeholder when there are no root-cause nodes", () => {
    render(<RootCauseSection nodes={[]} />);
    expect(screen.getByText("No root-cause nodes recorded")).toBeTruthy();
    assertNoRawState();
  });

  it("renders an empty reconstructed architecture without leaking undefined", () => {
    render(
      <ArchitectureSection
        diff={{ beforeFix: "", afterFix: "", isFact: false, notes: "" }}
      />,
    );
    expect(screen.getByText("Reconstructed")).toBeTruthy();
    // Empty before/after show a graceful "Not recorded" rather than blank.
    expect(document.body.textContent).toContain("Not recorded");
    assertNoRawState();
  });

  it("shows a placeholder when there are no prevention actions", () => {
    render(<PreventionSection actions={[]} />);
    expect(screen.getByText("No prevention actions recorded")).toBeTruthy();
    assertNoRawState();
  });
});
