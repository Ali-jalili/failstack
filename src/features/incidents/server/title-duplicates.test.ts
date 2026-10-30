/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` is a Next bundler-only guard module; stub it so the real
// current-user module (and the real `hasAuthorAccess`) loads under Vitest.
vi.mock("server-only", () => ({}));

// Minimal Supabase client mock. `from("incidents")` returns one shared
// chainable builder (select/eq/limit return the chain), and awaiting the
// chain resolves `{ data, error }` the way the production code destructures.
let chainResult: { data: unknown; error: { message: string } | null } = {
  data: null,
  error: null,
};
const chainCalls: Array<[string, unknown]> = [];

function record(method: string, arg: unknown) {
  chainCalls.push([method, arg]);
  return chain;
}

const chain = {
  select: (columns: unknown) => record("select", columns),
  eq: (column: string, value: unknown) => record("eq", [column, value]),
  limit: (rows: unknown) => record("limit", rows),
  then(onFulfilled?: (value: unknown) => unknown) {
    return Promise.resolve(
      onFulfilled ? onFulfilled({ ...chainResult }) : { ...chainResult },
    );
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => chain),
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
import { checkDuplicateTitle } from "./title-duplicates";

const mockCurrentUser = vi.mocked(getCurrentUserState);

const author: CurrentUserState = {
  kind: "authenticated",
  userId: "u-author",
  email: "author@example.com",
  reviewRole: null,
  roleError: null,
};

function setChain(data: unknown, error: { message: string } | null = null) {
  chainResult = { data, error };
}

function resetInteractionLog() {
  chainCalls.length = 0;
}

describe("checkDuplicateTitle — duplicate detection (QA-015)", () => {
  beforeEach(() => {
    resetInteractionLog();
    setChain(null);
    mockCurrentUser.mockReset();
    mockCurrentUser.mockResolvedValue(author);
  });

  it("reports a duplicate when a published title matches case-insensitively", async () => {
    setChain([
      { id: "i-1", title: "Database Outage" },
      { id: "i-2", title: "Other incident" },
    ]);

    const r = await checkDuplicateTitle({ title: "database outage" });

    expect(r).toEqual({ checked: true, duplicate: true });
  });

  it("treats extra whitespace in the input as the same title", async () => {
    setChain([{ id: "i-1", title: "Database  outage" }]);

    const r = await checkDuplicateTitle({ title: "  database outage  " });

    expect(r).toEqual({ checked: true, duplicate: true });
  });

  it("reports no duplicate for a non-matching title", async () => {
    setChain([
      { id: "i-1", title: "Database Outage" },
      { id: "i-2", title: "Payment API flapping" },
    ]);

    const r = await checkDuplicateTitle({
      title: "Disk full in storage cluster",
    });

    expect(r).toEqual({ checked: true, duplicate: false });
  });

  it("reports no duplicate when no published rows exist", async () => {
    setChain([]);

    const r = await checkDuplicateTitle({ title: "Database outage" });

    expect(r).toEqual({ checked: true, duplicate: false });
  });

  it("excludes the incident being edited from the comparison in edit mode", async () => {
    setChain([
      { id: "i-self", title: "Database outage" },
      { id: "i-other", title: "Unrelated incident" },
    ]);

    const r = await checkDuplicateTitle({
      title: "Database outage",
      incidentId: "i-self",
    });

    expect(r).toEqual({ checked: true, duplicate: false });
  });

  it("reads only PUBLISHED incidents so private/pending data is not exposed", async () => {
    setChain([]);

    await checkDuplicateTitle({ title: "Database outage" });

    expect(chainCalls).toContainEqual(["eq", ["status", "PUBLISHED"]]);
    expect(chainCalls).toContainEqual(["select", "id, title"]);
  });
});

describe("checkDuplicateTitle — failure modes never block the caller", () => {
  beforeEach(() => {
    resetInteractionLog();
    setChain(null);
    mockCurrentUser.mockReset();
    mockCurrentUser.mockResolvedValue(author);
  });

  it("returns checked: false when the title is too short to be meaningful", async () => {
    const r = await checkDuplicateTitle({ title: "abc" });

    expect(r).toEqual({ checked: false });
    // No DB round-trip for invalid input.
    expect(chainCalls).toHaveLength(0);
  });

  it("returns checked: false when the query fails (submission must proceed)", async () => {
    setChain(null, { message: "relation not found" });

    const r = await checkDuplicateTitle({ title: "Database outage" });

    expect(r).toEqual({ checked: false });
  });

  it("returns checked: false for anonymous sessions", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });

    const r = await checkDuplicateTitle({ title: "Database outage" });

    expect(r).toEqual({ checked: false });
  });

  it("returns checked: false for broken sign-in states", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "error", message: "boom" });

    const r = await checkDuplicateTitle({ title: "Database outage" });

    expect(r).toEqual({ checked: false });
  });

  it("returns checked: false for a failed role lookup", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "authenticated",
      userId: "u",
      email: null,
      reviewRole: null,
      roleError: "relation not found",
    });

    const r = await checkDuplicateTitle({ title: "Database outage" });

    expect(r).toEqual({ checked: false });
  });

  it("returns checked: false for reviewers (no author access)", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "authenticated",
      userId: "u-reviewer",
      email: null,
      reviewRole: "reviewer",
      roleError: null,
    });

    const r = await checkDuplicateTitle({ title: "Database outage" });

    expect(r).toEqual({ checked: false });
  });
});
