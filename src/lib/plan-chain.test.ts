import { describe, expect, it } from "vitest";
import { buildChain, nextStep } from "./plan-chain";
import { emptyContent } from "./ee-plan";

const base = { organisationName: "", employees: 0, snapshotHeadcount: null, analyses: [], barrierResponses: 0, plan: null, evidenceDocs: 0, dgReviews: 0 };

describe("plan chain", () => {
  it("has 13 steps ending in the EEA13 plan", () => {
    const c = buildChain(base);
    expect(c).toHaveLength(13);
    expect(c[12]!.title).toBe("EEA13 Employment Equity Plan");
  });
  it("points a new client to the employer profile first", () => {
    expect(nextStep(buildChain(base))!.id).toBe("employer");
  });
  it("plan is only complete once the organisation signs it off", () => {
    const plan = { ...emptyContent(), objectives: "x" };
    expect(buildChain({ ...base, plan })[12]!.status).toBe("partial");
    const signed = { ...plan, orgSignoff: { by: "CEO", at: "2026-10-24" } };
    expect(buildChain({ ...base, plan: signed })[12]!.status).toBe("partial");
    const full = { ...signed, milestones: [{ id: "1", kind: "goal" as const, title: "t", owner: "HR", due: "2027-01-01", status: "planned" as const }], goals: signed.goals.map((g) => ({ ...g, total: "50" })) };
    for (const k of ["seniorManager","committee","barriers","measures","timetable","monitoring","disputes","reasonableGrounds","incomeDifferentials","consultation"] as const) full[k] = "x";
    expect(buildChain({ ...base, plan: full, planDates: { start: "2026-01-01", end: "2030-12-31" } })[12]!.status).toBe("done");
  });
});
