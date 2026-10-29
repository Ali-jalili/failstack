/** @format */

import type { ExternalToast, ToastClassnames } from "sonner";

/**
 * Shared success-toast styling so auth success messages match the rest of
 * the site: lime accent (#c6e47c), tinted dark card, mono label, light text.
 * Mirrors the success card used by the incident form (`steps.tsx`).
 */
const SUCCESS_TOAST_CLASS =
  "border border-[#c6e47c]/40 bg-[#0c151c] font-[var(--font-geist-sans)]";
const SUCCESS_TITLE_CLASS =
  "font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-[#d5e8a5]";
const SUCCESS_DESCRIPTION_CLASS = "text-slate-400";

export const successToastOptions: Pick<ExternalToast, "classNames"> = {
  classNames: {
    toast: SUCCESS_TOAST_CLASS,
    title: SUCCESS_TITLE_CLASS,
    description: SUCCESS_DESCRIPTION_CLASS,
    icon: "border-[#c6e47c]/60 bg-[#c6e47c]/20 text-[#c6e47c]",
  },
};

/**
 * Error state is usually shown inline on the form, but if an error toast is
 * needed, keep it on the same dark card with a muted tone (no loud red).
 */
export const errorToastOptions: Pick<ExternalToast, "classNames"> = {
  classNames: {
    toast: "border border-slate-700 bg-[#0c151c] font-[var(--font-geist-sans)]",
    title:
      "font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-slate-200",
    description: "text-slate-400",
  },
};
