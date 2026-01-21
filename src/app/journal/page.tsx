"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type JournalRow = {
  id: number;
  day: string;
  mode: string;
  body: string;
  created_at: string;
  level_id: number | null;
  arc_id: number | null;
};

export default function JournalPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [selected, setSelected] = useState<JournalRow | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data } = await supabase
        .from("journals")
        .select("id,day,mode,body,created_at,level_id,arc_id")
        .eq("user_id", userId)
        .order("day", { ascending: false })
        .limit(50);
      setRows((data as JournalRow[]) ?? []);
      setSelected(((data as JournalRow[] | null) ?? [])[0] ?? null);
    })();
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-dvh bg-black px-6 py-10 text-zinc-300">
        Sign in first, then return to /journal.
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
            <div className="text-sm text-zinc-200">Journal Archive</div>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
            Entries
          </h2>
          <div className="mt-3 grid gap-2">
            {rows.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-300">
                No journal entries yet.
              </div>
            ) : (
              rows.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelected(r)}
                  className={[
                    "rounded-xl border px-3 py-3 text-left",
                    selected?.id === r.id
                      ? "border-indigo-400/40 bg-indigo-500/10"
                      : "border-white/10 bg-black/30 hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold text-zinc-100">
                    {r.day}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {r.mode}
                    {r.level_id ? ` • level:${r.level_id}` : ""}
                    {r.arc_id ? ` • arc:${r.arc_id}` : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
              Entry
            </h2>
            <div className="text-xs text-zinc-400">{selected?.day ?? ""}</div>
          </div>
          {selected ? (
            <div className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-zinc-100">
              {selected.body}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-300">Select an entry.</p>
          )}
        </section>
      </main>
    </div>
  );
}

