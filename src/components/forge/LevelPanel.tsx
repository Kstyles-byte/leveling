"use client";

import { useEffect, useMemo, useState } from "react";
import type { ForgeMode } from "@/lib/forge/modes";
import { supabase } from "@/lib/supabaseClient";
import { todayIsoDate } from "@/lib/forge/date";
import Link from "next/link";

type LevelStateRow = {
  current_level_id: number | null;
  day_index: number;
  failures: number;
};

type LevelRow = {
  id: number;
  level_code: string;
  duration_days: number;
  requirements: unknown;
  parent_level_id: number | null;
};

export function LevelPanel(props: { userId: string; mode: ForgeMode | null }) {
  const day = useMemo(() => todayIsoDate(), []);
  const [state, setState] = useState<LevelStateRow | null>(null);
  const [level, setLevel] = useState<LevelRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [subLevelPrompt, setSubLevelPrompt] = useState(false);
  const [subLevelCode, setSubLevelCode] = useState("");
  const [subLevelDuration, setSubLevelDuration] = useState(3);

  async function refresh() {
    setLoading(true);
    const { data: s } = await supabase
      .from("level_state")
      .select("current_level_id,day_index,failures")
      .eq("user_id", props.userId)
      .maybeSingle();

    const stateRow = (s as LevelStateRow | null) ?? null;
    setState(stateRow);

    if (stateRow?.current_level_id) {
      const { data: lvl } = await supabase
        .from("levels")
        .select("id,level_code,duration_days,requirements,parent_level_id")
        .eq("id", stateRow.current_level_id)
        .maybeSingle();
      setLevel((lvl as LevelRow | null) ?? null);
    } else {
      setLevel(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.userId]);

  useEffect(() => {
    if (!state) return;
    if (state.failures >= 3) setSubLevelPrompt(true);
  }, [state]);

  async function ensureLevelStateRow() {
    await supabase
      .from("level_state")
      .upsert({ user_id: props.userId }, { onConflict: "user_id" });
  }

  async function recordCheckIn(outcome: "success" | "skip" | "paused") {
    if (!props.mode) return;
    await ensureLevelStateRow();

    // ensure we have freshest view
    const { data: s } = await supabase
      .from("level_state")
      .select("current_level_id,day_index,failures")
      .eq("user_id", props.userId)
      .maybeSingle();

    const cur = (s as LevelStateRow | null) ?? { current_level_id: null, day_index: 0, failures: 0 };
    const next: LevelStateRow = { ...cur };

    if (props.mode === "failsafe_1") {
      // paused: no changes
    } else if (outcome === "success") {
      next.day_index = (cur.day_index ?? 0) + 1;
    } else if (outcome === "skip") {
      next.day_index = 0;
      next.failures = (cur.failures ?? 0) + 1;
    }

    await supabase
      .from("check_ins")
      .upsert(
        {
          user_id: props.userId,
          day,
          mode: props.mode,
          outcome: props.mode === "failsafe_1" ? "paused" : outcome,
          level_id: cur.current_level_id,
        },
        { onConflict: "user_id,day" },
      );

    await supabase
      .from("level_state")
      .upsert(
        {
          user_id: props.userId,
          current_level_id: cur.current_level_id,
          day_index: next.day_index,
          failures: next.failures,
        },
        { onConflict: "user_id" },
      );

    await refresh();
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          Life Level
        </h2>
        <p className="mt-2 text-sm text-zinc-300">Loading…</p>
      </section>
    );
  }

  if (!level || !state) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          Life Level
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          No current level selected yet. Create one in{" "}
          <Link className="text-indigo-300 underline" href="/levels">
            Level Constructor
          </Link>
          .
        </p>
      </section>
    );
  }

  const dayText = `${Math.min(state.day_index, level.duration_days)}/${level.duration_days}`;
  const completed = state.day_index >= level.duration_days;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          Life Level
        </h2>
        <div className="text-xs text-zinc-400">{day}</div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-zinc-400">Current</div>
            <div className="text-lg font-semibold text-zinc-50">
              Level {level.level_code}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">Day</div>
            <div className="font-mono text-lg text-zinc-50">{dayText}</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-zinc-400">
          Failures: <span className="text-zinc-200">{state.failures}</span>
          {completed ? (
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
              Completed (advance next level manually for now)
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!props.mode || props.mode === "failsafe_1"}
          onClick={() => recordCheckIn("success")}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Check-in: Success
        </button>
        <button
          type="button"
          disabled={!props.mode}
          onClick={() => {
            if (props.mode === "failsafe_1") return recordCheckIn("paused");
            if (props.mode === "failsafe_2") return recordCheckIn("skip");
            return recordCheckIn("skip");
          }}
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-zinc-100 disabled:opacity-50"
        >
          {props.mode === "failsafe_1"
            ? "Paused (Fail-safe 1)"
            : props.mode === "failsafe_2"
              ? "Reset (Fail-safe 2)"
              : "Skip (Reset to Day 0)"}
        </button>
      </div>

      {subLevelPrompt ? (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <div className="text-sm font-semibold text-amber-200">
            Too hard? Create a sub-level.
          </div>
          <p className="mt-1 text-xs text-amber-200/80">
            You’ve failed this level 3+ times. Create a 3-day bridge (e.g., {level.level_code}
            .2).
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              value={subLevelCode}
              onChange={(e) => setSubLevelCode(e.target.value)}
              placeholder={`${level.level_code}.2`}
              className="rounded-xl border border-amber-400/20 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <input
              value={subLevelDuration}
              onChange={(e) => setSubLevelDuration(Number(e.target.value))}
              type="number"
              min={1}
              className="rounded-xl border border-amber-400/20 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <button
              type="button"
              onClick={async () => {
                const code =
                  subLevelCode.trim() || `${level.level_code}.${Math.max(1, state.failures - 1)}`;
                const { data: inserted, error } = await supabase
                  .from("levels")
                  .insert({
                    user_id: props.userId,
                    level_code: code,
                    duration_days: subLevelDuration || 3,
                    requirements: level.requirements ?? {},
                    parent_level_id: level.id,
                  })
                  .select("id")
                  .single();
                if (error) return;

                await supabase
                  .from("level_state")
                  .upsert(
                    {
                      user_id: props.userId,
                      current_level_id: (inserted as { id: number }).id,
                      day_index: 0,
                      failures: 0,
                    },
                    { onConflict: "user_id" },
                  );

                setSubLevelPrompt(false);
                setSubLevelCode("");
                await refresh();
              }}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Create sub-level
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

