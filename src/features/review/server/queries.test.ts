/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
  createClient: vi.fn(),
  queryResult: {
    data: [] as unknown,
    error: null as { message: string } | null,
  },
}));

const queryChain = {
  select: mocks.select,
  eq: mocks.eq,
  order: mocks.order,
  then(onFulfilled: (value: unknown) => unknown) {
    return Promise.resolve(onFulfilled({ ...mocks.queryResult }));
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mocks.from,
    rpc: mocks.rpc,
  })),
}));

vi.mock("@/features/auth/server/current-user", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/auth/server/current-user")
    >();
  return { ...actual, getCurrentUserState: vi.fn() };
});

import {
  getCurrentUserState,
  type CurrentUserState,
} from "@/features/auth/server/current-user";
import { getIncidentReviewQueue } from "./queries";

const mockCurrentUser = vi.mocked(getCurrentUserState);

const reviewerUser: CurrentUserState = {
  kind: "authenticated",
  userId: "u-reviewer",
  email: "reviewer@example.com",
  reviewRole: "reviewer",
  roleError: null,
};

const authorUser: CurrentUserState = {
  kind: "authenticated",
  userId: "u-author",
  email: "author@example.com",
  reviewRole: null,
  roleError: null,
};

beforeEach(() => {
  mocks.queryResult = { data: [], error: null };
  mockCurrentUser.mockReset();
  mocks.createClient.mockReset().mockResolvedValue({
    from: mocks.from,
    rpc: mocks.rpc,
  });
  mocks.from.mockReset().mockReturnValue(queryChain);
  mocks.select.mockReset().mockReturnValue(queryChain);
  mocks.eq.mockReset().mockReturnValue(queryChain);
  mocks.order.mockReset().mockReturnValue(queryChain);
  mocks.rpc.mockReset().mockResolvedValue({ data: [], error: null });
});

