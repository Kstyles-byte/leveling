"use client";

import { useMemo, useState } from "react";

export function JournalGate(props: {
  day: string;
  initialBody?: string;
  onSave: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState(props.initialBody ?? "");
  const [saving, setSaving] = useState(false);
  const canProceed = useMemo(() => body.trim().length > 0, [body]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          Journal Gate
        </h2>
        <div className="text-xs text-zinc-400">{props.day}</div>
      </div>

      <p className="mt-2 text-xs leading-5 text-zinc-300">
        You can’t see “Active Grind” tasks until you write something.
      </p>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What’s on your mind? What matters today? What are you avoiding?"
        className="mt-3 h-40 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-400">
          {canProceed ? "Gate ready." : "Write at least 1 line."}
        </div>
        <button
          type="button"
          disabled={!canProceed || saving}
          onClick={async () => {
            setSaving(true);
            try {
              await props.onSave(body.trim());
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Unlock"}
        </button>
      </div>
    </section>
  );
}

