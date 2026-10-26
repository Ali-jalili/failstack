/** @format */

import { describe, expect, it } from "vitest";
import { incidentFormSchema, incidentTimelineSchema } from "./form-schema";

/**
 * Tests lock in the behavior of the incident validation schemas.
 *
 * `incidentFormSchema` is assembled from each step's `.shape`, which drops
 * object-level refinements in Zod v4. The two "first timeline event" rules
 * (stage === "TRIGGER", timestampOffsetMinutes === 0) are therefore
 * re-applied directly on `incidentFormSchema` so the full form — and the
 * server actions that validate against it — enforce them. These tests
 * assert that both `incidentFormSchema` and `incidentTimelineSchema` reject
 * a non-TRIGGER or non-zero first event, and that valid forms still pass.
 */

function event(
  overrides: {
    id: string;
    offset?: number;
    stage?: string;
  } = { id: "e" },
): Record<string, unknown> {
  return {
    id: overrides.id,
    timestampOffsetMinutes: overrides.offset ?? 0,
    stage: overrides.stage ?? "TRIGGER",
    title: "a title",
    description: "a description",
    affectedComponent: "comp",
  };
}

const validArchitectureDiff = {
  beforeFix: "before state",
  afterFix: "after state",
  isFact: true,
};

function rcaRoot(): Record<string, unknown> {
  return {
    id: "r1",
    parentId: null,
    type: "ROOT_CAUSE",
    title: "root cause",
    description: "root desc",
    systemComponent: "db",
  };
}

const validForm: Record<string, unknown> = {
  title: "An outage",
  companyName: "Acme",
  occurredAt: "2026-01-01T00:00:00Z",
  durationMinutes: 120,
  severity: "MAJOR",
  pattern: "CASCADING_FAILURE",
  summary: "A summary that is long enough.",
  system: "orders-service",
  technologies: ["kubernetes"],
  timeline: [
    event({ id: "e1" }),
    event({ id: "e2", offset: 10, stage: "FAILURE" }),
  ],
  rootCauseTree: [rcaRoot()],
  architectureDiff: validArchitectureDiff,
  preventionActions: [{ title: "add alerts" }],
};

function parse(form: Record<string, unknown>) {
  return incidentFormSchema.safeParse(form as object);
}

describe("incidentFormSchema", () => {
  it("accepts a fully valid form", () => {
    expect(parse(validForm).success).toBe(true);
  });

  it("rejects a non-URL officialPostMortemUrl", () => {
    const r = parse({ ...validForm, officialPostMortemUrl: "not a url" });
    expect(r.success).toBe(false);
  });

  it("rejects a zero/negative duration", () => {
    expect(parse({ ...validForm, durationMinutes: 0 }).success).toBe(false);
  });

  it("requires at least one technology", () => {
    expect(parse({ ...validForm, technologies: [] }).success).toBe(false);
  });

  it("requires at least two timeline events", () => {
    const r = parse({ ...validForm, timeline: [event({ id: "e1" })] });
    expect(r.success).toBe(false);
  });

  describe("root cause tree (enforced)", () => {
    it("rejects a tree with two root nodes", () => {
      const r = parse({
        ...validForm,
        rootCauseTree: [
          rcaRoot(),
          { ...rcaRoot(), id: "r2", type: "ROOT_CAUSE" },
        ],
      });
      expect(r.success).toBe(false);
    });

    it("rejects a tree with zero root nodes", () => {
      const r = parse({
        ...validForm,
        rootCauseTree: [
          {
            ...rcaRoot(),
            id: "c1",
            parentId: "r1",
            type: "CONTRIBUTING_FACTOR",
          },
        ],
      });
      expect(r.success).toBe(false);
    });
  });

  describe("architecture diff (enforced)", () => {
    it("requires notes when isFact is false", () => {
      const r = parse({
        ...validForm,
        architectureDiff: { ...validArchitectureDiff, isFact: false },
      });
      expect(r.success).toBe(false);
    });
  });

  describe("first-event rules (enforced on the full form)", () => {
    it("rejects a first event that is not TRIGGER", () => {
      const r = parse({
        ...validForm,
        timeline: [
          event({ id: "e1", stage: "FAILURE" }),
          event({ id: "e2", offset: 10, stage: "TRIGGER" }),
        ],
      });
      expect(r.success).toBe(false);
    });

    it("rejects a first event with a non-zero offset", () => {
      const r = parse({
        ...validForm,
        timeline: [
          event({ id: "e1", offset: 5 }),
          event({ id: "e2", offset: 10, stage: "FAILURE" }),
        ],
      });
      expect(r.success).toBe(false);
    });

    it("still accepts a valid timeline (TRIGGER at offset 0)", () => {
      expect(parse(validForm).success).toBe(true);
    });
  });
});

describe("incidentTimelineSchema (Step 3 refinements, enforced when used directly)", () => {
  function parseTimeline(timeline: Record<string, unknown>[]) {
    return incidentTimelineSchema.safeParse({ timeline });
  }

  it("accepts a first event that is TRIGGER at offset 0", () => {
    expect(
      parseTimeline([
        event({ id: "e1" }),
        event({ id: "e2", offset: 10, stage: "FAILURE" }),
      ]).success,
    ).toBe(true);
  });

  it("rejects a first event that is not TRIGGER", () => {
    const r = parseTimeline([
      event({ id: "e1", stage: "FAILURE" }),
      event({ id: "e2", offset: 10, stage: "TRIGGER" }),
    ]);
    expect(r.success).toBe(false);
  });

  it("rejects a first event with a non-zero offset", () => {
    const r = parseTimeline([
      event({ id: "e1", offset: 5 }),
      event({ id: "e2", offset: 10, stage: "FAILURE" }),
    ]);
    expect(r.success).toBe(false);
  });
});
