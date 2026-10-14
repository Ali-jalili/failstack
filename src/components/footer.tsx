/** @format */

import Link from "next/link";

const footerLinks = [
  { label: "Incident archive", href: "/incidents" },
  { label: "Contribute a postmortem", href: "/incidents/new" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#080d16] text-slate-400">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <Link
              href="/"
              aria-label="FailStack home"
              className="group inline-flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080d16]"
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
                <span className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.19em] text-slate-500">
                  Failure Observatory
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-[12px] leading-6 text-slate-500">
              An incident knowledge base for tracing software failures and
              preserving engineering lessons.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-col gap-3 sm:items-end"
          >
            <p className="flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#9cb876]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rotate-45 border border-[#c6e47c] bg-[#c6e47c]/20"
              />
              Explore
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-slate-300 underline decoration-slate-600 underline-offset-[5px] transition-colors hover:text-white hover:decoration-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-800/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] tracking-[0.04em] text-slate-500">
            FAILSTACK &copy; {new Date().getFullYear()}
          </span>
          <span className="font-mono text-[10px] tracking-[0.04em] text-slate-500">
            <span aria-hidden="true" className="mr-2 text-[#c6e47c]">
              /
            </span>
            Failures are data. Keep the lessons.
          </span>
        </div>
      </div>
    </footer>
  );
}
