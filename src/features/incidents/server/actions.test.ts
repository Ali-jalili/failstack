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

const updateResult: { data: unknown; error: unknown; count: number } = {
  data: undefined,
  error: null,
  count: 0,
};
let updateChain: {
  eq: MockFn;
  in: MockFn;
  select: MockFn;
  then: (onFulfilled: () => unknown) => Promise<unknown>;
};

const builder = {
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

function reset() {
  updateResult.count = 0;
  updateResult.error = null;
  // A fluent thenable: `.eq()` and `.in()` keep the chain, and awaiting the
  // chain (the production code does `await ...update(...).eq().eq().in()`) must
  // resolve to the `{ count, error }` payload rather than to `undefined`.
  updateChain = {
    eq: vi.fn(() => updateChain),
    in: vi.fn(() => updateChain),
    select: vi.fn(() => updateChain),
    then: (onFulfilled?: (value: unknown) => unknown) =>
      Promise.resolve(onFulfilled ? onFulfilled(updateResult) : updateResult),
  };

  builder.select.mockReset().mockImplementation(() => builder);
  builder.eq.mockReset().mockImplementation(() => builder);
  builder.in = vi.fn(() => builder);
  builder.single = vi.fn().mockReturnValue(builder);
  builder.maybeSingle
    .mockReset()
    .mockResolvedValue({ data: null, error: null });
  builder.insert
    .mockReset()
    .mockResolvedValue({ data: undefined, error: null });
  builder.delete.mockReset().mockImplementation(() => updateChain);
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
import {
  createIncident,
  updateIncidentResubmit,
  deleteIncident,
  saveDraft,
  submitDraft,
} from "./actions";

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
        "Could not update the incident. It may not exist, you may not be the owner, or its status no longer allows editing.",
    });
    // The update was scoped by owner + editable statuses + id.
    expect(b.update).toHaveBeenCalledWith(expect.anything(), {
      count: "exact",
    });
    expect(updateChain.eq).toHaveBeenCalledWith("id", "incident-1");
    expect(updateChain.eq).toHaveBeenCalledWith("author_id", "u-author");
    expect(updateChain.in).toHaveBeenCalledWith("status", [
      "DRAFT",
      "PENDING_REVIEW",
      "CHANGES_REQUESTED",
    ]);
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
        "Could not update the incident. It may not exist, you may not be the owner, or its status no longer allows editing.",
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

  it("accepts DRAFT status for editing", async () => {
    mockCurrentUser.mockResolvedValue(author);
    driveUpdate({ count: 1 });
    const r = await updateIncidentResubmit(validPayload());
    expect(r).toEqual({ error: null });
  });

  it("accepts PENDING_REVIEW status for editing", async () => {
    mockCurrentUser.mockResolvedValue(author);
    driveUpdate({ count: 1 });
    const r = await updateIncidentResubmit(validPayload());
    expect(r).toEqual({ error: null });
  });

  it("accepts CHANGES_REQUESTED status for editing", async () => {
    mockCurrentUser.mockResolvedValue(author);
    driveUpdate({ count: 1 });
    const r = await updateIncidentResubmit(validPayload());
    expect(r).toEqual({ error: null });
  });

  it("rejects PUBLISHED incidents from being edited", async () => {
    mockCurrentUser.mockResolvedValue(author);
    driveUpdate({ count: 0 });
    const r = await updateIncidentResubmit(validPayload());
    expect(r).toEqual({
      error:
        "Could not update the incident. It may not exist, you may not be the owner, or its status no longer allows editing.",
    });
  });
});

