import { describe, expect, it } from "vitest";
import { appointmentImpact, candidateFlow, governanceScorecard, reviewBlockers } from "@/lib/recruitment-phase2";
import { emptyCounts } from "@/lib/workforce";
import { PROVINCE_EAP } from "@/lib/sectors";

const c = (id: string, race: string, gender: string, history: string[], stage = history.at(-1)!) =>
  ({ id, stage, history: history.map((s) => ({ stage: s })), race, gender, foreign_national: false, disability: false });

describe("candidateFlow", () => {
  it("flags a 10 pp or larger fall in designated share", () => {
    const { rows, flags } = candidateFlow([
      c("1", "African", "Female", ["applied"], "rejected"), c("2", "African", "Male", ["applied"], "rejected"),
      c("3", "White", "Male", ["applied", "shortlisted"]), c("4", "Indian", "Female", ["applied", "shortlisted"]),
    ]);
    expect(rows[0]!.designatedShare).toBe(75);
    expect(rows[2]!.designatedShare).toBe(50);
    expect(flags.some((f) => f.includes("25 pp"))).toBe(true);
  });
});

describe("governanceScorecard", () => {
  it("requires three declared members including a trained EE rep", () => {
    const m = { role: "", conflict: false, declared: true, eeRep: false, trained: false };
    expect(governanceScorecard({ members: [{ ...m, name: "A" }, { ...m, name: "B" }] }).criticalOpen).toContain("Selection committee of at least three members");
    expect(governanceScorecard({ members: [{ ...m, name: "A" }, { ...m, name: "B" }, { ...m, name: "C" }] }).criticalOpen).toContain("Trained EE representative on the committee");
  });
});

describe("human review", () => {
  it("blocks approval while scorecard critical items are open", () => {
    const r = { candidate_id: "x", reviewer: "J M", reviewedImpact: true, confirmedMerit: true, reasons: "Strongest interview and test results" };
    expect(reviewBlockers(r, [])).toEqual([]);
    expect(reviewBlockers(r, ["Committee decision recorded"])).toHaveLength(1);
    expect(reviewBlockers({ ...r, confirmedMerit: false }, [])).toContain("Confirm the decision rests on job-related criteria");
  });
});

describe("appointmentImpact", () => {
  it("adds one appointee and reports the change", () => {
    const counts = { ...emptyCounts(), MW: 8, FA: 2 };
    const im = appointmentImpact({ counts, candidate: { race: "African", gender: "Female", foreign_national: false }, targets: { males: 30, females: 40, total: 70 }, eap: PROVINCE_EAP["Gauteng"]! });
    expect(im.before).toBe(20);
    expect(im.after).toBe(27.3);
    expect(im.verdict).toBe("Advances representation");
  });
  it("is not available for undeclared candidates", () => {
    expect(appointmentImpact({ counts: emptyCounts(), candidate: { race: "", gender: "", foreign_national: false }, targets: undefined, eap: null }).verdict).toBe("Not available");
  });
});
