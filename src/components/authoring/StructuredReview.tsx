/** @format */

"use client";

import { useState } from "react";
import { Incident } from "@/types/incident";
import { incidentSchema } from "@/lib/validation/incident";

interface StructuredReviewProps {
  initialDraft: Partial<Incident>;
  onSave: (validatedData: Incident) => void;
}

export function StructuredReview({
  initialDraft,
  onSave,
}: StructuredReviewProps) {
  const [draft, setDraft] = useState<Partial<Incident>>(initialDraft);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleValidateAndSave = () => {
    const result = incidentSchema.safeParse(draft);

    if (!result.success) {
      const formattedErrors = result.error.issues.map(
        (issue) => `${issue.path.join(" -> ")}: ${issue.message}`,
      );
      setValidationErrors(formattedErrors);
      return;
    }

    setValidationErrors([]);
    onSave(result.data as Incident);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-100">
      <div>
        <h2 className="text-xl font-semibold mb-1">Human Review & Edit</h2>
        <p className="text-sm text-slate-400">
          Review structured data against domain rules before publishing.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300 space-y-1 text-sm">
          <p className="font-semibold text-red-200">Validation Rules Failed:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={draft.title || ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Company
          </label>
          <input
            type="text"
            value={draft.companyName || ""}
            onChange={(e) =>
              setDraft({ ...draft, companyName: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Summary
        </label>
        <textarea
          rows={3}
          value={draft.summary || ""}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
        />
      </div>

      <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
        <button
          onClick={handleValidateAndSave}
          className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
        >
          Validate & Publish Incident
        </button>
      </div>
    </div>
  );
}
