import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentUserState: vi.fn(),
  hasAuthorAccess: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/features/incidents/components/IncidentForm", () => ({
  default: vi.fn(() => null),
}));

vi.mock("@/features/auth/server/current-user", () => ({
  getCurrentUserState: mocks.getCurrentUserState,
  hasAuthorAccess: mocks.hasAuthorAccess,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import EditIncidentPage from "./page";

describe("EditIncidentPage loading failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserState.mockResolvedValue({
      kind: "authenticated",
      userId: "author-1",
      email: null,
      reviewRole: null,
      roleError: null,
    });
    mocks.hasAuthorAccess.mockReturnValue(true);
  });

  function mockIncidentQuery(result: {
    data: unknown;
    error: { message: string } | null;
  }) {
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue(result),
    };
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    mocks.createClient.mockResolvedValue({
      from: vi.fn(() => builder),
    });
  }

  it("throws a generic operational error when the incident query fails", async () => {
    mockIncidentQuery({
      data: null,
      error: { message: "internal database details" },
    });

    await expect(
      EditIncidentPage({ params: Promise.resolve({ id: "incident-1" }) }),
    ).rejects.toThrow("Could not load this incident. Please try again.");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("keeps redirecting to the reports list when the incident is not found", async () => {
    mockIncidentQuery({ data: null, error: null });

    await expect(
      EditIncidentPage({ params: Promise.resolve({ id: "incident-1" }) }),
    ).rejects.toThrow("redirect:/my-incidents");
    expect(mocks.redirect).toHaveBeenCalledWith("/my-incidents");
  });
});
