/** @format */
/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PasswordField } from "./password-field";

afterEach(cleanup);

const field = {
  name: "password",
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
};

describe("PasswordField requirements indicator", () => {
  it("shows the status of each signup password requirement", () => {
    const { container } = render(
      <PasswordField
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        field={field}
        passwordRequirements={{
          minLength: true,
          hasLetter: true,
          hasDigit: false,
        }}
      />,
    );

    expect(screen.getByText("Password requirements")).toBeTruthy();
    expect(screen.getByText("At least 6 characters — met")).toBeTruthy();
    expect(screen.getByText("At least one English letter — met")).toBeTruthy();
    expect(screen.getByText("At least one digit — required")).toBeTruthy();
    expect(container.querySelector("span")?.className).toContain(
      "motion-reduce:transition-none",
    );
  });

  it("does not render the indicator when no requirements are supplied", () => {
    render(
      <PasswordField
        id="login-password"
        label="Password"
        autoComplete="current-password"
        field={field}
      />,
    );

    expect(screen.queryByText("Password requirements")).toBeNull();
  });
});
