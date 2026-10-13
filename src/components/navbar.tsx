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

  const navItems = user
    ? [
        { label: "Incident Archive", href: "/incidents" },
        ...(canReviewIncidents
          ? [{ label: "Review Queue", href: "/review/incidents", primary: true }]
          : []),
      ]
    : [
        { label: "Incident Archive", href: "/incidents" },
        { label: "Log in", href: "/login", primary: true },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900 shadow-inner transition group-hover:border-blue-500/50 group-hover:bg-slate-800">
            <span className="font-mono text-xs font-bold tracking-wider text-blue-400 group-hover:text-blue-300">
              FS
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-white">
              FailStack
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Incident Knowledge Base
            </span>
          </div>
        </Link>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <NavbarLinks items={navItems} />

          {user && (
            <AccountMenu
              email={user.email}
              isReviewer={canReviewIncidents}
            />
          )}
        </div>
      </div>
    </header>
  );
}
