/** @format */

import Link from "next/link";
import AccountMenu from "@/features/auth/components/AccountMenu";
import NavbarLinks from "./NavbarLinks";
import { getCurrentUserState } from "@/features/auth/server/current-user";

export default async function Navbar() {
  const userState = await getCurrentUserState();
  const user = userState.kind === "authenticated" ? userState : null;
  const canReviewIncidents =
    user !== null && !user.roleError && user.reviewRole === "reviewer";

  const navItems = [
    { label: "Incident archive", href: "/incidents", primary: !user },
    ...(user
      ? [
          {
            label: "New report",
            href: "/incidents/new",
            primary: !canReviewIncidents,
          },
          ...(canReviewIncidents
            ? [
                {
                  label: "Review queue",
                  href: "/review/incidents",
                  primary: true,
                },
              ]
            : []),
        ]
      : [{ label: "Log in", href: "/login" }]),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#080d16]/95 text-slate-100 shadow-[0_8px_30px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="group flex min-w-0 shrink-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080d16]"
          aria-label="FailStack home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center border border-slate-700/90 bg-slate-900/70 transition-colors group-hover:border-[#c6e47c]/70">
            <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#d5e8a5]">
              FS
            </span>
            <span className="absolute -bottom-px -right-px h-1.5 w-1.5 bg-[#c6e47c]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[14px] font-semibold tracking-[-0.02em] text-slate-100 transition-colors group-hover:text-white">
              FailStack
            </span>
            <span className="mt-1.5 hidden font-mono text-[8px] uppercase tracking-[0.19em] text-slate-500 sm:block">
              Failure Observatory
            </span>
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
          <div className="order-2 xl:order-1">
            <NavbarLinks items={navItems} />
          </div>
          {user && (
            <span className="order-1 hidden items-center gap-2 border-l border-slate-800 pl-3 font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500 lg:order-2 lg:flex">
              <span
                className={`h-1.5 w-1.5 ${
                  user.roleError
                    ? "bg-slate-500"
                    : canReviewIncidents
                      ? "bg-amber-300"
                      : "bg-[#c6e47c]"
                }`}
              />
              {user.roleError
                ? "Account"
                : canReviewIncidents
                  ? "Reviewer"
                  : "Contributor"}
            </span>
          )}
          {user && (
            <div className="order-1 lg:order-3">
              <AccountMenu
                email={user.email}
                isReviewer={canReviewIncidents}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
