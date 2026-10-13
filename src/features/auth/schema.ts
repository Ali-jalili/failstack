/** @format */

export type SignupErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "form", string>
>;

export type SignupFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginErrors = Partial<
  Record<"email" | "password" | "form", string>
>;

export type LoginFormData = {
  email: string;
  password: string;
};

export function validateSignup(data: SignupFormData): SignupErrors {
  const errors: SignupErrors = {};

  if (!data.name) {
    errors.name = "Please enter your name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

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
