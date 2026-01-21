import { describe, expect, it } from "vitest";
import { applyCheckIn, shouldPromptSubLevel } from "@/lib/forge/levelLogic";

describe("levelLogic", () => {
  it("increments day on active_grind success", () => {
    expect(applyCheckIn({ day_index: 0, failures: 0 }, "active_grind", "success"))
      .toEqual({ day_index: 1, failures: 0 });
  });

  it("resets day and increments failures on active_grind skip", () => {
    expect(applyCheckIn({ day_index: 4, failures: 1 }, "active_grind", "skip"))
      .toEqual({ day_index: 0, failures: 2 });
  });

  it("pauses state on failsafe_1 regardless of action", () => {
    expect(applyCheckIn({ day_index: 2, failures: 1 }, "failsafe_1", "success"))
      .toEqual({ day_index: 2, failures: 1 });
    expect(applyCheckIn({ day_index: 2, failures: 1 }, "failsafe_1", "skip"))
      .toEqual({ day_index: 2, failures: 1 });
  });

  it("failsafe_2 always resets and counts as a failure", () => {
    expect(applyCheckIn({ day_index: 2, failures: 1 }, "failsafe_2", "success"))
      .toEqual({ day_index: 0, failures: 2 });
  });

  it("prompts sub-level at 3+ failures", () => {
    expect(shouldPromptSubLevel({ day_index: 0, failures: 2 })).toBe(false);
    expect(shouldPromptSubLevel({ day_index: 0, failures: 3 })).toBe(true);
  });
});