describe("getIncidentReviewQueue authorization", () => {
  it("returns unauthenticated for anonymous users without touching Supabase", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });

    await expect(getIncidentReviewQueue()).resolves.toEqual({
      kind: "unauthenticated",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns an auth error without touching Supabase", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "error", message: "auth down" });

    await expect(getIncidentReviewQueue()).resolves.toEqual({
      kind: "error",
      message: "Could not verify your sign-in: auth down",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns a role lookup error without touching Supabase", async () => {
    mockCurrentUser.mockResolvedValue({
      ...reviewerUser,
      reviewRole: null,
      roleError: "roles unavailable",
    });

    await expect(getIncidentReviewQueue()).resolves.toEqual({
      kind: "error",
      message: "Could not verify reviewer access: roles unavailable",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("forbids authors without touching Supabase", async () => {
    mockCurrentUser.mockResolvedValue(authorUser);

    await expect(getIncidentReviewQueue()).resolves.toEqual({
      kind: "forbidden",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("getIncidentReviewQueue data access", () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue(reviewerUser);
  });

  it("returns pending incidents and filters and orders the query", async () => {
    const incidents = [
      {
        id: "incident-1",
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
        technologies: ["PostgreSQL", "Kubernetes"],
        timeline: [],
        root_cause_tree: [],
        architecture_diff: {
          beforeFix: "Single database instance",
          afterFix: "Automated failover enabled",
          isFact: true,
        },
        prevention_actions: [],
        created_at: "2026-01-01T00:00:00Z",
        author_id: "auth-user-1",
      },
    ];
    mocks.queryResult = { data: incidents, error: null };
    // The RPC batch-resolves author name + email for this author_id.
    mocks.rpc.mockResolvedValue({
      data: [
        {
          author_id: "auth-user-1",
          author_name: "Alex Morgan",
          author_email: "alex@example.com",
        },
      ],
      error: null,
    });

    await expect(getIncidentReviewQueue()).resolves.toEqual({
      kind: "success",
      incidents: [
        {
          ...incidents[0],
          author_name: "Alex Morgan",
          author_email: "alex@example.com",
        },
      ],
    });
    expect(mocks.from).toHaveBeenCalledWith("incidents");
    expect(mocks.eq).toHaveBeenCalledWith("status", "PENDING_REVIEW");
    expect(mocks.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(mocks.rpc).toHaveBeenCalledWith("get_author_identities", {
      p_author_ids: ["auth-user-1"],
    });
  });

  it("returns author_name/author_email as null when the RPC is not yet available", async () => {
    const incidents = [
      {
        id: "incident-1",
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
          beforeFix: "a",
          afterFix: "b",
          isFact: true,
        },
        prevention_actions: [],
        created_at: "2026-01-01T00:00:00Z",
        author_id: "auth-user-1",
      },
    ];
    mocks.queryResult = { data: incidents, error: null };
    // Simulate the pre-DBA-state where the RPC does not exist yet.
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "function get_author_identities does not exist" },
    });

    const result = await getIncidentReviewQueue();
    expect(result).toEqual({
      kind: "success",
      incidents: [
        {
          ...incidents[0],
          author_name: null,
          author_email: null,
        },
      ],
    });
  });

  it("associates each incident with its own author when multiple authors are present", async () => {
    const incidents = [
      {
        id: "i1",
        slug: "a",
        title: "A",
        company_name: "Acme",
        occurred_at: "2026-01-01T00:00:00Z",
        duration_minutes: 45,
        severity: "MAJOR",
        pattern: "CASCADING_FAILURE",
        summary: "s",
        official_post_mortem_url: null,
        system: "orders",
        technologies: [],
        timeline: [],
        root_cause_tree: [],
        architecture_diff: { beforeFix: "x", afterFix: "y", isFact: true },
        prevention_actions: [],
        created_at: "2026-01-01T00:00:00Z",
        author_id: "user-A",
      },
      {
        id: "i2",
        slug: "b",
        title: "B",
        company_name: "Globex",
        occurred_at: "2026-01-02T00:00:00Z",
        duration_minutes: 15,
        severity: "MINOR",
        pattern: "SINGLE_POINT_OF_FAILURE",
        summary: "s2",
        official_post_mortem_url: null,
        system: "billing",
        technologies: [],
        timeline: [],
        root_cause_tree: [],
        architecture_diff: { beforeFix: "x", afterFix: "y", isFact: true },
        prevention_actions: [],
        created_at: "2026-01-02T00:00:00Z",
        author_id: "user-B",
      },
    ];
    mocks.queryResult = { data: incidents, error: null };
    mocks.rpc.mockResolvedValue({
      data: [
        {
          author_id: "user-A",
          author_name: "Author A",
          author_email: "a@example.com",
        },
        {
          author_id: "user-B",
          author_name: "Author B",
          author_email: "b@example.com",
        },
      ],
      error: null,
    });

    const result = await getIncidentReviewQueue();
    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.incidents[0].author_name).toBe("Author A");
      expect(result.incidents[0].author_email).toBe("a@example.com");
      expect(result.incidents[1].author_name).toBe("Author B");
      expect(result.incidents[1].author_email).toBe("b@example.com");
    }
  });

  it("skips the author-identity RPC entirely when no incident has an author_id", async () => {
    const incidents = [
      {
        id: "i1",
        slug: "a",
        title: "A",
        company_name: "Acme",
        occurred_at: "2026-01-01T00:00:00Z",
        duration_minutes: 45,
        severity: "MAJOR",
        pattern: "CASCADING_FAILURE",
        summary: "s",
        official_post_mortem_url: null,
        system: "orders",
        technologies: [],
        timeline: [],
        root_cause_tree: [],
        architecture_diff: { beforeFix: "x", afterFix: "y", isFact: true },
        prevention_actions: [],
        created_at: "2026-01-01T00:00:00Z",
        author_id: null,
      },
    ];
    mocks.queryResult = { data: incidents, error: null };

    const result = await getIncidentReviewQueue();
    expect(result).toEqual({
      kind: "success",
      incidents: [{ ...incidents[0], author_name: null, author_email: null }],
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns the database error", async () => {
    mocks.queryResult = {
      data: null,
      error: { message: "database unavailable" },
    };

    await expect(getIncidentReviewQueue()).resolves.toEqual({
      kind: "error",
      message: "Could not load incidents pending review: database unavailable",
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
