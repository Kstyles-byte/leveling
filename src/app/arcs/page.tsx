"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ArcRow = {
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  category: string;
  status: "planned" | "active" | "completed";
};

function buildTree(arcs: ArcRow[]) {
  const byParent = new Map<number | null, ArcRow[]>();
  for (const a of arcs) {
    const key = a.parent_id ?? null;
    const arr = byParent.get(key) ?? [];
    arr.push(a);
    byParent.set(key, arr);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  }
  return byParent;
}

export default function ArcsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [arcs, setArcs] = useState<ArcRow[]>([]);
  const [surgeArcIds, setSurgeArcIds] = useState<Set<number>>(new Set());

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("money");
  const [parentId, setParentId] = useState<number | "none">("none");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  async function refresh(uid: string) {
    const { data: arcRows } = await supabase
      .from("arcs")
      .select("id,parent_id,name,description,category,status")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    setArcs((arcRows as ArcRow[]) ?? []);

    const { data: surgeRows } = await supabase
      .from("surge_arcs")
      .select("arc_id,is_active")
      .eq("user_id", uid)
      .eq("is_active", true);
    setSurgeArcIds(new Set((surgeRows ?? []).map((r) => (r as { arc_id: number }).arc_id)));
  }

  useEffect(() => {
    if (!userId) return;
    void refresh(userId);
  }, [userId]);

  const tree = useMemo(() => buildTree(arcs), [arcs]);

  if (!userId) {
    return (
      <div className="min-h-dvh bg-black px-6 py-10 text-zinc-300">
        Sign in first, then return to /arcs.
      </div>
    );
  }

  function Node({ arc, depth }: { arc: ArcRow; depth: number }) {
    const children = tree.get(arc.id) ?? [];
    const surged = surgeArcIds.has(arc.id);

    return (
      <div className="mt-2">
        <div
          className={[
            "flex items-start justify-between gap-3 rounded-xl border px-3 py-3",
            surged
              ? "border-indigo-400/40 bg-indigo-500/10"
              : "border-white/10 bg-black/30",
          ].join(" ")}
          style={{ marginLeft: depth * 12 }}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">{arc.name}</div>
            <div className="mt-1 text-xs text-zinc-400">
              {arc.category} • {arc.status}
              {arc.description ? ` • ${arc.description}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const next = !surged;
              setSurgeArcIds((s) => {
                const copy = new Set(s);
                if (next) copy.add(arc.id);
                else copy.delete(arc.id);
                return copy;
              });
              await supabase
                .from("surge_arcs")
                .upsert(
                  { user_id: userId, arc_id: arc.id, is_active: next },
                  { onConflict: "user_id,arc_id" },
                );
            }}
            className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-100"
          >
            {surged ? "Surging" : "Surge"}
          </button>
        </div>

        {children.map((c) => (
          <Node key={c.id} arc={c} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const roots = tree.get(null) ?? [];

  return (
    <div className="min-h-dvh bg-black">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-indigo-300/90">
              THE FORGE
            </div>
            <div className="text-sm text-zinc-200">Arc & Surge Manager</div>
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
            Create Arc Node
          </h2>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-300">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="Get a Job (Money Focus)"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-300">
                Description
              </span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="Seasonal focus / tech tree parent"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-300">
                Category
              </span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="money"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-300">Parent</span>
              <select
                value={parentId}
                onChange={(e) =>
                  setParentId(e.target.value === "none" ? "none" : Number(e.target.value))
                }
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                <option value="none">No parent (root)</option>
                {arcs.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={!name.trim()}
              onClick={async () => {
                await supabase.from("arcs").insert({
                  user_id: userId,
                  name: name.trim(),
                  description: description.trim() || null,
                  category: category.trim() || "general",
                  parent_id: parentId === "none" ? null : parentId,
                  status: "planned",
                });
                setName("");
                setDescription("");
                await refresh(userId);
              }}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create arc
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
            Tech Tree
          </h2>
          <p className="mt-2 text-xs text-zinc-400">
            Toggle “Surge” to highlight arcs on the dashboard.
          </p>

          <div className="mt-3">
            {roots.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-300">
                No arcs yet.
              </div>
            ) : (
              roots.map((r) => <Node key={r.id} arc={r} depth={0} />)
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

