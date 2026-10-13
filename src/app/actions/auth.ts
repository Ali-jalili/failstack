"use server";

export async function handleLogin(formData: FormData) {
  const { handleLogin } = await import("@/features/auth/server/actions");
  return handleLogin(formData);
}

export async function handleLogout() {
  const { handleLogout } = await import("@/features/auth/server/actions");
  return handleLogout();
}

export async function handleSignUp(formData: FormData) {
  const { handleSignUp } = await import("@/features/auth/server/actions");
  return handleSignUp(formData);
}
