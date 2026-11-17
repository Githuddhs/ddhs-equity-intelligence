import { describe, expect, it } from "vitest";
import {
  APPROVAL_ROUTES, CORRECTIVE_EMPTY, DEFAULT_THRESHOLDS, REASON_CODES, approvalProgress, correctiveState, declaredShare,
  deviationAnalytics, deviationFunnel, deviationRating, deviationReview, deviationWarnings, deriveObjective, levelTrajectory,
  type ApprovalRecord, type Corrective, type DeviationSummary, type Impact,
} from "@/lib/deviation";
import { GROUPS, type Counts, type Key } from "@/lib/workforce";

const counts = (over: Partial<Counts>): Counts => ({
  MA: 0, MC: 0, MI: 0, MW: 0, FA: 0, FC: 0, FI: 0, FW: 0, FNM: 0, FNF: 0, ...over,
});
const EAP = { MA: 20, MC: 5, MI: 5, MW: 0, FA: 25, FC: 5, FI: 5, FW: 5, FNM: 0, FNF: 0 } as Record<string, number>;

const impact = (verdict: Impact["verdict"], groupLabel = "African female"): Impact => ({
  group: "FA", groupLabel, before: 5, after: 6, sectoral: null, eap: null, verdict, notes: [],
});

const goodCorrective: Corrective = {
  action: "Develop an African female academic pipeline", owner: "Dean: Science", due: "2027-06-30",
  indicator: "Minimum three potential candidates identified", status: "open", evidence: [],
};

describe("EE recruitment objective", () => {
  it("names the designated group furthest below provincial EAP", () => {
    const o = deriveObjective(counts({ MA: 10, FA: 5, MW: 85 }), EAP);
    expect(o.key).toBe("FA");
    expect(o.label).toBe("African female");
    expect(o.current).toBe(5);
    expect(o.benchmark).toBe(25);
    expect(o.gap).toBe(-20);
  });

  it("says not available when no headcount is saved", () => {
    const o = deriveObjective(counts({}), EAP);
    expect(o.key).toBeNull();
    expect(o.current).toBeNull();
    expect(o.basis).toMatch(/No saved workforce headcount/);
  });

  it("falls back to the overall designated share when no province is set", () => {
    const o = deriveObjective(counts({ MA: 10, FA: 5, MW: 85 }), null);
    expect(o.key).toBeNull();
    expect(o.label).toBe("Designated groups (all)");
    expect(o.current).toBe(15);
    expect(o.benchmark).toBeNull();
    expect(o.basis).toMatch(/Province not set/);
  });
});

describe("level trajectory against the annual milestone", () => {
  it("shows the designated share after the appointment and the shortfall", () => {
    const t = levelTrajectory({ counts: counts({ MA: 10, FA: 5, MW: 85 }), milestone: 20, milestoneSource: "year 1 milestone", appointeeKey: "FA" });
    expect(t.designatedNow).toBe(15);
    expect(t.designatedAfter).toBe(15.8);
    expect(t.status).toBe("Below trajectory");
    expect(t.note).toContain("4.2 pp below");
  });

  it("is on trajectory once the appointment reaches the milestone", () => {
    const t = levelTrajectory({ counts: counts({ MA: 20, FA: 5, MW: 75 }), milestone: 25, milestoneSource: "sector target", appointeeKey: "FA" });
    expect(t.designatedAfter).toBe(25.7);
    expect(t.status).toBe("On trajectory");
  });

  it("is not available without a milestone", () => {
    const t = levelTrajectory({ counts: counts({ MA: 10, FA: 5, MW: 85 }), milestone: null, milestoneSource: "", appointeeKey: "FA" });
    expect(t.status).toBe("Not available");
    expect(t.designatedAfter).toBe(15.8);
  });
});

