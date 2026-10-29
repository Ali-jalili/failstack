/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` is a Next bundler-only guard module imported by
// `current-user.ts` (pulled in by `./actions`). Under Vitest it must be
// stubbed just so the module graph can load.
vi.mock("server-only", () => ({}));

// Supabase auth mock: `handleLogin` calls `signInWithPassword` and, on any
// returned error, maps it through the private `toUserFacingError`. Driving
// the mapper through that real handler means no production export of the
// helper is required (a "use server" module may only export async functions).
const signInWithPassword = vi.fn();
const signUp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword, signUp },
  })),
}));

import { handleLogin, handleSignUp } from "./actions";

const ACCOUNT_EXISTS =
  "An account with this email already exists. Try signing in instead.";
const INVALID_CREDENTIALS =
  "Incorrect email or password. Check your details and try again.";
const GENERIC = "Unable to complete the request. Please try again.";

/**
 * Runs `handleLogin` with a fixed email/password, injecting the given
 * Supabase error object as the `signInWithPassword` result, and returns the
 * mapped user-facing error string.
 */
async function mappedError(errorPayload: { code?: string; message?: string }) {
  signInWithPassword.mockResolvedValue({ error: errorPayload });
  const formData = new FormData();
  formData.set("email", "someone@example.com");
  formData.set("password", "hunter2");
  const result = await handleLogin(formData);
  return (result as { error?: string }).error;
}

beforeEach(() => {
  signInWithPassword.mockReset();
  signUp.mockReset();
});

describe("handleSignUp email validation", () => {
  it.each([
    ["saman", "saman"],
    ["saman@", "saman@"],
    ["@gmail.com", "@gmail.com"],
    ["saman@@gmail.com", "saman@@gmail.com"],
    ["saman gmail.com", "saman gmail.com"],
    ["saman@gmail", "saman@gmail"],
  ])(
    "rejects the malformed email %s before calling Supabase",
    async (_label, email) => {
      const formData = new FormData();
      formData.set("name", "Alex Morgan");
      formData.set("email", email);
      formData.set("password", "abc123");

      const result = await handleSignUp(formData);

      expect(result).toEqual({
        error: "Please enter a valid email address.",
      });
      expect(signUp).not.toHaveBeenCalled();
    },
  );

  it("rejects a malformed email before calling Supabase", async () => {
    const formData = new FormData();
    formData.set("name", "Alex Morgan");
    formData.set("email", "saman@gma.com");
    formData.set("password", "abc123");

    const result = await handleSignUp(formData);

    expect(result).toEqual({
      error: "Please check your email address. Did you mean gmail.com?",
    });
    expect(signUp).not.toHaveBeenCalled();
  });
  it("maps the duplicate-email signup error to the sign-in prompt", async () => {
    signUp.mockResolvedValueOnce({
      data: null,
      error: {
        code: "user_already_exists",
        message: "User already registered",
      },
    });
    const formData = new FormData();
    formData.set("name", "Alex Morgan");
    formData.set("email", "saman@company.com");
    formData.set("password", "abc123");

    const result = await handleSignUp(formData);

    expect(result).toEqual({
      error:
        "An account with this email already exists. Try signing in instead.",
    });
    expect(signUp).toHaveBeenCalledTimes(1);
  });

  it("matches the user-already-exists code independently of the message", async () => {
    signUp.mockResolvedValueOnce({
      data: null,
      error: { code: "user_already_exists", message: "" },
    });
    const formData = new FormData();
    formData.set("name", "Alex Morgan");
    formData.set("email", "saman@company.com");
    formData.set("password", "abc123");

    const result = await handleSignUp(formData);

    expect(result).toEqual({
      error:
        "An account with this email already exists. Try signing in instead.",
    });
  });

  it("matches the duplicate message independently of the error code", async () => {
    signUp.mockResolvedValueOnce({
      data: null,
      error: { code: "some-unknown-code", message: "User already registered" },
    });
    const formData = new FormData();
    formData.set("name", "Alex Morgan");
    formData.set("email", "saman@company.com");
    formData.set("password", "abc123");

    const result = await handleSignUp(formData);

    expect(result).toEqual({
      error:
        "An account with this email already exists. Try signing in instead.",
    });
  });
  it.each([
    ["test@gmaa.com"],
    ["test@gmaa.acom"],
    ["test@gmail.acom"],
    ["test@gimail.com"],
    ["test@gmaill.com"],
  ])(
    "rejects the known Gmail typo %s before calling Supabase",
    async (email) => {
      const formData = new FormData();
      formData.set("name", "Alex Morgan");
      formData.set("email", email);
      formData.set("password", "abc123");

      const result = await handleSignUp(formData);

      expect(result).toEqual({
        error: "Please check your email address. Did you mean gmail.com?",
      });
      expect(signUp).not.toHaveBeenCalled();
    },
  );
});

describe("toUserFacingError (via handleLogin) — account already exists", () => {
  it("maps the user-already-exists code to the sign-in prompt", async () => {
    expect(await mappedError({ code: "auth/user-already-exists" })).toBe(
      ACCOUNT_EXISTS,
    );
  });

  it("recognizes 'already been taken' in the message (case-insensitive)", async () => {
    expect(await mappedError({ message: "Email has already been taken" })).toBe(
      ACCOUNT_EXISTS,
    );
  });

  it("recognizes a lowercase 'already been taken' message", async () => {
    expect(
      await mappedError({
        message: "this email address is already been taken",
      }),
    ).toBe(ACCOUNT_EXISTS);
  });
});

describe("toUserFacingError (via handleLogin) — invalid credentials", () => {
  it("maps the invalid-credentials code to the check-your-details prompt", async () => {
    expect(await mappedError({ code: "auth/invalid-credentials" })).toBe(
      INVALID_CREDENTIALS,
    );
  });

  it("recognizes 'invalid login credentials' in the message", async () => {
    expect(await mappedError({ message: "Invalid login credentials" })).toBe(
      INVALID_CREDENTIALS,
    );
  });
});

describe("toUserFacingError (via handleLogin) — whitelisted safe codes", () => {
  it.each([
    "auth/email-confirmation-required",
    "auth/email-not-confirmed",
    "auth/formats/email-invalid",
  ])(
    "returns the provided message for the whitelisted code %s",
    async (code) => {
      expect(
        await mappedError({ code, message: "Confirm your email first" }),
      ).toBe("Confirm your email first");
    },
  );

  it("falls back to the generic message when a whitelisted code has no message", async () => {
    expect(await mappedError({ code: "auth/email-not-confirmed" })).toBe(
      GENERIC,
    );
  });

  it("falls back to the generic message when a whitelisted code has an empty message", async () => {
    expect(
      await mappedError({
        code: "auth/email-confirmation-required",
        message: "",
      }),
    ).toBe(GENERIC);
  });
});

describe("toUserFacingError (via handleLogin) — unknown errors (no leakage)", () => {
  it("returns the generic message for an unknown code", async () => {
    expect(await mappedError({ code: "some/internal-error" })).toBe(GENERIC);
  });

  it("does not leak a non-whitelisted raw message", async () => {
    expect(
      await mappedError({
        code: "db/connection-error",
        message: "secret internal detail: pool exhausted",
      }),
    ).toBe(GENERIC);
  });

  it("returns the generic message when both code and message are absent", async () => {
    expect(await mappedError({})).toBe(GENERIC);
  });

  it("returns the generic message for an empty message and no code", async () => {
    expect(await mappedError({ message: "" })).toBe(GENERIC);
  });
});

describe("toUserFacingError (via handleLogin) — rule precedence", () => {
  it("prefers the account-exists match over a whitelisted code", async () => {
    expect(
      await mappedError({
        code: "auth/email-confirmation-required",
        message: "already been taken",
      }),
    ).toBe(ACCOUNT_EXISTS);
  });

  it("prefers the account-exists match over the invalid-credentials code", async () => {
    expect(
      await mappedError({
        code: "auth/invalid-credentials",
        message: "already been taken",
      }),
    ).toBe(ACCOUNT_EXISTS);
  });
});
