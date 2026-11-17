import { describe, expect, it } from "vitest";
import { impactSnapshot, planGovernanceReport, type Trajectory } from "./deviation";

const t = (now: number, after: number, milestone: number): Trajectory => ({ milestone, milestoneSource: "plan", designatedNow: now, designatedAfter: after, status: "on_track" } as unknown as Trajectory);

describe("deviation governance report", () => {
  it("counts deviations at or above the plan milestone after appointment", () => {
    const r = planGovernanceReport({ title: "Plan" }, [
      { title: "A", level: "", rating: "green", status: "approved", reason: "", trajectory: t(40, 45, 44), approvals: [] },
      { title: "B", level: "", rating: "red", status: "declined", reason: "", trajectory: t(40, 39, 44), approvals: [] },
      { title: "C", level: "", rating: "amber", status: "in_review", reason: "", trajectory: null, approvals: [] },
    ]);
    const overview = r.blocks.find((b) => b.kind === "table" && b.title === "Overview");
    expect(overview && overview.kind === "table" && overview.body.find((x) => x[0].startsWith("At or above"))?.[1]).toBe("1 of 2");
  });
  it("freezes the impact shown, with Not available when no milestone exists", () => {
    const s = impactSnapshot({ trajectory: { ...t(40, 45, 0), milestone: null } as Trajectory, verdict: "Neutral" });
    expect(s.milestone).toBe("Not available");
    expect(s.designated).toBe("40% → 45%");
  });
});
