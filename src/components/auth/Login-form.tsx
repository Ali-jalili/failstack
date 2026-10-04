/** @format */

"use client";

import { handleLogin } from "@/app/actions/auth";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { validateLogin, type LoginErrors } from "@/lib/validation/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const data = {
      email: formData.get("email")?.toString().trim() ?? "",
      password: formData.get("password")?.toString() ?? "",
    };
    formData.set("email", data.email);

    const validationErrors = validateLogin(data);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await handleLogin(formData);

      if (result.error) {
        setErrors({
          form: result.error,
        });
        return;
      }

    } catch {
      setErrors({
        form: "Something went wrong while logging in. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute left-1/3 top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative flex w-full flex-col lg:flex-row">
        {/* Left Side: Form */}
        <div className="flex flex-1 flex-col justify-between px-6 py-12 lg:px-16 xl:px-24">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900 shadow-inner group-hover:border-blue-500/50">
                <span className="font-mono text-xs font-bold text-blue-400">
                  FS
                </span>
              </div>
              <span className="text-base font-semibold tracking-tight text-slate-100 group-hover:text-white">
                FailStack
              </span>
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-sm py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Enter your credentials to access your account.
              </p>
            </div>

            <button
              type="button"
              className="group relative flex w-full items-center justify-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Sign in with GitHub</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 font-mono text-slate-500">
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-mono font-medium uppercase text-slate-400"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((current) => ({ ...current, email: undefined, form: undefined }));
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  placeholder="alex@company.com"
                  className="mt-1.5 block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.email && (
                  <p id="login-email-error" role="alert" className="mt-1.5 text-xs text-rose-400">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-mono font-medium uppercase text-slate-400"
                  >
                    Password
                  </label>
                  <a
                    href="#forgot"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((current) => ({ ...current, password: undefined, form: undefined }));
                    }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "login-password-error" : undefined}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.007 10.007 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-1.782-2.18A3 3 0 0112 15a3 3 0 01-3-3c0-.828.336-1.578.879-2.121"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" role="alert" className="mt-1.5 text-xs text-rose-400">
                    {errors.password}
                  </p>
                )}
              </div>

              {errors.form && (
                <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {errors.form}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                Sign Up
              </Link>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-mono">
            FAILSTACK &copy; {new Date().getFullYear()}
          </div>
        </div>

        {/* Right Side Showcase */}
        <div className="hidden flex-1 border-l border-slate-800/80 bg-slate-900/30 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono text-slate-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Incident Knowledge Base</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome back to FailStack.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Continue writing postmortems, exploring failure modes, and
              improving system resilience.
            </p>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-mono text-xs text-amber-400">
                RCA_TREE_ANALYSIS
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                POSTMORTEM #402
              </span>
            </div>
            <div className="mt-4 space-y-2 font-mono text-xs text-slate-300">
              <div className="text-slate-400">
                ├── Root Cause: Uncapped Queue Depth
              </div>
              <div className="text-slate-400">
                ├── Trigger: Cache Invalidation Storm
              </div>
              <div className="text-emerald-400">
                └── Prevention: Circuit Breaker + Backoff
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
