/** @format */

import LoginForm from "@/features/auth/components/LoginForm";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm returnTo={getSafeRedirectPath(next, "")} />;
}
