/** @format */
/**
 * @vitest-environment jsdom
 *
 * QA-013 regression: validation error messages must not remain visible
 * after the user corrects a previously empty/invalid required field.
 *
 * The incident form's simple text fields (form-fields.tsx) already clear
 * their error on change. The array-based steps (Prevention, Timeline,
 * Root-cause) register their leaf inputs directly, so without explicit
 * `clearErrors` calls the array-level "at least one" / "at least two"
 * errors stay on screen after the user adds the required item. This test
 * locks in the corrected behavior.
 */

import { describe, expect, it, afterEach } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incidentFormSchema, type IncidentFormValues } from "../form-schema";
import PreventionReviewStep from "./PreventionReviewStep";
import TimelineStep from "./TimelineStep";
import RootCauseArchitectureStep from "./RootCauseArchitectureStep";

function buildDefaults(): IncidentFormValues {
  return {
    title: "An outage",
    companyName: "Acme",
    occurredAt: "2026-01-01T00:00:00Z",
    durationMinutes: 5,
    severity: "MINOR",
    pattern: "SINGLE_POINT_OF_FAILURE",
    summary: "A summary long enough.",
    officialPostMortemUrl: "",
    system: "orders-service",
    technologies: ["kubernetes"],
    timeline: [],
    rootCauseTree: [],
    architectureDiff: {
      beforeFix: "",
      afterFix: "",
      isFact: true,
      notes: "",
    },
    preventionActions: [],
  };
}

interface TriggerOptions {
  fields: (keyof IncidentFormValues)[];
  step: "prevention" | "timeline" | "root-cause";
}

function Harness({ fields, step }: TriggerOptions) {
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: buildDefaults(),
  });

  return (
    <FormProvider {...form}>
      <form noValidate>
        <button
          type="button"
          onClick={() => {
            void form.trigger(fields);
          }}
        >
          Validate
        </button>
        {step === "prevention" ? (
          <PreventionReviewStep />
        ) : step === "timeline" ? (
          <TimelineStep />
        ) : (
          <RootCauseArchitectureStep />
        )}
      </form>
    </FormProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe("QA-013: stale required-field errors clear after correction", () => {
  it("clears the 'at least one prevention action' error when an action is added", async () => {
    render(<Harness fields={["preventionActions"]} step="prevention" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    });

    const message = "At least one prevention action is required";
    await waitFor(() => expect(screen.getAllByText(message).length).toBe(1));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Add action/i }));
    });

    await waitFor(() => {
      expect(screen.queryByText(message)).toBeNull();
    });
  });

  it("clears the 'at least 2 timeline events' error when events are added", async () => {
    render(<Harness fields={["timeline"]} step="timeline" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    });

    const message = "At least 2 timeline events are required";
    await waitFor(() => expect(screen.queryByText(message)).not.toBeNull());

    // Adding one event resolves the "at least 2" error.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Add event/i }));
    });

    await waitFor(() => {
      expect(screen.queryByText(message)).toBeNull();
    });
  });

  it("clears the 'at least one prevention action title' leaf error on input", async () => {
    render(<Harness fields={["preventionActions"]} step="prevention" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    });

    // Add an action so a leaf title field exists, then validate leaf.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Add action/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    });

    const leafMessage = "Prevention action title is required";
    await waitFor(() =>
      expect(screen.queryAllByText(leafMessage).length).toBeGreaterThan(0),
    );

    const input = document.getElementById(
      "prevention-action-0-title",
    ) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "Add alerts" } });
    });

    // The leaf-level "title" error should clear after the user fills it in.
    await waitFor(() => {
      expect(screen.queryByText(leafMessage)).toBeNull();
    });
  });
});
