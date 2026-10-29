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
