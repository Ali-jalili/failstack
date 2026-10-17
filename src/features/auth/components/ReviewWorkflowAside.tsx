/** @format */

const serifClass = "[font-family:Georgia,'Times_New_Roman',serif]";

const reviewSteps = [
  {
    label: "01 / AUTHOR",
    title: "Document",
    text: "Submit a structured account of the incident.",
  },
  {
    label: "02 / REVIEW",
    title: "Challenge",
    text: "Reviewers can approve the report or request changes.",
  },
  {
    label: "03 / ARCHIVE",
    title: "Preserve",
    text: "Approved reports join the published incident archive.",
  },
];

/**
 * The desktop-only narrative panel shown next to the signup form, describing
 * the incident-review workflow.
 */
export default function ReviewWorkflowAside() {
  return (
    <aside
      aria-label="How contributions are reviewed"
      className="hidden border-l border-slate-800/80 bg-gradient-to-br from-[#0c151c] via-[#0b1219] to-[#101a1c] px-10 py-16 lg:flex lg:flex-col lg:justify-center"
    >
      <div className="mx-auto w-full max-w-md">
        <p className="flex items-center gap-[11px] font-mono text-[9px] uppercase leading-[1.6] tracking-[0.12em] text-[#9cb876]">
          <span
            aria-hidden="true"
            className="h-[7px] w-[7px] shrink-0 rotate-45 border border-[#9cb876] bg-[#9cb876]/20"
          />
          A considered path to publication
        </p>
        <h2
          className={`${serifClass} mt-4 text-[clamp(2.2rem,3.6vw,3.2rem)] font-normal leading-[0.99] tracking-[-0.055em] text-[#e9ece5]`}
        >
          Shared knowledge
          <br />
          needs <em className="text-[#e2a16d]">good review.</em>
        </h2>
        <p className="mt-4 max-w-sm text-[13px] leading-[1.75] text-slate-400">
          Every contribution enters a reviewer queue before it becomes part of
          the public archive.
        </p>

        <ol className="mt-9 border-t border-slate-500/20">
          {reviewSteps.map((step) => (
            <li
              key={step.label}
              className="border-b border-slate-500/15 py-[18px]"
            >
              <span className="font-mono text-[8px] uppercase leading-[1.5] tracking-[0.08em] text-slate-500">
                {step.label}
              </span>
              <h3
                className={`${serifClass} mt-2 text-[21px] font-normal tracking-[-0.025em] text-[#e2e7e2]`}
              >
                {step.title}
              </h3>
              <p className="mt-1 max-w-[25rem] text-[11px] leading-[1.6] text-slate-400">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
