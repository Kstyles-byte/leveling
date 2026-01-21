"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type SurgeArcRow = {
  arc_id: number;
  arcs: { name: string; category: string } | null;
};

export function SurgePanel(props: { userId: string }) {
  const [rows, setRows] = useState<SurgeArcRow[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase
        .from("surge_arcs")
        .select("arc_id, arcs:arcs!inner(name,category)")
        .eq("user_id", props.userId)
        .eq("is_active", true);
      if (!alive) return;
      const normalized: SurgeArcRow[] = (data ?? []).map(
        (
          row:
            | { arc_id: number; arcs: { name: string; category: string } }
            | { arc_id: number; arcs: { name: string; category: string }[] }
            | { arc_id: number; arcs: null },
        ) => {
          const arcs = Array.isArray(row.arcs) ? row.arcs[0] ?? null : row.arcs;
        return {
          arc_id: row.arc_id,
          arcs,
        };
        },
      );
      setRows(normalized);
    })();
    return () => {
      alive = false;
    };
  }, [props.userId]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
        Surge Targets
      </h2>
      <p className="mt-2 text-xs text-zinc-400">
        Highlighted arcs for the month.
      </p>
      <div className="mt-3 grid gap-2">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-300">
            No surged arcs. Toggle some in{" "}
            <Link className="text-indigo-300 underline" href="/arcs">
              Arcs &amp; Surge
            </Link>
            .
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.arc_id}
              className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-3"
            >
              <div className="text-sm font-semibold text-zinc-50">
                {r.arcs?.name ?? `Arc #${r.arc_id}`}
              </div>
              <div className="mt-0.5 text-xs text-indigo-200/80">
                {r.arcs?.category ?? "general"}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

