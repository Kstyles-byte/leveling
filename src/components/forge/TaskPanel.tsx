"use client";

import type { ForgeMode } from "@/lib/forge/modes";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  hidden_in_modes: string[];
  is_completed: boolean;
};

export function TaskPanel(props: {
  userId: string;
  mode: ForgeMode | null;
  gated: boolean;
}) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  const visibleTasks = useMemo(() => {
    if (!props.mode) return [];
    return tasks.filter((t) => !t.hidden_in_modes?.includes(props.mode!));
  }, [tasks, props.mode]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tasks")
        .select("id,title,description,hidden_in_modes,is_completed")
        .eq("user_id", props.userId)
        .order("created_at", { ascending: false });
      if (!alive) return;
      setTasks((data as TaskRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [props.userId]);

  if (!props.mode) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          Tasks
        </h2>
        <p className="mt-2 text-sm text-zinc-300">Pick a mode to begin.</p>
      </section>
    );
  }

  if (props.gated) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          Tasks
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          Locked. Complete the journal gate to reveal your Active Grind tasks.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          Tasks
        </h2>
        <div className="text-xs text-zinc-400">
          {loading ? "Loading…" : `${visibleTasks.filter((t) => !t.is_completed).length} open`}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task (quick capture)"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
        />
        <button
          type="button"
          disabled={!newTitle.trim()}
          onClick={async () => {
            const title = newTitle.trim();
            setNewTitle("");
            const { data, error } = await supabase
              .from("tasks")
              .insert({
                user_id: props.userId,
                title,
                hidden_in_modes:
                  props.mode === "active_grind"
                    ? []
                    : ["failsafe_1", "failsafe_2"],
              })
              .select("id,title,description,hidden_in_modes,is_completed")
              .single();
            if (error) return;
            setTasks((t) => [data as TaskRow, ...t]);
          }}
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        {visibleTasks.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-300">
            No tasks yet.
          </div>
        ) : (
          visibleTasks.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3"
            >
              <input
                type="checkbox"
                checked={t.is_completed}
                onChange={async () => {
                  const next = !t.is_completed;
                  setTasks((all) =>
                    all.map((x) => (x.id === t.id ? { ...x, is_completed: next } : x)),
                  );
                  await supabase
                    .from("tasks")
                    .update({ is_completed: next })
                    .eq("id", t.id)
                    .eq("user_id", props.userId);
                }}
                className="mt-1 h-4 w-4 accent-indigo-500"
              />
              <div className="min-w-0">
                <div
                  className={[
                    "text-sm font-semibold",
                    t.is_completed ? "text-zinc-500 line-through" : "text-zinc-100",
                  ].join(" ")}
                >
                  {t.title}
                </div>
                {t.description ? (
                  <div className="mt-0.5 text-xs text-zinc-400">{t.description}</div>
                ) : null}
              </div>
            </label>
          ))
        )}
      </div>
    </section>
  );
}