describe("recruitment funnel", () => {
  const cands = [
    { stage: "recommended", history: [], race: "African", gender: "Female", foreign_national: false },
    { stage: "shortlisted", history: [], race: "White", gender: "Male", foreign_national: false },
    { stage: "applied", history: [], race: "African", gender: "Female", foreign_national: false },
  ];

  it("counts the objective group at every stage", () => {
    const f = deviationFunnel(cands, "FA");
    expect(f.map((s) => s.label)).toEqual(["Applications", "Longlist", "Shortlist", "Interview", "Recommended"]);
    expect(f[0]).toEqual({ label: "Applications", total: 3, target: 2, share: 66.7 });
    expect(f[2]).toEqual({ label: "Shortlist", total: 2, target: 1, share: 50 });
    expect(f[4]).toEqual({ label: "Recommended", total: 1, target: 1, share: 100 });
  });

  it("uses all designated groups when no objective is identified", () => {
    const f = deviationFunnel(cands, null);
    expect(f[0]).toEqual({ label: "Applications", total: 3, target: 2, share: 66.7 });
  });

  it("reports the declared share of candidates", () => {
    expect(declaredShare(cands)).toBe(100);
    expect(declaredShare([{ stage: "applied", history: [], race: "", gender: "", foreign_national: false }, ...cands])).toBe(75);
  });
});

describe("deviation status", () => {
  const base = levelTrajectory({ counts: counts({ MA: 10, FA: 5, MW: 85 }), milestone: 20, milestoneSource: "year 1 milestone", appointeeKey: "FA" });

  it("is green when the appointment advances the objective", () => {
    const r = deviationRating({ impact: impact("Advances representation"), trajectory: base, repeatDeviations: 0, thresholds: DEFAULT_THRESHOLDS });
    expect(r.rating).toBe("green");
    expect(r.reasons[0]).toContain("advances the applicable EE objective");
  });

  it("is amber when the shortfall sits inside the tolerance", () => {
    const r = deviationRating({ impact: impact("Neutral"), trajectory: base, repeatDeviations: 0,
      thresholds: { amberTolerancePp: 5, repeatCount: 2 } });
    expect(r.rating).toBe("amber");
    expect(r.reasons.some((x) => x.includes("within the 5 pp Amber tolerance"))).toBe(true);
  });

  it("is red when the shortfall is beyond the tolerance", () => {
    const r = deviationRating({ impact: impact("Widens a gap"), trajectory: base, repeatDeviations: 0, thresholds: DEFAULT_THRESHOLDS });
    expect(r.rating).toBe("red");
    expect(r.reasons.some((x) => x.includes("4.2 pp below its milestone"))).toBe(true);
  });

  it("escalates to red once the repeat trigger is reached", () => {
    const r = deviationRating({ impact: impact("Neutral"), trajectory: base, repeatDeviations: 2, thresholds: DEFAULT_THRESHOLDS });
    expect(r.rating).toBe("red");
    expect(r.reasons.some((x) => x.includes("3rd deviation"))).toBe(true);
  });

  it("is not available when neither impact nor milestone can be checked", () => {
    const unknown = levelTrajectory({ counts: counts({}), milestone: null, milestoneSource: "", appointeeKey: null });
    const r = deviationRating({ impact: impact("Not available"), trajectory: unknown, repeatDeviations: 0, thresholds: DEFAULT_THRESHOLDS });
    expect(r.rating).toBe("not_available");
    expect(r.reasons[0]).toMatch(/cannot be calculated/);
  });

  it("always states the setting is not a statutory test", () => {
    const r = deviationRating({ impact: impact("Advances representation"), trajectory: base, repeatDeviations: 0, thresholds: DEFAULT_THRESHOLDS });
    expect(r.reasons[r.reasons.length - 1]).toContain("not a statutory test");
  });
});