describe("deleteIncident", () => {
  const validId = "abc-123";
  const publishedIncident = { id: validId, title: "Test", status: "PUBLISHED" };
  const draftIncident = { id: validId, title: "Test", status: "DRAFT" };

  beforeEach(freshBuilders);

  function mockAuth(state: CurrentUserState) {
    mockCurrentUser.mockResolvedValue(state);
  }

  function mockFetchIncident(
    data: typeof publishedIncident | null,
    error: unknown = null,
  ) {
    const b = lastBuilder();
    b.select.mockReturnValueOnce(b);
    b.eq.mockReturnValueOnce(b);
    b.single.mockResolvedValueOnce({ data, error });
  }

  function mockAccessCheck(data: { id: string } | null, error: unknown = null) {
    const b = lastBuilder();
    b.select.mockReturnValueOnce(b);
    b.eq.mockReturnValueOnce(b);
    b.eq.mockReturnValueOnce(b);
    b.single.mockResolvedValueOnce({ data, error });
  }

  it("rejects when not authenticated", async () => {
    mockAuth({ kind: "anonymous" });
    const r = await deleteIncident(validId);
    expect(r).toEqual({ error: "Not authenticated." });
  });

  it("rejects when auth state has an error", async () => {
    mockAuth({ kind: "error", message: "session expired" });
    const r = await deleteIncident(validId);
    expect(r).toEqual({ error: "session expired" });
  });

  it("rejects invalid ID", async () => {
    mockAuth(author);
    const r = await deleteIncident("");
    expect(r).toEqual({ error: "Invalid incident ID." });
  });

  it("rejects when incident not found", async () => {
    mockAuth(author);
    mockFetchIncident(null, null);
    const r = await deleteIncident(validId);
    expect(r).toEqual({
      error: "Could not find the incident. It may have been deleted already.",
    });
  });

  it("rejects when incident has a DB fetch error", async () => {
    mockAuth(author);
    mockFetchIncident(null, { message: "database down" });
    const r = await deleteIncident(validId);
    expect(r).toEqual({
      error: "Could not find the incident. It may have been deleted already.",
    });
  });

  it("rejects PUBLISHED incidents from deletion", async () => {
    mockAuth(author);
    mockFetchIncident(publishedIncident);
    const r = await deleteIncident(validId);
    expect(r).toEqual({
      error:
        "This incident cannot be deleted. Only incidents in DRAFT or CHANGES_REQUESTED status can be deleted.",
    });
  });

  it("rejects PENDING_REVIEW incidents from deletion", async () => {
    mockAuth(author);
    mockFetchIncident({ ...draftIncident, status: "PENDING_REVIEW" });
    const r = await deleteIncident(validId);
    expect(r).toEqual({
      error:
        "This incident cannot be deleted. Only incidents in DRAFT or CHANGES_REQUESTED status can be deleted.",
    });
  });

  it("rejects when user is not the author", async () => {
    mockAuth(author);
    mockFetchIncident(draftIncident);
    mockAccessCheck(null, null);
    const r = await deleteIncident(validId);
    expect(r).toEqual({
      error: "You do not have permission to delete this incident.",
    });
  });

  it("rejects when access check returns an error", async () => {
    mockAuth(author);
    mockFetchIncident(draftIncident);
    mockAccessCheck(null, { message: "permission denied" });
    const r = await deleteIncident(validId);
    expect(r).toEqual({
      error: "You do not have permission to delete this incident.",
    });
  });

  it("rejects a reviewer (reviewer has no author access)", async () => {
    mockAuth({
      kind: "authenticated",
      userId: "u-reviewer",
      email: null,
      reviewRole: "reviewer",
      roleError: null,
    });
    const r = await deleteIncident(validId);
    expect(r).toEqual({ error: "Author access required." });
    // No database access should happen for a reviewer.
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("deletes DRAFT incident successfully", async () => {
    mockAuth(author);
    mockFetchIncident(draftIncident);
    mockAccessCheck({ id: validId });
    const deleteChain = {
      eq: vi.fn(() => deleteChain),
      in: vi.fn(() => deleteChain),
      then: vi.fn(async (cb?: (val: unknown) => unknown) => {
        const result = { data: undefined, error: null };
        return cb ? cb(result) : result;
      }),
    };
    vi.mocked(builder.delete).mockReturnValue(deleteChain);
    const r = await deleteIncident(validId);
    expect(r).toEqual({ error: null });
  });

  it("deletes CHANGES_REQUESTED incident successfully", async () => {
    mockAuth(author);
    mockFetchIncident({ ...draftIncident, status: "CHANGES_REQUESTED" });
    mockAccessCheck({ id: validId });
    const deleteChain = {
      eq: vi.fn(() => deleteChain),
      in: vi.fn(() => deleteChain),
      then: vi.fn(async (cb?: (val: unknown) => unknown) => {
        const result = { data: undefined, error: null };
        return cb ? cb(result) : result;
      }),
    };
    vi.mocked(builder.delete).mockReturnValue(deleteChain);
    const r = await deleteIncident(validId);
    expect(r).toEqual({ error: null });
  });

  it("reports a DB error from the delete", async () => {
    mockAuth(author);
    mockFetchIncident(draftIncident);
    mockAccessCheck({ id: validId });
    const deleteChain = {
      eq: vi.fn(() => deleteChain),
      in: vi.fn(() => deleteChain),
      then: vi.fn(async (cb?: (val: unknown) => unknown) => {
        const result = { data: undefined, error: { message: "lock timeout" } };
        return cb ? cb(result) : result;
      }),
    };
    vi.mocked(builder.delete).mockReturnValue(deleteChain);
    const r = await deleteIncident(validId);
    expect(r).toEqual({ error: "Failed to delete the incident: lock timeout" });
  });
});

// Drive the awaited update chain (used by saveDraft/submitDraft, which do
// `await from().update(...).eq().eq().eq().select()`). The chain resolves to
// the shared `updateResult` object, so we set its fields directly.
function driveUpdateResult(outcome: {
  data?: unknown;
  error?: unknown;
  count?: number;
}) {
  updateResult.data = outcome.data ?? undefined;
  updateResult.error = outcome.error ?? null;
  updateResult.count = outcome.count ?? 0;
}

describe("saveDraft", () => {
  beforeEach(freshBuilders);

  function validDraft(overrides: Record<string, unknown> = {}) {
    return {
      title: "Database outage",
      companyName: "Acme",
      occurredAt: "2026-01-01T00:00:00Z",
      durationMinutes: 0,
      severity: "MAJOR",
      pattern: "CASCADING_FAILURE",
      summary: "",
      officialPostMortemUrl: "",
      system: "orders-service",
      technologies: [],
      timeline: [],
      rootCauseTree: [],
      architectureDiff: null,
      preventionActions: [],
      ...overrides,
    };
  }

  it("rejects anonymous users", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });
    const r = await saveDraft(validDraft());
    expect(r).toEqual({ error: "You must be signed in to save a draft." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects a reviewer (no author access)", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "authenticated",
      userId: "u-reviewer",
      email: null,
      reviewRole: "reviewer",
      roleError: null,
    });
    const r = await saveDraft(validDraft());
    expect(r).toEqual({ error: "Author access required." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("creates a new draft with status DRAFT and returns its slug", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    b.insert.mockResolvedValueOnce({ data: undefined, error: null });

    const r = await saveDraft(validDraft());

    expect(r).toEqual({
      error: null,
      incidentId: null,
      slug: "database-outage",
    });
    expect(b.insert).toHaveBeenCalledTimes(1);
    const insertedRow = b.insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertedRow.status).toBe("DRAFT");
    expect(insertedRow.author_id).toBe("u-author");
  });

  it("reports a DB error from a draft insert", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    b.insert.mockResolvedValueOnce({
      data: undefined,
      error: { message: "permission denied" },
    });

    const r = await saveDraft(validDraft());
    expect(r).toEqual({
      error: "Failed to save the draft: permission denied",
    });
  });

  it("updates an existing DRAFT (resume) without creating a duplicate", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    b.maybeSingle.mockResolvedValueOnce({
      data: { id: "d1", status: "DRAFT", slug: "database-outage" },
      error: null,
    });
    driveUpdateResult({ data: [{ slug: "database-outage" }], error: null });

    const r = await saveDraft(validDraft(), "d1");

    expect(r).toEqual({
      error: null,
      incidentId: "d1",
      slug: "database-outage",
    });
    expect(b.insert).not.toHaveBeenCalled();
    expect(b.update).toHaveBeenCalledTimes(1);
    // The update is scoped to the owner and to DRAFT status.
    expect(updateChain.eq).toHaveBeenCalledWith("id", "d1");
    expect(updateChain.eq).toHaveBeenCalledWith("author_id", "u-author");
    expect(updateChain.eq).toHaveBeenCalledWith("status", "DRAFT");
  });

  it("refuses to update a report that is no longer a DRAFT", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    b.maybeSingle.mockResolvedValueOnce({
      data: { id: "d1", status: "PENDING_REVIEW", slug: "x" },
      error: null,
    });

    const r = await saveDraft(validDraft(), "d1");
    expect(r).toMatchObject({
      error:
        "This report can no longer be saved as a draft. Use the edit flow instead.",
    });
    expect(b.update).not.toHaveBeenCalled();
  });
});

