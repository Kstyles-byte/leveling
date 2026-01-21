"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type LevelRow = {
  id: number;
  level_code: string;
  duration_days: number;
  requirements: unknown;
  parent_level_id: number | null;
};

export default function LevelsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [levelCode, setLevelCode] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [requirementsJson, setRequirementsJson] = useState(
    JSON.stringify({ coding_hours: 3, gym_sets: 3 }, null, 2),
  );

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("levels")
        .select("id,level_code,duration_days,requirements,parent_level_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (!alive) return;
      setLevels((data as LevelRow[]) ?? []);
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-dvh bg-black px-6 py-10 text-zinc-300">
        Sign in first, then return to /levels.
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-indigo-300/90">
              THE FORGE
            </div>
            <div className="text-sm text-zinc-200">Level Constructor</div>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
            Create / Update Level
          </h2>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-300">
                Level code (e.g., 1, 2.3)
              </span>
              <input
                value={levelCode}
                onChange={(e) => setLevelCode(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="1"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-300">
                Duration (days)
              </span>
              <input
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                type="number"
                min={1}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-300">
                Requirements (JSON)
              </span>
              <textarea
                value={requirementsJson}
                onChange={(e) => setRequirementsJson(e.target.value)}
                className="h-40 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </label>
            <button
              type="button"
              onClick={async () => {
                const req = JSON.parse(requirementsJson || "{}");
                const { data, error } = await supabase
                  .from("levels")
                  .insert({
                    user_id: userId,
                    level_code: levelCode.trim(),
                    duration_days: durationDays,
                    requirements: req,
                  })
                  .select("id")
                  .single();
                if (error) return;

                // If this is the first level, set as current.
                await supabase
                  .from("level_state")
                  .upsert(
                    { user_id: userId, current_level_id: (data as { id: number }).id },
                    { onConflict: "user_id" },
                  );

                setLevelCode("");
                const { data: refreshed } = await supabase
                  .from("levels")
                  .select("id,level_code,duration_days,requirements,parent_level_id")
                  .eq("user_id", userId)
                  .order("created_at", { ascending: true });
                setLevels((refreshed as LevelRow[]) ?? []);
              }}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Create level
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
            Existing Levels
          </h2>
          <div className="mt-3 grid gap-2">
            {levels.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-300">
                No levels yet.
              </div>
            ) : (
              levels.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">
                        Level {l.level_code}
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {l.duration_days} days
                        {l.parent_level_id ? " • sub-level" : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await supabase
                          .from("level_state")
                          .upsert(
                            { user_id: userId, current_level_id: l.id, day_index: 0 },
                            { onConflict: "user_id" },
                          );
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100"
                    >
                      Set current
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

