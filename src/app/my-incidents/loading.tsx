export default function MyReportsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your incident casebook"
      className="home-page relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] px-5 py-10 text-slate-100 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
    >
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(13rem,0.72fr)_minmax(0,1.7fr)] lg:gap-14 xl:gap-20">
        <aside aria-hidden="true">
          <div className="h-3 w-32 animate-pulse bg-slate-800 motion-reduce:animate-none" />
          <div className="mt-7 h-20 w-64 max-w-full animate-pulse bg-slate-800 motion-reduce:animate-none" />
          <div className="mt-5 h-12 w-full max-w-xs animate-pulse bg-slate-900 motion-reduce:animate-none" />
          <div className="mt-8 border-y border-slate-800/80 py-4">
            <div className="h-3 w-24 animate-pulse bg-slate-800 motion-reduce:animate-none" />
            <div className="mt-2 h-8 w-10 animate-pulse bg-slate-800 motion-reduce:animate-none" />
          </div>
        </aside>

        <div className="min-w-0">
          <p role="status" className="sr-only">
            Loading your reports
          </p>
          <div className="mb-9 border-y border-slate-800/80 py-4" aria-hidden="true">
            <div className="h-3 w-32 animate-pulse bg-slate-800 motion-reduce:animate-none" />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-5 animate-pulse bg-slate-900 motion-reduce:animate-none" />
              ))}
            </div>
          </div>
          <div className="mb-10 border-t border-slate-800/80 pt-4" aria-hidden="true">
            <div className="h-3 w-36 animate-pulse bg-slate-800 motion-reduce:animate-none" />
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-10 animate-pulse border-t border-slate-800 bg-slate-900/50 motion-reduce:animate-none" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-800/80 border-t border-slate-800/80" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="grid gap-3 py-6 sm:grid-cols-[8.5rem_minmax(0,1fr)_12rem]">
                <div className="h-4 w-28 animate-pulse bg-slate-800 motion-reduce:animate-none" />
                <div className="h-12 w-full max-w-md animate-pulse bg-slate-900 motion-reduce:animate-none" />
                <div className="h-12 w-full animate-pulse bg-slate-900 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
