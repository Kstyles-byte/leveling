"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { todayIsoDate } from "@/lib/forge/date";
import type { ForgeMode } from "@/lib/forge/modes";
import { MODE_LABEL } from "@/lib/forge/modes";
import Link from "next/link";
import { AuthPanel } from "@/components/forge/AuthPanel";
import { ModeSelector } from "@/components/forge/ModeSelector";
import { JournalGate } from "@/components/forge/JournalGate";
import { PomodoroTimer } from "@/components/forge/PomodoroTimer";
import { TaskPanel } from "@/components/forge/TaskPanel";
import { LevelPanel } from "@/components/forge/LevelPanel";
import { SurgePanel } from "@/components/forge/SurgePanel";

type User = Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];

export default function Home() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ForgeMode | null>(null);
  const [journalBody, setJournalBody] = useState<string | null>(null);

  const day = useMemo(() => todayIsoDate(), []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUser(data.user);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: modeRow } = await supabase
        .from("daily_modes")
        .select("mode")
        .eq("user_id", user.id)
        .eq("day", day)
        .maybeSingle();
      setMode((modeRow?.mode as ForgeMode | undefined) ?? null);

      const { data: journalRow } = await supabase
        .from("journals")
        .select("body")
        .eq("user_id", user.id)
        .eq("day", day)
        .maybeSingle();
      setJournalBody(journalRow?.body ?? null);
    })();
  }, [user, day]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-black px-6 py-10 text-zinc-300">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-6">
        <AuthPanel />
      </div>
    );
  }

  const gated = mode === "active_grind" && !journalBody;

  return (
    <div className="min-h-dvh bg-black">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-widest text-indigo-300/90">
              THE FORGE
            </div>
            <div className="text-sm text-zinc-200">
              {mode ? MODE_LABEL[mode] : "Choose today’s mode"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PomodoroTimer
              onComplete={async (seconds) => {
                await supabase.from("pomodoro_sessions").insert({
                  user_id: user.id,
                  category: "money",
                  started_at: new Date(Date.now() - seconds * 1000).toISOString(),
                  ended_at: new Date().toISOString(),
                  seconds,
                });
              }}
            />
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <LevelPanel userId={user.id} mode={mode} />
          <SurgePanel userId={user.id} />
        </div>

        <ModeSelector
          value={mode}
          onChange={async (m) => {
            setMode(m);
            await supabase
              .from("daily_modes")
              .upsert(
                { user_id: user.id, day, mode: m },
                { onConflict: "user_id,day" },
              );
          }}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {mode === "active_grind" ? (
            <JournalGate
              day={day}
              initialBody={journalBody ?? ""}
              onSave={async (body) => {
                const { data: ls } = await supabase
                  .from("level_state")
                  .select("current_level_id")
                  .eq("user_id", user.id)
                  .maybeSingle();

                const { data: surge } = await supabase
                  .from("surge_arcs")
                  .select("arc_id")
                  .eq("user_id", user.id)
                  .eq("is_active", true)
                  .limit(1);

                await supabase.from("journals").upsert(
                  {
                    user_id: user.id,
                    day,
                    mode: "active_grind",
                    level_id:
                      (ls as { current_level_id: number | null } | null)
                        ?.current_level_id ?? null,
                    arc_id: (surge?.[0] as { arc_id: number } | undefined)?.arc_id ?? null,
                    body,
                  },
                  { onConflict: "user_id,day" },
                );
                setJournalBody(body);
              }}
            />
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
                Today’s Focus
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {mode === "failsafe_1"
                  ? "Fail-safe 1: Keep your world small. Obey the No-Go list and do the minimum night routine."
                  : mode === "failsafe_2"
                    ? "Fail-safe 2: Stabilize. No TikTok, no junk. We reset the level but keep the arc alive."
                    : "Pick a mode to begin."}
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-200">
                <div className="text-xs font-semibold tracking-wide text-zinc-300">
                  No-Go list
                </div>
                <ul className="mt-2 list-disc pl-5 text-zinc-300">
                  <li>TikTok</li>
                  <li>Junk food</li>
                  <li>P</li>
                </ul>
              </div>
            </section>
          )}

          <TaskPanel userId={user.id} mode={mode} gated={gated} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
            Navigation
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/levels"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100"
            >
              Level Constructor
            </Link>
            <Link
              href="/arcs"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100"
            >
              Arcs &amp; Surge
            </Link>
            <Link
              href="/journal"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100"
            >
              Journal Archive
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
