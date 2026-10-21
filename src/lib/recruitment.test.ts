import { describe, expect, it } from "vitest";
import { approvalGaps, candidateGroup, reachedIndex, transformationPriority } from "@/lib/recruitment";
import { emptyCounts } from "@/lib/workforce";
import { PROVINCE_EAP } from "@/lib/sectors";

const counts = { ...emptyCounts(), MW: 80, FW: 10, MA: 10 };

describe("transformationPriority", () => {
  it("is not available without headcount", () => {
    expect(transformationPriority({ counts: undefined, targets: { males: 30, females: 40, total: 70 }, eap: null }).band).toBe("Not available");
  });
  it("scores sector shortfall as high priority", () => {
    const p = transformationPriority({ counts, targets: { males: 30, females: 40, total: 70 }, eap: PROVINCE_EAP["Gauteng"]! });
    // males 10% vs 30% (20 pp), women 10% vs 40% (30 pp) → 50 × 2 capped at 100
    expect(p.sectoral?.map((s) => s.gap)).toEqual([-20, -30]);
    expect(p.score).toBe(100);
    expect(p.band).toBe("High");
    expect(p.underRepresented[0]?.key).toBe("FA");
  });
  it("does not substitute national EAP when province is missing and no target exists", () => {
    const p = transformationPriority({ counts, targets: undefined, eap: null });
    expect(p.score).toBeNull();
    expect(p.underRepresented).toEqual([]);
  });
});

describe("approvalGaps", () => {
  const ready = { title: "Analyst", job_profile: "x".repeat(40), reason: "Replacement", criteria: ["BCom"], approver_name: "",
    sourcing: { channels: ["Online job boards"], external: true }, checks: { budget: true, jobProfileApproved: true, gradingConfirmed: true, eeConsulted: true, motivationAttached: true } };
  it("is empty when everything is in place", () => expect(approvalGaps(ready)).toEqual([]));
  it("requires a selection criterion", () => expect(approvalGaps({ ...ready, criteria: [] })).toContain("At least one job-related selection criterion"));
  it("requires an advertising channel", () => expect(approvalGaps({ ...ready, sourcing: { external: true } })).toContain("At least one advertising channel"));
});

describe("candidates", () => {
  it("maps declared profiles to EEA groups", () => {
    expect(candidateGroup({ race: "Indian", gender: "Female", foreign_national: false })).toBe("FI");
    expect(candidateGroup({ race: "African", gender: "Male", foreign_national: true })).toBe("FNM");
    expect(candidateGroup({ race: "", gender: "", foreign_national: false })).toBeNull();
  });
  it("keeps the furthest stage for rejected candidates", () => {
    expect(reachedIndex({ stage: "rejected", history: [{ stage: "applied" }, { stage: "shortlisted" }] })).toBe(2);
  });
});
