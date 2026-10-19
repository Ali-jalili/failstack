export default function MyReportsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your reports"
      className="home-page relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] px-5 py-12 text-slate-100 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
    >
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-[58rem]">
          <div className="mb-8 sm:mb-10">
            <div className="h-3 w-32 animate-pulse bg-slate-800 motion-reduce:animate-none" />
            <div className="mt-7 h-14 w-64 animate-pulse bg-slate-800 motion-reduce:animate-none" />
            <div className="mt-5 h-4 w-full max-w-lg animate-pulse bg-slate-900 motion-reduce:animate-none" />
          </div>

          <div className="mb-8 flex flex-wrap border-y border-slate-800/80 py-4 sm:mb-10">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="min-w-[9rem] flex-1 py-1 pr-4">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
                <div className="mt-2 h-7 w-8 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
              </div>
            ))}
          </div>

          <p role="status" className="sr-only">
            Loading your reports
          </p>
          <div className="divide-y divide-slate-800/80" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="py-6 first:pt-1">
                <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
                <div className="mt-3 h-3 w-36 animate-pulse rounded bg-slate-800/70 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