describe("deviation completeness review", () => {
  const objective = deriveObjective(counts({ MA: 10, FA: 5, MW: 85 }), EAP);
  const complete = { objective, declared: 100, targetedEvidence: true, shortlistJustified: true,
    reasonCode: REASON_CODES[0]!, reasonDetail: "", corrective: goodCorrective, evidenceFiles: 2 };

  it("is complete when every required check is met", () => {
    const r = deviationReview(complete);
    expect(r.status).toBe("Complete");
    expect(r.blocking).toEqual([]);
    expect(r.items.find((i) => i.label === "Supporting documents uploaded")?.required).toBe(false);
  });

  it("lists what is required before approval", () => {
    const r = deviationReview({ ...complete, declared: 50, targetedEvidence: false, corrective: null });
    expect(r.status).toBe("Incomplete");
    expect(r.blocking).toEqual([
      "Applicant demographics captured",
      "Targeted recruitment evidence recorded",
      "Corrective action with owner, due date and indicator",
    ]);
  });

  it("needs a detailed justification when the reason is Other", () => {
    const other = REASON_CODES[REASON_CODES.length - 1]!;
    expect(deviationReview({ ...complete, reasonCode: other, reasonDetail: "we needed help" }).blocking).toContain("Reason for deviation selected");
    expect(deviationReview({ ...complete, reasonCode: other, reasonDetail: "x".repeat(45) }).status).toBe("Complete");
  });

  it("asks for a corrective action when the saved record is empty", () => {
    expect(deviationReview({ ...complete, corrective: {} as Corrective }).blocking)
      .toContain("Corrective action with owner, due date and indicator");
  });
});

describe("risk-based approval routing", () => {
  const rec = (key: string, label: string, decision: ApprovalRecord["decision"] = "approved"): ApprovalRecord =>
    ({ key, label, by: "A Person", decision, comments: "Ok", at: "2026-11-17T09:00:00.000Z" });

  it("routes red records through five sequential steps", () => {
    const p = approvalProgress("red", []);
    expect(p.route.map((s) => s.label)).toEqual(["Dean / RC head", "Hiring manager", "HR business partner", "Director: EE or HR", "Designated senior authority"]);
    expect(p.next?.key).toBe("executive");
    expect(p.missing).toHaveLength(5);
  });

  it("includes every role player in each rating's route", () => {
    expect(APPROVAL_ROUTES.green.map((s) => s.label)).toEqual(["Hiring manager", "HR business partner"]);
    expect(APPROVAL_ROUTES.amber.map((s) => s.label)).toEqual(["Hiring manager", "HR business partner", "EE specialist / designated authority"]);
    expect(APPROVAL_ROUTES.not_available.map((s) => s.label)).toEqual(["Hiring manager", "HR business partner", "EE specialist / designated authority"]);
    expect(APPROVAL_ROUTES.red.map((s) => s.label)).toEqual(["Dean / RC head", "Hiring manager", "HR business partner", "Director: EE or HR", "Designated senior authority"]);
  });

  it("advances only in order", () => {
    const p = approvalProgress("red", [rec("executive", "Dean / RC head")]);
    expect(p.next?.key).toBe("hiring_manager");
    expect(p.complete).toBe(false);
  });

  it("is complete once every step has approved", () => {
    const all = APPROVAL_ROUTES.green.map((s) => rec(s.key, s.label));
    const p = approvalProgress("green", all);
    expect(p.complete).toBe(true);
    expect(p.next).toBeNull();
  });

  it("stops when a step declines", () => {
    const p = approvalProgress("green", [rec("hiring_manager", "Hiring manager"), rec("hrbp", "HR business partner", "declined")]);
    expect(p.declined).toBe(true);
    expect(p.complete).toBe(false);
    expect(p.canRecord).toBe(false);
  });
});

describe("corrective intervention", () => {
  const today = new Date("2026-11-17T12:00:00Z");
  const at = (days: number) => new Date(+today + days * 86400000).toISOString().slice(0, 10);

  it("flags overdue, due-soon and open interventions", () => {
    expect(correctiveState({ ...goodCorrective, due: at(-1) }, today)).toBe("overdue");
    expect(correctiveState({ ...goodCorrective, due: at(10) }, today)).toBe("due_soon");
    expect(correctiveState({ ...goodCorrective, due: at(60) }, today)).toBe("open");
    expect(correctiveState({ ...goodCorrective, status: "done" }, today)).toBe("done");
    expect(correctiveState(CORRECTIVE_EMPTY, today)).toBe("none");
  });

  it("copes with a record saved before every field existed", () => {
    expect(correctiveState({} as Corrective, today)).toBe("none");
    expect(correctiveState({ action: "Rerun the search" } as Corrective, today)).toBe("open");
    expect(correctiveState({ action: "Rerun the search", status: "open", due: at(-2) } as Corrective, today)).toBe("overdue");
  });
});

