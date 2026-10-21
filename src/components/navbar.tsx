/** @format */

import Link from "next/link";
import AccountMenu from "@/features/auth/components/AccountMenu";
import NavbarLinks from "./NavbarLinks";
import { getCurrentUserState } from "@/features/auth/server/current-user";

export default async function Navbar() {
  const userState = await getCurrentUserState();
  const user = userState.kind === "authenticated" ? userState : null;
  const isReviewer =
    user !== null &&
    !user.roleError &&
    (user.reviewRole === "reviewer" || user.reviewRole === "admin");
  const isWriter =
    user !== null && !user.roleError && user.reviewRole === null;

  const navItems = [
    { label: "Incident archive", href: "/incidents", primary: false },
    ...(user === null
      ? [
          { label: "Log in", href: "/login", placement: "action" as const },
          { label: "Sign up", href: "/signup", placement: "action" as const },
        ]
      : [
          ...(isWriter
            ? [
                {
                  label: "My reports",
                  href: "/my-incidents",
                  primary: false,
                },
                {
                  label: "Submit report",
                  href: "/incidents/new",
                  primary: true,
                },
              ]
            : []),
          ...(isReviewer
            ? [
                {
                  label: "Review queue",
                  href: "/review/incidents",
                  primary: false,
                },
              ]
            : []),
        ]),
  ];

  return (
    <header className="site-grid-surface sticky top-0 z-50 border-b border-slate-800/90 bg-[#090d12] text-slate-100">
      <div className="mx-auto flex min-h-[68px] max-w-[1360px] items-center gap-3 px-4 sm:px-6 lg:gap-8 lg:px-10">
        <Link
          href="/"
          className="group flex min-w-0 shrink-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#090d12]"
          aria-label="FailStack home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center border border-slate-700/90 bg-white/[0.02] transition-colors group-hover:border-[#c6e47c]/60">
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#d5e8a5]">
              FS
            </span>
            <span className="absolute -right-[3px] top-2 h-3 w-px bg-[#c6e47c]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-[-0.025em] text-slate-100 transition-colors group-hover:text-white">
              FailStack
            </span>
            <span className="mt-1.5 hidden font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500 sm:block">
              Incident Knowledge Base
            </span>
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2 lg:gap-4">
          <NavbarLinks items={navItems} />
          {user && (
            <AccountMenu
              email={user.email}
              isReviewer={isReviewer}
            />
          )}
        </div>
      </div>
    </header>
  );
}
