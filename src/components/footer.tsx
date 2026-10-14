/** @format */

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/90 bg-[#080d16] text-slate-400">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center border border-slate-700 bg-[#0b121e] text-xs font-mono font-bold text-blue-300">
                FS
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                FailStack
              </span>
            </Link>

            <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
              An incident knowledge base for tracing software failures and
              preserving engineering lessons.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end">
            <Link
              href="/incidents"
              className="text-xs text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Incident Archive
            </Link>
            <Link
              href="/incidents/new"
              className="text-xs text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Contribute
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-800/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] text-slate-600">
            FAILSTACK &copy; {new Date().getFullYear()}
          </span>
          <span className="font-mono text-[10px] text-slate-600">
            Failures are data. Keep the lessons.
          </span>
        </div>
      </div>
    </footer>
  );
}
