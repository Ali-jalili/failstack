/** @format */
/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import SignupForm from "./Signup-form";

const mocks = vi.hoisted(() => ({
  handleSignUp: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/features/auth/server/actions", () => ({
  handleSignUp: mocks.handleSignUp,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function fillValidSignupForm() {
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Alex Morgan" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "abc123" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "abc123" },
  });
}

function signupForm() {
  return document.querySelector("form") as HTMLFormElement;
}

function submitSignupForm() {
  fireEvent.submit(signupForm());
}

describe("SignupForm submission lifecycle", () => {
  it("does not call the server action when client validation fails", async () => {
    render(<SignupForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create account" }));
      await Promise.resolve();
    });

    expect(mocks.handleSignUp).not.toHaveBeenCalled();
  });

  it("prevents repeated handler entry and releases the guard after a server error", async () => {
    let resolveAction!: (result: { error: string }) => void;
    mocks.handleSignUp.mockReturnValueOnce(
      new Promise<{ error: string }>((resolve) => {
        resolveAction = resolve;
      }),
    );
    render(<SignupForm />);
    fillValidSignupForm();

    await act(async () => {
      submitSignupForm();
      await Promise.resolve();
    });
    await waitFor(() => expect(mocks.handleSignUp).toHaveBeenCalledTimes(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Creating account..." }),
    );
    expect(mocks.handleSignUp).toHaveBeenCalledTimes(1);

    resolveAction({ error: "An account already exists." });
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "An account already exists.",
      ),
    );
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Create account" })
        .disabled,
    ).toBe(false);

    mocks.handleSignUp.mockResolvedValueOnce({
      error: "Try a different email.",
    });
    submitSignupForm();
    await waitFor(() => expect(mocks.handleSignUp).toHaveBeenCalledTimes(2));
  });

  it("replaces the editable form for email confirmation success", async () => {
    mocks.handleSignUp.mockResolvedValue({
      error: null,
      requiresEmailConfirmation: true,
    });
    render(<SignupForm />);
    fillValidSignupForm();

    await act(async () => {
      submitSignupForm();
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.getByText("alex@example.com")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create account" })).toBeNull();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("keeps the form busy after immediate-session success", async () => {
    mocks.handleSignUp.mockResolvedValue({ destination: "/my-incidents" });
    render(<SignupForm />);
    fillValidSignupForm();

    await act(async () => {
      submitSignupForm();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/my-incidents"),
    );
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Creating account...",
      }).disabled,
    ).toBe(true);
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Account created",
      expect.objectContaining({
        description: "Your account is ready. Redirecting you now.",
      }),
    );
  });

  it("releases the guard when navigation throws synchronously", async () => {
    mocks.handleSignUp.mockResolvedValue({ destination: "/my-incidents" });
    mocks.push.mockImplementationOnce(() => {
      throw new Error("navigation failed");
    });
    render(<SignupForm />);
    fillValidSignupForm();

    await act(async () => {
      submitSignupForm();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Something went wrong while creating your account.",
      ),
    );
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Create account" })
        .disabled,
    ).toBe(false);
  });
});
