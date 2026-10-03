/** @format */

"use client";

import { useState } from "react";

interface RawInputFormProps {
  onSubmit: (data: { title: string; rawText: string; url?: string }) => void;
  isLoading?: boolean;
}

export function RawInputForm({ onSubmit, isLoading }: RawInputFormProps) {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawText) return;
    onSubmit({ title, rawText, url });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-1">
          New Incident Entry
        </h2>
        <p className="text-sm text-slate-400">
          Paste the raw post-mortem or incident description below.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Incident Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., AWS US-East-1 Outage Analysis"
            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Official Post-Mortem URL (Optional)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Raw Post-Mortem Text *
          </label>
          <textarea
            required
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw logs, slack messages, or official outage report text here..."
            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !title || !rawText}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? "Structuring Incident..." : "Generate Structured Draft"}
      </button>
    </form>
  );
}
