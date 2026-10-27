/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArchitectureDiff, TimelineEvent } from "@/types/incident";
import {
  getPublishedIncidentBySlug,
  getPublishedIncidentSummaries,
} from "./queries";

// `server-only` is a Next bundler-only guard module imported by
// `current-user.ts` (which `./queries` pulls in via auth helpers). Under
// Vitest it must be stubbed just so the module graph can load. Neither of the
// functions tested below reaches the auth layer, so no current-user mock is
// needed.
vi.mock("server-only", () => ({}));

// Minimal Supabase client mock. `createClient().from("incidents")` returns one
// shared fluent chain (select/eq/order return the chain so calls compose).
// Real Supabase builders are also *thenable*: awaiting the chain (as
// `getPublishedIncidentSummaries` does) or calling `maybeSingle()` both yield
// `{ data, error }`. We model that with a `then` that resolves the current
// `chainResult`, and tests drive it per-case via `setChainResult()`.
let chainResult: { data: unknown; error: { message: string } | null } = {
  data: null,
  error: null,
};
let orderCalls: unknown[] = [];
let eqCalls: Array<[string, unknown]> = [];

const selectMock = vi.fn(() => chain);
const eqMock = vi.fn((column: string, value: unknown) => {
  eqCalls.push([column, value]);
  return chain;
});
const orderMock = vi.fn((col: string, opts: unknown) => {
  orderCalls.push([col, opts]);
  return chain;
});
const maybeSingleMock = vi.fn(() => Promise.resolve({ ...chainResult }));

const chain = {
  select: selectMock,
  eq: eqMock,
  order: orderMock,
  maybeSingle: maybeSingleMock,
  // Thenable: `await chain` (used by getPublishedIncidentSummaries).
  then(onFulfilled: (value: unknown) => unknown) {
    return Promise.resolve(onFulfilled({ ...chainResult }));
  },
};

function setChainResult(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  chainResult = result;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => chain),
  })),
}));

beforeEach(() => {
  setChainResult({ data: null, error: null });
  orderCalls = [];
  eqCalls = [];
  selectMock.mockClear();
  eqMock.mockClear();
  orderMock.mockClear();
  maybeSingleMock.mockClear();
});

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "i-1",
    slug: "db-outage",
    title: "Database outage",
    company_name: "Acme",
    occurred_at: "2026-01-01T00:00:00Z",
    duration_minutes: 120,
    severity: "MAJOR",
    pattern: "CASCADING_FAILURE",
    summary: "A summary that is long enough.",
    system: "orders-service",
    technologies: ["kubernetes"],
    timeline: [] as unknown,
    root_cause_tree: [] as unknown,
    architecture_diff: {
      beforeFix: "before",
      afterFix: "after",
      isFact: true,
    },
    prevention_actions: [] as unknown,
    official_post_mortem_url: null,
    ...overrides,
  };
}

function ev(
  offset: number,
  stage: TimelineEvent["stage"],
  id = "e",
): TimelineEvent {
  return {
    id,
    timestampOffsetMinutes: offset,
    stage,
    title: "event " + stage,
    description: "desc",
    affectedComponent: "comp",
  };
}

