/** @format */
import SignupForm from "@/features/auth/components/Signup-form";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignupForm returnTo={getSafeRedirectPath(next, "")} />;
}
