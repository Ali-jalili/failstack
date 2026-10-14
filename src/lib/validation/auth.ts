/** @format */

export type LoginErrors = Partial<Record<"email" | "password" | "form", string>>;

export type LoginFormData = {
  email: string;
  password: string;
};

export function validateLogin(data: LoginFormData): LoginErrors {
  const errors: LoginErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!data.password) {
    errors.password = "Please enter your password.";
  }

  return errors;
}
