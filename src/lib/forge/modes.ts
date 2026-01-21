export type ForgeMode = "active_grind" | "failsafe_1" | "failsafe_2";

export const MODE_LABEL: Record<ForgeMode, string> = {
  active_grind: "Active Grind",
  failsafe_1: "Fail-safe 1",
  failsafe_2: "Fail-safe 2",
};

export function modeRuleSummary(mode: ForgeMode) {
  switch (mode) {
    case "active_grind":
      return "All level tasks + journaling. Level progress +1.";
    case "failsafe_1":
      return "No TikTok, No Junk, No P. Read/YouTube ok. Level paused (no reset).";
    case "failsafe_2":
      return "No TikTok, No Junk. Level resets (but Arc stays).";
  }
}

