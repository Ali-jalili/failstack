/** @format */

import { describe, expect, it } from "vitest";
import { signupSchema, signupServerSchema } from "./schema";

const validFields = {
  name: "Alex Morgan",
  email: "alex@example.com",
};

describe.each([
  ["client signup schema", signupSchema],
  ["server signup schema", signupServerSchema],
])("%s password policy", (_name, schema) => {
  it.each([
    ["123456", false],
    ["abcdef", false],
    ["abc12", false],
    ["abc123", true],
    ["A secure 123", true],
  ])("validates %s as %s", (password, isValid) => {
    const input = {
      ...validFields,
      password,
      ...(schema === signupSchema ? { confirmPassword: password } : {}),
    };

    expect(schema.safeParse(input).success).toBe(isValid);
  });
});

describe.each([
  ["client signup schema", signupSchema],
  ["server signup schema", signupServerSchema],
])("%s email policy", (_name, schema) => {
  it.each([
    ["saman", false],
    ["saman@", false],
    ["@gmail.com", false],
    ["saman@@gmail.com", false],
    ["saman gmail.com", false],
    ["saman@gmail", false],
    ["saman@gmail.com", true],
    ["saman+test@gmail.com", true],
    ["saman@company.com", true],
    ["saman@gma.com", false],
    ["saman@gmaa.com", false],
    ["saman@gmial.com", false],
    ["saman@gmaa.acom", false],
    ["saman@gmail.acom", false],
    ["saman@gimail.com", false],
    ["saman@gmaill.com", false],
    [" saman@gmail.com ", true],
  ])("validates %s as %s", (email, isValid) => {
    const input = {
      ...validFields,
      email,
      password: "abc123",
      ...(schema === signupSchema ? { confirmPassword: "abc123" } : {}),
    };

    expect(schema.safeParse(input).success).toBe(isValid);
  });
});
