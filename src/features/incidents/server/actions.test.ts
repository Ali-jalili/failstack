/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` is a Next bundler-only guard module; stub it so the real
// current-user module (and the real `hasAuthorAccess`) loads under Vitest.
vi.mock("server-only", () => ({}));

// Minimal Supabase client mock. `createClient()` returns a single shared
// client whose `from(table)` returns one shared, chainable builder, so a test
// can assert on the whole interaction in one place (the code under test calls
// `from("incidents")` more than once per request: a lookup then an insert).
//
// `update()` is modeled as a *fluent thenable*: it returns a `chain` that both
// has `.eq()` and, when awaited, resolves to `{ count, error }` — matching how
// the production code does `await incidentUpdate.update(...).eq(...).eq(...)`.
type MockFn = ReturnType<typeof vi.fn>;

const updateResult: { data: undefined; error: unknown; count: number } = {
  data: undefined,
  error: null,
  count: 0,
};
let updateChain: {
  eq: MockFn;
  then: (onFulfilled: () => unknown) => Promise<unknown>;
};

const builder = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

function reset() {
  updateResult.count = 0;
  updateResult.error = null;
  // A fluent thenable: `.eq()` keeps the chain, and awaiting the chain
  // (the production code does `await ...update(...).eq().eq().eq()`) must
  // resolve to the `{ count, error }` payload rather than to `undefined`.
  updateChain = {
    eq: vi.fn(() => updateChain),
    then: (onFulfilled?: (value: unknown) => unknown) =>
      Promise.resolve(onFulfilled ? onFulfilled(updateResult) : updateResult),
  };

  builder.select.mockReset().mockImplementation(() => builder);
  builder.eq.mockReset().mockImplementation(() => builder);
  builder.maybeSingle
    .mockReset()
    .mockResolvedValue({ data: null, error: null });
  builder.insert
    .mockReset()
    .mockResolvedValue({ data: undefined, error: null });
  builder.update.mockReset().mockImplementation(() => updateChain);
}

const fromMock = vi.fn(() => builder);

// Thin helpers used by the test bodies: reset all shared mock state (and the
// `from` call log).
function freshBuilders() {
  reset();
  fromMock.mockClear();
}

function lastBuilder() {
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: fromMock,
    rpc: vi.fn(async () => ({ error: null })),
  })),
}));

vi.mock("@/features/auth/server/current-user", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/auth/server/current-user")
    >();
  return {
    ...actual,
    getCurrentUserState: vi.fn(),
  };
});

import {
  getCurrentUserState,
  type CurrentUserState,
} from "@/features/auth/server/current-user";
import { createIncident, updateIncidentResubmit } from "./actions";

const mockCurrentUser = vi.mocked(getCurrentUserState);

const author: CurrentUserState = {
  kind: "authenticated",
  userId: "u-author",
  email: "author@example.com",
  reviewRole: null,
  roleError: null,
};

function validForm(overrides: Record<string, unknown> = {}) {
  return {
    title: "Database outage",
    companyName: "Acme",
    occurredAt: "2026-01-01T00:00:00Z",
    durationMinutes: 120,
    severity: "MAJOR",
    pattern: "CASCADING_FAILURE",
    summary: "A summary that is long enough.",
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
    },
    preventionActions: [{ title: "add alerts" }],
    ...overrides,
  };
}

describe("createIncident — authorization (rejects before any write)", () => {
  beforeEach(() => {
    freshBuilders();
    mockCurrentUser.mockReset();
  });

  it("denies anonymous users", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });
    const r = await createIncident(validForm());
    expect(r).toEqual({
      error: "You must be signed in to submit an incident.",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("denies a broken sign-in state", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "error", message: "boom" });
    const r = await createIncident(validForm());
    expect(r).toEqual({
      error: "Could not verify your sign-in. Please sign in again.",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("denies a reviewer (reviewer has no author access)", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "authenticated",
      userId: "u-reviewer",
      email: null,
      reviewRole: "reviewer",
      roleError: null,
    });
    const r = await createIncident(validForm());
    expect(r).toEqual({ error: "Author access required." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("denies when the role lookup failed", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "authenticated",
      userId: "u",
      email: null,
      reviewRole: null,
      roleError: "relation not found",
    });
    const r = await createIncident(validForm());
    expect(r).toEqual({
      error: "Could not verify your role. Please try again.",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("createIncident — idempotency", () => {
  beforeEach(() => {
    freshBuilders();
    mockCurrentUser.mockReset();
    mockCurrentUser.mockResolvedValue(author);
  });

  it("returns the existing incident with alreadyExists when the key is known", async () => {
    const b = lastBuilder();
    b.maybeSingle.mockResolvedValue({
      data: { slug: "existing-slug" },
      error: null,
    });

    const r = await createIncident(validForm(), "key-123");

    expect(r).toEqual({
      error: null,
      slug: "existing-slug",
      alreadyExists: true,
    });
    // The lookup was scoped to this user's key.
    expect(b.select).toHaveBeenCalledWith("slug");
    expect(b.eq).toHaveBeenCalledWith("idempotency_key", "key-123");
    expect(b.eq).toHaveBeenCalledWith("author_id", "u-author");
    // No insert happened on the happy idempotent path.
    expect(b.insert).not.toHaveBeenCalled();
  });
});

describe("createIncident — race and slug-collision handling", () => {
  beforeEach(() => {
    freshBuilders();
    mockCurrentUser.mockReset();
    mockCurrentUser.mockResolvedValue(author);
  });

  it("returns the concurrent incident when insert fails with 23505 on the idempotency key", async () => {
    const b = lastBuilder();
    // First lookup (known key) found nothing.
    b.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    b.insert.mockResolvedValueOnce({
      data: undefined,
      error: { code: "23505", message: "duplicate key" },
    });
    // Second lookup (the race recovery) finds the concurrent row.
    b.maybeSingle.mockResolvedValueOnce({
      data: { slug: "concurrent-slug" },
      error: null,
    });

    const r = await createIncident(validForm(), "key-123");

    expect(r).toEqual({
      error: null,
      slug: "concurrent-slug",
      alreadyExists: true,
    });
    expect(b.insert).toHaveBeenCalledTimes(1);
  });

  it("retries with a suffixed slug when insert fails with 23505 and there is no idempotency key", async () => {
    const b = lastBuilder();
    b.insert.mockResolvedValueOnce({
      data: undefined,
      error: { code: "23505", message: "duplicate key" },
    });
    b.insert.mockResolvedValueOnce({ data: undefined, error: null });

    const r = await createIncident(validForm());

    expect(r).toMatchObject({ error: null });
    expect((r as { slug?: string }).slug).toMatch(
      /^database-outage-[0-9a-f]{8}$/,
    );
    expect(b.insert).toHaveBeenCalledTimes(2);
    // The second attempt must use the UUID-suffixed slug.
    const secondInsertRow = b.insert.mock.calls[1]?.[0] as Record<
      string,
      unknown
    >;
    expect(secondInsertRow.slug).toMatch(/^database-outage-[0-9a-f]{8}$/);
  });

  it("reports the collision error when the slug retry also fails with 23505", async () => {
    const b = lastBuilder();
    b.insert.mockResolvedValue({
      data: undefined,
      error: { code: "23505", message: "duplicate key" },
    });

    const r = await createIncident(validForm());

    expect(r).toEqual({
      error:
        "Could not create a unique incident URL. Please try submitting again.",
    });
    expect(b.insert).toHaveBeenCalledTimes(2);
  });

  it("surfaces non-23505 insert errors as their message", async () => {
    const b = lastBuilder();
    b.insert.mockResolvedValueOnce({
      data: undefined,
      error: { code: "42501", message: "permission denied" },
    });

    const r = await createIncident(validForm(), "key-123");

    expect(r).toEqual({ error: "permission denied" });
    expect(b.insert).toHaveBeenCalledTimes(1);
  });
});

describe("updateIncidentResubmit — authorization and conditional update", () => {
  beforeEach(() => {
    freshBuilders();
    mockCurrentUser.mockReset();
  });

  function validPayload(overrides: Record<string, unknown> = {}) {
    return {
      id: "incident-1",
      title: "Database outage",
      companyName: "Acme",
      occurredAt: "2026-01-01T00:00:00Z",
      durationMinutes: 120,
      severity: "MAJOR",
      pattern: "CASCADING_FAILURE",
      summary: "A summary that is long enough.",
      system: "orders-service",
      technologies: ["kubernetes"],
      timeline: validForm().timeline,
      rootCauseTree: validForm().rootCauseTree,
      architectureDiff: validForm().architectureDiff,
      preventionActions: validForm().preventionActions,
      ...overrides,
    };
  }

  it("denies anonymous users", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });
    const r = await updateIncidentResubmit(validPayload());
    expect(r).toEqual({
      error: "You must be signed in to resubmit an incident.",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("denies a reviewer (no author access)", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "authenticated",
      userId: "u-reviewer",
      email: null,
      reviewRole: "reviewer",
      roleError: null,
    });
    const r = await updateIncidentResubmit(validPayload());
    expect(r).toEqual({ error: "Author access required." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  // Drives the awaited update outcome. `update()` is a fluent thenable, so the
  // production code awaits the whole `.update().eq().eq().eq()` chain and
  // destructures `{ count, error }` from it.
  function driveUpdate(outcome: { count?: number; error?: unknown }) {
    updateResult.count = outcome.count ?? 0;
    updateResult.error = outcome.error ?? null;
  }

  it("rejects a resubmit by a non-owner because the scoped update matches 0 rows", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    driveUpdate({ count: 0 });

    const r = await updateIncidentResubmit(validPayload());

    expect(r).toEqual({
      error:
        "Could not update the incident. It may not exist, you may not be the owner, or it is no longer editable.",
    });
    // The update was scoped by owner + status + id.
    expect(b.update).toHaveBeenCalledWith(expect.anything(), {
      count: "exact",
    });
    expect(updateChain.eq).toHaveBeenCalledWith("id", "incident-1");
    expect(updateChain.eq).toHaveBeenCalledWith("author_id", "u-author");
    expect(updateChain.eq).toHaveBeenCalledWith("status", "CHANGES_REQUESTED");
  });

  it("succeeds when exactly one matching row is updated", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    driveUpdate({ count: 1 });

    const r = await updateIncidentResubmit(validPayload());

    expect(r).toEqual({ error: null });
    expect(b.update).toHaveBeenCalledTimes(1);
  });

  it("rejects when a resubmit fails because the status no longer allows it (0 rows)", async () => {
    mockCurrentUser.mockResolvedValue(author);
    driveUpdate({ count: 0 });

    const r = await updateIncidentResubmit(validPayload());

    expect(r).toEqual({
      error:
        "Could not update the incident. It may not exist, you may not be the owner, or it is no longer editable.",
    });
  });

  it("reports a DB error from the update", async () => {
    mockCurrentUser.mockResolvedValue(author);
    driveUpdate({ count: 0, error: { message: "lock timeout" } });

    const r = await updateIncidentResubmit(validPayload());

    expect(r).toEqual({ error: "lock timeout" });
  });

  it("rejects when the update matched more than one row (unexpected count)", async () => {
    mockCurrentUser.mockResolvedValue(author);
    driveUpdate({ count: 2 });

    const r = await updateIncidentResubmit(validPayload());

    expect(r).toEqual({
      error: "The incident update did not affect exactly one report.",
    });
  });
});