describe("early warnings and register analytics", () => {
  const row = (over: Partial<DeviationSummary>): DeviationSummary => ({
    id: "1", vacancyId: "v1", title: "Senior Analyst", level: "Senior Management", unit: "Finance",
    rating: "amber", status: "approved", reasonCode: REASON_CODES[0]!, correctiveState: "open", created_at: "2026-01-01T00:00:00.000Z", ...over,
  });
  const funnel = [
    { label: "Applications", total: 86, target: 31, share: 36 },
    { label: "Longlist", total: 22, target: 9, share: 40.9 },
    { label: "Shortlist", total: 6, target: 3, share: 50 },
    { label: "Interview", total: 4, target: 2, share: 50 },
    { label: "Recommended", total: 1, target: 0, share: 0 },
  ];

  it("warns about consecutive appointments that did not advance the goal", () => {
    const w = deviationWarnings({ summaries: [
      row({ id: "a", rating: "amber", created_at: "2026-03-01T00:00:00.000Z" }),
      row({ id: "b", rating: "red", created_at: "2026-06-01T00:00:00.000Z" }),
    ], funnel, repeatCount: 2 });
    expect(w.some((x) => x.severity === "High" && x.area === "EE trajectory risk" && x.text.includes("2 consecutive appointments at Senior Management"))).toBe(true);
  });

  it("does not warn when a green appointment breaks the run", () => {
    const w = deviationWarnings({ summaries: [
      row({ id: "a", rating: "amber", created_at: "2026-03-01T00:00:00.000Z" }),
      row({ id: "b", rating: "green", created_at: "2026-06-01T00:00:00.000Z" }),
    ], funnel, repeatCount: 2 });
    expect(w.some((x) => x.area === "EE trajectory risk")).toBe(false);
  });

  it("warns about funnel leakage and overdue corrective actions", () => {
    const w = deviationWarnings({ summaries: [row({ correctiveState: "overdue" }), row({ id: "2", correctiveState: "overdue" })],
      funnel: [funnel[0]!, { ...funnel[2]!, share: 26 }], repeatCount: 2 });
    expect(w.some((x) => x.area === "Recruitment pipeline risk" && x.text.includes("from 36% of applications to 26% of shortlists"))).toBe(true);
    expect(w.some((x) => x.area === "Corrective action overdue" && x.text.includes("2 deviation-related intervention(s)"))).toBe(true);
  });

  it("counts deviations, the rate and the reasons", () => {
    const a = deviationAnalytics([
      row({ id: "1", rating: "red", reasonCode: REASON_CODES[1]! }),
      row({ id: "2", rating: "amber", reasonCode: REASON_CODES[1]! }),
      row({ id: "3", rating: "green" }),
      row({ id: "4", rating: "green" }),
      row({ id: "5", rating: "green" }),
    ]);
    expect(a.total).toBe(5);
    expect(a.deviations).toBe(2);
    expect(a.rate).toBe(40);
    expect(a.byReason[0]).toEqual({ reason: REASON_CODES[1], count: 2 });
    expect(a.byRating.find((x) => x.rating === "green")?.count).toBe(3);
    expect(a.overdue).toBe(0);
  });
});

describe("group keys used by the module", () => {
  it("matches the EEA12 designated groups", () => {
    const designated = GROUPS.filter((g) => g.designated).map((g) => g.key) as Key[];
    expect(designated).toEqual(["MA", "MC", "MI", "FA", "FC", "FI", "FW"]);
  });
});
