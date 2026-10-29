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
import LoginForm from "./Login-form";

const mocks = vi.hoisted(() => ({
  handleLogin: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/features/auth/server/actions", () => ({
  handleLogin: mocks.handleLogin,
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

function fillValidLoginForm() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "secret" },
  });
}

function submitLoginForm() {
  const form = screen
    .getByRole("button", { name: "Sign in" })
    .closest("form") as HTMLFormElement;
  fireEvent.submit(form);
}

describe("LoginForm success feedback", () => {
  it("shows success feedback only for a successful action result", async () => {
    mocks.handleLogin.mockResolvedValue({ destination: "/my-incidents" });
    render(<LoginForm />);
    fillValidLoginForm();

    await act(async () => {
      submitLoginForm();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/my-incidents"),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Signed in successfully.",
    );
  });

  it("does not show success feedback for authentication errors", async () => {
    mocks.handleLogin.mockResolvedValue({
      error: "Incorrect email or password. Check your details and try again.",
    });
    render(<LoginForm />);
    fillValidLoginForm();

    await act(async () => {
      submitLoginForm();
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("does not show success feedback for unexpected errors", async () => {
    mocks.handleLogin.mockRejectedValue(new Error("network failed"));
    render(<LoginForm />);
    fillValidLoginForm();

    await act(async () => {
      submitLoginForm();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Something went wrong while signing in.",
      ),
    );
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
