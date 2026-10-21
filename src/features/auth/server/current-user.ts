import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUserState =
  | { kind: "anonymous" }
  | { kind: "error"; message: string }
  | {
      kind: "authenticated";
      userId: string;
      email: string | null;
      reviewRole: "admin" | "reviewer" | null;
      roleError: string | null;
    };

type AuthenticatedUserState = Extract<CurrentUserState, { kind: "authenticated" }>;

export function hasAuthorAccess(
  userState: CurrentUserState,
): userState is AuthenticatedUserState {
  return (
    userState.kind === "authenticated" &&
    !userState.roleError &&
    userState.reviewRole === null
  );
}

export function hasReviewerAccess(
  userState: CurrentUserState,
): userState is AuthenticatedUserState {
  return (
    userState.kind === "authenticated" &&
    !userState.roleError &&
    (userState.reviewRole === "reviewer" || userState.reviewRole === "admin")
  );
}

export const getCurrentUserState = cache(
  async (): Promise<CurrentUserState> => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError && authError.name !== "AuthSessionMissingError") {
      return { kind: "error", message: authError.message };
    }

    if (!user) {
      return { kind: "anonymous" };
    }

    const { data: reviewRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const role = reviewRole?.role;

    return {
      kind: "authenticated",
      userId: user.id,
      email: user.email ?? null,
      reviewRole: role === "admin" || role === "reviewer" ? role : null,
      roleError: roleError?.message ?? null,
    };
  },
);