describe("mapPublishedIncident (via getPublishedIncidentBySlug) — invalid/incomplete data", () => {
  it("returns null incident and no error when no row matches", async () => {
    const r = await getPublishedIncidentBySlug("db-outage");
    expect(r).toEqual({ incident: null, error: null });
  });

  it("propagates a database error as { incident: null, error }", async () => {
    setChainResult({ data: null, error: { message: "db down" } });
    const r = await getPublishedIncidentBySlug("db-outage");
    expect(r).toEqual({ incident: null, error: "db down" });
  });

  it("maps a clean row, preserving official_post_mortem_url = null", async () => {
    setChainResult({ data: baseRow(), error: null });
    const r = await getPublishedIncidentBySlug("db-outage");
    expect(r.error).toBeNull();
    expect(r.incident).toMatchObject({
      id: "i-1",
      slug: "db-outage",
      official_post_mortem_url: null,
    });
  });

  it("keeps official_post_mortem_url when a URL is present", async () => {
    setChainResult({
      data: baseRow({
        official_post_mortem_url: "https://corp.example/postmortem",
      }),
      error: null,
    });
    const r = await getPublishedIncidentBySlug("db-outage");
    expect(r.incident?.official_post_mortem_url).toBe(
      "https://corp.example/postmortem",
    );
  });

  describe("technologies", () => {
    it("keeps only string entries when the column is an array", async () => {
      setChainResult({
        data: baseRow({ technologies: ["k8s", 42, null, "pg"] }),
        error: null,
      });
      const r = await getPublishedIncidentBySlug("db-outage");
      expect(r.incident?.technologies).toEqual(["k8s", "pg"]);
    });

    it("returns an empty array when the column is not an array", async () => {
      setChainResult({
        data: baseRow({ technologies: "kubernetes,postgres" }),
        error: null,
      });
      const r = await getPublishedIncidentBySlug("db-outage");
      expect(r.incident?.technologies).toEqual([]);
    });
  });

  describe("timeline / root_cause_tree / prevention_actions", () => {
    it("returns empty arrays for non-array values and keeps valid arrays", async () => {
      setChainResult({
        data: baseRow({
          timeline: [ev(0, "TRIGGER")],
          root_cause_tree: null,
          prevention_actions: [{ title: "add alerts" }],
        }),
        error: null,
      });
      const r = await getPublishedIncidentBySlug("db-outage");
      expect(r.incident?.timeline).toEqual([ev(0, "TRIGGER")]);
      expect(r.incident?.root_cause_tree).toEqual([]);
      expect(r.incident?.prevention_actions).toEqual([{ title: "add alerts" }]);
    });
  });

  describe("architecture_diff", () => {
    it("keeps a valid object diff", async () => {
      setChainResult({
        data: baseRow({
          architecture_diff: {
            beforeFix: "before",
            afterFix: "after",
            isFact: true,
          },
        }),
        error: null,
      });
      const r = await getPublishedIncidentBySlug("db-outage");
      expect(r.incident?.architecture_diff).toEqual({
        beforeFix: "before",
        afterFix: "after",
        isFact: true,
      });
    });

    it("substitutes the honest fallback when the diff is null", async () => {
      setChainResult({
        data: baseRow({ architecture_diff: null }),
        error: null,
      });
      const r = await getPublishedIncidentBySlug("db-outage");
      expect(r.incident?.architecture_diff).toEqual({
        beforeFix: "No prior architecture details were provided.",
        afterFix: "No updated architecture details were provided.",
        isFact: false,
        notes: "The report did not include an architecture comparison.",
      });
    });

    it("substitutes the honest fallback when the diff is not an object", async () => {
      setChainResult({
        data: baseRow({ architecture_diff: "not-an-object" }),
        error: null,
      });
      const r = await getPublishedIncidentBySlug("db-outage");
      expect((r.incident?.architecture_diff as ArchitectureDiff).isFact).toBe(
        false,
      );
    });
  });

  it("scopes the lookup to PUBLISHED rows for the requested slug", async () => {
    setChainResult({ data: baseRow(), error: null });
    await getPublishedIncidentBySlug("db-outage");
    expect(eqCalls).toContainEqual(["status", "PUBLISHED"]);
    expect(eqCalls).toContainEqual(["slug", "db-outage"]);
  });
});

