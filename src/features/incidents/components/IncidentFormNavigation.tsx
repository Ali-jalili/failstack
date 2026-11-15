import { StepNav } from "./IncidentFormSteps";

type IncidentFormNavigationProps = {
  isLast: boolean;
  isFirst: boolean;
  isLocked: boolean;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  mode: "create" | "edit";
  incidentId?: string;
  back: () => void;
  next: () => void;
  onSaveDraft: () => void;
  onResubmitDraft: () => void;
  onSubmit: () => void;
};

export default function IncidentFormNavigation({
  isLast,
  isFirst,
  isLocked,
  isSubmitting,
  isSavingDraft,
  mode,
  incidentId,
  back,
  next,
  onSaveDraft,
  onResubmitDraft,
  onSubmit,
}: IncidentFormNavigationProps) {
  return (
    <>
      {isLast ? (
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={back}
                  disabled={isLocked}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-700/80 bg-slate-900/40 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-300 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden="true">←</span>
                  Back to edit
                </button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => void onSaveDraft()}
                    disabled={isLocked || isSavingDraft}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-700/80 bg-slate-900/40 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-300 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSavingDraft ? "Saving…" : "Save draft"}
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isLocked}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#c6e47c] bg-[#c6e47c] px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#11190a] transition-colors hover:border-[#dcf7a0] hover:bg-[#dcf7a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting…" : "Confirm & submit"}
                    {!isSubmitting ? <span aria-hidden="true">→</span> : null}
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <div className="mt-7">
            <StepNav
              canGoBack={!isFirst}
              canProceed={!isLocked}
              isSubmitting={isSubmitting}
              isLocked={isLocked}
              isLast={isLast}
              backLabel={isLast ? "Back to Edit" : "Back"}
              submitLabel={
                mode === "edit" ? "Confirm & Save Changes" : "Confirm & Submit"
              }
              onBack={back}
              onNext={next}
              onSubmit={onSubmit}
            />
            <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => void onSaveDraft()}
                disabled={isLocked || isSavingDraft}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-700/80 bg-slate-900/40 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-300 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSavingDraft ? "Saving…" : "Save draft"}
              </button>
              {mode === "edit" && incidentId ? (
                <button
                  type="button"
                  onClick={() => void onResubmitDraft()}
                  disabled={isLocked || isSubmitting}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c6e47c]/40 bg-[#c6e47c]/10 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[#d5e8a5] transition-colors hover:border-[#c6e47c]/60 hover:bg-[#c6e47c]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? "Submitting…" : "Submit draft for review"}
                </button>
              ) : null}
            </div>
          </div>
      )}
    </>
  );
}
