"use client";

import type { ForgeMode } from "@/lib/forge/modes";
import { MODE_LABEL, modeRuleSummary } from "@/lib/forge/modes";

export function ModeSelector(props: {
  value: ForgeMode | null;
  onChange: (mode: ForgeMode) => void;
}) {
  const modes: ForgeMode[] = ["active_grind", "failsafe_1", "failsafe_2"];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
        What is your capacity today?
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {modes.map((m) => {
          const active = props.value === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => props.onChange(m)}
              className={[
                "rounded-xl border px-4 py-3 text-left transition",
                active
                  ? "border-indigo-400/60 bg-indigo-500/15"
                  : "border-white/10 bg-black/20 hover:bg-white/5",
              ].join(" ")}
            >
              <div className="text-sm font-semibold text-zinc-50">
                {MODE_LABEL[m]}
              </div>
              <div className="mt-1 text-xs leading-5 text-zinc-300">
                {modeRuleSummary(m)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