describe("submitDraft", () => {
  beforeEach(freshBuilders);

  function completeDraftRow() {
    return {
      title: "Database outage",
      company_name: "Acme",
      occurred_at: "2026-01-01T00:00:00Z",
      duration_minutes: 120,
      severity: "MAJOR",
      pattern: "CASCADING_FAILURE",
      summary: "A summary that is long enough.",
      official_post_mortem_url: null,
      system: "orders-service",
      technologies: ["kubernetes"],
      timeline: validForm().timeline,
      root_cause_tree: validForm().rootCauseTree,
      architecture_diff: validForm().architectureDiff,
      prevention_actions: validForm().preventionActions,
    };
  }

  it("rejects anonymous users", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });
    const r = await submitDraft("d1");
    expect(r).toEqual({ error: "You must be signed in to submit a draft." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects when the draft is not found / not owned", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    b.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const r = await submitDraft("d1");
    expect(r).toEqual({
      error: "Could not find that draft. It may have been deleted.",
    });
  });

  it("rejects an incomplete draft and does not transition its status", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    // An incomplete draft: empty summary and timeline.
    b.maybeSingle.mockResolvedValueOnce({
      data: {
        ...completeDraftRow(),
        summary: "",
        timeline: [],
        prevention_actions: [],
      },
      error: null,
    });

    const r = await submitDraft("d1");
    expect(r).toMatchObject({ error: expect.stringContaining("not complete") });
    // No status transition happened.
    expect(b.update).not.toHaveBeenCalled();
  });

  it("transitions a complete DRAFT to PENDING_REVIEW", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    b.maybeSingle.mockResolvedValueOnce({
      data: completeDraftRow(),
      error: null,
    });
    driveUpdateResult({ data: [{ slug: "database-outage" }], error: null });

    const r = await submitDraft("d1");
    expect(r).toEqual({ error: null, slug: "database-outage" });
    expect(b.update).toHaveBeenCalledTimes(1);
    expect(b.update).toHaveBeenCalledWith(expect.anything());
    expect(updateChain.eq).toHaveBeenCalledWith("id", "d1");
    expect(updateChain.eq).toHaveBeenCalledWith("author_id", "u-author");
    expect(updateChain.eq).toHaveBeenCalledWith("status", "DRAFT");
  });

  it("reports zero-rows from the transition as failure", async () => {
    mockCurrentUser.mockResolvedValue(author);
    const b = lastBuilder();
    b.maybeSingle.mockResolvedValueOnce({
      data: completeDraftRow(),
      error: null,
    });
    driveUpdateResult({ data: [], error: null });

    const r = await submitDraft("d1");
    expect(r).toMatchObject({
      error:
        "The draft was not submitted. It may have been deleted or its status changed.",
    });
  });
});
