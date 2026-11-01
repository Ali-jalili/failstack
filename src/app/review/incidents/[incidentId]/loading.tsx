/** @format */

export default function ReviewIncidentDetailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading incident review"
      className="home-page review-detail-page relative isolate min-h-[calc(100dvh-68px)] overflow-x-clip bg-[#080d16] px-5 py-9 text-slate-100 sm:px-8 sm:py-12 lg:px-10 lg:py-14"
    >
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto w-full max-w-[1240px]">
        <p role="status" className="sr-only">
          Loading incident review
        </p>
        <header
          aria-hidden="true"
          className="mb-8 border-b border-slate-800/80 pb-7"
        >
          <div className="h-3 w-48 animate-pulse bg-slate-800 motion-reduce:animate-none" />
          <div className="mt-5 h-14 w-80 max-w-full animate-pulse bg-slate-800 motion-reduce:animate-none sm:h-16" />
        </header>

        <div
          aria-hidden="true"
          className="mb-5 flex items-center justify-between border-b border-slate-800/80 pb-4"
        >
          <div className="h-8 w-32 animate-pulse bg-slate-800/70 motion-reduce:animate-none" />
          <div className="flex gap-2">
            <div className="h-10 w-28 animate-pulse bg-slate-800/70 motion-reduce:animate-none" />
            <div className="h-10 w-24 animate-pulse bg-slate-800/70 motion-reduce:animate-none" />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="border-y border-slate-800/80 bg-[#080d16]/75 px-4 py-6 sm:px-6 sm:py-8"
        >
          <div className="h-5 w-40 animate-pulse bg-slate-800 motion-reduce:animate-none" />
          <div className="mt-5 h-10 w-full max-w-2xl animate-pulse bg-slate-800 motion-reduce:animate-none" />
          <div className="mt-3 h-4 w-48 animate-pulse bg-slate-900 motion-reduce:animate-none" />
          <div className="mt-6 h-4 w-full max-w-3xl animate-pulse bg-slate-900 motion-reduce:animate-none" />
          <div className="mt-2 h-4 w-4/5 max-w-2xl animate-pulse bg-slate-900 motion-reduce:animate-none" />
          <div className="mt-7 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index}>
                <div className="h-3 w-20 animate-pulse bg-slate-800 motion-reduce:animate-none" />
                <div className="mt-2 h-4 w-28 animate-pulse bg-slate-900 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
