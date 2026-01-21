"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PomodoroTimer(props: {
  onComplete: (seconds: number) => Promise<void>;
  defaultMinutes?: number;
}) {
  const defaultSeconds = (props.defaultMinutes ?? 25) * 60;
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft !== 0) return;
    void (async () => {
      setRunning(false);
      const startedAt = startedAtRef.current;
      startedAtRef.current = null;
      // Fallback: if we somehow don't have startedAt, just log full block.
      const elapsed = startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000))
        : defaultSeconds;
      await props.onComplete(elapsed);
      setSecondsLeft(defaultSeconds);
    })();
  }, [secondsLeft, running, defaultSeconds, props]);

  const progress = useMemo(() => {
    const done = defaultSeconds - secondsLeft;
    return Math.min(100, Math.max(0, (done / defaultSeconds) * 100));
  }, [defaultSeconds, secondsLeft]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-zinc-200">
            Focus Block
          </div>
          <div className="mt-0.5 font-mono text-lg text-zinc-50">
            {formatSeconds(secondsLeft)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (running) return;
              startedAtRef.current = new Date();
              setRunning(true);
            }}
            disabled={running}
            className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => setRunning(false)}
            disabled={!running}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100 disabled:opacity-50"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              startedAtRef.current = null;
              setSecondsLeft(defaultSeconds);
            }}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-indigo-400/80"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

