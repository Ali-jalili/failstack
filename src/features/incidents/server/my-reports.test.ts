/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  createClient: vi.fn(),
}));

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
import { getMyReports } from "./queries";

const mockCurrentUser = vi.mocked(getCurrentUserState);

const authorUser: CurrentUserState = {
  kind: "authenticated",
  userId: "u-author",
  email: "author@example.com",
  reviewRole: null,
  roleError: null,
};

const reviewerUser: CurrentUserState = {
  kind: "authenticated",
  userId: "u-reviewer",
  email: "reviewer@example.com",
  reviewRole: "reviewer",
  roleError: null,
};

const validReports = [
  {
    id: "report-1",
    slug: "db-outage",
    title: "Database outage",
    created_at: "2026-10-01T12:30:00Z",
    status: "PENDING_REVIEW",
    latest_review_reason: null,
  },
];

beforeEach(() => {
  mockCurrentUser.mockReset();
  mocks.rpc.mockReset().mockResolvedValue({ data: validReports, error: null });
  mocks.createClient.mockReset().mockResolvedValue({ rpc: mocks.rpc });
});

describe("getMyReports authorization", () => {
  it("returns anonymous without touching Supabase", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });

    await expect(getMyReports()).resolves.toEqual({ kind: "anonymous" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns an auth error without touching Supabase", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "error", message: "auth down" });

    await expect(getMyReports()).resolves.toEqual({
      kind: "error",
      message: "Could not verify your sign-in: auth down",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns a role lookup error without touching Supabase", async () => {
    mockCurrentUser.mockResolvedValue({
      ...authorUser,
      roleError: "roles unavailable",
    });

    await expect(getMyReports()).resolves.toEqual({
      kind: "error",
      message: "Could not verify your role: roles unavailable",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("forbids reviewers without calling the reports RPC", async () => {
    mockCurrentUser.mockResolvedValue(reviewerUser);

    await expect(getMyReports()).resolves.toEqual({ kind: "forbidden" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("getMyReports data access", () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue(authorUser);
  });

  it("returns reports that pass the Zod schema", async () => {
    await expect(getMyReports()).resolves.toEqual({
      kind: "success",
      reports: validReports,
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("get_my_reports");
  });

  it("maps an RPC error", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "reports unavailable" },
    });

    await expect(getMyReports()).resolves.toEqual({
      kind: "error",
      message: "Could not load your reports: reports unavailable",
    });
  });

  it("rejects malformed RPC data with the unexpected-response error", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ ...validReports[0], status: "ARCHIVED" }],
      error: null,
    });

    await expect(getMyReports()).resolves.toEqual({
      kind: "error",
      message: "The reports service returned an unexpected response.",
    });
  });

  it("rejects a null RPC response with the unexpected-response error", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(getMyReports()).resolves.toEqual({
      kind: "error",
      message: "The reports service returned an unexpected response.",
    });
  });
});