describe("getTimelinePreview (via getPublishedIncidentSummaries)", () => {
  async function previewFor(timeline: unknown) {
    setChainResult({ data: [baseRow({ timeline })], error: null });
    const r = await getPublishedIncidentSummaries();
    expect(r.error).toBeNull();
    return r.incidents![0];
  }

  it("returns all events as the preview when there are 3 or fewer", async () => {
    const summary = await previewFor([
      ev(0, "TRIGGER"),
      ev(10, "FAILURE"),
      ev(30, "MITIGATION"),
    ]);
    expect(summary.timelineCount).toBe(3);
    expect(summary.timelinePreview).toEqual([
      { stage: "TRIGGER", timestampOffsetMinutes: 0, title: "event TRIGGER" },
      {
        stage: "FAILURE",
        timestampOffsetMinutes: 10,
        title: "event FAILURE",
      },
      {
        stage: "MITIGATION",
        timestampOffsetMinutes: 30,
        title: "event MITIGATION",
      },
    ]);
  });

  it("drops malformed entries (non-object, missing stage, non-number offset)", async () => {
    const summary = await previewFor([
      ev(0, "TRIGGER"),
      "junk",
      null,
      { stage: "TRIGGER", title: "no offset" },
      { stage: "NOT_A_STAGE", timestampOffsetMinutes: 5, title: "bad stage" },
      { stage: "FAILURE", timestampOffsetMinutes: "5", title: "bad offset" },
    ]);
    // Only the one fully-valid event survives.
    expect(summary.timelineCount).toBe(1);
    expect(summary.timelinePreview).toEqual([
      { stage: "TRIGGER", timestampOffsetMinutes: 0, title: "event TRIGGER" },
    ]);
  });

  it("returns a non-array timeline as count 0 / empty preview", async () => {
    const summary = await previewFor("not-an-array");
    expect(summary.timelineCount).toBe(0);
    expect(summary.timelinePreview).toEqual([]);
  });

  it("picks the first DETECTION/ROOT_CAUSE/MITIGATION/IMPACT as the middle", async () => {
    const summary = await previewFor([
      ev(0, "TRIGGER"),
      ev(5, "FAILURE"),
      ev(20, "DETECTION"),
      ev(40, "IMPACT"),
      ev(60, "MITIGATION"),
      ev(80, "PREVENTION"),
    ]);
    expect(summary.timelineCount).toBe(6);
    expect(summary.timelinePreview).toEqual([
      { stage: "TRIGGER", timestampOffsetMinutes: 0, title: "event TRIGGER" },
      {
        stage: "DETECTION",
        timestampOffsetMinutes: 20,
        title: "event DETECTION",
      },
      {
        stage: "PREVENTION",
        timestampOffsetMinutes: 80,
        title: "event PREVENTION",
      },
    ]);
  });

  it("falls back to the array midpoint when no marker stage is present", async () => {
    // 5 events, none in the marker set → middle = events[floor((5-1)/2)] = index 2.
    const summary = await previewFor([
      ev(0, "TRIGGER"),
      ev(5, "FAILURE"),
      ev(10, "PROPAGATION"),
      ev(15, "FAILURE"),
      ev(20, "PREVENTION"),
    ]);
    expect(summary.timelineCount).toBe(5);
    expect(summary.timelinePreview).toEqual([
      { stage: "TRIGGER", timestampOffsetMinutes: 0, title: "event TRIGGER" },
      {
        stage: "PROPAGATION",
        timestampOffsetMinutes: 10,
        title: "event PROPAGATION",
      },
      {
        stage: "PREVENTION",
        timestampOffsetMinutes: 20,
        title: "event PREVENTION",
      },
    ]);
  });

  it("ignores first/last events when choosing the middle marker", async () => {
    // A DETECTION at the very start or end must not be chosen as middle.
    const summary = await previewFor([
      ev(0, "DETECTION"),
      ev(5, "FAILURE"),
      ev(10, "PROPAGATION"),
      ev(15, "IMPACT"),
      ev(20, "DETECTION"),
    ]);
    // No qualifying marker strictly inside (0, n-1) other than IMPACT(15);
    // DETECTION at index 0 and index 4 are excluded by the index bounds.
    expect(summary.timelinePreview).toEqual([
      {
        stage: "DETECTION",
        timestampOffsetMinutes: 0,
        title: "event DETECTION",
      },
      { stage: "IMPACT", timestampOffsetMinutes: 15, title: "event IMPACT" },
      {
        stage: "DETECTION",
        timestampOffsetMinutes: 20,
        title: "event DETECTION",
      },
    ]);
  });

  it("sorts events by offset before building the preview", async () => {
    const summary = await previewFor([
      ev(30, "MITIGATION"),
      ev(0, "TRIGGER"),
      ev(15, "IMPACT"),
      ev(45, "PREVENTION"),
    ]);
    expect(summary.timelinePreview).toEqual([
      { stage: "TRIGGER", timestampOffsetMinutes: 0, title: "event TRIGGER" },
      { stage: "IMPACT", timestampOffsetMinutes: 15, title: "event IMPACT" },
      {
        stage: "PREVENTION",
        timestampOffsetMinutes: 45,
        title: "event PREVENTION",
      },
    ]);
  });

  it("filters to PUBLISHED rows and orders by occurred_at desc", async () => {
    setChainResult({ data: [], error: null });
    await getPublishedIncidentSummaries();
    expect(eqCalls).toContainEqual(["status", "PUBLISHED"]);
    expect(orderCalls).toContainEqual(["occurred_at", { ascending: false }]);
  });
});
