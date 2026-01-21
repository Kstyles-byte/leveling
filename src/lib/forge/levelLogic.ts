import type { ForgeMode } from "@/lib/forge/modes";

export type LevelState = {
  day_index: number;
  failures: number;
};

export type CheckInAction = "success" | "skip";

/**
 * Pure state transition for the Life Level engine.
 *
 * - active_grind:
 *   - success: day +1
 *   - skip: day -> 0, failures +1
 * - failsafe_1:
 *   - no change (paused)
 * - failsafe_2:
 *   - treated like skip/reset
 */
export function applyCheckIn(
  state: LevelState,
  mode: ForgeMode,
  action: CheckInAction,
): LevelState {
  if (mode === "failsafe_1") return state;
  if (mode === "failsafe_2") {
    return { day_index: 0, failures: state.failures + 1 };
  }
  if (action === "success") return { ...state, day_index: state.day_index + 1 };
  return { day_index: 0, failures: state.failures + 1 };
}

export function shouldPromptSubLevel(state: LevelState) {
  return state.failures >= 3;
}

