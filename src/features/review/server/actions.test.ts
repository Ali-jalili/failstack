/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` is a Next bundler-only guard module; under Vitest it must be
// stubbed so the real current-user module (and therefore the real
// `hasReviewerAccess`) can load.
vi.mock("server-only", () => ({}));

// Supabase client mock: every test asserts against this, never real network.
const rpcMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc: rpcMock })),
}));

// Use the real `hasReviewerAccess` (pure function under test) but override
// `getCurrentUserState` so each test can dictate the session state.
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
import { reviewIncident } from "./actions";

const mockCurrentUser = vi.mocked(getCurrentUserState);
const VALID_ID = "0f8fad6c-4e2e-4f4f-9b0e-3f3f5f5f5f5f";

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

function rpcOk() {
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ error: null });
}

describe("reviewIncident — validation layer (rejects before any auth check)", () => {
  it("rejects a non-UUID incidentId with the generic message", async () => {
    const r = await reviewIncident({
      incidentId: "not-a-uuid",
      action: "APPROVED",
    });
    expect(r).toEqual({ error: "Invalid review request. Please try again." });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown action with the generic message", async () => {
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "ARCHIVED",
    });
    expect(r).toEqual({ error: "Invalid review request. Please try again." });
  });

  it("rejects null input with the generic message", async () => {
    const r = await reviewIncident(null);
    expect(r).toEqual({ error: "Invalid review request. Please try again." });
  });

  it("rejects CHANGES_REQUESTED with an empty reason (field-level message)", async () => {
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "CHANGES_REQUESTED",
      reason: "",
    });
    expect(r).toEqual({ error: "Reason is required" });
  });

  it("rejects CHANGES_REQUESTED with a whitespace-only reason (trim boundary)", async () => {
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "CHANGES_REQUESTED",
      reason: "   ",
    });
    expect(r).toEqual({ error: "Reason is required" });
  });
});

describe("reviewIncident — authorization layer", () => {
  beforeEach(() => {
    rpcOk();
  });

  it("denies anonymous users and never reaches the data layer", async () => {
    mockCurrentUser.mockResolvedValue({ kind: "anonymous" });
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "APPROVED",
    });
    expect(r).toEqual({ error: "You must be signed in." });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("denies a broken sign-in state", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "error",
      message: "boom",
    });
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "APPROVED",
    });
    expect(r).toEqual({
      error: "Could not verify your sign-in. Please sign in again.",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("denies when the role lookup itself failed", async () => {
    mockCurrentUser.mockResolvedValue({
      kind: "authenticated",
      userId: "u",
      email: null,
      reviewRole: null,
      roleError: "relation not found",
    });
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "APPROVED",
    });
    expect(r).toEqual({
      error: "Could not verify reviewer access. Please refresh and try again.",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("denies an authenticated author (no reviewer role) and never reaches the data layer", async () => {
    mockCurrentUser.mockResolvedValue(authorUser);
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "APPROVED",
    });
    expect(r).toEqual({ error: "Reviewer access required." });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("reviewIncident — allowed reviewer/admin paths", () => {
  beforeEach(() => {
    rpcOk();
  });

  it("approves as a reviewer: null reason is passed to the RPC", async () => {
    mockCurrentUser.mockResolvedValue(reviewerUser);
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "APPROVED",
    });
    expect(r).toEqual({ error: null });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("review_incident", {
      p_incident_id: VALID_ID,
      p_action: "APPROVED",
      p_reason: null,
    });
  });

  it("allows an admin to request changes with a trimmed reason", async () => {
    mockCurrentUser.mockResolvedValue({
      ...reviewerUser,
      userId: "u-admin",
      reviewRole: "admin",
    });
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "CHANGES_REQUESTED",
      reason: "  Needs a timeline  ",
    });
    expect(r).toEqual({ error: null });
    // Zod's `.trim()` is a transform: the stored reason is trimmed.
    expect(rpcMock).toHaveBeenCalledWith("review_incident", {
      p_incident_id: VALID_ID,
      p_action: "CHANGES_REQUESTED",
      p_reason: "Needs a timeline",
    });
  });

  it("maps an RPC failure to the user-facing refresh message", async () => {
    mockCurrentUser.mockResolvedValue(reviewerUser);
    rpcMock.mockResolvedValue({ error: { message: "row lock" } });
    const r = await reviewIncident({
      incidentId: VALID_ID,
      action: "APPROVED",
    });
    expect(r).toEqual({
      error:
        "Could not save this decision. The incident may have already been reviewed. Refresh the queue and try again.",
    });
  });
});
