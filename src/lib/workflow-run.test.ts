import { describe, expect, it } from "vitest";
import { completeStage, currentStage, runProgress, startRun } from "./workflow-run";

describe("staff-started workflow", () => {
  it("starting opens stage 1 only", () => {
    const r = startRun("Staff A");
    expect(currentStage(r)).toBe(0);
    expect(r.stages.filter((s) => s.status === "in_progress")).toHaveLength(1);
  });
  it("stages complete in order", () => {
    const r = startRun("Staff A");
    expect(completeStage(r, 3, "Staff A")).toBe(r);
    const next = completeStage(r, 0, "Staff A");
    expect(currentStage(next)).toBe(1);
    expect(runProgress(next)).toBe(7);
  });
  it("finishing stage 14 completes the workflow", () => {
    let r = startRun("Staff A");
    for (let i = 0; i < 14; i++) r = completeStage(r, i, "Staff A");
    expect(currentStage(r)).toBeNull();
    expect(runProgress(r)).toBe(100);
  });
});
