import { describe, expect, it } from "vitest";
import { emptyContent } from "./ee-plan";
import { assemblePlan, EDITED, missingInputs, planComplete, sectionSource } from "./plan-assembly";

const dates = { start: "2026-01-01", end: "2030-12-31" };
const full = () => {
  const c = emptyContent();
  for (const k of ["seniorManager","committee","objectives","barriers","measures","timetable","monitoring","disputes","reasonableGrounds","incomeDifferentials","consultation"] as const) c[k] = "x";
  c.goals = c.goals.map((g) => ({ ...g, total: "50" }));
  c.milestones = [{ id: "1", kind: "goal", title: "t", owner: "HR", due: "2027-01-01", status: "planned" }];
  return c;
};

describe("plan assembly", () => {
  it("flags missing dates and empty sections", () => {
    const m = missingInputs(emptyContent(), { start: "", end: "" });
    expect(m.some((x) => x.key === "dates")).toBe(true);
    expect(m.some((x) => x.key === "seniorManager")).toBe(true);
  });
  it("is not complete without organisation sign-off, even with every input", () => {
    expect(missingInputs(full(), dates)).toHaveLength(0);
    expect(planComplete(full(), dates)).toBe(false);
    expect(planComplete({ ...full(), orgSignoff: { by: "CEO", at: "2026-10-24" } }, dates)).toBe(true);
  });
  it("is not complete when signed off but inputs are missing", () => {
    expect(planComplete({ ...emptyContent(), orgSignoff: { by: "CEO", at: "x" } }, dates)).toBe(false);
  });
  it("records the Barrier Analysis as the source of assembled barriers", () => {
    const r = assemblePlan(emptyContent(), { analyses: [], barriers: [{ answers: {} }], workforce: [], start: dates.start, end: dates.end });
    expect(sectionSource(r.content, "barriers")).toContain("Barrier Analysis (1 response)");
  });
  it("labels hand-written sections as written by you", () => {
    expect(sectionSource({ ...emptyContent(), disputes: "Our procedure" }, "disputes")).toBe(EDITED);
  });
});
