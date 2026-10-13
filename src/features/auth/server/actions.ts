/** @format */

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getCurrentUserState } from "@/features/auth/server/current-user";

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

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return {
      error: error.message,
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

  redirect(destination.destination);

  return {
    error: null,
  };
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
      error: error.message,
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
    return { error: error.message };
  }

  redirect("/login");
}
