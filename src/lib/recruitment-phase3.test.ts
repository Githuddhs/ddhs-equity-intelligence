import { describe, expect, it } from "vitest";
import { recruitmentDashboard, riskFlags, evidencePack, type C, type V } from "@/lib/recruitment-phase3";
import { reviewBlockers } from "@/lib/recruitment-phase2";

const v = (o: Partial<V> = {}): V => ({ id: "v1", title: "Analyst", occupational_level: "Skilled Technical", organisation: "", division: "", department: "Finance", section: "",
  status: "closed", priority: { band: "High" }, sourcing: { external: true }, governance: {}, appointment_review: {}, criteria: ["BCom"], job_profile: "", reason: "",
  approver_name: "", approval_note: "", approved_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z", closing_date: null, ...o });
const c = (id: string, race: string, gender: string, stage: string, o: Partial<C> = {}): C => ({ id, vacancy_id: "v1", full_name: id, stage, history: [{ stage }], race, gender,
  foreign_national: false, disability: false, source: "online", meets_minimum: null, assessment_score: null, created_at: "", cv_path: null, ...o });

describe("riskFlags", () => {
  it("flags an all-white-male shortlist as high risk", () => {
    const r = riskFlags(v(), [c("a", "White", "Male", "shortlisted"), c("b", "White", "Male", "shortlisted"), c("d", "White", "Male", "shortlisted")]);
    expect(r.some((x) => x.severity === "High" && x.area === "Applicant pool")).toBe(true);
  });
  it("flags missing governance once candidates reach interview", () => {
    expect(riskFlags(v(), [c("a", "African", "Female", "interview")]).some((x) => x.area === "Governance evidence")).toBe(true);
  });
  it("flags vacancies not advertised externally", () => {
    expect(riskFlags(v({ sourcing: { external: false } }), []).some((x) => x.area === "Direct recruitment")).toBe(true);
  });
});

describe("human control", () => {
  it("requires acknowledging high risks before approval", () => {
    const r = { candidate_id: "x", reviewer: "J M", reviewedImpact: true, confirmedMerit: true, reasons: "Strongest job-related results" };
    expect(reviewBlockers(r, [], 2)).toContain("Acknowledge the 2 high-severity risk flag(s)");
    expect(reviewBlockers({ ...r, acknowledgedRisks: true }, [], 2)).toEqual([]);
  });
});

describe("dashboard and evidence", () => {
  it("computes time to fill from approval to appointment", () => {
    const d = recruitmentDashboard([v()], [c("a", "African", "Female", "appointed", { history: [{ stage: "appointed", at: "2026-01-31T00:00:00Z" }] })]);
    expect(d.avgFill).toBe(30);
    expect(d.designatedAppointments).toBe(1);
  });
  it("evidence pack includes the human review section", () => {
    const p = evidencePack(v({ appointment_review: { reviewer: "J M", decision: "approved" } }), [], []);
    expect(p.blocks.some((b) => b.kind === "h" && b.text.includes("Human appointment review"))).toBe(true);
  });
});
