import { describe, expect, it } from "vitest";
import { buildReadiness, readinessScore } from "@/lib/data-readiness";

const base = { org: {}, employees: [], movements: 0, remuneration: 0, analyses: 0, barrierResponses: 0, plan: null, planDates: { start: "", end: "" }, docs: [] };

describe("data readiness", () => {
  it("has six onboarding steps and starts at 0% with no data", () => {
    const s = buildReadiness(base);
    expect(s).toHaveLength(6);
    expect(readinessScore(s).pct).toBe(0);
  });
  it("does not score conditional or optional items", () => {
    const s = buildReadiness({ ...base, org: { tradingName: "X", sdlNumber: "1" } });
    expect(readinessScore(s).done).toBe(0);
  });
  it("counts an uploaded EEA2 file as evidence", () => {
    const s = buildReadiness({ ...base, docs: ["eea2 2025.pdf"] });
    expect(s[2]!.items.find((i) => i.label === "Previous EEA2 submission")!.done).toBe(true);
  });
  it("does not count an EEA12-area workforce file as a previous EEA12 analysis", () => {
    const s = buildReadiness({ ...base, docs: ["workforce headcount.xlsx"] });
    expect(s[2]!.items.find((i) => i.label === "Previous EEA12 analysis")!.done).toBe(false);
  });
  it("links evidence items to the matching upload library", () => {
    const s = buildReadiness(base);
    expect(s[2]!.items.find((i) => i.label === "Previous EEA2 submission")!.area).toBe("forms");
  });
});
