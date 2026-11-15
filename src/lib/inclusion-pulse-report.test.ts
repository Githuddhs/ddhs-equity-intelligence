import { describe, expect, it } from "vitest";
import { buildPulseSummary, pulseSurveyReport, type PulseSummaryInput } from "./inclusion-pulse-report";

const base: PulseSummaryInput = {
  total: 3,
  links: { issued: 4, completed: 3, open: 1 },
  suppressed: false,
  minimumResponses: 3,
  items: [
    { id: "belong_accepted", answered: 3, average: 4, agreeShare: 2 / 3 },
    { id: "belong_authentic", answered: 2, average: 3.5, agreeShare: 0.5 },
    { id: "belong_contribute", answered: 1, average: 5, agreeShare: 1 },
    { id: "voice_safe", answered: 3, average: 2, agreeShare: 0 },
  ],
  barriers: [{ label: "Unfair discrimination", count: 2, share: 2 / 3 }, { label: "None of these", count: 1, share: 1 / 3 }],
};

describe("inclusion pulse aggregate reporting", () => {
  it("weights section and overall scores by the number of ratings", () => {
    const summary = buildPulseSummary(base);
    expect(summary.sections.find((section) => section.title === "Belonging and contribution")?.average).toBe(4);
    expect(summary.overall?.average).toBe(3.3);
    expect(summary.overall?.agreeShare).toBeCloseTo(4 / 9);
  });
  it("suppresses all scores and barriers below three responses", () => {
    const summary = buildPulseSummary({ ...base, total: 2 });
    expect(summary.suppressed).toBe(true);
    expect(summary.overall).toBeNull();
    expect(summary.sections).toEqual([]);
    expect(summary.barriers).toEqual([]);
  });
  it("keeps participation available while results are suppressed", () => {
    const summary = buildPulseSummary({ ...base, total: 2 });
    expect(summary.links).toMatchObject({ issued: 4, completed: 3, open: 1, completionRate: 0.75 });
  });
  it("omits individual answers and participant references from reports", () => {
    const report = JSON.stringify(pulseSurveyReport(buildPulseSummary(base), "Fictional Org", "Quarterly pulse", new Date("2026-11-15")));
    expect(report).toContain("Fictional Org");
    expect(report).not.toContain("Staff no. 1042");
    expect(report).not.toContain("Secret Name");
    expect(report).not.toContain("private comment");
  });
  it("explains suppression in the downloadable report", () => {
    const report = JSON.stringify(pulseSurveyReport(buildPulseSummary({ ...base, total: 2 }), "Fictional Org", "Quarterly pulse"));
    expect(report).toContain("withheld until at least 3 responses");
    expect(report).not.toContain("Unfair discrimination");
  });
});
