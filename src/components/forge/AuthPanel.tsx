"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"signin" | "signup" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ensureProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;
    await supabase.from("profiles").upsert(
      { id: user.id, display_name: user.email ?? null },
      { onConflict: "id" },
    );
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
        The Forge
      </h1>
      <p className="mt-1 text-sm text-zinc-300">
        Sign in to open your command center.
      </p>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-300">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            placeholder="you@example.com"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-300">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("signin");
              setError(null);
              try {
                const { error } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                if (error) throw error;
                await ensureProfile();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Sign-in failed.");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "signin" ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("signup");
              setError(null);
              try {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                await ensureProfile();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Sign-up failed.");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-zinc-100 disabled:opacity-60"
          >
            {busy === "signup" ? "Creating…" : "Sign up"}
          </button>
        </div>
      </div>
    </section>
  );
}

