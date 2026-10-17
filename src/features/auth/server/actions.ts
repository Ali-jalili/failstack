/** @format */

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getCurrentUserState } from "@/features/auth/server/current-user";
import { signupServerSchema } from "@/features/auth/schema";

const SAFE_SUPABASE_ERROR_CODES = new Set([
  "auth/email-confirmation-required",
  "auth/email-not-confirmed",
  "auth/formats/email-invalid",
]);

function toUserFacingError(error: { code?: string; message?: string }): string {
  const code = error.code;
  const message = error.message ?? "";

  if (
    code === "auth/user-already-exists" ||
    /already been taken/i.test(message)
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (
    code === "auth/invalid-credentials" ||
    /invalid login credentials/i.test(message)
  ) {
    return "Incorrect email or password. Check your details and try again.";
  }

  if (SAFE_SUPABASE_ERROR_CODES.has(code ?? "")) {
    return message || "Unable to complete the request. Please try again.";
  }

  return "Unable to complete the request. Please try again.";
}

async function getAuthenticatedDestination(destination: unknown) {
  const safeDestination = getSafeRedirectPath(destination, "");
  if (safeDestination) {
    return { destination: safeDestination };
  }

  const userState = await getCurrentUserState();
  if (userState.kind === "error") {
    return {
      error: `You are signed in, but your account role could not be verified: ${userState.message}`,
    };
  }
  if (userState.kind === "anonymous") {
    return { error: "Your sign-in could not be verified. Please try again." };
  }
  if (userState.roleError) {
    return {
      error: `You are signed in, but your account role could not be verified: ${userState.roleError}`,
    };
  }

  return {
    destination: userState.reviewRole ? "/review/incidents" : "/incidents",
  };
}

export async function handleSignUp(formData: FormData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return {
      error: "Invalid form data.",
    };
  }

  const parsed = signupServerSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid form data.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  if (error) {
    return {
      error: toUserFacingError(error),
    };
  }

  if (!data.session) {
    return {
      error: null,
      requiresEmailConfirmation: true,
    };
  }

  const destination = await getAuthenticatedDestination(formData.get("next"));
  if ("error" in destination) {
    return { error: destination.error };
  }

  // redirect() never returns; it throws.
  redirect(destination.destination);
}

export async function handleLogin(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return {
      error: "Invalid form data.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return {
      error: toUserFacingError(error),
    };
  }

  const destination = await getAuthenticatedDestination(formData.get("next"));
  if ("error" in destination) {
    return { error: destination.error };
  }

  redirect(destination.destination);
}

export async function handleLogout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: "Sign out failed. Please try again." };
  }

  redirect("/login");
}
