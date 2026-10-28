/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  createClient: vi.fn(),
  queryResult: { data: [] as unknown, error: null as { message: string } | null },
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
  createClient: mocks.createClient,
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
  });
  mocks.from.mockReset().mockReturnValue(queryChain);
  mocks.select.mockReset().mockReturnValue(queryChain);
  mocks.eq.mockReset().mockReturnValue(queryChain);
  mocks.order.mockReset().mockReturnValue(queryChain);
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
      },
    ];
    mocks.queryResult = { data: incidents, error: null };

    await expect(getIncidentReviewQueue()).resolves.toEqual({
      kind: "success",
      incidents,
    });
    expect(mocks.from).toHaveBeenCalledWith("incidents");
    expect(mocks.eq).toHaveBeenCalledWith("status", "PENDING_REVIEW");
    expect(mocks.order).toHaveBeenCalledWith("created_at", { ascending: true });
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
